import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PostStatus } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(postId: number) {
    return this.prisma.comment.findMany({
      where: { postId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });
  }

  async create(postId: number, dto: CreateCommentDto, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('信息不存在');
    if (post.status !== PostStatus.APPROVED) {
      throw new BadRequestException('信息未公开，不能留言');
    }

    return this.prisma.comment.create({
      data: {
        postId,
        userId,
        content: dto.content,
      },
      include: { user: true },
    });
  }

  async remove(id: number, adminId: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('留言不存在');
    await this.prisma.comment.update({
      where: { id },
      data: { isDeleted: true },
    });
    return { success: true, operator: adminId };
  }
}
