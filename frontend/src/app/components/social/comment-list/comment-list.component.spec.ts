import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { CommentListComponent } from './comment-list.component';
import { CommentsService } from '../../../services/social/comments.service';
import { ReactionsService } from '../../../services/social/reactions.service';
import { WebsocketService } from '../../../services/websocket.service';

describe('CommentListComponent', () => {
  let component: CommentListComponent;
  let fixture: ComponentFixture<CommentListComponent>;
  let commentsServiceSpy: jasmine.SpyObj<CommentsService>;
  let reactionsServiceSpy: jasmine.SpyObj<ReactionsService>;
  let websocketServiceSpy: jasmine.SpyObj<WebsocketService>;

  beforeEach(waitForAsync(() => {
    const commentsSpy = jasmine.createSpyObj('CommentsService', ['getMatchComments', 'getPredictionComments']);
    const reactionsSpy = jasmine.createSpyObj('ReactionsService', ['getReactionSummary']);
    const websocketSpy = jasmine.createSpyObj('WebsocketService', ['subscribeToSocial', 'unsubscribeFromSocial', 'onSocialEvent']);

    // Mock the service methods to return observables
    commentsSpy.getMatchComments.and.returnValue(of({ comments: [], hasMore: false, total: 0 }));
    reactionsSpy.getReactionSummary.and.returnValue(of({ totalCount: 0, reactions: [] }));
    websocketSpy.onSocialEvent.and.returnValue(of());

    TestBed.configureTestingModule({
      imports: [CommentListComponent, IonicModule.forRoot(), HttpClientTestingModule],
      providers: [
        { provide: CommentsService, useValue: commentsSpy },
        { provide: ReactionsService, useValue: reactionsSpy },
        { provide: WebsocketService, useValue: websocketSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentListComponent);
    component = fixture.componentInstance;

    // Provide required input
    component.targetId = 1;

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
