import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { ApiService } from '../../../core/services/api.service';
import { PageHeaderComponent, MatchCardComponent, FormSectionComponent } from '../../../shared/components';

@Component({
  selector: 'app-matches',
  standalone: true,
  templateUrl: './matches.page.html',
  styleUrls: ['./matches.page.scss'],
  imports: [CommonModule, FormsModule, IonContent, IonItem, IonLabel, IonInput, PageHeaderComponent, MatchCardComponent, FormSectionComponent]
})
export class MatchesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastController);

  teamId!: number;
  season = new Date().getFullYear();
  range = 'recent';
  limit: number | null = 10;
  from: string | null = null; // YYYY-MM-DD
  to: string | null = null;   // YYYY-MM-DD
  fixtures: any[] = [];
  loading = false;

  ngOnInit() {
    const param = this.route.snapshot.paramMap.get('teamId');
    this.teamId = Number(param);
    this.loadMatches();
  }

  loadMatches() {
    if (!this.teamId) return;
    this.loading = true;
    this.api.getTeamMatches(this.teamId, { season: this.season, range: this.range, limit: this.limit ?? undefined, from: this.from || undefined, to: this.to || undefined }).subscribe({
      next: (res) => {
        this.fixtures = Array.isArray(res) ? res : (res?.data || res?.matches || []);
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Failed to load fixtures', duration: 2000, color: 'danger' });
        t.present();
      }
    });
  }

  async syncFixtures() {
    if (!this.teamId) return;
    this.loading = true;
    this.api.syncTeamMatches(this.teamId, { season: this.season, range: this.range, limit: this.limit ?? undefined, from: this.from || undefined, to: this.to || undefined }).subscribe({
      next: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Fixture sync complete', duration: 1500, color: 'success' });
        t.present();
        this.loadMatches();
      },
      error: async () => {
        this.loading = false;
        const t = await this.toast.create({ message: 'Fixture sync failed', duration: 2000, color: 'danger' });
        t.present();
      }
    });
  }
}
