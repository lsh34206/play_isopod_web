import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsopodsService } from './isopods.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateIsopodDto } from './dto/create-isopod.dto';
import { CareIsopodDto } from './dto/update-isopod.dto';

@Controller('isopods')
@UseGuards(JwtAuthGuard)
export class IsopodsController {
  constructor(private readonly isopodsService: IsopodsService) {}

  @Get()
  async findAll(@Request() req) {
    return this.isopodsService.findAllByOwner(req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateIsopodDto) {
    return this.isopodsService.create(req.user.userId, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.isopodsService.findOneByOwner(id, req.user.userId);
  }

  @Post(':id/feed')
  @HttpCode(HttpStatus.OK)
  async feed(@Param('id') id: string, @Request() req) {
    return this.isopodsService.feedIsopod(id, req.user.userId);
  }

  @Post(':id/care')
  @HttpCode(HttpStatus.OK)
  async care(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: CareIsopodDto,
  ) {
    return this.isopodsService.careIsopod(id, req.user.userId, dto);
  }

  @Post(':id/upgrade')
  @HttpCode(HttpStatus.OK)
  async upgrade(@Param('id') id: string, @Request() req) {
    return this.isopodsService.upgradeGrade(id, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async release(@Param('id') id: string, @Request() req) {
    return this.isopodsService.releaseIsopod(id, req.user.userId);
  }
}
