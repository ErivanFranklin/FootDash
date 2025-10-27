import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth';

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
      return;
    }
    this.loading = true;
    // Note: AuthService.login will set the token on success
    // Use router navigation on success and a toast on failure
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Login failed', err);
        this.toast.create({
          message: 'Login failed',
          duration: 2000,
        }).then((toastEl: any) => toastEl.present());
      }
    });
  }
}
