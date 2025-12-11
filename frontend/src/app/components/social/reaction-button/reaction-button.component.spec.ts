import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ReactionButtonComponent } from './reaction-button.component';
import { ReactionTargetType } from '../../../models/social';
import { ReactionsService } from '../../../services/social/reactions.service';
import { WebsocketService } from '../../../services/websocket.service';

describe('ReactionButtonComponent', () => {
  let component: ReactionButtonComponent;
  let fixture: ComponentFixture<ReactionButtonComponent>;
  let reactionsServiceSpy: jasmine.SpyObj<ReactionsService>;
  let websocketServiceSpy: jasmine.SpyObj<WebsocketService>;

  beforeEach(waitForAsync(() => {
    const reactionsSpy = jasmine.createSpyObj('ReactionsService', ['addReaction', 'removeReaction']);
    const websocketSpy = jasmine.createSpyObj('WebsocketService', ['subscribeToSocial', 'unsubscribeFromSocial', 'onSocialEvent']);

    // Mock the service methods to return observables
    reactionsSpy.addReaction.and.returnValue(of({}));
    reactionsSpy.removeReaction.and.returnValue(of({}));
    websocketSpy.onSocialEvent.and.returnValue(of());

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HttpClientTestingModule, ReactionButtonComponent],
      providers: [
        { provide: ReactionsService, useValue: reactionsSpy },
        { provide: WebsocketService, useValue: websocketSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReactionButtonComponent);
    component = fixture.componentInstance;

    // Provide required inputs
    component.targetType = ReactionTargetType.MATCH;
    component.targetId = 1;

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
