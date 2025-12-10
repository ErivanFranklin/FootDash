import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Reaction, ReactionType, ReactionTargetType } from '../entities/reaction.entity';
import { CreateReactionDto, ReactionSummaryDto } from '../dto/reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
  ) {}

  async addReaction(userId: number, dto: CreateReactionDto): Promise<Reaction> {
    // Check if user already has a reaction on this target
    const existingReaction = await this.reactionRepository.findOne({
      where: {
        userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
      },
    });

    if (existingReaction) {
      // Update existing reaction
      existingReaction.reactionType = dto.reactionType;
      return this.reactionRepository.save(existingReaction);
    }

    // Create new reaction
    const reaction = this.reactionRepository.create({
      userId,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reactionType: dto.reactionType,
    });

    return this.reactionRepository.save(reaction);
  }

  async removeReaction(userId: number, targetType: ReactionTargetType, targetId: number): Promise<void> {
    const reaction = await this.reactionRepository.findOne({
      where: { userId, targetType, targetId },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.reactionRepository.remove(reaction);
  }

  async getReactionsByTarget(targetType: ReactionTargetType, targetId: number): Promise<Reaction[]> {
    return this.reactionRepository.find({
      where: { targetType, targetId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserReaction(userId: number, targetType: ReactionTargetType, targetId: number): Promise<Reaction | null> {
    return this.reactionRepository.findOne({
      where: { userId, targetType, targetId },
    });
  }

  async getReactionSummary(targetType: ReactionTargetType, targetId: number, userId?: number): Promise<ReactionSummaryDto> {
    const reactions = await this.reactionRepository.find({
      where: { targetType, targetId },
    });

    const summary: ReactionSummaryDto = {
      like: 0,
      love: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      angry: 0,
      total: reactions.length,
    };

    reactions.forEach(reaction => {
      summary[reaction.reactionType]++;
      if (userId && reaction.userId === userId) {
        summary.userReaction = reaction.reactionType;
      }
    });

    return summary;
  }

  async getReactionCount(targetType: ReactionTargetType, targetId: number): Promise<number> {
    return this.reactionRepository.count({
      where: { targetType, targetId },
    });
  }

  async getBulkReactionSummaries(targetType: ReactionTargetType, targetIds: number[], userId?: number): Promise<Map<number, ReactionSummaryDto>> {
    const reactions = await this.reactionRepository.find({
      where: { 
        targetType, 
        targetId: In(targetIds),
      },
    });

    const summaries = new Map<number, ReactionSummaryDto>();
    
    targetIds.forEach(id => {
      summaries.set(id, {
        like: 0,
        love: 0,
        laugh: 0,
        wow: 0,
        sad: 0,
        angry: 0,
        total: 0,
      });
    });

    reactions.forEach(reaction => {
      const summary = summaries.get(reaction.targetId);
      if (summary) {
        summary[reaction.reactionType]++;
        summary.total++;
        if (userId && reaction.userId === userId) {
          summary.userReaction = reaction.reactionType;
        }
      }
    });

    return summaries;
  }
}
