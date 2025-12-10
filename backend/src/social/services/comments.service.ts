import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from '../dto/comment.dto';
import { Reaction } from '../entities/reaction.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
  ) {}

  async createComment(userId: number, dto: CreateCommentDto): Promise<Comment> {
    // Validate that at least one target is specified
    if (!dto.matchId && !dto.predictionId && !dto.parentCommentId) {
      throw new BadRequestException('Comment must be associated with a match, prediction, or parent comment');
    }

    // Validate parent comment exists if specified
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

    return this.commentRepository.save(comment);
  }

  async getCommentsByMatch(matchId: number, page: number = 1, limit: number = 20, userId?: number): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { matchId, isDeleted: false, parentCommentId: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return this.enrichComments(comments, userId);
  }

  async getCommentsByPrediction(predictionId: number, page: number = 1, limit: number = 20, userId?: number): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { predictionId, isDeleted: false, parentCommentId: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return this.enrichComments(comments, userId);
  }

  async getReplies(parentCommentId: number, page: number = 1, limit: number = 10, userId?: number): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { parentCommentId, isDeleted: false },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return this.enrichComments(comments, userId);
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
    return this.commentRepository.save(comment);
  }

  async deleteComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
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
  }

  async getCommentCount(targetType: 'match' | 'prediction', targetId: number): Promise<number> {
    const where: any = { isDeleted: false };
    
    if (targetType === 'match') {
      where.matchId = targetId;
    } else {
      where.predictionId = targetId;
    }

    return this.commentRepository.count({ where });
  }

  private async enrichComments(comments: Comment[], userId?: number): Promise<CommentResponseDto[]> {
    const commentIds = comments.map(c => c.id);

    // Get reply counts
    const replyCounts = await this.commentRepository
      .createQueryBuilder('comment')
      .select('comment.parent_comment_id', 'parentId')
      .addSelect('COUNT(*)', 'count')
      .where('comment.parent_comment_id IN (:...ids)', { ids: commentIds })
      .andWhere('comment.is_deleted = false')
      .groupBy('comment.parent_comment_id')
      .getRawMany();

    const replyCountMap = new Map(replyCounts.map(r => [r.parentId, parseInt(r.count)]));

    // Get reaction counts
    const reactionCounts = await this.reactionRepository
      .createQueryBuilder('reaction')
      .select('reaction.target_id', 'targetId')
      .addSelect('COUNT(*)', 'count')
      .where('reaction.target_type = :type', { type: 'comment' })
      .andWhere('reaction.target_id IN (:...ids)', { ids: commentIds })
      .groupBy('reaction.target_id')
      .getRawMany();

    const reactionCountMap = new Map(reactionCounts.map(r => [r.targetId, parseInt(r.count)]));

    // Get user's reactions if userId provided
    let userReactions = new Map();
    if (userId) {
      const reactions = await this.reactionRepository.find({
        where: {
          userId,
          targetType: 'comment' as any,
          targetId: commentIds.length > 0 ? commentIds[0] : 0, // Will be handled by IN query
        },
      });
      userReactions = new Map(reactions.map(r => [r.targetId, r.reactionType]));
    }

    return comments.map(comment => ({
      id: comment.id,
      userId: comment.userId,
      userName: comment.user?.email || 'Unknown User',
      userAvatar: comment.user?.profilePhoto || undefined,
      matchId: comment.matchId,
      predictionId: comment.predictionId,
      parentCommentId: comment.parentCommentId,
      content: comment.content,
      replyCount: replyCountMap.get(comment.id) || 0,
      reactionCount: reactionCountMap.get(comment.id) || 0,
      userReaction: userReactions.get(comment.id),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));
  }
}
