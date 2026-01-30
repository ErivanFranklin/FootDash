import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';

/**
 * BottomSheetComponent
 * 
 * A reusable bottom sheet modal component for mobile-friendly interactions.
 * Uses Ionic's modal with custom styling to appear as a bottom sheet.
 * 
 * Usage:
 * ```typescript
 * const modal = await this.modalCtrl.create({
 *   component: BottomSheetComponent,
 *   componentProps: {
 *     title: 'Filter Options',
 *     content: FilterContentComponent
 *   },
 *   breakpoints: [0, 0.5, 0.75, 1],
 *   initialBreakpoint: 0.5,
 *   cssClass: 'bottom-sheet-modal'
 * });
 * await modal.present();
 * ```
 */
@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  templateUrl: './bottom-sheet.component.html',
  styleUrls: ['./bottom-sheet.component.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent]
})
export class BottomSheetComponent {
  @Input() title = '';
  @Input() showCloseButton = true;
  @Input() closeIcon = 'close';
  @Output() dismissed = new EventEmitter<void>();

  private modalCtrl = inject(ModalController);

  constructor() {}

  dismiss() {
    this.dismissed.emit();
    this.modalCtrl.dismiss();
  }
}
