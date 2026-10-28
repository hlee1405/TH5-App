export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  timestamp?: number;
  isMe?: boolean;
  type?: 'text' | 'location';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface Chat {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
    lastActive?: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  statusText: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  type: 'message' | 'friend' | 'system';
}

export interface UserSettings {
  notifications: boolean;
  showOnlineStatus: boolean;
  darkMode: boolean;
  soundEnabled: boolean;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ChatDetail: {
    chatId?: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    isOnline?: boolean;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Contacts: undefined;
  Notifications: undefined;
  Settings: undefined;
};
