import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonList, IonItemGroup, IonItem, IonAvatar, IonLabel, IonButtons, IonButton, IonIcon, IonText, IonCard, IonCardContent, IonSpinner } from '@ionic/angular/standalone';
import { CommentFormComponent } from '../comment-form/comment-form.component';
import { ReactionButtonComponent } from '../reaction-button/reaction-button.component';
import { CommentsService } from '../../../services/social/comments.service';
import { ReactionsService } from '../../../services/social/reactions.service';
import { ReportsService } from '../../../services/social/reports.service';
import { WebSocketService as WebsocketService, SocialEvent } from '../../../core/services/web-socket.service';
import { Comment as SocialComment, PaginatedComments, ReactionTargetType, ReportTargetType, ReportReason } from '../../../models/social';
import { ReactionSummary } from '../../../models/social/reaction.model';
import { Subscription } from 'rxjs';
import { AlertController, ToastController } from '@ionic/angular';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonList, IonItemGroup, IonItem, IonAvatar, IonLabel, IonButtons, IonButton, IonIcon, IonText, IonCard, IonCardContent, IonSpinner, CommentFormComponent, ReactionButtonComponent]
})
export class CommentListComponent implements OnInit, OnChanges, OnDestroy {
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
  replyingTo: Set<number> = new Set();
  repliesMap: Map<number, SocialComment[]> = new Map();
  repliesLoadingSet: Set<number> = new Set();
  repliesHasMore: Map<number, boolean> = new Map();
  repliesPageMap: Map<number, number> = new Map();
  reactionSummaries: Map<number, ReactionSummary> = new Map();

  // Enum for template access
  ReactionTargetType = ReactionTargetType;

  private socialSubscription?: Subscription;

  private commentsService = inject(CommentsService);
  private reactionsService = inject(ReactionsService);
  private reportsService = inject(ReportsService);
  private websocketService = inject(WebsocketService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private logger = inject(LoggerService);

  ngOnInit() {
    this.loadComments();
    this.setupWebSocketSubscription();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['targetId'] && !changes['targetId'].firstChange) {
      this.resetAndLoad();
      this.setupWebSocketSubscription();
    }
  }

  ngOnDestroy() {
    if (this.socialSubscription) {
      this.socialSubscription.unsubscribe();
    }
    // Unsubscribe from WebSocket
    if (this.targetId) {
      this.websocketService.unsubscribeFromSocial(this.targetType, this.targetId);
    }
  }

  private setupWebSocketSubscription() {
    // Clean up existing subscription
    if (this.socialSubscription) {
      this.socialSubscription.unsubscribe();
    }

    // Unsubscribe from previous target if exists
    if (this.targetId) {
      this.websocketService.unsubscribeFromSocial(this.targetType, this.targetId);
    }

    // Subscribe to new target
    if (this.targetId) {
      this.websocketService.subscribeToSocial(this.targetType, this.targetId);

      // Listen for real-time social events
      this.socialSubscription = this.websocketService.onSocialEvent().subscribe((event: SocialEvent) => {
        if (event.targetType === this.targetType && event.targetId === this.targetId) {
          if (event.type === 'comment') {
            this.handleNewComment(event);
          } else if (event.type === 'reaction') {
            this.handleReactionUpdate(event);
          }
        }
      });
    }
  }

  private handleNewComment(event: SocialEvent) {
    // Add new comment to the list if it's not already there
    const newComment = event.data.comment;
    const existingIndex = this.comments.findIndex(c => c.id === newComment.id);

    if (existingIndex === -1) {
      // Add to the beginning for new comments
      this.comments.unshift(newComment);
      this.commentAdded.emit(newComment);
    }
  }

  private handleReactionUpdate(event: SocialEvent) {
    // Update reaction summary for the target
    const summary = event.data.summary;
    if (event.data.reaction.targetType === ReactionTargetType.COMMENT) {
      this.reactionSummaries.set(event.data.reaction.targetId, summary);
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
        this.logger.error('Error loading comments:', error);
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
            this.logger.error('Error loading reaction summary:', error);
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
      // Load replies if not already loaded
      if (!this.repliesMap.has(commentId)) {
        this.loadReplies(commentId);
      }
    }
  }

  toggleReplyForm(commentId: number) {
    if (this.replyingTo.has(commentId)) {
      this.replyingTo.delete(commentId);
    } else {
      this.replyingTo.add(commentId);
      // Also expand replies when opening reply form
      if (!this.expandedReplies.has(commentId)) {
        this.expandedReplies.add(commentId);
        if (!this.repliesMap.has(commentId)) {
          this.loadReplies(commentId);
        }
      }
    }
  }

  private loadReplies(commentId: number, page: number = 1) {
    this.repliesLoadingSet.add(commentId);
    this.commentsService.getReplies(commentId, page, this.pageSize).subscribe({
      next: (result: PaginatedComments) => {
        const existing = page > 1 ? (this.repliesMap.get(commentId) ?? []) : [];
        this.repliesMap.set(commentId, [...existing, ...result.comments]);
        this.repliesHasMore.set(commentId, result.hasMore);
        this.repliesPageMap.set(commentId, page);
        this.repliesLoadingSet.delete(commentId);
        // Load reaction summaries for replies too
        this.loadReactionSummaries(result.comments);
      },
      error: (error) => {
        this.logger.error('Error loading replies:', error);
        this.repliesLoadingSet.delete(commentId);
      },
    });
  }

  loadMoreReplies(commentId: number) {
    const currentPage = this.repliesPageMap.get(commentId) ?? 1;
    this.loadReplies(commentId, currentPage + 1);
  }

  onCommentAdded(comment: SocialComment) {
    this.commentAdded.emit(comment);
    if (!comment.parentCommentId) {
      // Top-level comment — refresh the list
      this.resetAndLoad();
    } else {
      // Reply added — add to the replies map and update parent's reply count
      const parentId = comment.parentCommentId;
      const existing = this.repliesMap.get(parentId) ?? [];
      // Avoid duplicates
      if (!existing.find((c) => c.id === comment.id)) {
        this.repliesMap.set(parentId, [...existing, comment]);
      }
      // Update the parent comment's replyCount in the local array
      const parent = this.comments.find((c) => c.id === parentId);
      if (parent) {
        parent.replyCount = (parent.replyCount ?? 0) + 1;
      }
      // Close reply form
      this.replyingTo.delete(parentId);
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

  async reportComment(comment: SocialComment) {
    const alert = await this.alertController.create({
      header: 'Report Comment',
      message: 'Why are you reporting this comment?',
      inputs: [
        { name: 'reason', type: 'radio', label: 'Spam', value: ReportReason.SPAM, checked: true },
        { name: 'reason', type: 'radio', label: 'Harassment', value: ReportReason.HARASSMENT },
        { name: 'reason', type: 'radio', label: 'Inappropriate', value: ReportReason.INAPPROPRIATE },
        { name: 'reason', type: 'radio', label: 'Hate Speech', value: ReportReason.HATE_SPEECH },
        { name: 'reason', type: 'radio', label: 'Other', value: ReportReason.OTHER },
        { name: 'description', type: 'textarea', placeholder: 'Additional details (optional)' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Report',
          handler: (data) => {
            this.reportsService.createReport({
              targetType: ReportTargetType.COMMENT,
              targetId: comment.id,
              reason: data.reason,
              description: data.description
            }).subscribe({
              next: () => this.showToast('Comment reported successfully'),
              error: () => this.showToast('Error reporting comment', 'danger')
            });
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }

  trackByCommentId(index: number, item: any) {
    return item?.id ?? index;
  }
}
