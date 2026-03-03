import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonSegment, IonSegmentButton, IonLabel, IonItem, IonInput, IonTextarea,
  IonButton, IonIcon, IonAvatar, IonToggle, IonSelect, IonSelectOption,
  IonSpinner, IonText, IonList, IonNote,
} from '@ionic/angular/standalone';
import { ToastController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, trashOutline, personOutline, settingsOutline, notificationsOutline, lockClosedOutline, globeOutline, timeOutline } from 'ionicons/icons';

import { AuthService } from '../../core/services/auth.service';
import { UserSettingsService, UserProfile, UserPreferences } from '../../core/services/user-settings.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { LanguageService } from '../../core/services/language.service';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonSegment, IonSegmentButton, IonLabel, IonItem, IonInput, IonTextarea,
    IonButton, IonIcon, IonAvatar, IonToggle, IonSelect, IonSelectOption,
    IonSpinner, IonText, IonList, IonNote,
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="activeTab" (ionChange)="onTabChange()">
          <ion-segment-button value="profile">
            <ion-label>Profile</ion-label>
          </ion-segment-button>
          <ion-segment-button value="preferences">
            <ion-label>Preferences</ion-label>
          </ion-segment-button>
          <ion-segment-button value="notifications">
            <ion-label>Notifications</ion-label>
          </ion-segment-button>
          <ion-segment-button value="account">
            <ion-label>Account</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      @if (loading) {
        <div class="center"><ion-spinner name="crescent"></ion-spinner></div>
      } @else {

        <!-- PROFILE TAB -->
        @if (activeTab === 'profile') {
          <div class="tab-content">
            <div class="avatar-section">
              <ion-avatar class="avatar-lg">
                @if (profile?.avatarUrl) {
                  <img [src]="profile!.avatarUrl" alt="" (error)="onAvatarError()" />
                } @else {
                  <ion-icon name="person-outline" class="avatar-placeholder"></ion-icon>
                }
              </ion-avatar>
              <div class="avatar-actions">
                <ion-button size="small" (click)="fileInput.click()">
                  <ion-icon slot="start" name="camera-outline"></ion-icon>
                  Upload
                </ion-button>
                @if (profile?.avatarUrl) {
                  <ion-button size="small" color="danger" fill="outline" (click)="removeAvatar()">
                    <ion-icon slot="start" name="trash-outline"></ion-icon>
                    Remove
                  </ion-button>
                }
                <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="onAvatarSelected($event)" />
              </div>
            </div>

            <ion-list>
              <ion-item>
                <ion-label position="stacked">Display Name</ion-label>
                <ion-input [(ngModel)]="displayName" maxlength="50" placeholder="Your name"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Bio</ion-label>
                <ion-textarea [(ngModel)]="bio" maxlength="500" rows="4" placeholder="Tell us about yourself"></ion-textarea>
              </ion-item>
            </ion-list>
            <ion-button expand="block" (click)="saveProfile()" [disabled]="savingProfile" class="save-btn">
              @if (savingProfile) { <ion-spinner name="dots"></ion-spinner> } @else { Save Profile }
            </ion-button>
          </div>
        }

        <!-- PREFERENCES TAB -->
        @if (activeTab === 'preferences') {
          <div class="tab-content">
            <ion-list>
              <ion-item>
                <ion-icon name="settings-outline" slot="start"></ion-icon>
                <ion-select label="Theme" [(ngModel)]="selectedTheme" (ionChange)="onThemeChange()">
                  <ion-select-option value="light">Light</ion-select-option>
                  <ion-select-option value="dark">Dark</ion-select-option>
                  <ion-select-option value="auto">Auto (System)</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item class="language-item">
                <ion-icon name="globe-outline" slot="start"></ion-icon>
                <ion-label>Language</ion-label>
                <ion-select [(ngModel)]="selectedLanguage" (ionChange)="onLanguageChange()">
                  <ion-select-option value="en">English (US)</ion-select-option>
                  <ion-select-option value="es">Español</ion-select-option>
                  <ion-select-option value="pt">Português (BR)</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-icon name="time-outline" slot="start"></ion-icon>
                <ion-label position="stacked">Timezone</ion-label>
                <ion-input [(ngModel)]="timezone" placeholder="e.g. America/Sao_Paulo"></ion-input>
              </ion-item>
            </ion-list>
            <ion-button expand="block" (click)="savePreferences()" [disabled]="savingPrefs" class="save-btn">
              @if (savingPrefs) { <ion-spinner name="dots"></ion-spinner> } @else { Save Preferences }
            </ion-button>
          </div>
        }

        <!-- NOTIFICATIONS TAB -->
        @if (activeTab === 'notifications') {
          <div class="tab-content">
            <ion-list>
              <ion-item>
                <ion-toggle [(ngModel)]="notificationEnabled" (ionChange)="onNotifChange()">
                  Push Notifications
                </ion-toggle>
              </ion-item>
              <ion-item>
                <ion-toggle [(ngModel)]="emailNotifications" (ionChange)="onNotifChange()">
                  Email Notifications
                </ion-toggle>
              </ion-item>
            </ion-list>
            <ion-note class="notif-note">
              Control which types of events trigger notifications.
            </ion-note>
          </div>
        }

        <!-- ACCOUNT TAB -->
        @if (activeTab === 'account') {
          <div class="tab-content">
            <ion-list>
              <ion-item>
                <ion-label position="stacked">Current Password</ion-label>
                <ion-input [(ngModel)]="currentPassword" type="password"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">New Password</ion-label>
                <ion-input [(ngModel)]="newPassword" type="password" minlength="8"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Confirm New Password</ion-label>
                <ion-input [(ngModel)]="confirmNewPassword" type="password"></ion-input>
              </ion-item>
            </ion-list>
            @if (newPassword && newPassword.length > 0 && newPassword.length < 8) {
              <ion-note color="danger" class="field-note">Must be at least 8 characters</ion-note>
            }
            @if (confirmNewPassword && newPassword !== confirmNewPassword) {
              <ion-note color="danger" class="field-note">Passwords do not match</ion-note>
            }
            <ion-button expand="block" (click)="changePassword()" [disabled]="changingPw || !canChangePw()" class="save-btn">
              @if (changingPw) { <ion-spinner name="dots"></ion-spinner> } @else { Change Password }
            </ion-button>

            <div class="danger-zone">
              <ion-text color="danger"><h3>Danger Zone</h3></ion-text>
              <ion-button expand="block" color="danger" fill="outline" (click)="confirmDeleteAccount()">
                Delete Account
              </ion-button>
            </div>
          </div>
        }
      }
    </ion-content>
  `,
  styles: [`
    .center { display: flex; justify-content: center; padding: 48px 0; }
    .tab-content { padding: 16px; max-width: 600px; margin: 0 auto; }
    .avatar-section { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
    .avatar-lg { width: 96px; height: 96px; margin-bottom: 12px; --border-radius: 50%; background: var(--ion-color-light); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .avatar-lg img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
    .avatar-placeholder { font-size: 48px; color: var(--ion-color-medium); }
    .avatar-actions { display: flex; gap: 8px; }
    .language-item ion-label { margin-right: 12px; }
    .language-item ion-select { min-width: 170px; }
    .save-btn { margin-top: 16px; }
    .notif-note { display: block; padding: 8px 16px; font-size: 13px; }
    .danger-zone { margin-top: 48px; text-align: center; }
    .field-note { display: block; padding: 4px 16px; font-size: 12px; }
  `],
})
export class SettingsPage implements OnInit {
  activeTab = 'profile';
  loading = true;

  // Profile
  profile?: UserProfile;
  displayName = '';
  bio = '';
  savingProfile = false;

  // Preferences
  selectedTheme: ThemeMode = 'auto';
  selectedLanguage = 'en';
  timezone = '';
  savingPrefs = false;

  // Notifications
  notificationEnabled = true;
  emailNotifications = true;

  // Account
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  changingPw = false;

  private userId!: number;
  private auth = inject(AuthService);
  private settings = inject(UserSettingsService);
  private themeService = inject(ThemeService);
  private langService = inject(LanguageService);
  private toast = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);
  private logger = inject(LoggerService);

  constructor() {
    addIcons({ cameraOutline, trashOutline, personOutline, settingsOutline, notificationsOutline, lockClosedOutline, globeOutline, timeOutline });
  }

  ngOnInit() {
    this.userId = this.auth.getCurrentUserId() ?? 0;
    if (!this.userId) { this.router.navigate(['/login']); return; }

    this.selectedTheme = this.themeService.theme();
    this.selectedLanguage = this.langService.currentLang();
    this.loadData();
  }

  onTabChange() {}

  // ─── Profile ────────────────────────────────

  private loadData() {
    this.loading = true;
    this.settings.getProfile(this.userId).subscribe({
      next: (p) => {
        this.profile = p;
        this.displayName = p.displayName ?? '';
        this.bio = p.bio ?? '';
        this.loadPreferences();
      },
      error: () => {
        // Profile may not exist yet
        this.loadPreferences();
      },
    });
  }

  private loadPreferences() {
    this.settings.getPreferences(this.userId).subscribe({
      next: (prefs) => {
        this.notificationEnabled = prefs.notificationEnabled;
        this.emailNotifications = prefs.emailNotifications;
        this.timezone = prefs.timezone || '';
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  saveProfile() {
    this.savingProfile = true;
    this.settings.updateProfile(this.userId, { displayName: this.displayName, bio: this.bio }).subscribe({
      next: (p) => {
        this.profile = p;
        this.savingProfile = false;
        this.showToast('Profile saved!', 'success');
      },
      error: (err) => {
        this.savingProfile = false;
        this.logger.error('Error saving profile', err);
        this.showToast('Failed to save profile', 'danger');
      },
    });
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.showToast('File must be under 2 MB', 'warning');
      return;
    }
    this.settings.uploadAvatar(this.userId, file).subscribe({
      next: (p) => {
        this.profile = p;
        this.showToast('Avatar updated!', 'success');
      },
      error: (err) => {
        this.logger.error('Avatar upload failed', err);
        this.showToast('Avatar upload failed', 'danger');
      },
    });
  }

  removeAvatar() {
    this.settings.deleteAvatar(this.userId).subscribe({
      next: () => {
        if (this.profile) this.profile.avatarUrl = undefined;
        this.showToast('Avatar removed', 'success');
      },
      error: () => this.showToast('Failed to remove avatar', 'danger'),
    });
  }

  onAvatarError() {
    if (this.profile) {
      this.profile.avatarUrl = undefined;
    }
  }

  // ─── Preferences ───────────────────────────

  onThemeChange() {
    this.themeService.setTheme(this.selectedTheme);
    this.settings.updateTheme(this.userId, this.selectedTheme).subscribe();
  }

  onLanguageChange() {
    this.langService.setLanguage(this.selectedLanguage);
    this.settings.updatePreferences(this.userId, { language: this.selectedLanguage as any }).subscribe();
  }

  savePreferences() {
    this.savingPrefs = true;
    this.settings.updatePreferences(this.userId, {
      theme: this.selectedTheme,
      language: this.selectedLanguage as any,
      timezone: this.timezone,
    }).subscribe({
      next: () => {
        this.savingPrefs = false;
        this.showToast('Preferences saved!', 'success');
      },
      error: () => {
        this.savingPrefs = false;
        this.showToast('Failed to save preferences', 'danger');
      },
    });
  }

  // ─── Notifications ─────────────────────────

  onNotifChange() {
    this.settings.updateNotificationPrefs(this.userId, {
      notificationEnabled: this.notificationEnabled,
      emailNotifications: this.emailNotifications,
    }).subscribe();
  }

  // ─── Account ───────────────────────────────

  canChangePw(): boolean {
    return !!this.currentPassword && !!this.newPassword && this.newPassword.length >= 8 && this.newPassword === this.confirmNewPassword;
  }

  changePassword() {
    if (!this.canChangePw()) return;
    this.changingPw = true;
    this.settings.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.changingPw = false;
        this.currentPassword = this.newPassword = this.confirmNewPassword = '';
        this.showToast('Password changed!', 'success');
      },
      error: (err) => {
        this.changingPw = false;
        this.logger.error('Change password failed', err);
        this.showToast(err?.error?.message || 'Failed to change password', 'danger');
      },
    });
  }

  async confirmDeleteAccount() {
    const alert = await this.alertCtrl.create({
      header: 'Delete Account',
      message: 'This action is permanent and cannot be undone. All your data will be lost.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'destructive', cssClass: 'danger', handler: () => this.deleteAccount() },
      ],
    });
    await alert.present();
  }

  private deleteAccount() {
    // Placeholder — backend endpoint not yet implemented
    this.showToast('Account deletion is not yet available', 'warning');
  }

  private async showToast(message: string, color: string) {
    const t = await this.toast.create({ message, duration: 2500, color });
    await t.present();
  }
}
