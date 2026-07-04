import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  registerForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      Swal.fire({
        icon: 'warning',
        title: 'Invalid Form',
        text: 'Please fill all fields correctly.'
      });

      return;
    }

    const { name, email, password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Mismatch',
        text: 'Password and confirm password must be same.'
      });

      return;
    }

    this.loading = true;

    this.auth.register({ name, email, password }).subscribe({
      next: () => {
        this.loading = false;

        Swal.fire({
          icon: 'success',
          title: 'Registration Successful',
          text: 'Your account has been created. Please login.',
          timer: 1600,
          showConfirmButton: false
        });

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1600);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: this.getRegisterErrorMessage(error)
        });
      }
    });
  }

  private getRegisterErrorMessage(error: HttpErrorResponse): string {
    const backendMessage = this.extractBackendMessage(error);

    if (backendMessage.toLowerCase().includes('email already registered')) {
      return 'This email is already registered. Please login or use another email.';
    }

    if (backendMessage.toLowerCase().includes('already')) {
      return backendMessage;
    }

    if (error.status === 0) {
      return 'Backend server is not running. Please start the backend and try again.';
    }

    if (error.status === 400) {
      return backendMessage || 'Invalid registration details. Please check your input.';
    }

    if (error.status === 403) {
      return 'Registration request is blocked. Please check backend security or CORS configuration.';
    }

    if (error.status === 409) {
      return 'This email is already registered. Please login or use another email.';
    }

    if (error.status >= 500) {
      return backendMessage || 'Server error occurred. Please try again after some time.';
    }

    return backendMessage || 'Unable to create account. Please try again.';
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