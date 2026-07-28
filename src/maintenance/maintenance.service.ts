import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceLog } from '../entities/maintenance-log.entity';
import { Drone, DroneStatus } from '../entities/drone.entity';
import {
  CreateMaintenanceLogDto,
  UpdateMaintenanceLogDto,
} from '../dto/create-maintenance-log.dto';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceLog)
    private maintenanceRepository: Repository<MaintenanceLog>,
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
  ) {}

  async findAll({
    page = 1,
    limit = 20,
    droneId,
  }: {
    page: number;
    limit: number;
    droneId?: string;
  }) {
    const query = this.maintenanceRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.drone', 'drone')
      .orderBy('log.datePerformed', 'DESC');

    if (droneId) {
      query.andWhere('log.droneId = :droneId', { droneId });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<MaintenanceLog> {
    const log = await this.maintenanceRepository.findOne({
      where: { id },
      relations: {
        drone: true,
      },
    });

    if (!log) {
      throw new NotFoundException(`Maintenance log with ID ${id} not found`);
    }

    return log;
  }

  async create(
    createMaintenanceLogDto: CreateMaintenanceLogDto,
  ): Promise<MaintenanceLog> {
    const drone = await this.droneRepository.findOne({
      where: { id: createMaintenanceLogDto.droneId },
    });

    if (!drone) {
      throw new NotFoundException(
        `Drone with ID ${createMaintenanceLogDto.droneId} not found`,
      );
    }

    // Drone zaten MAINTENANCE durumunda mı?
    if (drone.status === DroneStatus.MAINTENANCE) {
      throw new BadRequestException(`Drone ${drone.serialNumber} is already in MAINTENANCE status`);
    }

    // Drone RETIRED mi?
    if (drone.status === DroneStatus.RETIRED) {
      throw new BadRequestException(`Drone ${drone.serialNumber} is RETIRED and cannot be maintained`);
    }

    if (!createMaintenanceLogDto.datePerformed) {
      throw new NotFoundException(`Date performed is required`);
    }

    // Update drone maintenance dates
    const now = new Date();
    drone.lastMaintenanceDate = createMaintenanceLogDto.datePerformed;
    drone.nextMaintenanceDueDate = new Date(now.setDate(now.getDate() + 30))
      .toISOString()
      .split('T')[0];
    await this.droneRepository.save(drone);

    const log = this.maintenanceRepository.create(createMaintenanceLogDto);
    return this.maintenanceRepository.save(log);
  }

  async update(
    id: string,
    updateMaintenanceLogDto: UpdateMaintenanceLogDto,
  ): Promise<MaintenanceLog> {
    const log = await this.findOne(id);
    if (!log) {
      throw new NotFoundException(`Maintenance log with ID ${id} not found`);
    }

    Object.assign(log, updateMaintenanceLogDto);
    return this.maintenanceRepository.save(log);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.maintenanceRepository.delete(id);
    return (result?.affected || 0) > 0;
  }
}
