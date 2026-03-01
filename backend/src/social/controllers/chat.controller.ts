import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ChatService } from '../services/chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':matchId/messages')
  async getMessages(
    @Param('matchId', ParseIntPipe) matchId: number,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Math.min(parseInt(limit, 10), 100) : 50;
    const messages = await this.chatService.getRecentMessages(matchId, take);
    // Reverse so oldest is first (DB returns DESC)
    return messages.reverse();
  }
}
