import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reaction, ReactionType, ReactionTargetType } from '../entities/reaction.entity';
import { CreateReactionDto, ReactionSummaryDto, ReactionResponseDto } from '../dto/reaction.dto';
import { SocialGateway } from '../../websockets/social.gateway';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
    private readonly socialGateway: SocialGateway,
  ) {}

  async addReaction(userId: number, dto: CreateReactionDto): Promise<Reaction> {
    // Check if user already has a reaction on this target
    const existing = await this.reactionRepository.findOne({
      where: {
        userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
      },
    });

    if (existing) {
      // Update existing reaction
      existing.reactionType = dto.reactionType;
      return await this.reactionRepository.save(existing);
    }

    // Create new reaction
    const reaction = this.reactionRepository.create({
      userId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reactionType: dto.reactionType,
    });

    const savedReaction = await this.reactionRepository.save(reaction);

    // Broadcast real-time reaction event
    this.socialGateway.broadcastSocialEvent({
      type: 'reaction',
      targetType: dto.targetType === ReactionTargetType.MATCH ? 'match' : 'prediction',
      targetId: dto.targetId,
      userId,
      userName: '', // Will be populated by the controller
      data: {
        reaction: savedReaction,
        summary: await this.getReactionSummary(null, dto.targetType, dto.targetId),
      },
    });

    return savedReaction;
  }

  async removeReaction(userId: number, targetType: ReactionTargetType, targetId: number): Promise<boolean> {
    const reaction = await this.reactionRepository.findOne({
      where: { userId, targetType, targetId },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.reactionRepository.remove(reaction);
    return true;
  }

  async getReactionsByTarget(targetType: ReactionTargetType, targetId: number): Promise<Reaction[]> {
    return await this.reactionRepository.find({
      where: { targetType, targetId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserReaction(userId: number, targetType: ReactionTargetType, targetId: number): Promise<Reaction | null> {
    return await this.reactionRepository.findOne({
      where: { userId, targetType, targetId },
    });
  }

  async getReactionSummary(userId: number | null, targetType: ReactionTargetType, targetId: number): Promise<ReactionSummaryDto> {
    const reactions = await this.getReactionsByTarget(targetType, targetId);

    const summary: ReactionSummaryDto = {
      like: 0,
      love: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      angry: 0,
      total: reactions.length,
    };

    // Count each reaction type
    reactions.forEach(reaction => {
      summary[reaction.reactionType]++;
      
      // Check if this is the current user's reaction
      if (userId && reaction.userId === userId) {
        summary.userReaction = reaction.reactionType;
      }
    });

    return summary;
  }

  async getReactionCount(targetType: ReactionTargetType, targetId: number): Promise<number> {
    return await this.reactionRepository.count({
      where: { targetType, targetId },
    });
  }

  async getReactionCountByType(targetType: ReactionTargetType, targetId: number, reactionType: ReactionType): Promise<number> {
    return await this.reactionRepository.count({
      where: { targetType, targetId, reactionType },
    });
  }

  toResponseDto(reaction: Reaction): ReactionResponseDto {
    return {
      id: reaction.id,
      userId: reaction.userId,
      userName: reaction.user?.email || 'Unknown',
      targetType: reaction.targetType,
      targetId: reaction.targetId,
      reactionType: reaction.reactionType,
      createdAt: reaction.createdAt.toISOString(),
    };
  }
}
