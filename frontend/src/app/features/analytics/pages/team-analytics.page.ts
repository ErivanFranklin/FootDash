import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonSpinner, IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon } from '@ionic/angular/standalone';
import { TeamAnalyticsCardComponent } from '../../../components/team-analytics-card/team-analytics-card.component';
import { AnalyticsChartsComponent } from '../../../components/analytics-charts/analytics-charts.component';
import { ApiService } from '../../../core/services/api.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface Team {
  id: number;
  name: string;
  logo?: string;
}

@Component({
  selector: 'app-team-analytics',
  standalone: true,
  templateUrl: './team-analytics.page.html',
  styleUrls: ['./team-analytics.page.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonButton,
    IonIcon,
    TeamAnalyticsCardComponent,
    AnalyticsChartsComponent,
  ],
})
export class TeamAnalyticsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private router = inject(Router);

  teamId!: number;
  team$!: Observable<Team | null>;
  loading = true;
  selectedView: 'overview' | 'charts' = 'overview';

  ngOnInit() {
    this.teamId = Number(this.route.snapshot.paramMap.get('teamId'));
    this.loadTeam();
  }

  loadTeam() {
    // Using the teams endpoint to get team info
    this.team$ = this.api.getTeam(this.teamId).pipe(
      map((team: any) => {
        this.loading = false;
        // Handle case where API returns an array (e.g., from external Football API)
        const t = Array.isArray(team) ? team[0] : team;
        if (!t || !t.id) {
          // Fallback: use the route teamId so analytics can still load
          return { id: this.teamId, name: 'Team', logo: undefined };
        }
        return {
          id: t.id,
          name: t.name,
          logo: t.logo,
        };
      }),
      catchError((error) => {
        console.error('Error loading team:', error);
        this.loading = false;
        // Fallback: still allow analytics to load with the route teamId
        return of({ id: this.teamId, name: 'Team', logo: undefined } as Team);
      })
    );
  }

  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/teams']);
    }
  }

  onSegmentChange(event: any) {
    this.selectedView = event.detail.value;
  }
}
