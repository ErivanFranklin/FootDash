import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChatService } from './chat.service';
import { ChatMsg } from '../entities/chat-msg.entity';

describe('ChatService', () => {
  let service: ChatService;
  let repo: Repository<ChatMsg>;

  const repoMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  } as unknown as Repository<ChatMsg>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(ChatMsg), useValue: repoMock },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    repo = module.get(getRepositoryToken(ChatMsg));
    jest.clearAllMocks();
  });

  it('saves chat messages through repository', async () => {
    (repo.create as any).mockReturnValue({
      userId: 1,
      matchId: 99,
      content: 'hello',
    });
    (repo.save as any).mockResolvedValue({ id: 7, content: 'hello' });

    const result = await service.saveMessage(1, 99, 'hello');

    expect(repo.create).toHaveBeenCalledWith({
      userId: 1,
      matchId: 99,
      content: 'hello',
    });
    expect(repo.save).toHaveBeenCalled();
    expect(result).toEqual({ id: 7, content: 'hello' });
  });

  it('gets recent messages with default limit', async () => {
    (repo.find as any).mockResolvedValue([{ id: 1 }]);

    const result = await service.getRecentMessages(44);

    expect(repo.find).toHaveBeenCalledWith({
      where: { matchId: 44 },
      order: { createdAt: 'DESC' },
      take: 50,
      relations: ['user'],
    });
    expect(result).toEqual([{ id: 1 }]);
  });

  it('gets recent messages with custom limit', async () => {
    (repo.find as any).mockResolvedValue([{ id: 2 }]);

    await service.getRecentMessages(44, 10);

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { matchId: 44 },
        take: 10,
      }),
    );
  });
});