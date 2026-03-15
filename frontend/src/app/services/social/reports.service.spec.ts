import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { ReportsService } from './reports.service';
import { ReportReason, ReportTargetType } from '../../models/social';

describe('ReportsService', () => {
  let service: ReportsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(ReportsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates a report', () => {
    let report: any;

    service
      .createReport({
        targetType: ReportTargetType.COMMENT,
        targetId: 14,
        reason: ReportReason.SPAM,
      })
      .subscribe((result) => (report = result));

    const req = httpMock.expectOne('/api/social/reports');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      targetType: ReportTargetType.COMMENT,
      targetId: 14,
      reason: ReportReason.SPAM,
    });
    req.flush({ id: 1, targetId: 14, reason: ReportReason.SPAM });

    expect(report.id).toBe(1);
  });

  it('gets reports with and without an isResolved filter', () => {
    let unresolved: any;
    let allReports: any;

    service.getReports(false).subscribe((result) => (unresolved = result));
    const filteredReq = httpMock.expectOne(
      (request) =>
        request.url === '/api/social/reports' &&
        request.params.get('isResolved') === 'false',
    );
    expect(filteredReq.request.method).toBe('GET');
    filteredReq.flush([{ id: 1 }]);

    service.getReports().subscribe((result) => (allReports = result));
    const unfilteredReq = httpMock.expectOne(
      (request) =>
        request.url === '/api/social/reports' &&
        !request.params.has('isResolved'),
    );
    expect(unfilteredReq.request.method).toBe('GET');
    unfilteredReq.flush([]);

    expect(unresolved).toEqual([{ id: 1 }]);
    expect(allReports).toEqual([]);
  });

  it('resolves a report via patch', () => {
    let report: any;

    service.resolveReport(9).subscribe((result) => (report = result));

    const req = httpMock.expectOne('/api/social/reports/9/resolve');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({ id: 9, isResolved: true });

    expect(report.isResolved).toBeTrue();
  });
});