import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppService } from '../../src/app.service';
import { Drone } from '../../src/entities/drone.entity';
import { Mission } from '../../src/entities/mission.entity';

describe('AppService - Fleet Health Report', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getRepositoryToken(Drone),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
              getRawOne: jest.fn().mockResolvedValue({ average: '0' }),
              getMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Mission),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFleetHealth', () => {
    it('should return fleet health summary with data', async () => {
      // Arrange
      const droneRepository = {
        count: jest.fn().mockResolvedValue(1000),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn()
            .mockResolvedValueOnce([
              { status: 'AVAILABLE', count: '450' },
              { status: 'IN_MISSION', count: '200' },
              { status: 'MAINTENANCE', count: '50' },
              { status: 'RETIRED', count: '300' },
            ])
            .mockResolvedValueOnce([
              { status: 'overdue', count: '15' },
              { status: 'due_soon', count: '45' },
              { status: 'good', count: '640' },
            ]),
          getRawOne: jest.fn().mockResolvedValue({ average: '125.45' }),
          getMany: jest.fn().mockResolvedValue([
            {
              id: 'drone-1',
              serialNumber: 'SKY-A7B3-9C2D',
              model: 'MATRICE_300',
              status: 'MAINTENANCE',
              totalFlightHours: 245.5,
              lastMaintenanceDate: '2026-07-10',
              nextMaintenanceDueDate: '2026-07-20',
            },
          ]),
        }),
      };

      const missionRepository = {
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            {
              id: 'mission-1',
              name: 'Test Mission',
              type: 'WIND_TURBINE_INSPECTION',
              status: 'PLANNED',
              droneId: 'drone-1',
              pilotName: 'Test Pilot',
              siteLocation: 'Test Location',
              plannedStart: new Date(),
              plannedEnd: new Date(),
            },
          ]),
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AppService,
          {
            provide: getRepositoryToken(Drone),
            useValue: droneRepository,
          },
          {
            provide: getRepositoryToken(Mission),
            useValue: missionRepository,
          },
        ],
      }).compile();

      service = module.get<AppService>(AppService);

      // Act
      const result = await service.getFleetHealth();

      // Assert
      expect(result.summary.totalDrones).toBe(1000);
      expect(result.summary.statusBreakdown).toHaveLength(4);
      expect(result.summary.averageFlightHours).toBe(125.45);
      expect(result.maintenance.overdueCount).toBe(1);
      expect(result.missions.count).toBe(1);
    });

    it('should handle empty fleet', async () => {
      const droneRepository = {
        count: jest.fn().mockResolvedValue(0),
        createQueryBuilder: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
          getRawOne: jest.fn().mockResolvedValue({ average: '0' }),
          getMany: jest.fn().mockResolvedValue([]),
        }),
      };

      const missionRepository = {
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AppService,
          {
            provide: getRepositoryToken(Drone),
            useValue: droneRepository,
          },
          {
            provide: getRepositoryToken(Mission),
            useValue: missionRepository,
          },
        ],
      }).compile();

      service = module.get<AppService>(AppService);

      const result = await service.getFleetHealth();

      expect(result.summary.totalDrones).toBe(0);
      expect(result.summary.statusBreakdown).toHaveLength(0);
      expect(result.summary.averageFlightHours).toBe(0);
      expect(result.maintenance.overdueCount).toBe(0);
      expect(result.missions.count).toBe(0);
    });
  });
});