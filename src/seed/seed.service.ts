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

  private generateDrones(count: number): Drone[] {
    const drones: Drone[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const lastMaintenance = new Date(now);
      lastMaintenance.setDate(
        lastMaintenance.getDate() - Math.floor(Math.random() * 90),
      );

      const nextMaintenance = new Date(lastMaintenance);
      nextMaintenance.setDate(
        nextMaintenance.getDate() + 30 + Math.floor(Math.random() * 30),
      );

      const registration = new Date(now);
      registration.setDate(
        registration.getDate() - Math.floor(Math.random() * 365),
      );

      const drone = new Drone();
      drone.serialNumber = this.generateSerialNumber();
      drone.model = this.getRandomItem(Object.values(DroneModel));
      drone.status = this.getRandomItem(Object.values(DroneStatus));
      drone.totalFlightHours = Math.round((Math.random() * 500 + 10) * 10) / 10;
      drone.lastMaintenanceDate = lastMaintenance.toISOString().split('T')[0];
      drone.nextMaintenanceDueDate = nextMaintenance
        .toISOString()
        .split('T')[0];
      drone.registrationTimestamp = registration;

      drones.push(drone);
    }

    return drones;
  }

  private generateMissions(drones: Drone[], count: number): Mission[] {
    const missions: Mission[] = [];
    const now = new Date();

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
    ];

    const missionNames = [
      'Rüzgar Türbini İnceleme',
      'Güneş Paneli Survey',
      'Enerji Hattı Kontrolü',
      'Haritalama Görevi',
      'Tarım İnceleme',
      'Acil Müdahale',
      'Kestirimci Bakım',
      'Periyodik Kontrol',
      'Güvenlik İzleme',
      'Çevresel Etki Analizi',
    ];

    for (let i = 0; i < count; i++) {
      const drone = drones[Math.floor(Math.random() * drones.length)];
      const plannedStart = new Date(now);
      plannedStart.setHours(
        plannedStart.getHours() + Math.floor(Math.random() * 168) - 48,
      );

      const plannedEnd = new Date(plannedStart);
      plannedEnd.setHours(
        plannedEnd.getHours() + 2 + Math.floor(Math.random() * 4),
      );

      const status = this.getRandomItem(Object.values(MissionStatus));

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

      // COMPLETED veya ABORTED ise actual dates ekle
      if (
        status === MissionStatus.COMPLETED ||
        status === MissionStatus.ABORTED
      ) {
        const actualStart = new Date(plannedStart);
        actualStart.setHours(
          actualStart.getHours() + Math.floor(Math.random() * 2),
        );
        mission.actualStart = actualStart;

        const actualEnd = new Date(actualStart);
        actualEnd.setHours(
          actualEnd.getHours() + 1 + Math.floor(Math.random() * 3),
        );
        mission.actualEnd = actualEnd;

        if (status === MissionStatus.COMPLETED) {
          mission.flightHoursLogged =
            Math.round((Math.random() * 5 + 0.5) * 10) / 10;
        }

        if (status === MissionStatus.ABORTED) {
          const abortReasons = [
            'Hava koşulları uygun değil',
            'Teknik arıza',
            'Pilot müdahalesi',
            'Güvenlik ihlali',
            'Batarya yetersiz',
            'İletişim sorunu',
            'Acil iniş gerekli',
          ];
          mission.abortReason = this.getRandomItem(abortReasons);
        }
      }

      missions.push(mission);
    }

    return missions;
  }

  private generateMaintenanceLogs(
    drones: Drone[],
    count: number,
  ): MaintenanceLog[] {
    const logs: MaintenanceLog[] = [];
    const now = new Date();

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

    for (let i = 0; i < count; i++) {
      const drone = drones[Math.floor(Math.random() * drones.length)];
      const datePerformed = new Date(now);
      datePerformed.setDate(
        datePerformed.getDate() - Math.floor(Math.random() * 90),
      );

      const log = new MaintenanceLog();
      log.drone = drone;
      log.droneId = drone.id;
      log.type = this.getRandomItem(Object.values(MaintenanceType));
      log.technicianName = this.getRandomItem(technicianNames);
      log.notes = this.getRandomItem(maintenanceNotes);
      log.datePerformed = datePerformed.toISOString().split('T')[0];
      log.flightHoursAtTime =
        Math.round(Math.random() * drone.totalFlightHours * 10) / 10;

      logs.push(log);
    }

    return logs;
  }

  async seed() {
    this.logger.log('🌱 Seeding database...');

    try {
      // 1000 drone oluştur
      const drones = this.generateDrones(1000);
      const savedDrones = await this.droneRepository.save(drones);
      this.logger.log(`✅ ${savedDrones.length} drones created`);

      // 250 mission oluştur
      const missions = this.generateMissions(savedDrones, 250);
      const savedMissions = await this.missionRepository.save(missions);
      this.logger.log(`✅ ${savedMissions.length} missions created`);

      // 500 maintenance log oluştur
      const maintenanceLogs = this.generateMaintenanceLogs(savedDrones, 500);
      const savedLogs =
        await this.maintenanceLogRepository.save(maintenanceLogs);
      this.logger.log(`✅ ${savedLogs.length} maintenance logs created`);

      this.logger.log('🎉 Seeding completed successfully!');

      return {
        drones: savedDrones.length,
        missions: savedMissions.length,
        maintenanceLogs: savedLogs.length,
      };
    } catch (error) {
      this.logger.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  async clearData() {
    this.logger.log('🗑️ Clearing all data...');
    await this.maintenanceLogRepository.delete({});
    await this.missionRepository.delete({});
    await this.droneRepository.delete({});
    this.logger.log('✅ All data cleared');
  }
}
