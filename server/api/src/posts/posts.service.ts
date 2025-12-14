import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuditAction, PostStatus, PostType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuditPostDto } from './dto/audit-post.dto';
import { maskPhone } from '../utils/phone';

interface ListQuery {
  type?: PostType;
  categoryId?: number;
  q?: string;
  status?: PostStatus;
  page: number;
  pageSize: number;
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: Partial<ListQuery>, onlyApproved = true): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { description: { contains: query.q } },
        { locationText: { contains: query.q } },
        { tagsJson: { contains: query.q } },
      ];
    }
    if (onlyApproved) {
      where.status = PostStatus.APPROVED;
    }
    return where;
  }

  async createByUser(dto: CreatePostDto, userId: number) {
    if (!dto.images || dto.images.length < 2) {
      throw new BadRequestException('至少上传 2 张图片');
    }
    const post = await this.prisma.post.create({
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationText: dto.locationText,
        contactPhone: dto.contactPhone,
        tagsJson: dto.tags ? JSON.stringify(dto.tags) : null,
        status: PostStatus.PENDING,
        createdByUser: userId,
      },
    });

    await this.prisma.postImage.createMany({
      data: dto.images.map((url, idx) => ({
        postId: post.id,
        url,
        sort: idx,
      })),
    });

    return this.findDetail(post.id, userId);
  }

  async updateByUser(id: number, dto: UpdatePostDto, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('信息不存在');
    if (post.createdByUser !== userId) throw new ForbiddenException('无权操作');

    const data: Prisma.PostUpdateInput = {
      ...dto,
      tagsJson: dto.tags ? JSON.stringify(dto.tags) : undefined,
      status: PostStatus.PENDING, // 用户修改后重新进入待审核
    };

    await this.prisma.post.update({ where: { id }, data });

    if (dto.images && dto.images.length > 0) {
      await this.prisma.postImage.deleteMany({ where: { postId: id } });
      await this.prisma.postImage.createMany({
        data: dto.images.map((url, idx) => ({ postId: id, url, sort: idx })),
      });
    }

    return this.findDetail(id, userId);
  }

  async deleteByUser(id: number, userId: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('信息不存在');
    if (post.createdByUser !== userId) throw new ForbiddenException('无权删除');
    await this.prisma.post.delete({ where: { id } });
    return { success: true };
  }

  async listPublic(query: ListQuery) {
    const where = this.buildWhere(query, true);
    const [total, items] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { sort: 'asc' } },
          category: true,
        },
      }),
    ]);

    return {
      total,
      items: items.map((item) => this.maskPublicPhone(item)),
    };
  }

  async listMine(query: ListQuery, userId: number) {
    const where = this.buildWhere(query, false);
    where.createdByUser = userId;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { sort: 'asc' } },
          category: true,
        },
      }),
    ]);
    return { total, items: items.map((item) => this.maskPublicPhone(item)) };
  }

  async findDetail(id: number, userId?: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sort: 'asc' } },
        category: true,
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });
    if (!post) throw new NotFoundException('信息不存在');

    if (post.status !== PostStatus.APPROVED) {
      const isOwner = userId && post.createdByUser === userId;
      const isAdmin = false;
      if (!isOwner && !isAdmin) {
        throw new NotFoundException('信息未公开');
      }
    }

    return this.maskPublicPhone(post);
  }

  async adminList(query: ListQuery & { status?: PostStatus }) {
    const where = this.buildWhere(query, false);
    if (query.status) where.status = query.status;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { sort: 'asc' } },
          category: true,
        },
      }),
    ]);
    return { total, items };
  }

  async adminCreate(dto: CreatePostDto, adminId: number) {
    const post = await this.prisma.post.create({
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationText: dto.locationText,
        contactPhone: dto.contactPhone,
        tagsJson: dto.tags ? JSON.stringify(dto.tags) : null,
        status: PostStatus.APPROVED,
        createdByAdmin: adminId,
      },
    });
    await this.prisma.postImage.createMany({
      data: dto.images.map((url, idx) => ({
        postId: post.id,
        url,
        sort: idx,
      })),
    });
    return this.findDetail(post.id);
  }

  async audit(id: number, dto: AuditPostDto, adminId: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('信息不存在');

    let status: PostStatus = post.status;
    if (dto.action === AuditAction.APPROVED) status = PostStatus.APPROVED;
    if (dto.action === AuditAction.REJECTED) status = PostStatus.REJECTED;
    if (dto.action === AuditAction.OFFLINE) status = PostStatus.OFFLINE;

    await this.prisma.$transaction([
      this.prisma.post.update({
        where: { id },
        data: {
          status,
          rejectReason: dto.reason,
        },
      }),
      this.prisma.auditRecord.create({
        data: {
          postId: id,
          adminId,
          action: dto.action,
          reason: dto.reason,
        },
      }),
    ]);

    return { success: true };
  }

  private maskPublicPhone(post: any) {
    return {
      ...post,
      contactPhone: maskPhone(post.contactPhone),
      tags: post.tagsJson ? this.safeParseTags(post.tagsJson) : [],
    };
  }

  private safeParseTags(raw: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      return [];
    }
  }
}
