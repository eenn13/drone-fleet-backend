import { 
  IsString, 
  IsEnum, 
  IsDateString, 
  IsNumber, 
  IsOptional, 
  Min,
  IsNotEmpty 
} from 'class-validator';
import { MaintenanceType } from '../entities/maintenance-log.entity';
import { PartialType } from '@nestjs/mapped-types';

export class CreateMaintenanceLogDto {
  @IsEnum(MaintenanceType)
  @IsNotEmpty({ message: 'Maintenance type is required' })
  type?: MaintenanceType;

  @IsString()
  @IsNotEmpty({ message: 'Technician name is required' })
  technicianName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsNotEmpty({ message: 'Date performed is required' })
  datePerformed?: string;

  @IsNumber()
  @Min(0, { message: 'Flight hours must be at least 0' })
  flightHoursAtTime?: number;

  @IsString()
  @IsNotEmpty({ message: 'Drone ID is required' })
  droneId?: string;
}

export class UpdateMaintenanceLogDto extends PartialType(CreateMaintenanceLogDto) {}