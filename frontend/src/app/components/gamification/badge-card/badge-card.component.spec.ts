import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { BadgeCardComponent } from './badge-card.component';

describe('BadgeCardComponent', () => {
  let component: BadgeCardComponent;
  let fixture: ComponentFixture<BadgeCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), BadgeCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeCardComponent);
    component = fixture.componentInstance;
    component.badge = {
      id: 1,
      name: 'Sharp Predictor',
      description: 'Test badge',
      iconUrl: '',
      slug: 'sharp-predictor',
      tier: 'bronze',
      criteriaType: 'predictions',
      threshold: 10,
      sortOrder: 1,
      unlocked: false,
    };
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fallback to bronze icon when iconUrl is missing', () => {
    component.badge.tier = 'bronze';
    component.badge.iconUrl = '';
    expect(component.getIconName()).toBe('medal-outline');
  });

  it('should fallback to platinum icon when iconUrl is missing', () => {
    component.badge.tier = 'platinum';
    component.badge.iconUrl = '';
    expect(component.getIconName()).toBe('diamond-outline');
  });

  it('should use custom ion icon name when provided', () => {
    component.badge.iconUrl = 'star-outline';
    expect(component.getIconName()).toBe('star-outline');
  });
});
