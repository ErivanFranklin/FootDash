import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonSpinner, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { TeamAnalyticsCardComponent } from '../../../components/team-analytics-card/team-analytics-card.component';
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
    TeamAnalyticsCardComponent,
  ],
})
export class TeamAnalyticsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);

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
        return {
          id: team.id,
          name: team.name,
          logo: team.logo,
        };
      }),
      catchError((error) => {
        console.error('Error loading team:', error);
        this.loading = false;
        return of(null);
      })
    );
  }

  onSegmentChange(event: any) {
    this.selectedView = event.detail.value;
  }
}
