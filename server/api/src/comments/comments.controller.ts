import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post as HttpPost, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserAuthGuard } from '../common/guards/user-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { CurrentAdmin } from '../common/decorators/current-admin.decorator';

@Controller()
export class CommentsController {
  constructor(private readonly service: CommentsService) {}

  @Get('posts/:postId/comments')
  async list(@Param('postId', ParseIntPipe) postId: number) {
    return this.service.list(postId);
  }

  @HttpPost('posts/:postId/comments')
  @UseGuards(UserAuthGuard)
  async create(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.service.create(postId, dto, user.id);
  }

  @Delete('admin/comments/:id')
  @UseGuards(AdminAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentAdmin() admin: any) {
    return this.service.remove(id, admin.id);
  }
}
