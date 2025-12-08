import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private sessionService = inject(SessionService);
  private router = inject(Router);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  showPassword = signal(false);
  errorMessage = signal('');
  isLoading = signal(false);

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { username, password } = this.loginForm.value;

    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        const rol = this.sessionService.rol();
        console.log('Login exitoso. Rol detectado:', rol); // DEBUG

        if (rol === 'ADMIN') {
          this.router
            .navigate(['/dashboard'])
            .then((success) => console.log('Navegación a Dashboard:', success));
        } else {
          this.router
            .navigate(['/ventas'])
            .then((success) => console.log('Navegación a Ventas:', success));
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMessage.set('Credenciales incorrectas o error en el servidor');
        console.error(err);
      },
    });
  }
}
