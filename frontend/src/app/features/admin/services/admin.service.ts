import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = '/api/admin';

  constructor(private http: HttpClient) {}

  // User Management
  getAllUsers(limit: number, offset: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, {
      params: { limit: limit.toString(), offset: offset.toString() },
    });
  }

  searchUsers(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/search`, {
      params: { email },
    });
  }

  getUserDetails(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}`);
  }

  blockUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/block`, {});
  }

  unblockUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/unblock`, {});
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  // Report Management
  getAllReports(limit: number, offset: number, status?: string): Observable<any> {
    let params: any = { limit: limit.toString(), offset: offset.toString() };
    if (status) {
      params.status = status;
    }
    return this.http.get(`${this.apiUrl}/reports`, { params });
  }

  getReportDetails(reportId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/${reportId}`);
  }

  approveReport(reportId: number, action: 'block_user' | 'delete_comment' | 'warn_user'): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/${reportId}/approve`, { action });
  }

  rejectReport(reportId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/${reportId}/reject`, {});
  }

  // System Monitoring
  getSystemHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
