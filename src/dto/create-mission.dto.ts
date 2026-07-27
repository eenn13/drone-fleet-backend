import { 
  IsString, 
  IsEnum, 
  IsDateString, 
  IsOptional, 
  IsNumber, 
  Min,
  IsNotEmpty 
} from 'class-validator';
import { MissionType, MissionStatus } from '../entities/mission.entity';
import { PartialType } from '@nestjs/mapped-types';

export class CreateMissionDto {
  @IsString()
  @IsNotEmpty({ message: 'Mission name is required' })
  name?: string;

  @IsEnum(MissionType)
  @IsNotEmpty({ message: 'Mission type is required' })
  type?: MissionType;

  @IsString()
  @IsNotEmpty({ message: 'Pilot name is required' })
  pilotName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Site location is required' })
  siteLocation?: string;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsNotEmpty({ message: 'Planned start date is required' })
  plannedStart?: string;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsNotEmpty({ message: 'Planned end date is required' })
  plannedEnd?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format' })
  actualStart?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format' })
  actualEnd?: string;

  @IsEnum(MissionStatus)
  @IsNotEmpty({ message: 'Mission status is required' })
  status?: MissionStatus;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Flight hours must be at least 0' })
  flightHoursLogged?: number;

  @IsOptional()
  @IsString()
  abortReason?: string;

  @IsString()
  @IsNotEmpty({ message: 'Drone ID is required' })
  droneId?: string;
}

export class UpdateMissionDto extends PartialType(CreateMissionDto) {}