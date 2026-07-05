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
  messageType?: 'TEXT' | 'FILE';
  sentAt?: string;
  createdAt?: string;
  read?: boolean;
  readStatus?: boolean;

  fileOriginalName?: string;
  fileStoredName?: string;
  fileContentType?: string;
  fileSize?: number;
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

  sendFileMessage(receiverId: number, file: File, content: string): Observable<MessageResponse> {
    const formData = new FormData();
    formData.append('receiverId', String(receiverId));
    formData.append('file', file);
    formData.append('content', content || '');

    return this.http.post<MessageResponse>(`${this.apiUrl}/file`, formData);
  }

  viewFile(fileName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/view/${fileName}`, {
      responseType: 'blob'
    });
  }

  downloadFile(fileName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/download/${fileName}`, {
      responseType: 'blob'
    });
  }

  markMessagesAsRead(senderId: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/read/${senderId}`, null, {
      responseType: 'text'
    });
  }
}