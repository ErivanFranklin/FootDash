import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FeedItemComponent } from './feed-item.component';
import { Activity, ActivityType, ActivityTargetType } from '../../../models/social';

describe('FeedItemComponent', () => {
  let component: FeedItemComponent;
  let fixture: ComponentFixture<FeedItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), HttpClientTestingModule, FeedItemComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FeedItemComponent);
    component = fixture.componentInstance;

    // Provide required input
    component.activity = {
      id: 1,
      userId: 1,
      userName: 'Test User',
      activityType: ActivityType.COMMENT,
      targetType: ActivityTargetType.MATCH,
      targetId: 1,
      createdAt: new Date().toISOString()
    };

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
