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
import { MissionsService } from './missions.service';
import { CreateMissionDto, UpdateMissionDto } from '../dto/create-mission.dto';

@Controller('api/missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('droneId') droneId?: string,
    @Query('status') status?: string,
  ) {
    return this.missionsService.findAll({ page, limit, droneId, status });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const mission = await this.missionsService.findOne(id);
    if (!mission) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }
    return mission;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMissionDto: CreateMissionDto) {
    return this.missionsService.create(createMissionDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMissionDto: UpdateMissionDto,
  ) {
    const mission = await this.missionsService.update(id, updateMissionDto);
    if (!mission) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }
    return mission;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const result = await this.missionsService.remove(id);
    if (!result) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }
  }
}