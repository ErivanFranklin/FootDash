import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonSpinner,
} from '@ionic/angular/standalone';
import { TranslocoPipe } from '@jsverse/transloco';
import { PageHeaderComponent } from '../../shared/components';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonButton, IonIcon, IonList, IonItem, IonLabel, IonSpinner,
    TranslocoPipe,
    PageHeaderComponent,
  ],
  templateUrl: './export.page.html',
  styleUrls: ['./export.page.scss'],
})
export class ExportPage {
  exporting = false;

  private authService = inject(AuthService);
  private toastCtrl = inject(ToastController);

  async exportPredictions(format: 'csv' | 'json') {
    this.exporting = true;
    try {
      const url = `${environment.apiBaseUrl}/export/predictions?format=${format}`;
      const token = this.authService.getToken();
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `footdash-predictions.${format}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      this.showToast('Predictions exported successfully');
    } catch {
      this.showToast('Export failed', 'danger');
    }
    this.exporting = false;
  }

  async exportStats(format: 'csv' | 'json') {
    this.exporting = true;
    try {
      const url = `${environment.apiBaseUrl}/export/stats?format=${format}`;
      const token = this.authService.getToken();
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `footdash-stats.${format}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
      this.showToast('Stats exported successfully');
    } catch {
      this.showToast('Export failed', 'danger');
    }
    this.exporting = false;
  }

  shareOnTwitter() {
    const text = encodeURIComponent(
      'Check out my prediction stats on FootDash! ⚽📊 #FootDash #Football',
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }

  shareOnFacebook() {
    const url = encodeURIComponent(window.location.origin);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
    );
  }

  shareOnWhatsApp() {
    const text = encodeURIComponent(
      'Check out my prediction stats on FootDash! ⚽📊 ' + window.location.origin,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      this.showToast('Link copied to clipboard');
    } catch {
      this.showToast('Failed to copy link', 'danger');
    }
  }

  private async showToast(message: string, color = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
