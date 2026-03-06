import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonNote } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonNote, FormsModule, RouterLink],
})
export class LoginPage implements OnInit {
  email = '';
  password = '';
  twoFactorCode = '';
  recoveryCode = '';
  requiresTwoFactor = false;
  loading = false;
  // use functional inject() to satisfy @angular-eslint/prefer-inject
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastController);
  private logger = inject(LoggerService);
  private readonly ONBOARDING_KEY = 'footdash_onboarding_done';

  ngOnInit() {
    // If already authenticated, redirect to home
    // Use Promise.resolve to defer until after the current navigation completes
    if (this.auth.isAuthenticated()) {
      Promise.resolve().then(() => {
        this.router.navigateByUrl(this.getPostLoginTarget(), { replaceUrl: true });
      });
    }
  }

  submit() {
    // call the AuthService to login and redirect on success
    if (!this.email || !this.password) {
      // quick client-side guard
      this.logger.log('login: missing credentials');
      this.toast.create({
        message: 'Please enter email and password',
        duration: 2000,
        color: 'warning'
      }).then((toastEl: any) => toastEl.present());
      return;
    }

    if (this.requiresTwoFactor && !this.twoFactorCode && !this.recoveryCode) {
      this.toast.create({
        message: 'Enter your authenticator code or a recovery code',
        duration: 2500,
        color: 'warning'
      }).then((toastEl: any) => toastEl.present());
      return;
    }

    this.loading = true;
    // Note: AuthService.login will set the token on success
    // Use router navigation on success and a toast on failure
    this.auth.login(this.email, this.password, this.twoFactorCode, this.recoveryCode).subscribe({
      next: (response) => {
        if (response?.requiresTwoFactor) {
          this.loading = false;
          this.requiresTwoFactor = true;
          this.toast.create({
            message: 'Two-factor verification is required for this account',
            duration: 2500,
            color: 'medium'
          }).then((toastEl: any) => toastEl.present());
          return;
        }

        this.loading = false;
        this.logger.log('Login successful', response);
        
        // Show success toast
        this.toast.create({
          message: 'Login successful! Welcome back!',
          duration: 2000,
          color: 'success'
        }).then((toastEl: any) => toastEl.present());
        
        // Navigate to home after a brief delay to ensure token is stored
        setTimeout(() => {
          this.router.navigateByUrl(this.getPostLoginTarget(), { replaceUrl: true });
        }, 100);
      },
      error: (err: any) => {
        this.loading = false;
        this.logger.error('Login failed', err);
        const errorMessage = err?.error?.message || err?.message || 'Login failed';
        this.toast.create({
          message: errorMessage,
          duration: 3000,
          color: 'danger'
        }).then((toastEl: any) => toastEl.present());
      }
    });
  }

  register() {
    if (!this.email || !this.password) {
      this.logger.log('register: missing credentials');
      return;
    }
    this.loading = true;
    this.auth.register(this.email, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        this.logger.log('Registration successful', response);
        
        // Show success toast
        this.toast.create({
          message: 'Registration successful! Welcome!',
          duration: 2000,
          color: 'success'
        }).then((toastEl: any) => toastEl.present());
        
        // Navigate to home after a brief delay to ensure token is stored
        setTimeout(() => {
          localStorage.removeItem(this.ONBOARDING_KEY);
          this.router.navigate(['/onboarding']);
        }, 100);
      },
      error: (err: any) => {
        this.loading = false;
        this.logger.error('Register failed', err);
        const errorMessage = err?.error?.message || err?.message || 'Registration failed';
        this.toast.create({
          message: errorMessage,
          duration: 3000,
          color: 'danger'
        }).then((toastEl: any) => toastEl.present());
      }
    });
  }

  private shouldShowOnboarding(): boolean {
    return localStorage.getItem(this.ONBOARDING_KEY) !== 'true';
  }

  private getPostLoginTarget(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '';
    if (returnUrl.startsWith('/')) {
      return returnUrl;
    }
    return this.shouldShowOnboarding() ? '/onboarding' : '/home';
  }
}
