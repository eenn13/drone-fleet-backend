import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpCode, 
  HttpStatus,
  NotFoundException
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceLogDto, UpdateMaintenanceLogDto } from '../dto/create-maintenance-log.dto';

@Controller('api/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('droneId') droneId?: string,
  ) {
    return this.maintenanceService.findAll({ page, limit, droneId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const log = await this.maintenanceService.findOne(id);
    if (!log) {
      throw new NotFoundException(`Maintenance log with ID ${id} not found`);
    }
    return log;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMaintenanceLogDto: CreateMaintenanceLogDto) {
    return this.maintenanceService.create(createMaintenanceLogDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaintenanceLogDto: UpdateMaintenanceLogDto,
  ) {
    const log = await this.maintenanceService.update(id, updateMaintenanceLogDto);
    if (!log) {
      throw new NotFoundException(`Maintenance log with ID ${id} not found`);
    }
    return log;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const result = await this.maintenanceService.remove(id);
    if (!result) {
      throw new NotFoundException(`Maintenance log with ID ${id} not found`);
    }
  }
}