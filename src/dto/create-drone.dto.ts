import { 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsDateString, 
  Matches, 
  Min, 
  IsOptional,
  IsNotEmpty 
} from 'class-validator';
import { DroneModel, DroneStatus } from '../entities/drone.entity';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDroneDto {
  @IsString()
  @IsNotEmpty({ message: 'Serial number is required' })
  @Matches(/^SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/, {
    message: 'Serial number must be in format SKY-XXXX-XXXX',
  })
  serialNumber?: string;

  @IsEnum(DroneModel)
  @IsNotEmpty({ message: 'Model is required' })
  model?: DroneModel;

  @IsEnum(DroneStatus)
  @IsNotEmpty({ message: 'Status is required' })
  status?: DroneStatus;

  @IsNumber()
  @Min(0, { message: 'Total flight hours must be at least 0' })
  totalFlightHours?: number;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsNotEmpty({ message: 'Last maintenance date is required' })
  lastMaintenanceDate?: string;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsNotEmpty({ message: 'Next maintenance due date is required' })
  nextMaintenanceDueDate?: string;

  @IsDateString({}, { message: 'Invalid date format' })
  @IsOptional()
  registrationTimestamp?: string;
}

export class UpdateDroneDto extends PartialType(CreateDroneDto) {}