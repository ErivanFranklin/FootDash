import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FeedPage } from './feed.page';

describe('FeedPage', () => {
  let component: FeedPage;
  let fixture: ComponentFixture<FeedPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FeedPage]
    });
    fixture = TestBed.createComponent(FeedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
