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
  message?: string;
  token?: string;
  accessToken?: string;
  jwt?: string;
  jwtToken?: string;
  userId?: number;
  id?: number;
  name?: string;
  email?: string;
  role?: string;
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

  saveAuthData(response: AuthResponse): boolean {
    if (!this.isBrowser) {
      return false;
    }

    const token =
      response.token ||
      response.accessToken ||
      response.jwt ||
      response.jwtToken ||
      '';

    if (!token || token.trim().length === 0) {
      console.error('Token missing from login response:', response);
      return false;
    }

    window.localStorage.setItem('chat_token', token);
    window.localStorage.setItem('chat_user_id', String(response.userId || response.id || ''));
    window.localStorage.setItem('chat_user_name', response.name || 'Chat User');
    window.localStorage.setItem('chat_user_email', response.email || '');
    window.localStorage.setItem('chat_user_role', response.role || 'USER');

    return true;
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

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && token.trim().length > 0;
  }

  logout(): void {
    if (!this.isBrowser) {
      return;
    }

    window.localStorage.clear();
  }
}