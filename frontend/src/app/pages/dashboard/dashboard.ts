import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { Auth } from '../../core/services/auth';
import { ChatListItem, ChatService } from '../../core/services/chat';
import { CurrentUser, UserService } from '../../core/services/user';
import { MessageResponse, MessageService } from '../../core/services/message';
import {
  RealtimeChatEvent,
  RealtimeMessageEvent,
  TypingEvent,
  UserStatusEvent,
  WebSocketService
} from '../../core/services/websocket';

interface ChatPreview {
  id: number;
  name: string;
  email?: string;
  message: string;
  time: string;
  unread: number;
  online: boolean;
  type: 'user' | 'group';
  initials: string;
  lastSeen?: string | null;
  lastMessageId?: number | null;
  lastMessageSentByMe?: boolean;
}

interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  time: string;
  sentByMe: boolean;
  read?: boolean;
  messageType?: 'TEXT' | 'FILE';
  fileOriginalName?: string;
  fileStoredName?: string;
  fileContentType?: string;
  fileSize?: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer?: ElementRef<HTMLDivElement>;

  activeTab: 'chats' | 'groups' = 'chats';
  selectedChat: ChatPreview | null = null;
  searchText = '';

  currentUser: CurrentUser | null = null;
  loadingUser = false;
  loadingChats = false;
  loadingMessages = false;
  sendingMessage = false;
  private typingActive = false;

  newMessage = '';
  messages: ChatMessage[] = [];

  showEmojiPicker = false;
  selectedFile: File | null = null;

  isTyping = false;
  typingUserName = '';

  emojis: string[] = [
    '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎',
    '😢', '😭', '😡', '👍', '👎', '🙏', '👏', '🔥',
    '❤️', '💙', '✅', '❌', '🎉', '🚀', '💯', '⭐',
    '😇', '🤝', '🙌', '💪', '👀', '😅', '😋', '🤩'
  ];

  private statusSubscription?: Subscription;
  private messageSubscription?: Subscription;
  private chatSubscription?: Subscription;
  private typingSubscription?: Subscription;

  private typingStopTimer?: ReturnType<typeof setTimeout>;
  private receiverTypingClearTimer?: ReturnType<typeof setTimeout>;

  private onlineStatusMap = new Map<number, boolean>();
  private lastSeenMap = new Map<number, string | null>();

  chats: ChatPreview[] = [];

  groups: ChatPreview[] = [
    {
      id: 101,
      name: 'Backend Team',
      message: 'Group API testing done.',
      time: '11:12 AM',
      unread: 4,
      online: true,
      type: 'group',
      initials: 'BT'
    },
    {
      id: 102,
      name: 'Angular Squad',
      message: 'Dashboard UI looks good.',
      time: 'Yesterday',
      unread: 0,
      online: true,
      type: 'group',
      initials: 'AS'
    }
  ];

  constructor(
    public auth: Auth,
    private userService: UserService,
    private chatService: ChatService,
    private messageService: MessageService,
    private webSocketService: WebSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.listenToStatusUpdates();
    this.listenToRealtimeMessages();
    this.listenToRealtimeChats();
    this.listenToTypingUpdates();
    this.loadCurrentUser();
    this.loadChatList();
  }

  ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe();
    this.messageSubscription?.unsubscribe();
    this.chatSubscription?.unsubscribe();
    this.typingSubscription?.unsubscribe();

    if (this.typingStopTimer) {
      clearTimeout(this.typingStopTimer);
    }

    if (this.receiverTypingClearTimer) {
      clearTimeout(this.receiverTypingClearTimer);
    }

    this.webSocketService.disconnect();
  }

  get currentList(): ChatPreview[] {
    const list = this.activeTab === 'chats' ? this.chats : this.groups;

    if (!this.searchText.trim()) {
      return list;
    }

    const keyword = this.searchText.toLowerCase();

    return list.filter((item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.message.toLowerCase().includes(keyword) ||
      item.email?.toLowerCase().includes(keyword)
    );
  }

  get displayName(): string {
    return this.currentUser?.name || this.auth.getUserName();
  }

  get displayEmail(): string {
    return this.currentUser?.email || this.auth.getUserEmail();
  }

  get displayInitials(): string {
    return this.getInitials(this.displayName);
  }

  loadCurrentUser(): void {
    this.loadingUser = true;

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadingUser = false;

        this.webSocketService.connect(user.id).then(() => {
          setTimeout(() => {
            this.loadChatList();
          }, 700);
        }).catch((error) => {
          console.error('WebSocket connection failed:', error);
        });
      },
      error: (error) => {
        this.loadingUser = false;

        if (error.status === 401 || error.status === 403) {
          this.handleSessionExpired();
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'User Load Failed',
          text: 'Unable to load current user details.'
        });
      }
    });
  }

  loadChatList(): void {
    this.loadingChats = true;

    this.chatService.getChatList().subscribe({
      next: (items) => {
        this.chats = items.map((item) => this.mapChatItem(item));
        this.loadingChats = false;
      },
      error: (error) => {
        this.loadingChats = false;

        if (error.status === 401 || error.status === 403) {
          this.handleSessionExpired();
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Chat List Failed',
          text: 'Unable to load chat list.'
        });
      }
    });
  }

  private listenToStatusUpdates(): void {
    this.statusSubscription = this.webSocketService.statusUpdates$.subscribe({
      next: (event) => {
        console.log('DASHBOARD STATUS EVENT:', event);
        this.applyStatusUpdate(event);
      }
    });
  }

  private listenToRealtimeMessages(): void {
    this.messageSubscription = this.webSocketService.messageUpdates$.subscribe({
      next: (event) => {
        console.log('DASHBOARD MESSAGE EVENT:', event);
        this.handleRealtimeMessage(event);
      }
    });
  }

  private listenToRealtimeChats(): void {
    this.chatSubscription = this.webSocketService.chatUpdates$.subscribe({
      next: (event) => {
        console.log('DASHBOARD CHAT EVENT:', event);
        this.handleRealtimeChat(event);
      }
    });
  }

  private listenToTypingUpdates(): void {
    this.typingSubscription = this.webSocketService.typingUpdates$.subscribe({
      next: (event) => {
        console.log('DASHBOARD TYPING EVENT:', event);
        this.handleTypingEvent(event);
      }
    });
  }

  private handleTypingEvent(event: TypingEvent): void {
  if (!this.selectedChat || this.selectedChat.type !== 'user') {
    return;
  }

  const senderId =
    (event as any).senderId ||
    (event as any).userId ||
    (event as any).id;

  const senderName =
    (event as any).senderName ||
    (event as any).name ||
    this.selectedChat.name;

  const typing = Boolean((event as any).typing);

  console.log('TYPING MATCH CHECK:', {
    selectedChatId: this.selectedChat.id,
    senderId,
    senderName,
    typing,
    rawEvent: event
  });

  if (Number(this.selectedChat.id) !== Number(senderId)) {
    return;
  }

  this.isTyping = typing;
  this.typingUserName = senderName;

  if (this.receiverTypingClearTimer) {
    clearTimeout(this.receiverTypingClearTimer);
  }

  if (typing) {
    this.scrollMessagesToBottom();

    this.receiverTypingClearTimer = setTimeout(() => {
      this.isTyping = false;
      this.typingUserName = '';
    }, 2500);
  } else {
    this.isTyping = false;
    this.typingUserName = '';
  }
}

  onTyping(): void {
  if (!this.selectedChat || this.selectedChat.type !== 'user') {
    return;
  }

  if (!this.typingActive) {
    this.typingActive = true;
    this.webSocketService.sendTyping(this.selectedChat.id, true);
  }

  if (this.typingStopTimer) {
    clearTimeout(this.typingStopTimer);
  }

  this.typingStopTimer = setTimeout(() => {
    if (this.selectedChat && this.selectedChat.type === 'user') {
      this.webSocketService.sendTyping(this.selectedChat.id, false);
    }

    this.typingActive = false;
  }, 1600);
}

  private handleRealtimeChat(event: RealtimeChatEvent): void {
    const otherUserId = event.userId || event.id;

    setTimeout(() => {
      this.loadChatList();
    }, 300);

    if (
      otherUserId &&
      this.selectedChat?.type === 'user' &&
      this.selectedChat.id === otherUserId
    ) {
      setTimeout(() => {
        this.loadConversation(otherUserId);
        this.markMessagesAsRead(otherUserId);
      }, 400);
    }
  }

  private handleRealtimeMessage(event: RealtimeMessageEvent): void {
    const currentUserId = Number(this.currentUser?.id || this.auth.getUserId());

    if (!currentUserId) {
      return;
    }

    const otherUserId =
      event.senderId === currentUserId
        ? event.receiverId
        : event.senderId;

    const isSelectedChatOpen =
      this.selectedChat?.type === 'user' &&
      this.selectedChat.id === otherUserId;

    const realtimeMessage = this.mapRealtimeMessage(event);

    if (isSelectedChatOpen) {
      const alreadyExists = this.messages.some((message) => message.id === realtimeMessage.id);

      if (!alreadyExists) {
        this.messages.push(realtimeMessage);
        this.scrollMessagesToBottom();
      }

      if (event.senderId !== currentUserId) {
        this.markMessagesAsRead(event.senderId);
      }
    }

    this.updateChatPreviewAfterRealtime(event, otherUserId, isSelectedChatOpen);

    setTimeout(() => {
      this.loadChatList();
    }, 300);

    if (!this.chats.some((chat) => chat.id === otherUserId)) {
      setTimeout(() => {
        this.loadChatList();
      }, 500);
    }
  }

  private updateChatPreviewAfterRealtime(
    event: RealtimeMessageEvent,
    otherUserId: number,
    isSelectedChatOpen: boolean
  ): void {
    const currentUserId = Number(this.currentUser?.id || this.auth.getUserId());
    const sentByMe = event.senderId === currentUserId;

    const previewText =
      event.messageType === 'FILE'
        ? `📎 ${event.fileOriginalName || 'File'}`
        : event.content;

    this.chats = this.chats.map((chat) => {
      if (chat.id !== otherUserId) {
        return chat;
      }

      return {
        ...chat,
        message: sentByMe ? `You: ${previewText}` : previewText,
        time: this.formatMessageTime(event.sentAt || event.createdAt || ''),
        unread: sentByMe || isSelectedChatOpen ? 0 : chat.unread + 1,
        lastMessageId: event.id,
        lastMessageSentByMe: sentByMe
      };
    });

    if (this.selectedChat?.id === otherUserId && this.selectedChat.type === 'user') {
      this.selectedChat = {
        ...this.selectedChat,
        message: sentByMe ? `You: ${previewText}` : previewText,
        time: this.formatMessageTime(event.sentAt || event.createdAt || ''),
        unread: 0,
        lastMessageId: event.id,
        lastMessageSentByMe: sentByMe
      };
    }
  }

  private applyStatusUpdate(event: UserStatusEvent): void {
    const statusUserId = event.userId || event.id;

    if (!statusUserId) {
      return;
    }

    this.onlineStatusMap.set(statusUserId, event.online);
    this.lastSeenMap.set(statusUserId, event.lastSeen || null);

    let matched = false;

    this.chats = this.chats.map((chat) => {
      if (chat.id !== statusUserId) {
        return chat;
      }

      matched = true;

      return {
        ...chat,
        online: event.online,
        lastSeen: event.lastSeen || chat.lastSeen,
        message: event.online && (!chat.lastMessageId || chat.message === 'No messages yet')
          ? 'Online now'
          : chat.message
      };
    });

    if (this.selectedChat?.id === statusUserId && this.selectedChat.type === 'user') {
      this.selectedChat = {
        ...this.selectedChat,
        online: event.online,
        lastSeen: event.lastSeen || this.selectedChat.lastSeen
      };
    }

    if (!matched && this.activeTab === 'chats') {
      setTimeout(() => {
        this.loadChatList();
      }, 500);
    }
  }

  private mapChatItem(item: ChatListItem): ChatPreview {
    const savedOnlineStatus = this.onlineStatusMap.get(item.userId);
    const savedLastSeen = this.lastSeenMap.get(item.userId);

    const finalOnline =
      savedOnlineStatus !== undefined
        ? savedOnlineStatus
        : item.online;

    const finalLastSeen =
      savedLastSeen !== undefined
        ? savedLastSeen
        : item.lastSeen;

    return {
      id: item.userId,
      name: item.name,
      email: item.email,
      message: this.buildLastMessage(item, finalOnline),
      time: this.formatMessageTime(item.lastMessageTime),
      unread: item.unreadCount || 0,
      online: finalOnline,
      type: 'user',
      initials: this.getInitials(item.name),
      lastSeen: finalLastSeen,
      lastMessageId: item.lastMessageId,
      lastMessageSentByMe: item.lastMessageSentByMe
    };
  }

  private buildLastMessage(item: ChatListItem, onlineStatus: boolean): string {
    if (!item.lastMessage) {
      return onlineStatus ? 'Online now' : 'No messages yet';
    }

    if (item.lastMessageSentByMe) {
      return `You: ${item.lastMessage}`;
    }

    return item.lastMessage;
  }

  selectChat(chat: ChatPreview): void {
    this.selectedChat = chat;
    this.messages = [];
    this.newMessage = '';
    this.selectedFile = null;
    this.showEmojiPicker = false;
    this.isTyping = false;
    this.typingUserName = '';

    if (this.typingStopTimer) {
      clearTimeout(this.typingStopTimer);
    }

    if (this.receiverTypingClearTimer) {
      clearTimeout(this.receiverTypingClearTimer);
    }

    if (chat.type === 'user') {
      this.loadConversation(chat.id);
      this.markMessagesAsRead(chat.id);
    }
  }

  loadConversation(receiverId: number): void {
    this.loadingMessages = true;

    this.messageService.getConversation(receiverId).subscribe({
      next: (messages) => {
        this.messages = messages.map((message) => this.mapMessage(message));
        this.loadingMessages = false;

        this.scrollMessagesToBottom();
      },
      error: (error) => {
        this.loadingMessages = false;

        if (error.status === 401 || error.status === 403) {
          this.handleSessionExpired();
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Messages Failed',
          text: 'Unable to load conversation.'
        });
      }
    });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();

    if ((!content && !this.selectedFile) || !this.selectedChat || this.selectedChat.type !== 'user') {
      return;
    }

    this.sendingMessage = true;

    const request$ = this.selectedFile
      ? this.messageService.sendFileMessage(this.selectedChat.id, this.selectedFile, content)
      : this.messageService.sendMessage({
        receiverId: this.selectedChat.id,
        content
      });

    request$.subscribe({
      next: (message) => {
        if (this.selectedChat?.type === 'user') {
          this.webSocketService.sendTyping(this.selectedChat.id, false);
        }

        this.sendingMessage = false;
        this.newMessage = '';
        this.selectedFile = null;
        this.showEmojiPicker = false;

        const mappedMessage = this.mapMessage(message);
        const alreadyExists = this.messages.some((item) => item.id === mappedMessage.id);

        if (!alreadyExists) {
          this.messages.push(mappedMessage);
        }

        const previewText =
          mappedMessage.messageType === 'FILE'
            ? `📎 ${mappedMessage.fileOriginalName || 'File'}`
            : content;

        this.updateChatPreviewAfterSend(this.selectedChat!.id, previewText);

        this.scrollMessagesToBottom();

        setTimeout(() => {
          this.loadChatList();
        }, 400);
      },
      error: (error) => {
        this.sendingMessage = false;

        if (error.status === 401 || error.status === 403) {
          this.handleSessionExpired();
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Message Failed',
          text: 'Unable to send message.'
        });
      }
    });
  }

  onMessageEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;

    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.newMessage = `${this.newMessage}${emoji}`;
    this.showEmojiPicker = false;
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.selectedFile = input.files[0];
    input.value = '';
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
  }

  private markMessagesAsRead(senderId: number): void {
    this.messageService.markMessagesAsRead(senderId).subscribe({
      next: () => {
        this.chats = this.chats.map((chat) => {
          if (chat.id !== senderId) {
            return chat;
          }

          return {
            ...chat,
            unread: 0
          };
        });
      },
      error: () => {}
    });
  }

  private mapMessage(message: MessageResponse): ChatMessage {
    const currentUserId = Number(this.currentUser?.id || this.auth.getUserId());

    const createdTime =
      message.sentAt ||
      message.createdAt ||
      '';

    return {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      time: this.formatMessageTime(createdTime),
      sentByMe: message.senderId === currentUserId,
      read: message.read || message.readStatus,
      messageType: message.messageType || 'TEXT',
      fileOriginalName: message.fileOriginalName,
      fileStoredName: message.fileStoredName,
      fileContentType: message.fileContentType,
      fileSize: message.fileSize
    };
  }

  private mapRealtimeMessage(message: RealtimeMessageEvent): ChatMessage {
    const currentUserId = Number(this.currentUser?.id || this.auth.getUserId());

    const createdTime =
      message.sentAt ||
      message.createdAt ||
      '';

    return {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      time: this.formatMessageTime(createdTime),
      sentByMe: message.senderId === currentUserId,
      read: message.read || message.readStatus,
      messageType: message.messageType || 'TEXT',
      fileOriginalName: message.fileOriginalName,
      fileStoredName: message.fileStoredName,
      fileContentType: message.fileContentType,
      fileSize: message.fileSize
    };
  }

  private updateChatPreviewAfterSend(receiverId: number, content: string): void {
    this.chats = this.chats.map((chat) => {
      if (chat.id !== receiverId) {
        return chat;
      }

      return {
        ...chat,
        message: `You: ${content}`,
        time: 'Now',
        unread: 0,
        lastMessageSentByMe: true
      };
    });

    if (this.selectedChat?.id === receiverId) {
      this.selectedChat = {
        ...this.selectedChat,
        message: `You: ${content}`,
        time: 'Now',
        unread: 0,
        lastMessageSentByMe: true
      };
    }
  }

  viewFile(message: ChatMessage): void {
    if (!message.fileStoredName) {
      return;
    }

    this.messageService.viewFile(message.fileStoredName).subscribe({
      next: (blob) => {
        const fileUrl = URL.createObjectURL(blob);
        window.open(fileUrl, '_blank');

        setTimeout(() => {
          URL.revokeObjectURL(fileUrl);
        }, 5000);
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'File View Failed',
          text: 'Unable to open file.'
        });
      }
    });
  }

  downloadFile(message: ChatMessage): void {
    if (!message.fileStoredName) {
      return;
    }

    this.messageService.downloadFile(message.fileStoredName).subscribe({
      next: (blob) => {
        const fileUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        anchor.href = fileUrl;
        anchor.download = message.fileOriginalName || 'download';
        anchor.click();

        URL.revokeObjectURL(fileUrl);
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Download Failed',
          text: 'Unable to download file.'
        });
      }
    });
  }

  formatFileSize(size?: number): string {
    if (!size) {
      return '';
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  private scrollMessagesToBottom(): void {
    setTimeout(() => {
      if (!this.messageContainer?.nativeElement) {
        return;
      }

      const element = this.messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }, 100);
  }

  private formatMessageTime(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    if (isYesterday) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], {
      day: '2-digit',
      month: 'short'
    });
  }

  private getInitials(name: string): string {
    if (!name || !name.trim()) {
      return 'CU';
    }

    const parts = name.trim().split(' ').filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  private handleSessionExpired(): void {
    this.auth.logout();

    Swal.fire({
      icon: 'warning',
      title: 'Session Expired',
      text: 'Please login again.',
      timer: 1600,
      showConfirmButton: false
    });

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1600);
  }

  selectTab(tab: 'chats' | 'groups'): void {
    this.activeTab = tab;
    this.selectedChat = null;
    this.searchText = '';
    this.messages = [];
    this.newMessage = '';
    this.selectedFile = null;
    this.showEmojiPicker = false;
    this.isTyping = false;
    this.typingUserName = '';

    if (this.typingStopTimer) {
      clearTimeout(this.typingStopTimer);
    }

    if (this.receiverTypingClearTimer) {
      clearTimeout(this.receiverTypingClearTimer);
    }

    if (tab === 'chats') {
      this.loadChatList();
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value;
  }

  logout(): void {
    this.webSocketService.disconnect();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}