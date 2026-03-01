import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { AlertController } from '@ionic/angular';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  private swUpdate = inject(SwUpdate);
  private alertCtrl = inject(AlertController);
  private logger = inject(LoggerService);

  init(): void {
    if (!this.swUpdate.isEnabled) {
      this.logger.info('[SwUpdate] Service worker not enabled');
      return;
    }

    // Listen for new version ready
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => this.promptUpdate());

    // Check for updates on startup
    this.swUpdate.checkForUpdate().catch(err =>
      this.logger.warn('[SwUpdate] Check failed', err)
    );
  }

  private async promptUpdate(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Update Available',
      message: 'A new version of FootDash is ready. Reload now for the latest features.',
      buttons: [
        { text: 'Later', role: 'cancel' },
        {
          text: 'Reload',
          handler: () => {
            this.swUpdate.activateUpdate().then(() => window.location.reload());
          },
        },
      ],
    });
    await alert.present();
  }
}
