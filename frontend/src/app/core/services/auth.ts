import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly apiUrl = 'http://localhost:8082/api/auth';
  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request);
  }

  saveAuthData(response: AuthResponse): void {
    if (!this.isBrowser) {
      return;
    }

    window.localStorage.setItem('chat_token', response.token);
    window.localStorage.setItem('chat_user_id', String(response.userId));
    window.localStorage.setItem('chat_user_name', response.name);
    window.localStorage.setItem('chat_user_email', response.email);
    window.localStorage.setItem('chat_user_role', response.role);
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return window.localStorage.getItem('chat_token');
  }

  getUserId(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return window.localStorage.getItem('chat_user_id');
  }

  getUserName(): string {
    if (!this.isBrowser) {
      return 'Chat User';
    }

    return window.localStorage.getItem('chat_user_name') || 'Chat User';
  }

  getUserEmail(): string {
    if (!this.isBrowser) {
      return '';
    }

    return window.localStorage.getItem('chat_user_email') || '';
  }

  getUserRole(): string {
    if (!this.isBrowser) {
      return 'USER';
    }

    return window.localStorage.getItem('chat_user_role') || 'USER';
  }

  getUserInitials(): string {
    const name = this.getUserName().trim();

    if (!name) {
      return 'CU';
    }

    const parts = name.split(' ').filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    if (!this.isBrowser) {
      return;
    }

    window.localStorage.removeItem('chat_token');
    window.localStorage.removeItem('chat_user_id');
    window.localStorage.removeItem('chat_user_name');
    window.localStorage.removeItem('chat_user_email');
    window.localStorage.removeItem('chat_user_role');
  }
}