import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatListItem {
  userId: number;
  name: string;
  email: string;
  online: boolean;
  lastSeen: string | null;
  lastMessageId: number | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageSentByMe: boolean;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = `${environment.apiBaseUrl}/chats`;

  constructor(private http: HttpClient) {}

  getChatList(): Observable<ChatListItem[]> {
    return this.http.get<ChatListItem[]>(this.apiUrl);
  }
}