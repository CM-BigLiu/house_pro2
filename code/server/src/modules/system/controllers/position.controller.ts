import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from '../entities/position.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('system/positions')
@UseGuards(JwtAuthGuard)
export class PositionController {
  constructor(
    @InjectRepository(Position)
    private positionRepo: Repository<Position>,
  ) {}

  @Get()
  async findAll() {
    return this.positionRepo.find({ order: { sort: 'ASC', id: 'ASC' } });
  }
}
