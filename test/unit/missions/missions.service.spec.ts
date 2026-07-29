import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MissionsService } from '../../../src/missions/missions.service';
import { Mission, MissionStatus } from '../../../src/entities/mission.entity';
import { Drone, DroneStatus } from '../../../src/entities/drone.entity';
import { BadRequestException } from '@nestjs/common';

describe('MissionsService', () => {
  let service: MissionsService;

  const mockMissionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockDroneRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionsService,
        {
          provide: getRepositoryToken(Mission),
          useValue: mockMissionRepository,
        },
        {
          provide: getRepositoryToken(Drone),
          useValue: mockDroneRepository,
        },
      ],
    }).compile();

    service = module.get<MissionsService>(MissionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Mission Status Transitions', () => {
    const mockDrone = {
      id: 'drone-1',
      serialNumber: 'SKY-A7B3-9C2D',
      status: DroneStatus.AVAILABLE,
    };

    const mockMission = {
      id: 'mission-1',
      name: 'Test Mission',
      droneId: 'drone-1',
      status: MissionStatus.PLANNED,
      plannedStart: new Date('2026-07-28T10:00:00Z'),
      plannedEnd: new Date('2026-07-28T14:00:00Z'),
    };

    it('should allow transition from PLANNED to PRE_FLIGHT_CHECK', async () => {
      const mission = { ...mockMission, status: MissionStatus.PLANNED };
      const updateDto = { status: MissionStatus.PRE_FLIGHT_CHECK };
      
      mockMissionRepository.findOne.mockResolvedValue(mission);
      mockDroneRepository.findOne.mockResolvedValue(mockDrone);
      mockMissionRepository.save.mockResolvedValue({ ...mission, status: MissionStatus.PRE_FLIGHT_CHECK });

      const result = await service.update('mission-1', updateDto);
      expect(result.status).toBe(MissionStatus.PRE_FLIGHT_CHECK);
    });

    it('should allow transition from PRE_FLIGHT_CHECK to IN_PROGRESS', async () => {
      const mission = { ...mockMission, status: MissionStatus.PRE_FLIGHT_CHECK };
      const updateDto = { status: MissionStatus.IN_PROGRESS };
      
      mockMissionRepository.findOne.mockResolvedValue(mission);
      mockDroneRepository.findOne.mockResolvedValue(mockDrone);
      mockMissionRepository.save.mockResolvedValue({ ...mission, status: MissionStatus.IN_PROGRESS });

      const result = await service.update('mission-1', updateDto);
      expect(result.status).toBe(MissionStatus.IN_PROGRESS);
    });

    it('should require flight hours when transitioning to COMPLETED', async () => {
      const mission = { ...mockMission, status: MissionStatus.IN_PROGRESS };
      const updateDto = { status: MissionStatus.COMPLETED };
      
      mockMissionRepository.findOne.mockResolvedValue(mission);
      mockDroneRepository.findOne.mockResolvedValue(mockDrone);

      await expect(service.update('mission-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should require abort reason when transitioning to ABORTED', async () => {
      const mission = { ...mockMission, status: MissionStatus.IN_PROGRESS };
      const updateDto = { status: MissionStatus.ABORTED };
      
      mockMissionRepository.findOne.mockResolvedValue(mission);
      mockDroneRepository.findOne.mockResolvedValue(mockDrone);

      await expect(service.update('mission-1', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});