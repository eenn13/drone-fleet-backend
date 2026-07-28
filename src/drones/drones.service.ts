import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Drone, DroneStatus } from '../entities/drone.entity';
import { CreateDroneDto, UpdateDroneDto } from '../dto/create-drone.dto';
import { Mission, MissionStatus } from '../entities/mission.entity';

@Injectable()
export class DronesService {
  constructor(
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
    @InjectRepository(Mission) // ✅ Mission repository'sini ekle
    private missionRepository: Repository<Mission>,
  ) {}

  async findAll({
    page = 1,
    limit = 20,
    search,
    status,
  }: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const where: FindOptionsWhere<Drone> = {};

    if (status && Object.values(DroneStatus).includes(status as DroneStatus)) {
      where.status = status as DroneStatus;
    }

    if (search) {
      where.serialNumber = Like(`%${search}%`);
    }

    const [items, total] = await this.droneRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: {
        missions: true,
        maintenanceLogs: true,
      },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Drone | null> {
    return this.droneRepository.findOne({
      where: { id },
      relations: {
        missions: true,
        maintenanceLogs: true,
      },
    });
  }

  async create(createDroneDto: CreateDroneDto): Promise<Drone> {
    // Check if serial number already exists
    const existing = await this.droneRepository.findOne({
      where: { serialNumber: createDroneDto.serialNumber },
    });

    if (existing) {
      throw new BadRequestException('Serial number already exists');
    }

    const drone = this.droneRepository.create({
      ...createDroneDto,
      registrationTimestamp: new Date(),
    });

    return this.droneRepository.save(drone);
  }

  async update(id: string, updateDroneDto: UpdateDroneDto): Promise<Drone> {
    const drone = await this.findOne(id);
    if (!drone) {
      throw new NotFoundException(`Drone with ID ${id} not found`);
    }

    if (updateDroneDto.status === DroneStatus.RETIRED) {
      // Drone'un aktif veya planlanmış görevleri var mı kontrol et
      const activeMissions = await this.missionRepository.find({
        where: [
          { droneId: id, status: MissionStatus.PLANNED },
          { droneId: id, status: MissionStatus.IN_PROGRESS },
        ],
      });

      if (activeMissions.length > 0) {
        throw new BadRequestException(
          `Drone cannot be retired because it has ${activeMissions.length} upcoming or in-progress mission(s).`,
        );
      }
    }
    // Check if serial number is being changed and already exists
    if (
      updateDroneDto.serialNumber &&
      updateDroneDto.serialNumber !== drone.serialNumber
    ) {
      const existing = await this.droneRepository.findOne({
        where: { serialNumber: updateDroneDto.serialNumber },
      });
      if (existing) {
        throw new BadRequestException('Serial number already exists');
      }
    }

    Object.assign(drone, updateDroneDto);
    return this.droneRepository.save(drone);
  }

  async remove(id: string): Promise<boolean> {
    const activeMissions = await this.missionRepository.find({
      where: [
        { droneId: id, status: MissionStatus.PLANNED },
        { droneId: id, status: MissionStatus.IN_PROGRESS },
      ],
    });

    if (activeMissions.length > 0) {
      throw new BadRequestException(
        `Drone cannot be deleted because it has ${activeMissions.length} upcoming or in-progress mission(s).`,
      );
    }

    const result = await this.droneRepository.delete(id);
    return (result?.affected || 0) > 0;
  }

  async updateMaintenanceSchedule(
    id: string,
    action: 'complete' | 'schedule',
  ): Promise<Drone> {
    const drone = await this.findOne(id);
    if (!drone) {
      throw new NotFoundException(`Drone with ID ${id} not found`);
    }

    const now = new Date();
    if (action === 'complete') {
      drone.lastMaintenanceDate = now.toISOString().split('T')[0];
      drone.nextMaintenanceDueDate = new Date(now.setDate(now.getDate() + 30))
        .toISOString()
        .split('T')[0];
    } else {
      // Schedule maintenance
      drone.status = DroneStatus.MAINTENANCE;
      drone.nextMaintenanceDueDate = new Date(now.setDate(now.getDate() + 7))
        .toISOString()
        .split('T')[0];
    }

    return this.droneRepository.save(drone);
  }

  async canDelete(id: string): Promise<boolean> {
    const activeMissions = await this.missionRepository.find({
      where: [
        { droneId: id, status: MissionStatus.PLANNED },
        { droneId: id, status: MissionStatus.IN_PROGRESS },
      ],
    });
    return activeMissions.length === 0;
  }

  async getActiveMissionCount(id: string): Promise<number> {
    const activeMissions = await this.missionRepository.find({
      where: [
        { droneId: id, status: MissionStatus.PLANNED },
        { droneId: id, status: MissionStatus.IN_PROGRESS },
      ],
    });
    return activeMissions.length;
  }
}
