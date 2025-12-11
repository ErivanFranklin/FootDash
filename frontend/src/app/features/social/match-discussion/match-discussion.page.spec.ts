import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatchDiscussionPage } from './match-discussion.page';

describe('MatchDiscussionPage', () => {
  let component: MatchDiscussionPage;
  let fixture: ComponentFixture<MatchDiscussionPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, MatchDiscussionPage]
    });
    fixture = TestBed.createComponent(MatchDiscussionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
