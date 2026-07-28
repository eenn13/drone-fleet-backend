import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Mission, MissionStatus } from './entities/mission.entity';
import { Drone, DroneStatus } from './entities/drone.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getFleetHealth() {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1. Toplam drone sayısı ve duruma göre dağılım
    const totalDrones = await this.droneRepository.count();

    const statusBreakdown = await this.droneRepository
      .createQueryBuilder('drone')
      .select('drone.status', 'status')
      .addSelect('COUNT(drone.id)', 'count')
      .groupBy('drone.status')
      .getRawMany();

    // 2. Bakımı gecikmiş dronelar
    const overdueMaintenance = await this.droneRepository
      .createQueryBuilder('drone')
      .where('drone.nextMaintenanceDueDate < :today', {
        today: now.toISOString().split('T')[0],
      })
      .andWhere('drone.status != :retired', { retired: DroneStatus.RETIRED })
      .orderBy('drone.nextMaintenanceDueDate', 'ASC')
      .getMany();

    // 3. Son 24 saat içindeki görevler
    const missionsNext24Hours = await this.missionRepository
      .createQueryBuilder('mission')
      .where('mission.plannedStart BETWEEN :now AND :next24Hours', {
        now: now.toISOString(),
        next24Hours: next24Hours.toISOString(),
      })
      .andWhere('mission.status != :completed', {
        completed: MissionStatus.COMPLETED,
      })
      .andWhere('mission.status != :aborted', {
        aborted: MissionStatus.ABORTED,
      })
      .orderBy('mission.plannedStart', 'ASC')
      .getMany();

    // 4. Drone başına ortalama uçuş saati
    const averageFlightHoursResult = await this.droneRepository
      .createQueryBuilder('drone')
      .select('AVG(drone.totalFlightHours)', 'average')
      .getRawOne();

    const averageFlightHours = parseFloat(
      averageFlightHoursResult?.average || '0',
    );

    // 5. Bakım durumu özeti (ekstra bilgi)
    const maintenanceStats = await this.droneRepository
      .createQueryBuilder('drone')
      .select(
        `CASE 
      WHEN drone.nextMaintenanceDueDate < CURRENT_DATE THEN 'overdue'
      WHEN drone.nextMaintenanceDueDate <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
      ELSE 'good'
    END`,
        'status',
      )
      .addSelect('COUNT(drone.id)', 'count')
      .where('drone.status != :retired', { retired: DroneStatus.RETIRED })
      .groupBy(
        `
    CASE 
      WHEN drone.nextMaintenanceDueDate < CURRENT_DATE THEN 'overdue'
      WHEN drone.nextMaintenanceDueDate <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
      ELSE 'good'
    END
  `,
      )
      .getRawMany();

    return {
      summary: {
        totalDrones,
        statusBreakdown: statusBreakdown.map((item) => ({
          status: item.status,
          count: parseInt(item.count, 10),
        })),
        averageFlightHours: parseFloat(averageFlightHours.toFixed(2)),
      },
      maintenance: {
        overdue: overdueMaintenance.map((drone) => ({
          id: drone.id,
          serialNumber: drone.serialNumber,
          model: drone.model,
          status: drone.status,
          totalFlightHours: drone.totalFlightHours,
          lastMaintenanceDate: drone.lastMaintenanceDate,
          nextMaintenanceDueDate: drone.nextMaintenanceDueDate,
          daysOverdue: Math.ceil(
            (new Date().getTime() -
              new Date(drone.nextMaintenanceDueDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        })),
        overdueCount: overdueMaintenance.length,
        maintenanceStats: maintenanceStats.map((item) => ({
          status: item.status,
          count: parseInt(item.count, 10),
        })),
      },
      missions: {
        next24Hours: missionsNext24Hours.map((mission) => ({
          id: mission.id,
          name: mission.name,
          type: mission.type,
          status: mission.status,
          droneId: mission.droneId,
          pilotName: mission.pilotName,
          siteLocation: mission.siteLocation,
          plannedStart: mission.plannedStart,
          plannedEnd: mission.plannedEnd,
        })),
        count: missionsNext24Hours.length,
      },
      timestamp: now.toISOString(),
    };
  }
}
