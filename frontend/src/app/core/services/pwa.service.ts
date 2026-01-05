import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PwaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private registering = false;

  async initPushNotifications(): Promise<void> {
    if (this.registering) {
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return;
    }

    if (!environment.pushPublicKey) {
      console.warn('[PWA] Skipping push registration: pushPublicKey is not configured');
      return;
    }

    try {
      this.registering = true;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.info('[PWA] Notification permission not granted');
        return;
      }

      const existingRegistration = await navigator.serviceWorker.getRegistration();
      if (!existingRegistration) {
        console.warn('[PWA] No active service worker registration found');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(environment.pushPublicKey)
      });

      const payload = JSON.stringify(subscription);
      if (payload.length < 50) {
        console.warn('[PWA] Subscription payload too short to register');
        return;
      }

      const userId = this.authService.getCurrentUserId();
      await firstValueFrom(
        this.http.post(`${environment.apiBaseUrl}/notifications/tokens`, {
          token: payload,
          platform: 'web-pwa',
          userId
        })
      );
      console.info('[PWA] Push subscription registered');
    } catch (error) {
      console.error('[PWA] Failed to initialize push notifications', error);
    } finally {
      this.registering = false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
