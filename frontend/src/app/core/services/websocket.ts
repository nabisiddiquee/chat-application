import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

export interface UserStatusEvent {
  userId?: number;
  id?: number;
  name?: string;
  email?: string;
  online: boolean;
  lastSeen?: string | null;
}

export interface RealtimeMessageEvent {
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

export interface RealtimeChatEvent {
  userId?: number;
  id?: number;
  name?: string;
  email?: string;
  online?: boolean;
  lastSeen?: string | null;
  lastMessageId?: number | null;
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  lastMessageSentByMe?: boolean;
  unreadCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private connectedUserId: number | null = null;

  private messageSubscription: StompSubscription | null = null;
  private chatSubscription: StompSubscription | null = null;

  private readonly statusSubject = new Subject<UserStatusEvent>();
  private readonly messageSubject = new Subject<RealtimeMessageEvent>();
  private readonly chatSubject = new Subject<RealtimeChatEvent>();

  statusUpdates$ = this.statusSubject.asObservable();
  messageUpdates$ = this.messageSubject.asObservable();
  chatUpdates$ = this.chatSubject.asObservable();

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

      this.subscribeToMessages(userId);
      this.subscribeToChats(userId);
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

  private subscribeToMessages(userId: number): void {
    if (!this.stompClient?.connected) {
      return;
    }

    this.messageSubscription?.unsubscribe();

    this.messageSubscription = this.stompClient.subscribe(
      `/topic/messages/${userId}`,
      (message: IMessage) => {
        this.handleMessageEvent(message);
      }
    );

    console.log('Subscribed to messages topic:', `/topic/messages/${userId}`);
  }

  private subscribeToChats(userId: number): void {
    if (!this.stompClient?.connected) {
      return;
    }

    this.chatSubscription?.unsubscribe();

    this.chatSubscription = this.stompClient.subscribe(
      `/topic/chats/${userId}`,
      (message: IMessage) => {
        this.handleChatEvent(message);
      }
    );

    console.log('Subscribed to chats topic:', `/topic/chats/${userId}`);
  }

  disconnect(): void {
    this.messageSubscription?.unsubscribe();
    this.chatSubscription?.unsubscribe();

    this.messageSubscription = null;
    this.chatSubscription = null;

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

  private handleMessageEvent(message: IMessage): void {
    try {
      const data = JSON.parse(message.body) as RealtimeMessageEvent;
      console.log('REALTIME MESSAGE EVENT:', data);
      this.messageSubject.next(data);
    } catch (error) {
      console.error('Invalid realtime message:', error);
    }
  }

  private handleChatEvent(message: IMessage): void {
    try {
      const data = JSON.parse(message.body) as RealtimeChatEvent;
      console.log('REALTIME CHAT EVENT:', data);
      this.chatSubject.next(data);
    } catch (error) {
      console.error('Invalid realtime chat event:', error);
    }
  }
}