import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonAvatar, IonListHeader, IonLabel, IonCard, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CommentListComponent } from '../../../components/social/comment-list/comment-list.component';
import { ReactionButtonComponent } from '../../../components/social/reaction-button/reaction-button.component';
import { MatchChatComponent } from '../../../components/match-chat/match-chat.component';
import { ReactionsService } from '../../../services/social/reactions.service';
import { ReactionSummary, ReactionTargetType } from '../../../models/social';
import { LoggerService } from '../../../core/services/logger.service';
import { WebSocketService } from '../../../core/services/web-socket.service';

@Component({
  selector: 'app-match-discussion',
  templateUrl: './match-discussion.page.html',
  styleUrls: ['./match-discussion.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonAvatar, IonListHeader, IonLabel, IonCard, IonCardContent, IonSpinner,
    CommentListComponent,
    ReactionButtonComponent,
    MatchChatComponent,
  ]
})
export class MatchDiscussionPage implements OnInit {
  matchId!: number;
  match: any = null; // TODO: Define proper Match model
  reactionSummary: ReactionSummary | null = null;
  loading: boolean = false;
  liveEvents: Array<{ text: string; at: Date; kind: 'goal' | 'kickoff' | 'update' }> = [];
  pollOptions = ['Home Team', 'Draw', 'Away Team'];
  pollVotes: Record<string, number> = {};
  selectedPollOption = '';

  // Enum for template access
  ReactionTargetType = ReactionTargetType;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private reactionsService = inject(ReactionsService);
  private websocket = inject(WebSocketService);
  private logger = inject(LoggerService);

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.matchId = +params['id'];
      this.loadMatchDetails();
      this.loadReactionSummary();
      this.initializeLiveExperience();
    });
  }

  private initializeLiveExperience() {
    this.liveEvents = [];
    this.selectedPollOption = '';
    this.loadPollVotes();

    this.websocket.subscribeToMatch(this.matchId);
    this.websocket.onMatchUpdate().subscribe((payload: any) => {
      if (String(payload?.matchId) !== String(this.matchId)) return;
      const message = String(payload?.message || 'Live match update');
      const lower = message.toLowerCase();
      const kind: 'goal' | 'kickoff' | 'update' = lower.includes('goal') || lower.includes('scored')
        ? 'goal'
        : (lower.includes('kick') || lower.includes('start') ? 'kickoff' : 'update');

      this.liveEvents = [
        { text: message, at: new Date(), kind },
        ...this.liveEvents,
      ].slice(0, 12);
    });
  }

  private pollStorageKey(): string {
    return `match_poll_${this.matchId}`;
  }

  private loadPollVotes() {
    const homeName = this.match?.homeTeam?.name || this.pollOptions[0];
    const awayName = this.match?.awayTeam?.name || this.pollOptions[2];
    this.pollOptions = [homeName, 'Draw', awayName];

    try {
      const raw = localStorage.getItem(this.pollStorageKey());
      this.pollVotes = raw ? JSON.parse(raw) : {};
    } catch {
      this.pollVotes = {};
    }

    for (const option of this.pollOptions) {
      if (!Number.isFinite(this.pollVotes[option])) {
        this.pollVotes[option] = 0;
      }
    }
  }

  votePoll(option: string) {
    if (!option || this.selectedPollOption === option) return;

    if (this.selectedPollOption) {
      this.pollVotes[this.selectedPollOption] = Math.max(0, (this.pollVotes[this.selectedPollOption] || 0) - 1);
    }

    this.selectedPollOption = option;
    this.pollVotes[option] = (this.pollVotes[option] || 0) + 1;
    localStorage.setItem(this.pollStorageKey(), JSON.stringify(this.pollVotes));
  }

  totalPollVotes(): number {
    return Object.values(this.pollVotes).reduce((sum, n) => sum + Number(n || 0), 0);
  }

  pollPercent(option: string): number {
    const total = this.totalPollVotes();
    if (!total) return 0;
    return Math.round(((this.pollVotes[option] || 0) / total) * 100);
  }

  private loadMatchDetails() {
    this.loading = true;
    this.apiService.getMatch(this.matchId).subscribe({
      next: (data) => {
        this.match = {
          id: this.matchId,
          homeTeam: {
            name: data.teams?.home?.name || data.homeTeam?.name || 'Home Team',
            logo: data.teams?.home?.logo || data.homeTeam?.logo || null
          },
          awayTeam: {
            name: data.teams?.away?.name || data.awayTeam?.name || 'Away Team',
            logo: data.teams?.away?.logo || data.awayTeam?.logo || null
          },
          date: data.fixture?.date || data.date || new Date(),
          status: data.fixture?.status?.short || data.status || 'scheduled',
          score: data.goals ? { home: data.goals.home, away: data.goals.away } : data.score || null
        };
        this.loading = false;
      },
      error: (error) => {
        this.logger.error('Error loading match details:', error);
        // Fallback so page still renders
        this.match = {
          id: this.matchId,
          homeTeam: { name: 'Home Team', logo: null },
          awayTeam: { name: 'Away Team', logo: null },
          date: new Date(),
          status: 'scheduled',
          score: null
        };
        this.loading = false;
      }
    });
  }

  private loadReactionSummary() {
    this.reactionsService.getReactionSummary(ReactionTargetType.MATCH, this.matchId)
      .subscribe({
        next: (summary) => {
          this.reactionSummary = summary;
        },
        error: (error) => {
          this.logger.error('Error loading reaction summary:', error);
        }
      });
  }

  onCommentAdded(comment: any) {
    // Refresh reaction summary if needed
    this.loadReactionSummary();
  }

  onCommentDeleted(commentId: number) {
    // Refresh reaction summary if needed
    this.loadReactionSummary();
  }

  getMatchStatusText(): string {
    if (!this.match) return '';

    switch (this.match.status) {
      case 'scheduled': return 'Scheduled';
      case 'live': return 'Live';
      case 'finished': return 'Finished';
      default: return 'Unknown';
    }
  }

  getMatchScoreText(): string {
    if (!this.match || !this.match.score) return '';
    return `${this.match.score.home} - ${this.match.score.away}`;
  }
}
