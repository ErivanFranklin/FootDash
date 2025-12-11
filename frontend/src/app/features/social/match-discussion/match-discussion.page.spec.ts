import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchDiscussionPage } from './match-discussion.page';

describe('MatchDiscussionPage', () => {
  let component: MatchDiscussionPage;
  let fixture: ComponentFixture<MatchDiscussionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MatchDiscussionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
