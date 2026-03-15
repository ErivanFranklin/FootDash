import { ExportController } from './export.controller';

describe('ExportController', () => {
  const exportServiceMock = {
    getUserPredictions: jest.fn(),
    getUserStats: jest.fn(),
    toCsv: jest.fn(),
  };

  const makeRes = () => ({
    setHeader: jest.fn(),
    send: jest.fn(),
    json: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports predictions as csv', async () => {
    exportServiceMock.getUserPredictions.mockResolvedValue([{ id: 1 }]);
    exportServiceMock.toCsv.mockReturnValue('id\n1');
    const res = makeRes();
    const controller = new ExportController(exportServiceMock as any);

    await controller.exportPredictions({ sub: 9 }, 'csv', res as any);

    expect(exportServiceMock.toCsv).toHaveBeenCalledWith([{ id: 1 }]);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.send).toHaveBeenCalledWith('id\n1');
  });

  it('exports predictions as json by default', async () => {
    exportServiceMock.getUserPredictions.mockResolvedValue([{ id: 1 }]);
    const res = makeRes();
    const controller = new ExportController(exportServiceMock as any);

    await controller.exportPredictions({ sub: 9 }, undefined as any, res as any);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('exports stats as csv and json', async () => {
    exportServiceMock.getUserStats.mockResolvedValue({ wins: 3 });
    exportServiceMock.toCsv.mockReturnValue('wins\n3');
    const csvRes = makeRes();
    const jsonRes = makeRes();
    const controller = new ExportController(exportServiceMock as any);

    await controller.exportStats({ sub: 9 }, 'csv', csvRes as any);
    await controller.exportStats({ sub: 9 }, 'json', jsonRes as any);

    expect(exportServiceMock.toCsv).toHaveBeenCalledWith([{ wins: 3 }]);
    expect(csvRes.send).toHaveBeenCalledWith('wins\n3');
    expect(jsonRes.json).toHaveBeenCalledWith({ wins: 3 });
  });
});
