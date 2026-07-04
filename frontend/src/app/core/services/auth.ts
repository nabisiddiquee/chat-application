import { Injectable } from '@angular/core';
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

  constructor(private http: HttpClient) {}

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request);
  }

  saveAuthData(response: AuthResponse): void {
    localStorage.setItem('chat_token', response.token);
    localStorage.setItem('chat_user_id', String(response.userId));
    localStorage.setItem('chat_user_name', response.name);
    localStorage.setItem('chat_user_email', response.email);
    localStorage.setItem('chat_user_role', response.role);
  }

  getToken(): string | null {
    return localStorage.getItem('chat_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user_id');
    localStorage.removeItem('chat_user_name');
    localStorage.removeItem('chat_user_email');
    localStorage.removeItem('chat_user_role');
  }
}