import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';

@Controller()
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get('categories')
  async list() {
    return this.service.findPublic();
  }

  @Get('admin/categories')
  @UseGuards(AdminAuthGuard)
  async adminList() {
    return this.service.findAll();
  }

  @Post('admin/categories')
  @UseGuards(AdminAuthGuard)
  async create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Put('admin/categories/:id')
  @UseGuards(AdminAuthGuard)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete('admin/categories/:id')
  @UseGuards(AdminAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
