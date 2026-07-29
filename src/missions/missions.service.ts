import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission, MissionStatus } from '../entities/mission.entity';
import { Drone, DroneStatus } from '../entities/drone.entity';
import { CreateMissionDto, UpdateMissionDto } from '../dto/create-mission.dto';

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  constructor(
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
  ) {}

  /**
   * Drone'un belirtilen zaman aralığında çakışan görevi var mı kontrol et
   */
  private async hasOverlappingMission(
    droneId: string,
    plannedStart: Date,
    plannedEnd: Date,
    excludeMissionId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.missionRepository
      .createQueryBuilder('mission')
      .where('mission.droneId = :droneId', { droneId })
      .andWhere('mission.status != :status2', {
        status2: MissionStatus.ABORTED,
      })
      .andWhere('mission.status != :status3', {
        status3: MissionStatus.COMPLETED,
      })
      .andWhere(
        '(mission.plannedStart < :plannedEnd AND mission.plannedEnd > :plannedStart)',
        {
          plannedStart,
          plannedEnd,
        },
      );

    // Güncelleme sırasında kendi kendisiyle çakışmayı engelle
    if (excludeMissionId) {
      queryBuilder.andWhere('mission.id != :excludeMissionId', {
        excludeMissionId,
      });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * Tarihin geçmişte olup olmadığını kontrol et
   */
  private isDateInPast(date: Date): boolean {
    const now = new Date();
    // Bugünün başlangıcını al (00:00:00)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date < today;
  }

  /**
   * Tarih aralığını kontrol et
   */
  private validateMissionDates(plannedStart: Date, plannedEnd: Date): void {
    // Geçmiş tarih kontrolü
    if (this.isDateInPast(plannedStart)) {
      throw new BadRequestException(
        'Mission cannot be scheduled in the past. Planned start must be today or in the future.',
      );
    }

    // Başlangıç ve bitiş kontrolü
    if (plannedStart >= plannedEnd) {
      throw new BadRequestException('Planned start must be before planned end');
    }
  }

  async findAll({
    page = 1,
    limit = 20,
    status,
    droneId,
    startDate,
    endDate,
  }: {
    page: number;
    limit: number;
    status?: string;
    droneId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query = this.missionRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.assignedDrone', 'drone')
      .orderBy('mission.plannedStart', 'DESC');

    // ✅ Status filtresi
    if (
      status &&
      Object.values(MissionStatus).includes(status as MissionStatus)
    ) {
      query.andWhere('mission.status = :status', { status });
    }

    // ✅ Drone ID filtresi
    if (droneId) {
      query.andWhere('mission.droneId = :droneId', { droneId });
    }

    // ✅ Tarih aralığı filtresi (startDate - endDate)
    if (startDate && endDate) {
      query.andWhere('mission.plannedStart BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
    } else if (startDate) {
      query.andWhere('mission.plannedStart >= :startDate', {
        startDate: new Date(startDate).toISOString(),
      });
    } else if (endDate) {
      query.andWhere('mission.plannedStart <= :endDate', {
        endDate: new Date(endDate).toISOString(),
      });
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
    if (drone.status !== DroneStatus.AVAILABLE) {
      throw new BadRequestException('Drone is not available for mission');
    }

    if (!createMissionDto.plannedStart || !createMissionDto.plannedEnd) {
      throw new BadRequestException('Planned start and end times are required');
    }

    const plannedStart = new Date(createMissionDto.plannedStart);
    const plannedEnd = new Date(createMissionDto.plannedEnd);

    // Başlangıç ve bitiş tarihlerini kontrol et
    if (plannedStart >= plannedEnd) {
      throw new BadRequestException('Planned start must be before planned end');
    }

    this.validateMissionDates(plannedStart, plannedEnd);
    // Çakışan görev var mı kontrol et
    const hasOverlap = await this.hasOverlappingMission(
      drone.id,
      plannedStart,
      plannedEnd,
    );

    if (hasOverlap) {
      throw new BadRequestException(
        `Drone ${drone.serialNumber} already has a mission scheduled during this time period`,
      );
    }

    // Update drone status
    if (createMissionDto.status === MissionStatus.IN_PROGRESS) {
      drone.status = DroneStatus.IN_MISSION;
      await this.droneRepository.save(drone);
    }

    const mission = this.missionRepository.create(createMissionDto);
    return this.missionRepository.save(mission);
  }

  /**
   * Bakım gerekli mi kontrol et
   * - 50 uçuş saatini geçti mi?
   * - Son bakımdan bu yana 90 gün geçti mi?
   */
  private isMaintenanceRequired(drone: Drone): boolean {
    const now = new Date();
    const lastMaintenance = new Date(drone.lastMaintenanceDate);

    // 90 gün kontrolü
    const daysSinceLastMaintenance = Math.floor(
      (now.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isDaysExceeded = daysSinceLastMaintenance >= 90;

    // 50 saat kontrolü (totalFlightHours üzerinden)
    // lastMaintenanceDate'den sonraki uçuş saatini hesapla
    // Not: totalFlightHours tüm uçuş saatini tutar, son bakımdan sonraki kısmı bulmak için
    // bakım log'larından son bakımdaki uçuş saatini alabiliriz.
    // Ancak şimdilik totalFlightHours >= 50 kontrolü yapalım
    // (Drone ilk kez bakıma giriyorsa totalFlightHours 50'yi geçtiğinde bakım gerekir)
    const isHoursExceeded = drone.totalFlightHours >= 50;

    return isDaysExceeded || isHoursExceeded;
  }

  async update(
    id: string,
    updateMissionDto: UpdateMissionDto,
  ): Promise<Mission> {
    const mission = await this.findOne(id);
    if (!mission) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }

    const drone = await this.droneRepository.findOne({
      where: { id: mission.droneId },
    });

    if (!drone) {
      throw new NotFoundException(`Drone with ID ${mission.droneId} not found`);
    }

    if (updateMissionDto.status === MissionStatus.ABORTED) {
      if (!updateMissionDto.abortReason && !mission.abortReason) {
        throw new BadRequestException(
          'Abort reason is required when aborting a mission',
        );
      }
    }

    if (updateMissionDto.plannedStart || updateMissionDto.plannedEnd) {
      const plannedStart = updateMissionDto.plannedStart
        ? new Date(updateMissionDto.plannedStart)
        : new Date(mission.plannedStart);
      const plannedEnd = updateMissionDto.plannedEnd
        ? new Date(updateMissionDto.plannedEnd)
        : new Date(mission.plannedEnd);

      if (plannedStart >= plannedEnd) {
        throw new BadRequestException(
          'Planned start must be before planned end',
        );
      }

      this.validateMissionDates(plannedStart, plannedEnd);

      // Çakışan görev var mı kontrol et (kendisi hariç)
      const hasOverlap = await this.hasOverlappingMission(
        drone.id,
        plannedStart,
        plannedEnd,
        mission.id, // exclude kendi id'si
      );

      if (hasOverlap) {
        throw new BadRequestException(
          `Drone ${drone.serialNumber} already has a mission scheduled during this time period`,
        );
      }
    }

    // Handle drone status changes
    if (updateMissionDto.status) {
      if (updateMissionDto.status === MissionStatus.IN_PROGRESS) {
        drone.status = DroneStatus.IN_MISSION;
      } else if (updateMissionDto.status === MissionStatus.COMPLETED) {
        drone.status = DroneStatus.AVAILABLE;
        const flightHoursToAdd =
          updateMissionDto.flightHoursLogged || mission.flightHoursLogged;

        if (!flightHoursToAdd || flightHoursToAdd <= 0) {
          throw new BadRequestException(
            'Flight hours must be logged and greater than 0 when mission is completed',
          );
        }
        // Drone'un toplam uçuş saatini güncelle
        const oldTotalHours = drone.totalFlightHours;
        drone.totalFlightHours = oldTotalHours + flightHoursToAdd;

        // Bakım gerekli mi kontrol et
        const needsMaintenance = this.isMaintenanceRequired(drone);

        if (needsMaintenance) {
          drone.status = DroneStatus.MAINTENANCE;
          this.logger.log(
            `🔴 ${drone.serialNumber} bakım gerekli! (Uçuş: ${drone.totalFlightHours} saat, Son bakım: ${drone.lastMaintenanceDate})`,
          );
        }

        const now = new Date();
        const nextMaintenanceDate = new Date(now);
        nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + 90);
        drone.nextMaintenanceDueDate = nextMaintenanceDate
          .toISOString()
          .split('T')[0];
      } else if (updateMissionDto.status === MissionStatus.ABORTED) {
        drone.status = DroneStatus.AVAILABLE;
      }
      await this.droneRepository.save(drone);
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
