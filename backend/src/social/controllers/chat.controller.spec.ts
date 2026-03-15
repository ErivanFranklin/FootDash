import { Test, TestingModule } from '@nestjs/testing';

import { ChatController } from './chat.controller';
import { ChatService } from '../services/chat.service';

describe('ChatController', () => {
  let controller: ChatController;

  const chatServiceMock = {
    getRecentMessages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: chatServiceMock }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    jest.clearAllMocks();
  });

  it('uses default limit and reverses descending messages', async () => {
    chatServiceMock.getRecentMessages.mockResolvedValue([
      { id: 3 },
      { id: 2 },
      { id: 1 },
    ]);

    const result = await controller.getMessages(8);

    expect(chatServiceMock.getRecentMessages).toHaveBeenCalledWith(8, 50);
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('caps limit at 100', async () => {
    chatServiceMock.getRecentMessages.mockResolvedValue([]);

    await controller.getMessages(8, '120');

    expect(chatServiceMock.getRecentMessages).toHaveBeenCalledWith(8, 100);
  });

  it('passes parsed numeric limit when below cap', async () => {
    chatServiceMock.getRecentMessages.mockResolvedValue([]);

    await controller.getMessages(8, '25');

    expect(chatServiceMock.getRecentMessages).toHaveBeenCalledWith(8, 25);
  });
});