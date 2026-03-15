import { MatchGateway } from './match.gateway';

describe('MatchGateway', () => {
  const createGateway = () => {
    const gateway = new MatchGateway();
    const emit = jest.fn();
    const server = {
      to: jest.fn(() => ({ emit })),
    };
    gateway.server = server as any;
    return { gateway, server, emit };
  };

  it('subscribes client to match room and emits welcome update', () => {
    const { gateway, server, emit } = createGateway();
    const client = { id: 'c1', join: jest.fn(), leave: jest.fn() } as any;

    gateway.handleSubscribe({ matchId: '123' }, client);

    expect(client.join).toHaveBeenCalledWith('123');
    expect(server.to).toHaveBeenCalledWith('123');
    expect(emit).toHaveBeenCalledWith('match-update', {
      matchId: '123',
      message: 'Welcome to match 123',
    });
  });

  it('ignores invalid subscribe payload', () => {
    const { gateway, server } = createGateway();
    const client = { id: 'c2', join: jest.fn(), leave: jest.fn() } as any;

    gateway.handleSubscribe({ matchId: '' } as any, client);
    gateway.handleSubscribe(undefined as any, client);

    expect(client.join).not.toHaveBeenCalled();
    expect(server.to).not.toHaveBeenCalled();
  });

  it('unsubscribes client from room when payload is valid', () => {
    const { gateway } = createGateway();
    const client = { id: 'c3', join: jest.fn(), leave: jest.fn() } as any;

    gateway.handleUnsubscribe({ matchId: '123' }, client);

    expect(client.leave).toHaveBeenCalledWith('123');
  });

  it('ignores invalid unsubscribe payload', () => {
    const { gateway } = createGateway();
    const client = { id: 'c4', join: jest.fn(), leave: jest.fn() } as any;

    gateway.handleUnsubscribe({ matchId: '' } as any, client);
    gateway.handleUnsubscribe(undefined as any, client);

    expect(client.leave).not.toHaveBeenCalled();
  });

  it('broadcasts match update when server exists', () => {
    const { gateway, server, emit } = createGateway();

    gateway.broadcastMatchUpdate('55', { score: '2-1' });

    expect(server.to).toHaveBeenCalledWith('55');
    expect(emit).toHaveBeenCalledWith('match-update', {
      matchId: '55',
      score: '2-1',
    });
  });

  it('does not throw when broadcast is called without server', () => {
    const gateway = new MatchGateway();
    gateway.server = undefined as any;

    expect(() => gateway.broadcastMatchUpdate('1', { ping: true })).not.toThrow();
  });
});