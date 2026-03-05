import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AdminUser {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  isPro: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalProUsers: number;
  newUsersLast7Days: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getStats() {
    return this.http.get<AdminStats>(`${this.apiUrl}/admin/stats`);
  }

  listUsers(limit = 50, offset = 0, search = '', role = '', isPro = '') {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    if (role) {
      params = params.set('role', role);
    }
    if (isPro) {
      params = params.set('isPro', isPro);
    }
    return this.http.get<AdminUsersResponse>(`${this.apiUrl}/admin/users`, {
      params,
    });
  }

  updateUserRole(userId: number, role: 'USER' | 'ADMIN' | 'MODERATOR') {
    const params = new HttpParams().set('userId', userId);
    return this.http.patch<AdminUser>(
      `${this.apiUrl}/admin/users/role`,
      { role },
      { params },
    );
  }

  updateUserPro(userId: number, isPro: boolean) {
    const params = new HttpParams().set('userId', userId);
    return this.http.patch<AdminUser>(
      `${this.apiUrl}/admin/users/pro`,
      { isPro },
      { params },
    );
  }
}
