import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DronesModule } from './drones/drones.module';
import { MissionsModule } from './missions/missions.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { Drone } from './entities/drone.entity';
import { Mission } from './entities/mission.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'root'),
        database: configService.get('DB_DATABASE', 'postgres'),
        entities: [Drone, Mission, MaintenanceLog],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    DronesModule,
    MissionsModule,
    MaintenanceModule,
    SeedModule,
  ],
})
export class AppModule {}