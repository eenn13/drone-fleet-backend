import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { Mission } from '../entities/mission.entity';
import { Drone } from '../entities/drone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mission, Drone])],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}