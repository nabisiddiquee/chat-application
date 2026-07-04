import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Invalid Form',
        text: 'Please enter valid email and password.'
      });

      return;
    }

    this.loading = true;

    this.auth.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.auth.saveAuthData(response);

        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: `Welcome back, ${response.name}!`,
          timer: 1500,
          showConfirmButton: false
        });

        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: this.getLoginErrorMessage(error)
        });
      }
    });
  }

  private getLoginErrorMessage(error: HttpErrorResponse): string {
    const backendMessage = this.extractBackendMessage(error);

    if (error.status === 0) {
      return 'Backend server is not running. Please start the backend and try again.';
    }

    if (error.status === 400 || error.status === 401 || error.status === 403) {
      return backendMessage || 'Invalid email or password.';
    }

    if (error.status >= 500) {
      return backendMessage || 'Server error occurred. Please try again after some time.';
    }

    return backendMessage || 'Invalid email or password.';
  }

  private extractBackendMessage(error: HttpErrorResponse): string {
    if (!error) {
      return '';
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error?.error) {
      return error.error.error;
    }

    if (error.message) {
      return error.message;
    }

    return '';
  }
}