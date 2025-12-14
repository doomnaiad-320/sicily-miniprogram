import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { OptionalUserGuard } from '../common/guards/optional-user.guard';

@Module({
  providers: [PostsService, OptionalUserGuard],
  controllers: [PostsController],
})
export class PostsModule {}
