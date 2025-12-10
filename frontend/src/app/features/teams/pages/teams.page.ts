import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../../../core/services/api.service';
import { PageHeaderComponent, TeamCardComponent } from '../../../shared/components';

@Component({
  selector: 'app-teams',
  standalone: true,
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.scss'],
  imports: [CommonModule, IonContent, PageHeaderComponent, TeamCardComponent]
})
export class TeamsPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastController);

  teams: any[] = [];
  loading = false;

  ngOnInit() {
    this.loadTeams();
  }

  loadTeams() {
    this.loading = true;
    this.api.getTeams().subscribe({
      next: (res) => {
        this.teams = Array.isArray(res) ? res : (res?.data || res?.teams || []);
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Failed to load teams', duration: 2000, color: 'danger' });
        t.present();
      }
    });
  }

  viewMatches(team: any) {
    const id = team?.id ?? team?.teamId ?? team?.externalId ?? team?.team?.id;
    if (id == null) return;
    this.router.navigate(['/matches', id]);
  }

  viewAnalytics(team: any) {
    const id = team?.id ?? team?.teamId ?? team?.externalId ?? team?.team?.id;
    if (id == null) return;
    this.router.navigate(['/analytics/team', id]);
  }

  async syncTeam(team: any) {
    const id = team?.id ?? team?.teamId ?? team?.externalId ?? team?.team?.id;
    if (id == null) return;
    this.loading = true;
    this.api.syncTeam(id).subscribe({
      next: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Team sync complete', duration: 1500, color: 'success' });
        t.present();
        this.loadTeams();
      },
      error: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Team sync failed', duration: 2000, color: 'danger' });
        t.present();
      }
    });
  }
}
