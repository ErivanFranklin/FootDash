import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto, PaginatedCommentsDto } from '../dto/comment.dto';
import { PaginationQueryDto } from '../dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async createComment(userId: number, dto: CreateCommentDto): Promise<Comment> {
    // Validate that at least one target is provided
    if (!dto.matchId && !dto.predictionId && !dto.parentCommentId) {
      throw new ForbiddenException('Comment must be associated with a match, prediction, or parent comment');
    }

    // If replying to a comment, verify parent exists
    if (dto.parentCommentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentCommentId, isDeleted: false },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.commentRepository.create({
      userId,
      content: dto.content,
      matchId: dto.matchId,
      predictionId: dto.predictionId,
      parentCommentId: dto.parentCommentId,
    });

    return await this.commentRepository.save(comment);
  }

  async getCommentsByMatch(matchId: number, query: PaginationQueryDto): Promise<PaginatedCommentsDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { matchId, parentCommentId: null, isDeleted: false },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      comments: await Promise.all(comments.map(c => this.toResponseDto(c))),
      total,
      page,
      limit,
      hasMore: skip + comments.length < total,
    };
  }

  async getCommentsByPrediction(predictionId: number, query: PaginationQueryDto): Promise<PaginatedCommentsDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { predictionId, parentCommentId: null, isDeleted: false },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      comments: await Promise.all(comments.map(c => this.toResponseDto(c))),
      total,
      page,
      limit,
      hasMore: skip + comments.length < total,
    };
  }

  async getReplies(parentCommentId: number, query: PaginationQueryDto): Promise<PaginatedCommentsDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { parentCommentId, isDeleted: false },
      relations: ['user'],
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    return {
      comments: await Promise.all(comments.map(c => this.toResponseDto(c))),
      total,
      page,
      limit,
      hasMore: skip + comments.length < total,
    };
  }

  async updateComment(commentId: number, userId: number, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    return await this.commentRepository.save(comment);
  }

  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await this.commentRepository.save(comment);

    return true;
  }

  async getCommentCount(targetType: 'match' | 'prediction', targetId: number): Promise<number> {
    const where: any = { isDeleted: false, parentCommentId: null };
    
    if (targetType === 'match') {
      where.matchId = targetId;
    } else {
      where.predictionId = targetId;
    }

    return await this.commentRepository.count({ where });
  }

  async getReplyCount(commentId: number): Promise<number> {
    return await this.commentRepository.count({
      where: { parentCommentId: commentId, isDeleted: false },
    });
  }

  private async toResponseDto(comment: Comment): Promise<CommentResponseDto> {
    const replyCount = await this.getReplyCount(comment.id);

    return {
      id: comment.id,
      userId: comment.userId,
      userName: comment.user?.email || 'Unknown',
      userAvatar: comment.user?.avatar,
      matchId: comment.matchId,
      predictionId: comment.predictionId,
      parentCommentId: comment.parentCommentId,
      content: comment.content,
      replyCount,
      reactionCount: 0, // Will be populated by ReactionsService
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      isDeleted: comment.isDeleted,
    };
  }
}
