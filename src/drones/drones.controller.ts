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
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { DronesService } from './drones.service';
import { CreateDroneDto, UpdateDroneDto } from '../dto/create-drone.dto';

@Controller('api/drones')
export class DronesController {
  constructor(private readonly dronesService: DronesService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.dronesService.findAll({ page, limit, search, status });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const drone = await this.dronesService.findOne(id);
    if (!drone) {
      throw new NotFoundException(`Drone with ID ${id} not found`);
    }
    return drone;
  }

  @Get(':id/can-delete')
  async canDelete(@Param('id') id: string) {
    const canDelete = await this.dronesService.canDelete(id);
    return {
      canDelete,
      activeMissionCount: canDelete ? 0 : await this.dronesService.getActiveMissionCount(id),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDroneDto: CreateDroneDto) {
    return this.dronesService.create(createDroneDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDroneDto: UpdateDroneDto,
  ) {
    const drone = await this.dronesService.update(id, updateDroneDto);
    if (!drone) {
      throw new NotFoundException(`Drone with ID ${id} not found`);
    }
    return drone;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const result = await this.dronesService.remove(id);
    if (!result) {
      throw new NotFoundException(`Drone with ID ${id} not found`);
    }
  }

  @Post(':id/maintenance')
  async updateMaintenance(
    @Param('id') id: string,
    @Query('action') action: 'complete' | 'schedule',
  ) {
    return this.dronesService.updateMaintenanceSchedule(id, action);
  }
}