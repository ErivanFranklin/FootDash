import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Comment as SocialComment, CreateCommentRequest } from '../../../models/social';
import { CommentsService } from '../../../services/social/comments.service';

@Component({
  selector: 'app-comment-form',
  templateUrl: './comment-form.component.html',
  styleUrls: ['./comment-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule]
})
export class CommentFormComponent {
  @Input() targetType: 'match' | 'prediction' = 'match';
  @Input() targetId!: number;
  @Input() parentCommentId?: number;
  @Input() placeholder: string = 'Write a comment...';

  @Output() commentAdded = new EventEmitter<SocialComment>();

  commentForm: FormGroup;
  submitting: boolean = false;
  maxLength: number = 500;

  constructor(
    private fb: FormBuilder,
    private commentsService: CommentsService
  ) {
    this.commentForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(this.maxLength)]]
    });
  }

  get content() {
    return this.commentForm.get('content');
  }

  get remainingChars(): number {
    const currentLength = this.content?.value?.length || 0;
    return this.maxLength - currentLength;
  }

  onSubmit() {
    if (this.commentForm.valid && !this.submitting) {
      this.submitting = true;
      const content = this.commentForm.value.content.trim();

      const request: CreateCommentRequest = {
        content,
        matchId: this.targetType === 'match' ? this.targetId : undefined,
        predictionId: this.targetType === 'prediction' ? this.targetId : undefined,
        parentCommentId: this.parentCommentId
      };

      this.commentsService.createComment(request).subscribe({
        next: (comment: SocialComment) => {
          this.commentForm.reset();
          this.commentAdded.emit(comment);
          this.submitting = false;
        },
        error: (error) => {
          console.error('Error creating comment:', error);
          this.submitting = false;
          // TODO: Show error toast
        }
      });
    }
  }

  canSubmit(): boolean {
    return this.commentForm.valid &&
           !this.submitting &&
           this.content?.value?.trim().length > 0;
  }

  counterFormatter(inputLength: number, maxLength: number) {
    return `${maxLength - inputLength} characters left`;
  }
}
