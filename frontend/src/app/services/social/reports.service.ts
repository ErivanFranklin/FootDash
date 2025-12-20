import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReportDto, Report } from '../../models/social';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiBaseUrl}/social/reports`;
  private http = inject(HttpClient);

  createReport(dto: CreateReportDto): Observable<Report> {
    return this.http.post<Report>(this.apiUrl, dto);
  }

  getReports(isResolved?: boolean): Observable<Report[]> {
    const params: any = {};
    if (isResolved !== undefined) {
      params.isResolved = isResolved;
    }
    return this.http.get<Report[]>(this.apiUrl, { params });
  }

  resolveReport(id: number): Observable<Report> {
    return this.http.patch<Report>(`${this.apiUrl}/${id}/resolve`, {});
  }
}
