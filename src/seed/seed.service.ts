import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drone, DroneModel, DroneStatus } from '../entities/drone.entity';
import {
  Mission,
  MissionType,
  MissionStatus,
} from '../entities/mission.entity';
import {
  MaintenanceLog,
  MaintenanceType,
} from '../entities/maintenance-log.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Drone)
    private droneRepository: Repository<Drone>,
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
    @InjectRepository(MaintenanceLog)
    private maintenanceLogRepository: Repository<MaintenanceLog>,
  ) {}

  private generateSerialNumber(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'SKY-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getRandomItem<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getRandomDate(start: Date, end: Date): Date {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );
  }

  /**
   * Gerçekçi drone verileri oluştur
   * - Her 50 uçuş saatinde veya 90 günde bir bakım
   * - Sadece AVAILABLE dronelar göreve atanabilir
   * - IN_MISSION dronelar görevde
   * - MAINTENANCE dronelar bakımda
   */
  private generateRealisticDrones(count: number): {
    drones: Drone[];
    maintenanceLogs: Partial<MaintenanceLog>[];
  } {
    const drones: Drone[] = [];
    const maintenanceLogs: Partial<MaintenanceLog>[] = [];
    const now = new Date();

    // Gerçekçi model dağılımı
    const modelDistribution = [
      DroneModel.MATRICE_300,
      DroneModel.MATRICE_300,
      DroneModel.MATRICE_300,
      DroneModel.MAVIC_3_ENTERPRISE,
      DroneModel.MAVIC_3_ENTERPRISE,
      DroneModel.PHANTOM_4,
    ];

    // Gerçekçi durum dağılımı (filonun %40'ı AVAILABLE, %25'i IN_MISSION, %15'i MAINTENANCE, %20'si RETIRED)
    const statusDistribution = [
      DroneStatus.AVAILABLE,
      DroneStatus.AVAILABLE,
      DroneStatus.AVAILABLE,
      DroneStatus.AVAILABLE,
      DroneStatus.IN_MISSION,
      DroneStatus.IN_MISSION,
      DroneStatus.MAINTENANCE,
      DroneStatus.RETIRED,
      DroneStatus.RETIRED,
    ];

    const technicianNames = [
      'Hasan Usta',
      'Fatma Tekin',
      'Mehmet Usta',
      'Ali Usta',
      'Zeynep Mühendis',
      'Can Teknisyen',
      'Ece Bakım',
      'Murat Usta',
      'Serkan Arıza',
      'Gülten Onarım',
      'Burak Tamir',
      'Seda Kalibrasyon',
    ];

    const maintenanceNotes = [
      'Rutin kontrol yapıldı, tüm sistemler çalışıyor',
      'Batarya değişimi yapıldı, performans testi başarılı',
      'Motor revizyonu yapıldı, uçuş testi geçildi',
      'Firmware güncellemesi yapıldı, sistem optimizasyonu sağlandı',
      'Komple bakım yapıldı, tüm bileşenler kontrol edildi',
      'Kamera sistemi kalibrasyonu yapıldı',
      'Rotor değişimi ve dengeleme işlemi gerçekleştirildi',
      'GPS modülü güncellendi, sinyal gücü iyileştirildi',
    ];

    const typeDistribution = [
      MaintenanceType.ROUTINE_CHECK,
      MaintenanceType.ROUTINE_CHECK,
      MaintenanceType.ROUTINE_CHECK,
      MaintenanceType.BATTERY_REPLACEMENT,
      MaintenanceType.BATTERY_REPLACEMENT,
      MaintenanceType.FIRMWARE_UPDATE,
      MaintenanceType.MOTOR_REPAIR,
      MaintenanceType.FULL_OVERHAUL,
    ];

    for (let i = 0; i < count; i++) {
      const status = this.getRandomItem(statusDistribution);
      const totalFlightHours = Math.round((Math.random() * 500 + 5) * 10) / 10;

      // Son bakım tarihi: duruma göre gerçekçi ayarla
      let lastMaintenanceDate: Date;
      let nextMaintenanceDueDate: Date;
      let flightHoursSinceLastMaintenance = 0;

      if (status === DroneStatus.MAINTENANCE) {
        // Bakımda: bakım tarihi gecikmiş (50 saat veya 90 gün geçmiş)
        const isHoursOverdue = Math.random() > 0.5;
        if (isHoursOverdue) {
          // 50 saat geçmiş
          lastMaintenanceDate = new Date(now);
          lastMaintenanceDate.setDate(
            lastMaintenanceDate.getDate() - 30 - Math.random() * 30,
          );
          flightHoursSinceLastMaintenance = 50 + Math.random() * 20;
        } else {
          // 90 gün geçmiş
          lastMaintenanceDate = new Date(now);
          lastMaintenanceDate.setDate(
            lastMaintenanceDate.getDate() - 90 - Math.random() * 30,
          );
          flightHoursSinceLastMaintenance = 30 + Math.random() * 20;
        }
        nextMaintenanceDueDate = new Date(now);
        nextMaintenanceDueDate.setDate(
          nextMaintenanceDueDate.getDate() - 5 - Math.random() * 10,
        );
      } else if (status === DroneStatus.RETIRED) {
        // Emekli: eski bakım
        lastMaintenanceDate = new Date(now);
        lastMaintenanceDate.setDate(
          lastMaintenanceDate.getDate() - 180 - Math.random() * 180,
        );
        flightHoursSinceLastMaintenance = 0;
        nextMaintenanceDueDate = new Date(now);
        nextMaintenanceDueDate.setDate(
          nextMaintenanceDueDate.getDate() + 30 + Math.random() * 60,
        );
      } else {
        // AVAILABLE veya IN_MISSION: bakım tarihi gelecekte
        const daysSinceLastMaintenance = 10 + Math.random() * 40;
        lastMaintenanceDate = new Date(now);
        lastMaintenanceDate.setDate(
          lastMaintenanceDate.getDate() - daysSinceLastMaintenance,
        );
        flightHoursSinceLastMaintenance =
          (daysSinceLastMaintenance / 30) * 10 + Math.random() * 10;

        const daysUntilNextMaintenance = 15 + Math.random() * 60;
        nextMaintenanceDueDate = new Date(now);
        nextMaintenanceDueDate.setDate(
          nextMaintenanceDueDate.getDate() + daysUntilNextMaintenance,
        );
      }

      const registration = new Date(now);
      registration.setFullYear(
        registration.getFullYear() - 1 - Math.floor(Math.random() * 2),
      );

      const drone = new Drone();
      drone.serialNumber = this.generateSerialNumber();
      drone.model = this.getRandomItem(modelDistribution);
      drone.status = status;
      drone.totalFlightHours = totalFlightHours;
      drone.lastMaintenanceDate = lastMaintenanceDate
        .toISOString()
        .split('T')[0];
      drone.nextMaintenanceDueDate = nextMaintenanceDueDate
        .toISOString()
        .split('T')[0];
      drone.registrationTimestamp = registration;

      drones.push(drone);

      // Bakım kayıtları oluştur (RETIRED hariç)
      if (status !== DroneStatus.RETIRED) {
        // Her drone için 1-4 bakım kaydı
        const logCount = 1 + Math.floor(Math.random() * 3);
        let currentFlightHours = totalFlightHours * 0.2;

        for (let j = 0; j < logCount; j++) {
          const logDate = new Date(lastMaintenanceDate);
          logDate.setDate(logDate.getDate() - j * 30 - Math.random() * 30);
          currentFlightHours += Math.random() * 30 + 10;

          maintenanceLogs.push({
            droneId: drone.id, // Sonradan doldurulacak
            type: this.getRandomItem(typeDistribution),
            technicianName: this.getRandomItem(technicianNames),
            notes: this.getRandomItem(maintenanceNotes),
            datePerformed: logDate.toISOString().split('T')[0],
            flightHoursAtTime: Math.round(currentFlightHours * 10) / 10,
          });
        }
      }
    }

    return { drones, maintenanceLogs };
  }

  /**
   * Gerçekçi mission verileri oluştur
   * - Missions cannot be scheduled in the past
   * - A drone cannot have overlapping missions
   * - Sadece AVAILABLE dronelar göreve atanabilir
   * - Status akışı: PLANNED → PRE_FLIGHT_CHECK → IN_PROGRESS → COMPLETED
   * - COMPLETED harici ABORTED olabilir
   */
  private generateRealisticMissions(drones: Drone[], count: number): Mission[] {
    const missions: Mission[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const pilotNames = [
      'Ahmet Yılmaz',
      'Mehmet Demir',
      'Ayşe Kaya',
      'Ali Öztürk',
      'Serkan Yılmaz',
      'Fatma Demir',
      'Hasan Usta',
      'Zeynep Çelik',
      'Murat Aydın',
      'Elif Yıldız',
      'Can Özkan',
      'Selin Korkmaz',
      'Emre Şahin',
      'Gülten Ak',
      'Mert Can',
      'Seda Yılmaz',
      'Okan Şen',
      'Burcu Taş',
      'Eren Çelik',
      'Sibel Demirtaş',
    ];

    const locations = [
      'İstanbul Merkez',
      'Ankara OSB',
      'İzmir Alsancak',
      'Bursa Nilüfer',
      'Antalya GES',
      'Konya Ovası',
      'Çanakkale Rüzgar Enerji',
      'Osmaniye RES',
      'Manisa Organize Sanayi',
      'Eskişehir Teknopark',
      'Adana Çimento',
      'Mersin Liman',
      'Samsun Termik',
      'Trabzon Liman',
      'Denizli Traverten',
      'Muğla GES',
      'Gaziantep OSB',
      'Kocaeli TÜBİTAK',
      'Tekirdağ Serbest Bölge',
      'Balıkesir Rüzgar',
    ];

    const missionNames = [
      'Rüzgar Türbini İnceleme',
      'Güneş Paneli Survey',
      'Enerji Hattı Kontrolü',
      'Haritalama Görevi',
      'Tarım İnceleme',
      'Acil Müdahale',
      'Periyodik Kontrol',
      'Güvenlik İzleme',
      'Çevresel Etki Analizi',
      'Bina İnceleme',
      'Köprü Kontrolü',
      'Baraj Denetimi',
      'Orman Yangın İzleme',
    ];

    // Sadece AVAILABLE veya IN_MISSION droneları kullan
    const availableDrones = drones.filter(
      (d) =>
        d.status === DroneStatus.AVAILABLE ||
        d.status === DroneStatus.IN_MISSION,
    );

    // Kullanılan zaman aralıklarını takip et (çakışmayı önlemek için)
    const usedTimeSlots: Map<
      string,
      Array<{ start: Date; end: Date }>
    > = new Map();

    for (let i = 0; i < count; i++) {
      const drone =
        availableDrones.length > 0
          ? availableDrones[Math.floor(Math.random() * availableDrones.length)]
          : drones[Math.floor(Math.random() * drones.length)];

      // ✅ Başlangıç değeri ata
      let plannedStart: Date = new Date(today);
      let plannedEnd: Date = new Date(today);
      let hasOverlap = true;
      let attempts = 0;

      // Çakışmayan bir zaman bulana kadar dene
      while (hasOverlap && attempts < 20) {
        const daysOffset = Math.floor(Math.random() * 30) - 5; // -5 gün ile +25 gün arası
        plannedStart = new Date(today);
        plannedStart.setDate(plannedStart.getDate() + daysOffset);
        plannedStart.setHours(
          8 + Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 60),
          0,
          0,
        );

        // Geçmişe planlanamaz (bugünden önce olamaz)
        if (plannedStart < today) {
          plannedStart = new Date(today);
          plannedStart.setHours(
            9 + Math.floor(Math.random() * 8),
            Math.floor(Math.random() * 60),
            0,
            0,
          );
        }

        const duration = 1 + Math.floor(Math.random() * 6);
        plannedEnd = new Date(plannedStart);
        plannedEnd.setHours(plannedEnd.getHours() + duration);

        // Çakışma kontrolü
        const droneSlots = usedTimeSlots.get(drone.id) || [];
        hasOverlap = droneSlots.some(
          (slot) => plannedStart < slot.end && plannedEnd > slot.start,
        );

        if (!hasOverlap) {
          usedTimeSlots.set(drone.id, [
            ...droneSlots,
            { start: plannedStart, end: plannedEnd },
          ]);
          break;
        }
        attempts++;
      }

      if (attempts >= 20) continue; // Çakışmayan zaman bulunamadı

      // Status belirle (gerçekçi dağılım)
      let status: MissionStatus;
      const isPastMission = plannedStart < now;

      if (isPastMission) {
        // Geçmiş görevler
        const statusWeights = [
          MissionStatus.COMPLETED,
          MissionStatus.COMPLETED,
          MissionStatus.COMPLETED,
          MissionStatus.COMPLETED,
          MissionStatus.ABORTED,
        ];
        status = this.getRandomItem(statusWeights);
      } else {
        // Gelecek görevler
        const statusWeights = [
          MissionStatus.PLANNED,
          MissionStatus.PLANNED,
          MissionStatus.PLANNED,
          MissionStatus.PRE_FLIGHT_CHECK,
          MissionStatus.IN_PROGRESS,
        ];
        status = this.getRandomItem(statusWeights);
      }

      const mission = new Mission();
      mission.name = `${this.getRandomItem(missionNames)} - ${this.getRandomItem(locations)}`;
      mission.type = this.getRandomItem(Object.values(MissionType));
      mission.assignedDrone = drone;
      mission.droneId = drone.id;
      mission.pilotName = this.getRandomItem(pilotNames);
      mission.siteLocation = this.getRandomItem(locations);
      mission.plannedStart = plannedStart;
      mission.plannedEnd = plannedEnd;
      mission.status = status;

      // Drone durumunu güncelle (IN_PROGRESS ise)
      if (
        status === MissionStatus.IN_PROGRESS &&
        drone.status === DroneStatus.AVAILABLE
      ) {
        drone.status = DroneStatus.IN_MISSION;
      }

      // Geçmiş görevler için actual dates
      if (isPastMission) {
        const actualStart = new Date(plannedStart);
        actualStart.setMinutes(
          actualStart.getMinutes() + Math.floor(Math.random() * 30),
        );
        mission.actualStart = actualStart;

        if (status === MissionStatus.COMPLETED) {
          const actualEnd = new Date(actualStart);
          const durationHours =
            (plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 60 * 60);
          actualEnd.setHours(
            actualEnd.getHours() +
              Math.floor(
                durationHours * 0.7 + Math.random() * durationHours * 0.3,
              ),
          );
          mission.actualEnd = actualEnd;
          mission.flightHoursLogged =
            Math.round(
              (durationHours * 0.5 + Math.random() * durationHours * 0.5) * 10,
            ) / 10;
        } else if (status === MissionStatus.ABORTED) {
          const abortReasons = [
            'Hava koşulları uygun değil',
            'Teknik arıza',
            'Pilot müdahalesi',
            'Güvenlik ihlali',
            'Batarya yetersiz',
            'İletişim sorunu',
            'Acil iniş gerekli',
            'İnsansız hava aracı hasarı',
            'Yasak bölge ihlali',
          ];
          mission.abortReason = this.getRandomItem(abortReasons);
        }
      }

      missions.push(mission);
    }

    return missions;
  }

  async seed() {
    this.logger.log('🌱 Seeding database with realistic test data...');

    try {
      // Önce verileri temizle
      await this.clearData();

      // 1000 drone oluştur (bakım kayıtları ile birlikte)
      this.logger.log('📝 Generating 1000 drones with maintenance history...');
      const { drones: droneData, maintenanceLogs: maintenanceData } =
        this.generateRealisticDrones(1000);

      const savedDrones = await this.droneRepository.save(droneData);
      this.logger.log(`✅ ${savedDrones.length} drones created`);

      // Bakım log'larını drone ID'leri ile güncelle
      const logsWithDroneIds = maintenanceData.map((log, index) => {
        const droneIndex = Math.floor(index / 3) % savedDrones.length;
        return {
          ...log,
          droneId: savedDrones[droneIndex].id,
          drone: savedDrones[droneIndex],
        };
      });

      // 500 maintenance log oluştur
      this.logger.log('📝 Generating 500 maintenance logs...');
      const savedLogs =
        await this.maintenanceLogRepository.save(logsWithDroneIds);
      this.logger.log(`✅ ${savedLogs.length} maintenance logs created`);

      // 250 mission oluştur
      this.logger.log('📝 Generating 250 missions...');
      const missions = this.generateRealisticMissions(savedDrones, 250);
      const savedMissions = await this.missionRepository.save(missions);
      this.logger.log(`✅ ${savedMissions.length} missions created`);

      // İstatistikler
      const statusStats = await this.droneRepository
        .createQueryBuilder('drone')
        .select('drone.status', 'status')
        .addSelect('COUNT(drone.id)', 'count')
        .groupBy('drone.status')
        .getRawMany();

      this.logger.log('📊 Drone Status Distribution:');
      statusStats.forEach((stat) => {
        this.logger.log(`   ${stat.status}: ${stat.count}`);
      });

      const missionStats = await this.missionRepository
        .createQueryBuilder('mission')
        .select('mission.status', 'status')
        .addSelect('COUNT(mission.id)', 'count')
        .groupBy('mission.status')
        .getRawMany();

      this.logger.log('📊 Mission Status Distribution:');
      missionStats.forEach((stat) => {
        this.logger.log(`   ${stat.status}: ${stat.count}`);
      });

      const maintenanceStatus = await this.droneRepository
        .createQueryBuilder('drone')
        .select(
          `CASE 
      WHEN drone.status = 'MAINTENANCE' THEN 'in_maintenance'
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
      WHEN drone.status = 'MAINTENANCE' THEN 'in_maintenance'
      WHEN drone.nextMaintenanceDueDate < CURRENT_DATE THEN 'overdue'
      WHEN drone.nextMaintenanceDueDate <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
      ELSE 'good'
    END
  `,
        ) // ✅ TAMAMEN AYNI CASE ifadesini GROUP BY'a yaz
        .getRawMany();

      this.logger.log('📊 Maintenance Status Distribution:');
      maintenanceStatus.forEach((stat) => {
        this.logger.log(`   ${stat.status}: ${stat.count}`);
      });

      // Çakışma kontrolü
      const overlappingMissions = await this.missionRepository
        .createQueryBuilder('m1')
        .where(
          `EXISTS (
            SELECT 1 FROM missions m2 
            WHERE m2."droneId" = "m1"."droneId" 
            AND m2."id" != "m1"."id" 
            AND m2."status" NOT IN ('COMPLETED', 'ABORTED')
            AND m2."plannedStart" < "m1"."plannedEnd" 
            AND m2."plannedEnd" > "m1"."plannedStart"
          )`
        )
        .getCount();

      this.logger.log(
        `📊 Overlapping missions: ${overlappingMissions} (should be 0)`,
      );

      this.logger.log('🎉 Seeding completed successfully!');

      return {
        drones: savedDrones.length,
        missions: savedMissions.length,
        maintenanceLogs: savedLogs.length,
        droneStatusDistribution: statusStats,
        missionStatusDistribution: missionStats,
        maintenanceStatusDistribution: maintenanceStatus,
        overlappingMissions: overlappingMissions,
      };
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  async clearData() {
    this.logger.log('🗑️ Clearing all data...');

    try {
      await this.maintenanceLogRepository
        .createQueryBuilder()
        .delete()
        .execute();

      await this.missionRepository.createQueryBuilder().delete().execute();

      await this.droneRepository.createQueryBuilder().delete().execute();

      this.logger.log('✅ All data cleared');
    } catch (error) {
      this.logger.error('❌ Clear failed:', error);
      throw error;
    }
  }
}
