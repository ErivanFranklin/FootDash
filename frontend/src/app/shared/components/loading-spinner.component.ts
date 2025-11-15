import { Component, Input } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <ion-spinner
      [name]="spinnerName"
      [color]="color"
      [attr.aria-label]="ariaLabel">
    </ion-spinner>
  `,
  imports: [IonSpinner, CommonModule]
})
export class LoadingSpinnerComponent {
  @Input() spinnerName: string = 'dots';
  @Input() color?: string;
  @Input() ariaLabel: string = 'Loading...';
}