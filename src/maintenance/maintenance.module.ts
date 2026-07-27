import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceLog } from '../entities/maintenance-log.entity';
import { Drone } from '../entities/drone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceLog, Drone])],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}