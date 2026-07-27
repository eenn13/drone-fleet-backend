import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { Drone } from '../entities/drone.entity';
import { Mission } from '../entities/mission.entity';
import { MaintenanceLog } from '../entities/maintenance-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Drone, Mission, MaintenanceLog])],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}