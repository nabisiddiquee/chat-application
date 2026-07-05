import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SendMessageRequest {
  receiverId: number;
  content: string;
}

export interface MessageResponse {
  id: number;
  senderId: number;
  senderName?: string;
  senderEmail?: string;
  receiverId: number;
  receiverName?: string;
  receiverEmail?: string;
  content: string;
  sentAt?: string;
  createdAt?: string;
  read?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly apiUrl = 'http://localhost:8082/api/messages';

  constructor(private http: HttpClient) {}

  getConversation(receiverId: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.apiUrl}/${receiverId}`);
  }

  sendMessage(request: SendMessageRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.apiUrl, request);
  }

  markMessagesAsRead(senderId: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/read/${senderId}`, null, {
      responseType: 'text'
    });
  }
}