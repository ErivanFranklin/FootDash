import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { CommentListComponent } from '../../../components/social/comment-list/comment-list.component';
import { ReactionButtonComponent } from '../../../components/social/reaction-button/reaction-button.component';
import { ReactionsService } from '../../../services/social/reactions.service';
import { ReactionSummary, ReactionTargetType } from '../../../models/social';

@Component({
  selector: 'app-match-discussion',
  templateUrl: './match-discussion.page.html',
  styleUrls: ['./match-discussion.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CommentListComponent,
    ReactionButtonComponent
  ]
})
export class MatchDiscussionPage implements OnInit {
  matchId!: number;
  match: any = null; // TODO: Define proper Match model
  reactionSummary: ReactionSummary | null = null;
  loading: boolean = false;

  // Enum for template access
  ReactionTargetType = ReactionTargetType;

  constructor(
    private route: ActivatedRoute,
    private reactionsService: ReactionsService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.matchId = +params['id'];
      this.loadMatchDetails();
      this.loadReactionSummary();
    });
  }

  private loadMatchDetails() {
    // TODO: Implement match service to get match details
    // For now, we'll use a placeholder
    this.match = {
      id: this.matchId,
      homeTeam: { name: 'Home Team', logo: null },
      awayTeam: { name: 'Away Team', logo: null },
      date: new Date(),
      status: 'scheduled',
      score: null
    };
  }

  private loadReactionSummary() {
    this.reactionsService.getReactionSummary(ReactionTargetType.MATCH, this.matchId)
      .subscribe({
        next: (summary) => {
          this.reactionSummary = summary;
        },
        error: (error) => {
          console.error('Error loading reaction summary:', error);
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
