import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';

export interface UserStatusEvent {
  userId?: number;
  id?: number;
  name?: string;
  email?: string;
  online: boolean;
  lastSeen?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private connectedUserId: number | null = null;

  private readonly statusSubject = new Subject<UserStatusEvent>();

  statusUpdates$ = this.statusSubject.asObservable();

  async connect(userId: number): Promise<void> {
    if (this.stompClient?.active && this.connectedUserId === userId) {
      return;
    }

    this.disconnect();

    this.connectedUserId = userId;

    if (typeof window !== 'undefined') {
      (window as any).global = window;
      (globalThis as any).global = globalThis;
    }

    const sockJsModule = await import('sockjs-client');
    const SockJS = sockJsModule.default || sockJsModule;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8082/ws-sockjs'),

      connectHeaders: {
        userId: String(userId)
      },

      reconnectDelay: 5000,

      debug: () => {}
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket connected for user:', userId);

      this.stompClient?.subscribe('/topic/status', (message: IMessage) => {
        this.handleStatusMessage(message);
      });

      this.stompClient?.subscribe(`/topic/status/${userId}`, (message: IMessage) => {
        this.handleStatusMessage(message);
      });
    };

    this.stompClient.onDisconnect = () => {
      console.log('WebSocket disconnected for user:', userId);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('WebSocket STOMP error:', frame);
    };

    this.stompClient.onWebSocketError = (error) => {
      console.error('WebSocket error:', error);
    };

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
      this.connectedUserId = null;
    }
  }

  private handleStatusMessage(message: IMessage): void {
    try {
      const data = JSON.parse(message.body) as UserStatusEvent;
      console.log('STATUS EVENT:', data);
      this.statusSubject.next(data);
    } catch (error) {
      console.error('Invalid status message:', error);
    }
  }
}