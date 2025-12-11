import { Component, Input, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSpinner, IonMenuButton } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Observable, of, isObservable, BehaviorSubject, from, Subject } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <ion-header [translucent]="translucent">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end" *ngIf="actions?.length">
          <ion-button
            *ngFor="let action of actions; let i = index"
            [size]="action.size || 'small'"
            [color]="action.color || 'primary'"
            [disabled]="action.disabled || (getActionLoading(i) | async)"
            [attr.aria-label]="action.ariaLabel || action.label"
            (click)="handleAction(action, i)">
            <ng-container *ngIf="(getActionLoading(i) | async) !== true; else loadingTemplate">
              <ion-icon *ngIf="action.icon" [name]="action.icon"></ion-icon>
              {{ action.label }}
            </ng-container>
            <ng-template #loadingTemplate>
              <ion-spinner name="dots"></ion-spinner>
            </ng-template>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSpinner, IonMenuButton, CommonModule]
})
export class PageHeaderComponent implements OnDestroy {
  @Input() title!: string;
  @Input() translucent: boolean = true;
  @Input() actions?: Array<{
    label: string;
    handler: () => void | Promise<void> | Observable<void>;
    icon?: string;
    color?: string;
    size?: string;
    disabled?: boolean;
    /** loading can be a boolean or an Observable<boolean> */
    loading?: boolean | Observable<boolean>;
    /** optional aria label for the action button */
    ariaLabel?: string;
  }>;

  private actionLoadingStates = new Map<number, BehaviorSubject<boolean>>();
  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.actionLoadingStates.forEach(subject => subject.complete());
    this.actionLoadingStates.clear();
  }

  /**
   * Get or create a loading state observable for a specific action index
   */
  getActionLoading(index: number): Observable<boolean> {
    if (!this.actionLoadingStates.has(index)) {
      this.actionLoadingStates.set(index, new BehaviorSubject<boolean>(false));
    }
    const actionLoadingState = this.actionLoadingStates.get(index)!;
    
    // If the action has an external loading observable/boolean, merge it with internal state
    const action = this.actions?.[index];
    if (action?.loading !== undefined) {
      const externalLoading = isObservable(action.loading) 
        ? action.loading 
        : of(!!action.loading);
      
      // Return true if either external or internal loading is true
      return new Observable<boolean>(observer => {
        let externalValue = false;
        let internalValue = false;
        
        const updateValue = () => observer.next(externalValue || internalValue);
        
        const externalSub = externalLoading.pipe(takeUntil(this.destroy$)).subscribe(val => {
          externalValue = val;
          updateValue();
        });
        
        const internalSub = actionLoadingState.pipe(takeUntil(this.destroy$)).subscribe(val => {
          internalValue = val;
          updateValue();
        });
        
        return () => {
          externalSub.unsubscribe();
          internalSub.unsubscribe();
        };
      });
    }
    
    return actionLoadingState.asObservable();
  }

  /**
   * Handle action click, managing async operations automatically
   */
  handleAction(action: { handler: () => void | Promise<void> | Observable<void> }, index: number): void {
    const result = action.handler();
    
    // If the handler returns a Promise or Observable, manage loading state
    if (result) {
      const loadingState = this.actionLoadingStates.get(index);
      if (loadingState) {
        loadingState.next(true);
        
        const observable$ = result instanceof Promise ? from(result) : result as Observable<void>;
        
        observable$.pipe(
          takeUntil(this.destroy$),
          finalize(() => loadingState.next(false)),
          catchError(error => {
            console.error('Action handler error:', error);
            return of(void 0);
          })
        ).subscribe();
      }
    }
  }
}