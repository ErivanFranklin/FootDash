import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from '../services/comments.service';

describe('CommentsController', () => {
  let controller: CommentsController;

  const mockCommentsService = {
    createComment: jest.fn(),
    getCommentsByMatch: jest.fn(),
    getCommentsByPrediction: jest.fn(),
    getReplies: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    getCommentCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: mockCommentsService }],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    jest.clearAllMocks();
  });

  it('creates comment with current user id', async () => {
    mockCommentsService.createComment.mockResolvedValue({ id: 1 });

    const result = await controller.createComment(
      { user: { sub: 8 } } as any,
      { content: 'hello', matchId: 10 } as any,
    );

    expect(mockCommentsService.createComment).toHaveBeenCalledWith(8, {
      content: 'hello',
      matchId: 10,
    });
    expect(result.success).toBe(true);
  });

  it('gets match comments by parsed match id', async () => {
    mockCommentsService.getCommentsByMatch.mockResolvedValue({ comments: [], total: 0, page: 1, limit: 20, hasMore: false });

    const result = await controller.getMatchComments('55', { page: 1, limit: 20 } as any);

    expect(mockCommentsService.getCommentsByMatch).toHaveBeenCalledWith(55, { page: 1, limit: 20 });
    expect(result.success).toBe(true);
  });

  it('gets prediction comments by parsed prediction id', async () => {
    mockCommentsService.getCommentsByPrediction.mockResolvedValue({ comments: [], total: 0, page: 1, limit: 20, hasMore: false });

    await controller.getPredictionComments('14', { page: 1 } as any);

    expect(mockCommentsService.getCommentsByPrediction).toHaveBeenCalledWith(14, { page: 1 });
  });

  it('gets replies by parsed comment id', async () => {
    mockCommentsService.getReplies.mockResolvedValue({ comments: [], total: 0, page: 1, limit: 20, hasMore: false });

    await controller.getCommentReplies('9', { page: 2 } as any);

    expect(mockCommentsService.getReplies).toHaveBeenCalledWith(9, { page: 2 });
  });

  it('updates comment with current user id', async () => {
    mockCommentsService.updateComment.mockResolvedValue({ id: 6, content: 'updated' });

    const result = await controller.updateComment(
      { user: { sub: 4 } } as any,
      '6',
      { content: 'updated' } as any,
    );

    expect(mockCommentsService.updateComment).toHaveBeenCalledWith(6, 4, {
      content: 'updated',
    });
    expect(result.success).toBe(true);
  });

  it('deletes comment with current user id', async () => {
    const result = await controller.deleteComment({ user: { sub: 4 } } as any, '8');

    expect(mockCommentsService.deleteComment).toHaveBeenCalledWith(8, 4);
    expect(result.success).toBe(true);
  });

  it('returns match comment count', async () => {
    mockCommentsService.getCommentCount.mockResolvedValue(11);

    const result = await controller.getMatchCommentCount('21');

    expect(mockCommentsService.getCommentCount).toHaveBeenCalledWith('match', 21);
    expect(result.count).toBe(11);
  });

  it('returns prediction comment count', async () => {
    mockCommentsService.getCommentCount.mockResolvedValue(4);

    const result = await controller.getPredictionCommentCount('18');

    expect(mockCommentsService.getCommentCount).toHaveBeenCalledWith('prediction', 18);
    expect(result.count).toBe(4);
  });
});
