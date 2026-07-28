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

    if (drone.status === DroneStatus.MAINTENANCE) {
      throw new BadRequestException(`Drone ${drone.serialNumber} is already in MAINTENANCE status`);
    }

    // Drone RETIRED mi?
    if (drone.status === DroneStatus.RETIRED) {
      throw new BadRequestException(`Drone ${drone.serialNumber} is RETIRED and cannot be maintained`);
    }

    // Drone IN_MISSION mi?
    if (drone.status === DroneStatus.IN_MISSION) {
      throw new BadRequestException(
        `Drone ${drone.serialNumber} is IN_MISSION and cannot be maintained. Complete or abort the mission first.`
      );
    }
    
    if (!createMaintenanceLogDto.datePerformed) {
      throw new BadRequestException('Date performed is required');
    }

    drone.status = DroneStatus.MAINTENANCE;
    // Drone'un bakım tarihlerini güncelle
    const datePerformed = new Date(createMaintenanceLogDto.datePerformed);
    
    // lastMaintenanceDate = datePerformed
    drone.lastMaintenanceDate = datePerformed.toISOString().split('T')[0];
    
    // nextMaintenanceDueDate = datePerformed + 90 gün
    const nextMaintenanceDate = new Date(datePerformed);
    nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + 90);
    drone.nextMaintenanceDueDate = nextMaintenanceDate.toISOString().split('T')[0];
    
    // totalFlightHours = flightHoursAtTime
    drone.totalFlightHours = drone.totalFlightHours + (createMaintenanceLogDto.flightHoursAtTime === undefined ? 0 : createMaintenanceLogDto.flightHoursAtTime);

    // Drone'u kaydet
    await this.droneRepository.save(drone);

    // Bakım log'u oluştur
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

   /**
   * Bakım kaydını siler ve drone'un durumunu günceller
   */
  async remove(id: string): Promise<boolean> {
    // 1. Silinecek bakım kaydını bul
    const log = await this.findOne(id);
    if (!log) {
      throw new NotFoundException(`Maintenance log with ID ${id} not found`);
    }

    const droneId = log.droneId;

    // 2. Bakım kaydını sil
    const result = await this.maintenanceRepository.delete(id);
    const isDeleted = (result?.affected || 0) > 0;

    if (!isDeleted) {
      return false;
    }

    // 3. Drone'un kalan bakım kayıtlarını kontrol et
    const remainingLogs = await this.maintenanceRepository.find({
      where: { droneId },
    });

    // 4. Eğer drone MAINTENANCE durumunda ve başka bakım kaydı yoksa AVAILABLE yap
    const drone = await this.droneRepository.findOne({
      where: { id: droneId },
    });

    if (drone && drone.status === DroneStatus.MAINTENANCE && remainingLogs.length === 0) {
      drone.status = DroneStatus.AVAILABLE;
      await this.droneRepository.save(drone);
    }

    return true;
  }
}
