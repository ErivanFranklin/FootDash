import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, delay, of, throwError } from 'rxjs';

describe('PageHeaderComponent', () => {
  let component: PageHeaderComponent;
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Basic Rendering', () => {
    it('should render title', () => {
      component.title = 'Test Title';
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('ion-title'));
      expect(titleElement.nativeElement.textContent).toContain('Test Title');
    });

    it('should render translucent header by default', () => {
      component.title = 'Test';
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('ion-header'));
      expect(header.nativeElement.translucent).toBe(true);
    });

    it('should render non-translucent header when specified', () => {
      component.title = 'Test';
      component.translucent = false;
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('ion-header'));
      expect(header.nativeElement.translucent).toBe(false);
    });

    it('should not render action buttons when no actions provided', () => {
      component.title = 'Test';
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('ion-button'));
      expect(buttons.length).toBe(0);
    });

    it('should render action buttons when actions provided', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action 1', handler: () => {} },
        { label: 'Action 2', handler: () => {} }
      ];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('ion-button'));
      expect(buttons.length).toBe(2);
      expect(buttons[0].nativeElement.textContent).toContain('Action 1');
      expect(buttons[1].nativeElement.textContent).toContain('Action 2');
    });
  });

  describe('Action Button Properties', () => {
    it('should apply custom size to button', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {}, size: 'large' }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      expect(button.nativeElement.size).toBe('large');
    });

    it('should apply default size when not specified', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {} }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      expect(button.nativeElement.size).toBe('small');
    });

    it('should apply custom color to button', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {}, color: 'danger' }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      expect(button.nativeElement.color).toBe('danger');
    });

    it('should render icon when provided', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {}, icon: 'add' }
      ];
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('ion-icon'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.name).toBe('add');
    });

    it('should disable button when disabled is true', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {}, disabled: true }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      expect(button.nativeElement.disabled).toBe(true);
    });

    it('should apply aria-label to button', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {}, ariaLabel: 'Custom ARIA Label' }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe('Custom ARIA Label');
    });

    it('should use label as aria-label when ariaLabel not provided', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'My Action', handler: () => {} }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe('My Action');
    });
  });

  describe('Synchronous Handlers', () => {
    it('should call handler when button clicked', () => {
      const handlerSpy = jasmine.createSpy('handler');
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: handlerSpy }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      button.nativeElement.click();

      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it('should not show loading spinner for sync handlers', fakeAsync(() => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {} }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      button.nativeElement.click();
      tick();
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();
    }));
  });

  describe('Async Promise Handlers', () => {
    it('should show loading spinner while promise is pending', fakeAsync(() => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => promise }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      button.nativeElement.click();
      tick();
      fixture.detectChanges();

      // Should show spinner while pending
      let spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();

      // Should hide label while loading
      let labelText = button.nativeElement.textContent.trim();
      expect(labelText).not.toContain('Action');

      // Resolve promise
      resolvePromise!();
      tick();
      fixture.detectChanges();

      // Should hide spinner after resolution
      spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();

      // Should show label again
      labelText = button.nativeElement.textContent.trim();
      expect(labelText).toContain('Action');
    }));

    it('should disable button while promise is pending', fakeAsync(() => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => promise }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      
      // Should not be disabled initially
      expect(button.nativeElement.disabled).toBe(false);

      button.nativeElement.click();
      tick();
      fixture.detectChanges();

      // Should be disabled while pending
      expect(button.nativeElement.disabled).toBe(true);

      // Resolve promise
      resolvePromise!();
      tick();
      fixture.detectChanges();

      // Should be enabled after resolution
      expect(button.nativeElement.disabled).toBe(false);
    }));

    it('should handle promise rejection gracefully', fakeAsync(() => {
      const consoleErrorSpy = spyOn(console, 'error');
      const errorPromise = Promise.reject(new Error('Test error'));

      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => errorPromise }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      button.nativeElement.click();
      tick();
      fixture.detectChanges();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Should hide spinner after error
      const spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();

      // Should re-enable button
      expect(button.nativeElement.disabled).toBe(false);
    }));
  });

  describe('Async Observable Handlers', () => {
    it('should show loading spinner while observable is emitting', fakeAsync(() => {
      const observable$ = of(void 0).pipe(delay(100));

      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => observable$ }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      button.nativeElement.click();
      tick(50);
      fixture.detectChanges();

      // Should show spinner while observable is active
      let spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();

      // Complete observable
      tick(60);
      fixture.detectChanges();

      // Should hide spinner after completion
      spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();
    }));

    it('should handle observable errors gracefully', fakeAsync(() => {
      const consoleErrorSpy = spyOn(console, 'error');
      const errorObservable$ = throwError(() => new Error('Observable error'));

      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => errorObservable$ }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));
      button.nativeElement.click();
      tick();
      fixture.detectChanges();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Should hide spinner after error
      const spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();
    }));
  });

  describe('External Loading State', () => {
    it('should show spinner when loading is true', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {}, loading: true }
      ];
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should hide spinner when loading is false', () => {
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {}, loading: false }
      ];
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();
    });

    it('should respond to observable loading state changes', fakeAsync(() => {
      const loadingSubject = new BehaviorSubject<boolean>(false);

      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {}, loading: loadingSubject.asObservable() }
      ];
      fixture.detectChanges();

      // Initially not loading
      let spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();

      // Start loading
      loadingSubject.next(true);
      tick();
      fixture.detectChanges();

      spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();

      // Stop loading
      loadingSubject.next(false);
      tick();
      fixture.detectChanges();

      spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();
    }));

    it('should combine external and internal loading states', fakeAsync(() => {
      const externalLoading = new BehaviorSubject<boolean>(false);
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      component.title = 'Test';
      component.actions = [
        { 
          label: 'Action', 
          handler: () => promise,
          loading: externalLoading.asObservable()
        }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('ion-button'));

      // Start external loading
      externalLoading.next(true);
      tick();
      fixture.detectChanges();

      let spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();

      // Stop external loading
      externalLoading.next(false);
      tick();
      fixture.detectChanges();

      spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();

      // Start internal loading via handler
      button.nativeElement.click();
      tick();
      fixture.detectChanges();

      spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();

      // Start external loading while internal is active
      externalLoading.next(true);
      tick();
      fixture.detectChanges();

      // Should still show spinner
      spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();

      // Complete internal loading
      resolvePromise!();
      tick();
      fixture.detectChanges();

      // Should still show spinner because external is still true
      spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();

      // Stop external loading
      externalLoading.next(false);
      tick();
      fixture.detectChanges();

      // Now spinner should be hidden
      spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeFalsy();
    }));
  });

  describe('Component Lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      const loadingSubject = new BehaviorSubject<boolean>(false);
      
      component.title = 'Test';
      component.actions = [
        { label: 'Action', handler: () => {}, loading: loadingSubject.asObservable() }
      ];
      fixture.detectChanges();

      // Verify subject has subscribers
      expect(loadingSubject.observers.length).toBeGreaterThan(0);

      // Destroy component
      component.ngOnDestroy();

      // Subscribers should be cleaned up
      expect(loadingSubject.observers.length).toBe(0);
    });
  });
});
