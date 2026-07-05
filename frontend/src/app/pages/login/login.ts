import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
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
export class Login implements OnInit {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;

  private readonly isBrowser: boolean;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    console.log('LOGIN COMPONENT LOADED');

    if (this.isBrowser && this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    console.log('LOGIN BUTTON CLICKED');

    if (this.loginForm.invalid) {
      console.log('LOGIN FORM INVALID:', this.loginForm.value);

      this.loginForm.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Invalid Form',
        text: 'Please enter valid email and password.'
      });

      return;
    }

    this.loading = true;

    const request = {
      email: String(this.loginForm.value.email).trim(),
      password: String(this.loginForm.value.password)
    };

    console.log('LOGIN REQUEST:', request);

    this.auth.login(request).subscribe({
      next: (response) => {
        console.log('LOGIN RESPONSE:', response);

        this.loading = false;

        const saved = this.auth.saveAuthData(response);

        if (!saved) {
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Token not found in login response.'
          });

          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: `Welcome back, ${response.name || 'User'}!`,
          timer: 700,
          showConfirmButton: false
        });

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 700);
      },
      error: (error: HttpErrorResponse) => {
        console.error('LOGIN ERROR:', error);

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
      return 'Backend server is not running. Please start backend and try again.';
    }

    if (error.status === 400 || error.status === 401 || error.status === 403) {
      return backendMessage || 'Invalid email or password.';
    }

    if (error.status >= 500) {
      return backendMessage || 'Server error occurred. Please try again later.';
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