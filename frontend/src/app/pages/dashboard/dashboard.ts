import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { Auth } from '../../core/services/auth';

interface ChatPreview {
  id: number;
  name: string;
  message: string;
  time: string;
  unread: number;
  online: boolean;
  type: 'user' | 'group';
  initials: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  activeTab: 'chats' | 'groups' = 'chats';
  selectedChat: ChatPreview | null = null;
  searchText = '';

  chats: ChatPreview[] = [
    {
      id: 1,
      name: 'Test User',
      message: 'Hey Nabi, how are you?',
      time: '10:45 AM',
      unread: 2,
      online: true,
      type: 'user',
      initials: 'TU'
    },
    {
      id: 2,
      name: 'Amit Kumar',
      message: 'Project update completed.',
      time: '09:30 AM',
      unread: 0,
      online: false,
      type: 'user',
      initials: 'AK'
    },
    {
      id: 3,
      name: 'Rahul Dev',
      message: 'Let’s connect tonight.',
      time: 'Yesterday',
      unread: 1,
      online: true,
      type: 'user',
      initials: 'RD'
    }
  ];

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
    private router: Router
  ) {}

  get currentList(): ChatPreview[] {
    const list = this.activeTab === 'chats' ? this.chats : this.groups;

    if (!this.searchText.trim()) {
      return list;
    }

    const keyword = this.searchText.toLowerCase();

    return list.filter((item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.message.toLowerCase().includes(keyword)
    );
  }

  selectTab(tab: 'chats' | 'groups'): void {
    this.activeTab = tab;
    this.selectedChat = null;
    this.searchText = '';
  }

  selectChat(chat: ChatPreview): void {
    this.selectedChat = chat;
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}