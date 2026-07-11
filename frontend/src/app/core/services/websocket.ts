import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { environment } from '../../../environments/environment';

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
  readStatus?: boolean;

  messageType?: 'TEXT' | 'FILE';
  fileOriginalName?: string;
  fileStoredName?: string;
  fileContentType?: string;
  fileSize?: number;
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

export interface TypingEvent {
  senderId?: number;
  senderName?: string;
  userId?: number;
  id?: number;
  name?: string;
  receiverId?: number;
  typing: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private connectedUserId: number | null = null;

  private messageSubscription: StompSubscription | null = null;
  private chatSubscription: StompSubscription | null = null;
  private typingSubscription: StompSubscription | null = null;

  private readonly statusSubject = new Subject<UserStatusEvent>();
  private readonly messageSubject = new Subject<RealtimeMessageEvent>();
  private readonly chatSubject = new Subject<RealtimeChatEvent>();
  private readonly typingSubject = new Subject<TypingEvent>();

  statusUpdates$ = this.statusSubject.asObservable();
  messageUpdates$ = this.messageSubject.asObservable();
  chatUpdates$ = this.chatSubject.asObservable();
  typingUpdates$ = this.typingSubject.asObservable();

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
     webSocketFactory: () => new SockJS(environment.websocketUrl),

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
      this.subscribeToTyping(userId);
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

  sendTyping(receiverId: number, typing: boolean): void {
  if (!this.stompClient?.connected) {
    console.warn('Typing event skipped because WebSocket is not connected');
    return;
  }

  if (!this.connectedUserId) {
    console.warn('Typing event skipped because connected user id is missing');
    return;
  }

  this.stompClient.publish({
    destination: '/app/typing',
    body: JSON.stringify({
      senderId: this.connectedUserId,
      receiverId,
      typing
    })
  });

  console.log('TYPING SENT:', {
    senderId: this.connectedUserId,
    receiverId,
    typing
  });
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

  private subscribeToTyping(userId: number): void {
    if (!this.stompClient?.connected) {
      return;
    }

    this.typingSubscription?.unsubscribe();

    this.typingSubscription = this.stompClient.subscribe(
      `/topic/typing/${userId}`,
      (message: IMessage) => {
        this.handleTypingMessage(message);
      }
    );

    console.log('Subscribed to typing topic:', `/topic/typing/${userId}`);
  }

  disconnect(): void {
    this.messageSubscription?.unsubscribe();
    this.chatSubscription?.unsubscribe();
    this.typingSubscription?.unsubscribe();

    this.messageSubscription = null;
    this.chatSubscription = null;
    this.typingSubscription = null;

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

  private handleTypingMessage(message: IMessage): void {
    try {
      const data = JSON.parse(message.body) as TypingEvent;
      console.log('TYPING EVENT:', data);
      this.typingSubject.next(data);
    } catch (error) {
      console.error('Invalid typing event:', error);
    }
  }
}