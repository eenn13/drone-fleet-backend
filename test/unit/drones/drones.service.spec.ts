import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DronesService } from '../../../src/drones/drones.service';
import { Drone, DroneModel, DroneStatus } from '../../../src/entities/drone.entity';
import { Mission } from '../../../src/entities/mission.entity';
import { BadRequestException } from '@nestjs/common';

describe('DronesService', () => {
  let service: DronesService;

  const mockDroneRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockMissionRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DronesService,
        {
          provide: getRepositoryToken(Drone),
          useValue: mockDroneRepository,
        },
        {
          provide: getRepositoryToken(Mission),
          useValue: mockMissionRepository,
        },
      ],
    }).compile();

    service = module.get<DronesService>(DronesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Serial Number Validation', () => {
    it('should accept valid serial number format', () => {
      const validSerial = 'SKY-A7B3-9C2D';
      const regex = /^SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      expect(regex.test(validSerial)).toBe(true);
    });

    it('should reject invalid serial number format', () => {
      const invalidSerial = 'SKY-A7B3-9C2';
      const regex = /^SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
      expect(regex.test(invalidSerial)).toBe(false);
    });

    it('should throw error when serial number already exists', async () => {
      const createDroneDto = {
        serialNumber: 'SKY-A7B3-9C2D',
        model: DroneModel.MATRICE_300,
        status: DroneStatus.AVAILABLE,
        totalFlightHours: 100,
        lastMaintenanceDate: '2026-07-15',
        nextMaintenanceDueDate: '2026-08-15',
      };

      mockDroneRepository.findOne.mockResolvedValue({ id: 'existing-drone' });

      await expect(service.create(createDroneDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create drone with valid serial number', async () => {
      const createDroneDto = {
        serialNumber: 'SKY-NEW-1234',
        model: DroneModel.MAVIC_3_ENTERPRISE,
        status: DroneStatus.AVAILABLE,
        totalFlightHours: 0,
        lastMaintenanceDate: '2026-07-15',
        nextMaintenanceDueDate: '2026-08-15',
      };

      const createdDrone = {
        id: 'new-drone',
        ...createDroneDto,
      };

      mockDroneRepository.findOne.mockResolvedValue(null);
      mockDroneRepository.create.mockReturnValue(createdDrone);
      mockDroneRepository.save.mockResolvedValue(createdDrone);

      const result = await service.create(createDroneDto);
      expect(result).toBeDefined();
      expect(result.serialNumber).toBe(createDroneDto.serialNumber);
    });
  });
});