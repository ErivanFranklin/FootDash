import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { ReactionButtonComponent } from '../reaction-button/reaction-button.component';
import { CommentsService } from '../../../services/social/comments.service';
import { ReactionsService } from '../../../services/social/reactions.service';
import { Comment as SocialComment, PaginatedComments, ReactionTargetType } from '../../../models/social';
import { ReactionSummary } from '../../../models/social/reaction.model';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, CommentFormComponent, ReactionButtonComponent]
})
export class CommentListComponent implements OnInit, OnChanges {
  @Input() targetType: 'match' | 'prediction' = 'match';
  @Input() targetId!: number;
  @Input() showReplies: boolean = true;
  @Input() maxDepth: number = 3;

  @Input() comments: SocialComment[] = []; // For passing pre-loaded comments (e.g., replies)

  @Output() commentAdded = new EventEmitter<SocialComment>();
  @Output() commentDeleted = new EventEmitter<number>();

  loading: boolean = false;
  hasMore: boolean = false;
  currentPage: number = 1;
  pageSize: number = 20;

  expandedReplies: Set<number> = new Set();
  reactionSummaries: Map<number, ReactionSummary> = new Map();

  // Enum for template access
  ReactionTargetType = ReactionTargetType;

  constructor(
    private commentsService: CommentsService,
    private reactionsService: ReactionsService
  ) {}

  ngOnInit() {
    this.loadComments();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['targetId'] && !changes['targetId'].firstChange) {
      this.resetAndLoad();
    }
  }

  private resetAndLoad() {
    this.comments = [];
    this.currentPage = 1;
    this.hasMore = false;
    this.expandedReplies.clear();
    this.reactionSummaries.clear();
    this.loadComments();
  }

  loadComments() {
    if (this.loading) return;

    this.loading = true;
    const serviceMethod = this.targetType === 'match'
      ? this.commentsService.getMatchComments(this.targetId, this.currentPage, this.pageSize)
      : this.commentsService.getPredictionComments(this.targetId, this.currentPage, this.pageSize);

    serviceMethod.subscribe({
      next: (result: PaginatedComments) => {
        if (this.currentPage === 1) {
          this.comments = result.comments;
        } else {
          this.comments = [...this.comments, ...result.comments];
        }
        this.hasMore = result.hasMore;
        this.currentPage++;
        this.loading = false;

        // Load reaction summaries for all comments
        this.loadReactionSummaries(result.comments);
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.loading = false;
      }
    });
  }

  private loadReactionSummaries(comments: SocialComment[]) {
    comments.forEach(comment => {
      this.reactionsService.getReactionSummary(ReactionTargetType.COMMENT, comment.id)
        .subscribe({
          next: (summary) => {
            this.reactionSummaries.set(comment.id, summary);
          },
          error: (error) => {
            console.error('Error loading reaction summary:', error);
          }
        });
    });
  }

  loadMore() {
    if (!this.loading && this.hasMore) {
      this.loadComments();
    }
  }

  toggleReplies(commentId: number) {
    if (this.expandedReplies.has(commentId)) {
      this.expandedReplies.delete(commentId);
    } else {
      this.expandedReplies.add(commentId);
      // TODO: Load replies for this comment
    }
  }

  onCommentAdded(comment: SocialComment) {
    this.commentAdded.emit(comment);
    // Refresh comments if it's a top-level comment
    if (!comment.parentCommentId) {
      this.resetAndLoad();
    }
  }

  onCommentDeleted(commentId: number) {
    this.commentDeleted.emit(commentId);
    // Remove from local list
    this.comments = this.comments.filter(c => c.id !== commentId);
  }

  getReactionSummary(commentId: number): ReactionSummary | undefined {
    return this.reactionSummaries.get(commentId);
  }

  trackByCommentId(index: number, comment: SocialComment): number {
    return comment.id;
  }
}
