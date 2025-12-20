import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AdminService } from '../services/admin.service';

interface SystemHealth {
  timestamp: string;
  database: {
    status: string;
    users: {
      total: number;
      admins: number;
    };
  };
  reports: {
    total: number;
    pending: number;
  };
  websockets: {
    activeConnections: number;
  };
}

@Component({
  selector: 'app-system-monitoring',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './system-monitoring.page.html',
  styleUrls: ['./system-monitoring.page.scss'],
})
export class SystemMonitoringPage implements OnInit {
  systemHealth: SystemHealth | null = null;
  loading = false;
  lastRefresh: Date | null = null;
  autoRefresh = false;
  refreshInterval: any;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadSystemHealth();
  }

  loadSystemHealth(): void {
    this.loading = true;
    this.adminService.getSystemHealth().subscribe({
      next: (health) => {
        this.systemHealth = health;
        this.lastRefresh = new Date();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading system health:', error);
        this.loading = false;
      },
    });
  }

  toggleAutoRefresh(): void {
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.loadSystemHealth();
      }, 5000);
    } else {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  getDbStatusColor(): string {
    return this.systemHealth?.database.status === 'connected' ? 'success' : 'danger';
  }
}
