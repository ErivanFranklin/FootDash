import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  const createGateway = () => {
    const chatService = {
      saveMessage: jest.fn(),
    };
    const gateway = new ChatGateway(chatService as any);

    const emit = jest.fn();
    const server = {
      to: jest.fn(() => ({ emit })),
    };

    gateway.server = server as any;

    return { gateway, chatService, server, emit };
  };

  it('joins room and broadcasts online users for the match', () => {
    const { gateway, server, emit } = createGateway();
    const client = {
      id: 's1',
      join: jest.fn(),
      to: jest.fn(() => ({ emit: jest.fn() })),
    } as any;

    gateway.handleJoinRoom({ matchId: 10, userId: 2 }, client);

    expect(client.join).toHaveBeenCalledWith('match-10');
    expect(server.to).toHaveBeenCalledWith('match-10');
    expect(emit).toHaveBeenCalledWith('online-users', {
      count: 1,
      userIds: [2],
    });
  });

  it('leaves room and updates online users', () => {
    const { gateway, emit } = createGateway();
    const client = {
      id: 's2',
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn(() => ({ emit: jest.fn() })),
    } as any;

    gateway.handleJoinRoom({ matchId: 11, userId: 3 }, client);
    gateway.handleLeaveRoom({ matchId: 11 }, client);

    expect(client.leave).toHaveBeenCalledWith('match-11');
    expect(emit).toHaveBeenLastCalledWith('online-users', {
      count: 0,
      userIds: [],
    });
  });

  it('saves and emits new messages to room', async () => {
    const { gateway, chatService, emit } = createGateway();
    chatService.saveMessage.mockResolvedValue({ id: 99, content: 'hi' });

    await gateway.handleMessage({ userId: 7, matchId: 12, content: 'hi' });

    expect(chatService.saveMessage).toHaveBeenCalledWith(7, 12, 'hi');
    expect(emit).toHaveBeenCalledWith('new-message', { id: 99, content: 'hi' });
  });

  it('emits typing and stop typing events', () => {
    const { gateway } = createGateway();
    const emit = jest.fn();
    const client = {
      id: 's3',
      to: jest.fn(() => ({ emit })),
    } as any;

    gateway.handleTyping({ matchId: 4, userId: 1, username: 'u' }, client);
    gateway.handleStopTyping({ matchId: 4, userId: 1 }, client);

    expect(client.to).toHaveBeenCalledWith('match-4');
    expect(emit).toHaveBeenCalledWith('user-typing', {
      userId: 1,
      username: 'u',
    });
    expect(emit).toHaveBeenCalledWith('user-stop-typing', { userId: 1 });
  });

  it('handles disconnect and removes connected user', () => {
    const { gateway, emit } = createGateway();
    const client = {
      id: 's4',
      join: jest.fn(),
      to: jest.fn(() => ({ emit: jest.fn() })),
    } as any;

    gateway.handleJoinRoom({ matchId: 14, userId: 5 }, client);
    gateway.handleDisconnect(client);

    expect(emit).toHaveBeenLastCalledWith('online-users', {
      count: 0,
      userIds: [],
    });
  });
});