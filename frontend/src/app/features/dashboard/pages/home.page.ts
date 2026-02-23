import { Component, inject, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonButtons, IonMenuButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { MatchCardComponent, FormSectionComponent, StatCardComponent } from '../../../shared/components';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonButtons, IonMenuButton, FormsModule, MatchCardComponent, FormSectionComponent, StatCardComponent],
})
export class HomePage implements OnInit {
  private api = inject(ApiService);

  pingResult: any = null;
  teamId: number | null = 33;
  season = new Date().getFullYear();
  limit: number | null = 3;
  range = 'recent';
  loading = false;
  fixtures: any[] = [];

  ngOnInit() {
    // Auto-ping backend on page load
    this.pingBackend();
    // Auto-fetch some matches
    this.fetchMatches();
  }

  pingBackend() {
    this.loading = true;
    this.api.ping().subscribe({
      next: (res) => { this.pingResult = res; this.loading = false; },
      error: (err) => { this.pingResult = { error: true, message: String(err?.message || err) }; this.loading = false; }
    });
  }

  fetchMatches() {
    if (!this.teamId) return;
    this.loading = true;
    this.api.getTeamMatches(this.teamId, { season: this.season, range: this.range, limit: this.limit ?? undefined }).subscribe({
      next: (res) => { this.fixtures = Array.isArray(res) ? res : (res?.data || res?.matches || []); this.loading = false; },
      error: (err) => { this.fixtures = []; this.pingResult = { error: true, message: String(err?.message || err) }; this.loading = false; }
    });
  }
}
