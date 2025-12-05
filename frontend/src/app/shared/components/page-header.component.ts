import { Component, Input } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Observable, of, isObservable } from 'rxjs';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <ion-header [translucent]="translucent">
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end" *ngIf="actions?.length">
          <ion-button
            *ngFor="let action of actions"
            [size]="action.size || 'small'"
            [color]="action.color || 'primary'"
            [disabled]="action.disabled"
            [attr.aria-label]="action.ariaLabel || action.label"
            (click)="action.handler()">
            <ng-container *ngIf="(isLoading(action) | async) !== true; else loadingTemplate">
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
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonSpinner, CommonModule]
})
export class PageHeaderComponent {
  @Input() title!: string;
  @Input() translucent: boolean = true;
  @Input() actions?: Array<{
    label: string;
    handler: () => void;
    icon?: string;
    color?: string;
    size?: string;
    disabled?: boolean;
    /** loading can be a boolean or an Observable<boolean> */
    loading?: boolean | Observable<boolean>;
    /** optional aria label for the action button */
    ariaLabel?: string;
  }>;

  /**
   * Normalize loading to an Observable<boolean> so template can use async safely
   */
  isLoading(action: { loading?: boolean | Observable<boolean> } ): Observable<boolean> {
    if (!action || action.loading == null) return of(false);
    return isObservable(action.loading) ? (action.loading as Observable<boolean>) : of(!!action.loading);
  }
}