import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DronesModule } from '../../src/drones/drones.module';
import { MissionsModule } from '../../src/missions/missions.module';
import { MaintenanceModule } from '../../src/maintenance/maintenance.module';
import { Drone, DroneStatus, DroneModel } from '../../src/entities/drone.entity';
import { Mission, MissionStatus, MissionType } from '../../src/entities/mission.entity';
import { MaintenanceLog } from '../../src/entities/maintenance-log.entity';
import { DronesService } from '../../src/drones/drones.service';
import { MissionsService } from '../../src/missions/missions.service';

describe('Mission Lifecycle Integration Test', () => {
  let app: INestApplication;
  let dronesService: DronesService;
  let missionsService: MissionsService;

  let testDrone: Drone;
  let testMission: Mission;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: parseInt(configService.get('DB_PORT', '5432')),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'root'),
            database: configService.get('DB_TEST_DATABASE', 'postgres'),
            entities: [Drone, Mission, MaintenanceLog],
            synchronize: true,
            dropSchema: true,
            logging: false,
          }),
          inject: [ConfigService],
        }),
        DronesModule,
        MissionsModule,
        MaintenanceModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    dronesService = module.get<DronesService>(DronesService);
    missionsService = module.get<MissionsService>(MissionsService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete full mission lifecycle', async () => {
    // 1. Create a drone
    const createDroneDto = {
      serialNumber: 'SKY-INT-1234',
      model: DroneModel.MATRICE_300,
      status: DroneStatus.AVAILABLE,
      totalFlightHours: 0,
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      nextMaintenanceDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    };

    testDrone = await dronesService.create(createDroneDto);
    expect(testDrone).toBeDefined();
    expect(testDrone.serialNumber).toBe('SKY-INT-1234');
    expect(testDrone.status).toBe(DroneStatus.AVAILABLE);

    // 2. Schedule a mission - ✅ MissionType enum kullan
    const createMissionDto = {
      name: 'Integration Test Mission',
      type: MissionType.WIND_TURBINE_INSPECTION,
      pilotName: 'Test Pilot',
      siteLocation: 'Test Location',
      plannedStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      plannedEnd: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
      status: MissionStatus.PLANNED,
      droneId: testDrone.id,
    };

    testMission = await missionsService.create(createMissionDto);
    expect(testMission).toBeDefined();
    expect(testMission.status).toBe(MissionStatus.PLANNED);

    // 3. Start mission (IN_PROGRESS)
    const startMission = await missionsService.update(testMission.id, {
      status: MissionStatus.IN_PROGRESS,
    });
    expect(startMission.status).toBe(MissionStatus.IN_PROGRESS);

    // Verify drone status changed
    const droneInMission = await dronesService.findOne(testDrone.id);
    expect(droneInMission).not.toBeNull();
    if (droneInMission) {
      expect(droneInMission.status).toBe(DroneStatus.IN_MISSION);
    }

    // 4. Complete mission
    const flightHours = 3.5;
    const completeMission = await missionsService.update(testMission.id, {
      status: MissionStatus.COMPLETED,
      flightHoursLogged: flightHours,
    });
    expect(completeMission.status).toBe(MissionStatus.COMPLETED);
    expect(completeMission.flightHoursLogged).toBe(flightHours);

    // Verify drone flight hours updated
    const completedDrone = await dronesService.findOne(testDrone.id);
    expect(completedDrone).not.toBeNull();
    if (completedDrone) {
      expect(completedDrone.totalFlightHours).toBe(flightHours);
      expect(completedDrone.status).toBe(DroneStatus.AVAILABLE);
    }
  });
});