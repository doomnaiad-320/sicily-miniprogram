import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuditPostDto } from './dto/audit-post.dto';
import { UserAuthGuard } from '../common/guards/user-auth.guard';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';
import { PostStatus, PostType } from '@prisma/client';
import { OptionalUserGuard } from '../common/guards/optional-user.guard';

@Controller()
export class PostsController {
  constructor(private readonly service: PostsService) {}

  @Get('posts')
  async list(
    @Query('type') type?: PostType,
    @Query('categoryId') categoryId?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    return this.service.listPublic({
      type,
      categoryId: categoryId ? Number(categoryId) : undefined,
      q: q || undefined,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });
  }

  @Get('posts/:id')
  @UseGuards(OptionalUserGuard)
  async detail(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: any) {
    return this.service.findDetail(id, user?.id);
  }

  @HttpPost('posts')
  @UseGuards(UserAuthGuard)
  async create(@Body() dto: CreatePostDto, @CurrentUser() user: any) {
    return this.service.createByUser(dto, user.id);
  }

  @Patch('posts/:id')
  @UseGuards(UserAuthGuard)
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto, @CurrentUser() user: any) {
    return this.service.updateByUser(id, dto, user.id);
  }

  @Delete('posts/:id')
  @UseGuards(UserAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.deleteByUser(id, user.id);
  }

  @Get('me/posts')
  @UseGuards(UserAuthGuard)
  async myPosts(
    @CurrentUser() user: any,
    @Query('status') status?: PostStatus,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    return this.service.listMine(
      {
        status,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 10,
      },
      user.id,
    );
  }

  // 管理端
  @Get('admin/posts')
  @UseGuards(AdminAuthGuard)
  async adminList(
    @Query('type') type?: PostType,
    @Query('status') status?: PostStatus,
    @Query('categoryId') categoryId?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
  ) {
    return this.service.adminList({
      type,
      status,
      categoryId: categoryId ? Number(categoryId) : undefined,
      q: q || undefined,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });
  }

  @HttpPost('admin/posts')
  @UseGuards(AdminAuthGuard)
  async adminCreate(@Body() dto: CreatePostDto, @CurrentAdmin() admin: any) {
    return this.service.adminCreate(dto, admin.id);
  }

  @Patch('admin/posts/:id/status')
  @UseGuards(AdminAuthGuard)
  async audit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AuditPostDto,
    @CurrentAdmin() admin: any,
  ) {
    return this.service.audit(id, dto, admin.id);
  }
}
