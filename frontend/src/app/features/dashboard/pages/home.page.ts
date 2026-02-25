import { Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonButtons, IonMenuButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { MatchCardComponent, FormSectionComponent, StatCardComponent } from '../../../shared/components';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonButtons, IonMenuButton, FormsModule, MatchCardComponent, FormSectionComponent, StatCardComponent],
})
export class HomePage implements OnInit {
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  pingResult: any = null;
  matchResult: any = null;
  teamId: number | null = 33;
  // Football seasons span two calendar years; before August use previous year
  season = new Date().getMonth() < 7
    ? new Date().getFullYear() - 1
    : new Date().getFullYear();
  limit: number | null = 5;
  range = 'all';
  loading = false;
  loadingMatches = false;
  fixtures: any[] = [];

  ngOnInit() {
    this.pingBackend();
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
    this.loadingMatches = true;
    this.matchResult = null;
    this.api.getTeamMatches(this.teamId, { season: this.season, range: this.range, limit: this.limit ?? undefined }).subscribe({
      next: (res) => {
        this.fixtures = Array.isArray(res) ? res : (res?.data || res?.matches || []);
        this.matchResult = { success: true, count: this.fixtures.length, sample: this.fixtures.slice(0, 3) };
        this.loadingMatches = false;
      },
      error: (err) => {
        this.fixtures = [];
        this.matchResult = { error: true, message: String(err?.message || err) };
        this.loadingMatches = false;
      }
    });
  }

  /** Syntax-highlight JSON for display in the template */
  prettyJson(obj: any): SafeHtml {
    if (obj == null) return '';
    const json = JSON.stringify(obj, null, 2);
    const highlighted = json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|(\b(true|false)\b)|(\bnull\b)|(-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match: string, ...args: any[]) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = args[2] ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    ).replace(/([{}\[\]])/g, '<span class="json-bracket">$1</span>')
     .replace(/,\s*\n/g, '<span class="json-comma">,</span>\n');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
