import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMsg } from '../entities/chat-msg.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMsg)
    private chatRepo: Repository<ChatMsg>,
  ) {}

  async saveMessage(userId: number, matchId: number, content: string): Promise<ChatMsg> {
    const msg = this.chatRepo.create({
      userId,
      matchId,
      content,
    });
    return this.chatRepo.save(msg);
  }

  async getRecentMessages(matchId: number, limit = 50): Promise<ChatMsg[]> {
    return this.chatRepo.find({
      where: { matchId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }
}
