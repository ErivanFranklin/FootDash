import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, FormsModule],
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;
  // use functional inject() to satisfy @angular-eslint/prefer-inject
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastController);

  submit() {
    // call the AuthService to login and redirect on success
    if (!this.email || !this.password) {
      // quick client-side guard
      console.log('login: missing credentials');
      this.toast.create({
        message: 'Please enter email and password',
        duration: 2000,
        color: 'warning'
      }).then((toastEl: any) => toastEl.present());
      return;
    }
    this.loading = true;
    // Note: AuthService.login will set the token on success
    // Use router navigation on success and a toast on failure
    this.auth.login(this.email, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Login successful', response);
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Login failed', err);
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
      console.log('register: missing credentials');
      return;
    }
    this.loading = true;
    this.auth.register(this.email, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Registration successful', response);
        
        // Show success toast
        this.toast.create({
          message: 'Registration successful! Welcome!',
          duration: 2000,
          color: 'success'
        }).then((toastEl: any) => toastEl.present());
        
        // Navigate to home after a brief delay to ensure token is stored
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 100);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Register failed', err);
        const errorMessage = err?.error?.message || err?.message || 'Registration failed';
        this.toast.create({
          message: errorMessage,
          duration: 3000,
          color: 'danger'
        }).then((toastEl: any) => toastEl.present());
      }
    });
  }
}
