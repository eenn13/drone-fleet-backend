import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission, MissionStatus } from '../entities/mission.entity';
import { Drone, DroneStatus } from '../entities/drone.entity';
import { CreateMissionDto, UpdateMissionDto } from '../dto/create-mission.dto';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
  ) {}

  async findAll({
    page = 1,
    limit = 20,
    droneId,
    status,
  }: {
    page: number;
    limit: number;
    droneId?: string;
    status?: string;
  }) {
    const query = this.missionRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.assignedDrone', 'drone')
      .orderBy('mission.plannedStart', 'DESC');

    if (droneId) {
      query.andWhere('mission.droneId = :droneId', { droneId });
    }

    if (
      status &&
      Object.values(MissionStatus).includes(status as MissionStatus)
    ) {
      query.andWhere('mission.status = :status', { status });
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

  async findOne(id: string): Promise<Mission> {
    const mission = await this.missionRepository.findOne({
      where: { id },
      relations: {
        assignedDrone: true,
      },
    });

    if (!mission) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }

    return mission;
  }

  async create(createMissionDto: CreateMissionDto): Promise<Mission> {
    const drone = await this.droneRepository.findOne({
      where: { id: createMissionDto.droneId },
    });

    if (!drone) {
      throw new NotFoundException(
        `Drone with ID ${createMissionDto.droneId} not found`,
      );
    }

    // Check if drone is available
    if (
      drone.status !== DroneStatus.AVAILABLE &&
      drone.status !== DroneStatus.IN_MISSION
    ) {
      throw new BadRequestException('Drone is not available for mission');
    }

    // Update drone status
    if (createMissionDto.status === MissionStatus.IN_PROGRESS) {
      drone.status = DroneStatus.IN_MISSION;
      await this.droneRepository.save(drone);
    }

    const mission = this.missionRepository.create(createMissionDto);
    return this.missionRepository.save(mission);
  }

  async update(
    id: string,
    updateMissionDto: UpdateMissionDto,
  ): Promise<Mission> {
    const mission = await this.findOne(id);
    if (!mission) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }

    // Handle drone status changes
    if (updateMissionDto.status) {
      const drone = await this.droneRepository.findOne({
        where: { id: mission.droneId },
      });

      if (drone) {
        if (updateMissionDto.status === MissionStatus.IN_PROGRESS) {
          drone.status = DroneStatus.IN_MISSION;
        } else if (updateMissionDto.status === MissionStatus.COMPLETED) {
          drone.status = DroneStatus.AVAILABLE;
        } else if (updateMissionDto.status === MissionStatus.CANCELLED) {
          drone.status = DroneStatus.AVAILABLE;
        } else if (updateMissionDto.status === MissionStatus.ABORTED) {
          drone.status = DroneStatus.AVAILABLE;
        }
        await this.droneRepository.save(drone);
      }
    }

    Object.assign(mission, updateMissionDto);
    return this.missionRepository.save(mission);
  }

  async remove(id: string): Promise<boolean> {
    const mission = await this.findOne(id);
    if (!mission) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }

    // Update drone status if mission is in progress
    if (mission.status === MissionStatus.IN_PROGRESS) {
      const drone = await this.droneRepository.findOne({
        where: { id: mission.droneId },
      });
      if (drone) {
        drone.status = DroneStatus.AVAILABLE;
        await this.droneRepository.save(drone);
      }
    }

    const result = await this.missionRepository.delete(id);

    return (result?.affected || 0) > 0;
  }
}
