import { Controller, Post, Delete, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('api/seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async seed() {
    return this.seedService.seed();
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clear() {
    return this.seedService.clearData();
  }

  @Get('status')
  async status() {
    return { 
      message: 'Seed service is running',
      endpoints: {
        seed: 'POST /api/seed - Seed the database with 1000 drones, 250 missions, 500 maintenance logs',
        clear: 'DELETE /api/seed - Clear all data',
        status: 'GET /api/seed/status - Check seed service status'
      }
    };
  }
}