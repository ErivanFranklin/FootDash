import { SocialGateway } from './social.gateway';

describe('SocialGateway', () => {
  const createGateway = () => {
    const gateway = new SocialGateway();
    const roomEmit = jest.fn();
    const server = {
      to: jest.fn(() => ({ emit: roomEmit })),
      emit: jest.fn(),
    };
    gateway.server = server as any;
    return { gateway, server, roomEmit };
  };

  it('subscribes to social room and acknowledges client', () => {
    const { gateway } = createGateway();
    const client = {
      id: 's1',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    } as any;

    gateway.handleSubscribe({ targetType: 'match', targetId: 9 }, client);

    expect(client.join).toHaveBeenCalledWith('match-9');
    expect(client.emit).toHaveBeenCalledWith('social-subscribed', {
      targetType: 'match',
      targetId: 9,
      message: 'Subscribed to match 9 social updates',
    });
  });

  it('ignores invalid social subscribe payload', () => {
    const { gateway } = createGateway();
    const client = { id: 's2', join: jest.fn(), emit: jest.fn() } as any;

    gateway.handleSubscribe({ targetType: 'match', targetId: 0 } as any, client);
    gateway.handleSubscribe(undefined as any, client);

    expect(client.join).not.toHaveBeenCalled();
    expect(client.emit).not.toHaveBeenCalled();
  });

  it('unsubscribes from social room and acknowledges client', () => {
    const { gateway } = createGateway();
    const client = {
      id: 's3',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    } as any;

    gateway.handleUnsubscribe({ targetType: 'prediction', targetId: 7 }, client);

    expect(client.leave).toHaveBeenCalledWith('prediction-7');
    expect(client.emit).toHaveBeenCalledWith('social-unsubscribed', {
      targetType: 'prediction',
      targetId: 7,
      message: 'Unsubscribed from prediction 7 social updates',
    });
  });

  it('subscribes and unsubscribes user-specific rooms', () => {
    const { gateway } = createGateway();
    const client = {
      id: 's4',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    } as any;

    gateway.handleSubscribeUser({ userId: 42 }, client);
    gateway.handleUnsubscribeUser({ userId: 42 }, client);

    expect(client.join).toHaveBeenCalledWith('user-42');
    expect(client.leave).toHaveBeenCalledWith('user-42');
  });

  it('broadcasts social event to target room', () => {
    const { gateway, server, roomEmit } = createGateway();

    gateway.broadcastSocialEvent({
      type: 'comment',
      targetType: 'match',
      targetId: 10,
      userId: 1,
      userName: 'u',
      data: { text: 'x' },
    });

    expect(server.to).toHaveBeenCalledWith('match-10');
    expect(roomEmit).toHaveBeenCalledWith(
      'social-event',
      expect.objectContaining({ type: 'comment', targetId: 10 }),
    );
  });

  it('emits user-targeted and global events', () => {
    const { gateway, server, roomEmit } = createGateway();

    gateway.emitToUser(5, 'new-alert', { id: 1 });
    gateway.broadcastGlobalEvent({
      type: 'follow',
      targetType: 'prediction',
      targetId: 4,
      userId: 2,
      userName: 'n',
      data: {},
    });

    expect(server.to).toHaveBeenCalledWith('user-5');
    expect(roomEmit).toHaveBeenCalledWith('new-alert', { id: 1 });
    expect(server.emit).toHaveBeenCalledWith(
      'global-social-event',
      expect.objectContaining({ type: 'follow' }),
    );
  });

  it('does not throw when server is unavailable for broadcasts', () => {
    const gateway = new SocialGateway();
    gateway.server = undefined as any;

    expect(() =>
      gateway.broadcastSocialEvent({
        type: 'reaction',
        targetType: 'match',
        targetId: 1,
        userId: 1,
        userName: 'u',
        data: {},
      }),
    ).not.toThrow();
    expect(() => gateway.emitToUser(1, 'x', {})).not.toThrow();
    expect(() =>
      gateway.broadcastGlobalEvent({
        type: 'comment',
        targetType: 'prediction',
        targetId: 1,
        userId: 1,
        userName: 'u',
        data: {},
      }),
    ).not.toThrow();
  });
});