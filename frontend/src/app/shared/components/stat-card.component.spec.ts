import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';
import { By } from '@angular/platform-browser';

describe('StatCardComponent', () => {
  let component: StatCardComponent;
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
  });

  it('renders label and value', () => {
    component.label = 'Possession';
    component.value = 62;
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.stat-label');
    const value = fixture.nativeElement.querySelector('.stat-value');

    expect(label).toBeTruthy();
    expect(value).toBeTruthy();
    expect(label.textContent).toContain('Possession');
    expect(value.textContent).toContain('62');
  });

  it('renders subtitle when provided', () => {
    component.label = 'Shots';
    component.value = 10;
    component.subtitle = 'on target';
    fixture.detectChanges();

    const subtitle = fixture.nativeElement.querySelector('.stat-subtitle');
    expect(subtitle).toBeTruthy();
    expect(subtitle.textContent).toContain('on target');
  });

  it('applies aria attributes', () => {
    component.label = 'Corners';
    component.value = 3;
    component.ariaLabel = 'Corners statistic';
    component.valueAriaLabel = 'Corners value 3';
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.stat-card');
    const value = fixture.nativeElement.querySelector('.stat-value');

    expect(card.getAttribute('role')).toBe('group');
    expect(card.getAttribute('aria-label')).toBe('Corners statistic');
    expect(value.getAttribute('aria-label')).toBe('Corners value 3');
  });

  it('shows trending-up for positive change', () => {
    component.label = 'Form';
    component.value = 'Good';
    component.change = 5;
    fixture.detectChanges();

    // Verify the component computes the correct icon
    expect(component.changeIcon).toBe('trending-up');
    expect(component.changeText).toBe('+5');
    
    const changeEl = fixture.nativeElement.querySelector('.stat-change');
    expect(changeEl).toBeTruthy();
    expect(changeEl.textContent).toContain('+5');
  });

  it('shows trending-down for negative change', () => {
    component.label = 'Form';
    component.value = 'Poor';
    component.change = -2;
    fixture.detectChanges();

    // Verify the component computes the correct icon
    expect(component.changeIcon).toBe('trending-down');
    expect(component.changeText).toBe('-2');
    
    const changeEl = fixture.nativeElement.querySelector('.stat-change');
    expect(changeEl).toBeTruthy();
    expect(changeEl.textContent).toContain('-2');
  });
});
