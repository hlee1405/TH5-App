import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { User, Chat, Contact, NotificationItem, UserSettings, Message } from '../types';
import { Theme, lightTheme, darkTheme } from '../theme';
import {
  INITIAL_CHATS,
  INITIAL_CONTACTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
} from '../data/mockData';
import {
  isFirebaseConfigured,
  subscribeToAuth,
  loginWithEmail,
  registerWithEmail,
  logoutFirebase,
  getAuthErrorMessage,
  subscribeToUsers,
  subscribeToUser,
  setupUserPresence,
  subscribeToConversations,
  sendTextMessage,
  sendLocationMessage,
  markChatAsReadInFirebase,
} from '../services';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AppContextType {
  isLoggedIn: boolean;
  isFirebaseActive: boolean;
  currentUser: User;
  chats: Chat[];
  contacts: Contact[];
  notifications: NotificationItem[];
  settings: UserSettings;
  theme: Theme;
  unreadChatsCount: number;
  unreadNotificationsCount: number;
  login: (email: string, pass: string) => Promise<AuthResult>;
  register: (name: string, email: string, pass: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  sendMessage: (receiverId: string, text: string) => Promise<void>;
  sendLocation: (receiverId: string, latitude: number, longitude: number) => Promise<void>;
  markChatAsRead: (partnerId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  getChatByUserId: (userId: string) => Chat | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: '',
  name: 'Khách',
  email: '',
  phone: '',
  avatar: '',
  bio: '',
  isOnline: false,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);

  const isFirebaseActive = useMemo(() => isFirebaseConfigured(), []);

  // Lắng nghe trạng thái Firebase Auth và đồng bộ Realtime Database nếu đã cấu hình
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    let unsubPresence: (() => void) | null = null;
    let unsubProfile: (() => void) | null = null;
    let unsubUsers: (() => void) | null = null;
    let unsubConversations: (() => void) | null = null;

    const unsubAuth = subscribeToAuth((fbUser) => {
      if (unsubPresence) { unsubPresence(); unsubPresence = null; }
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      if (unsubUsers) { unsubUsers(); unsubUsers = null; }
      if (unsubConversations) { unsubConversations(); unsubConversations = null; }

      if (fbUser) {
        const uid = fbUser.uid;
        const initialName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Người dùng';

        setCurrentUser({
          id: uid,
          name: initialName,
          email: fbUser.email || '',
          phone: '',
          avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(initialName)}`,
          bio: 'Xin chào! Tôi đang dùng ConnectChat.',
          isOnline: true,
        });
        setIsLoggedIn(true);

        // 1. Tự động cập nhật trực tuyến và ngắt khi offline
        unsubPresence = setupUserPresence(uid);

        // 2. Lắng nghe cập nhật thông tin hồ sơ của chính mình
        unsubProfile = subscribeToUser(uid, (profile) => {
          if (profile) {
            setCurrentUser((prev) => ({
              ...prev,
              ...profile,
              id: uid,
            }));
          }
        });

        // 3. Lắng nghe danh sách liên hệ (danh bạ) loại trừ chính mình
        unsubUsers = subscribeToUsers(uid, (userList) => {
          setContacts(userList);
        });

        // 4. Lắng nghe danh sách các cuộc trò chuyện đã có
        unsubConversations = subscribeToConversations(uid, (convList) => {
          setChats(convList);
        });
      } else {
        setIsLoggedIn(false);
        setCurrentUser(DEFAULT_USER);
        setChats([]);
        setContacts([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubPresence) unsubPresence();
      if (unsubProfile) unsubProfile();
      if (unsubUsers) unsubUsers();
      if (unsubConversations) unsubConversations();
    };
  }, []);

  const unreadChatsCount = useMemo(() => {
    return chats.reduce((acc, chat) => acc + (chat.unreadCount > 0 ? 1 : 0), 0);
  }, [chats]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  /**
   * Đăng nhập: Hỗ trợ cả Firebase Realtime thật và Chế độ Demo
   */
  const login = async (email: string, pass: string): Promise<AuthResult> => {
    // Nếu chưa gắn API Key Firebase thật, cho phép trải nghiệm chế độ Demo
    if (!isFirebaseConfigured()) {
      const isUser1 = email.toLowerCase().includes('user1');
      const isUser2 = email.toLowerCase().includes('user2');
      const id = isUser1 ? 'u_user1' : isUser2 ? 'u_user2' : `demo_${Date.now()}`;
      const name = isUser1
        ? 'Nguyễn Văn A'
        : isUser2
        ? 'Trần Thị B'
        : email.split('@')[0] || 'Người dùng';

      setCurrentUser({
        id,
        name,
        email: email.trim(),
        phone: '0912 345 678',
        avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(name)}`,
        bio: 'Tài khoản trải nghiệm ConnectChat',
        isOnline: true,
      });

      // Lọc danh bạ loại trừ chính tài khoản này
      const demoContacts = INITIAL_CONTACTS.filter((c) => c.id !== id);
      setContacts(demoContacts);
      setChats(INITIAL_CHATS);
      setIsLoggedIn(true);
      return { success: true };
    }

    // Nếu đã cấu hình Firebase, gọi xác thực Firebase Auth
    try {
      await loginWithEmail(email, pass);
      return { success: true };
    } catch (error: any) {
      console.warn('Lỗi đăng nhập Firebase:', error);
      const code = error?.code || '';
      return {
        success: false,
        error: getAuthErrorMessage(code),
      };
    }
  };

  /**
   * Đăng ký tài khoản
   */
  const register = async (name: string, email: string, pass: string): Promise<AuthResult> => {
    if (!isFirebaseConfigured()) {
      const id = `u_${Date.now()}`;
      const userName = name.trim() || 'Người dùng mới';

      setCurrentUser({
        id,
        name: userName,
        email: email.trim(),
        phone: '',
        avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(userName)}`,
        bio: 'Người dùng mới của ConnectChat',
        isOnline: true,
      });

      setContacts(INITIAL_CONTACTS);
      setChats([]);
      setIsLoggedIn(true);
      return { success: true };
    }

    try {
      await registerWithEmail(name, email, pass);
      return { success: true };
    } catch (error: any) {
      console.warn('Lỗi đăng ký Firebase:', error);
      const code = error?.code || '';
      return {
        success: false,
        error: getAuthErrorMessage(code),
      };
    }
  };

  /**
   * Đăng xuất
   */
  const logout = async (): Promise<void> => {
    if (isFirebaseConfigured()) {
      try {
        await logoutFirebase(currentUser.id);
      } catch (error) {
        console.warn('Lỗi đăng xuất Firebase:', error);
      }
    }
    setIsLoggedIn(false);
    setCurrentUser(DEFAULT_USER);
  };

  /**
   * Đánh dấu cuộc trò chuyện đã đọc
   */
  const markChatAsRead = (partnerId: string) => {
    if (!currentUser.id || !partnerId) return;

    if (isFirebaseConfigured()) {
      markChatAsReadInFirebase(currentUser.id, partnerId);
    } else {
      setChats((prev) =>
        prev.map((c) => (c.user.id === partnerId ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  const getChatByUserId = (userId: string) => {
    return chats.find((c) => c.user.id === userId);
  };

  /**
   * Gửi tin nhắn chữ 1-1 tới người nhận
   */
  const sendMessage = async (receiverId: string, text: string) => {
    if (!currentUser.id || !receiverId || !text.trim()) return;

    if (isFirebaseConfigured()) {
      await sendTextMessage(currentUser.id, receiverId, text);
    } else {
      // Demo local fallback
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        senderId: currentUser.id,
        text: text.trim(),
        time,
        timestamp: Date.now(),
        isMe: true,
        type: 'text',
      };

      setChats((prev) => {
        const idx = prev.findIndex((c) => c.user.id === receiverId);
        if (idx !== -1) {
          const updated: Chat = {
            ...prev[idx],
            lastMessage: text.trim(),
            lastMessageTime: time,
            messages: [...(prev[idx].messages || []), newMsg],
          };
          return [updated, ...prev.filter((_, i) => i !== idx)];
        }
        return prev;
      });
    }
  };

  /**
   * Gửi tin nhắn vị trí 1-1 tới người nhận
   */
  const sendLocation = async (receiverId: string, latitude: number, longitude: number) => {
    if (!currentUser.id || !receiverId) return;

    if (isFirebaseConfigured()) {
      await sendLocationMessage(currentUser.id, receiverId, latitude, longitude);
    } else {
      // Demo local fallback
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        senderId: currentUser.id,
        text: '📍 Vị trí hiện tại',
        time,
        timestamp: Date.now(),
        isMe: true,
        type: 'location',
        location: { latitude, longitude },
      };

      setChats((prev) => {
        const idx = prev.findIndex((c) => c.user.id === receiverId);
        if (idx !== -1) {
          const updated: Chat = {
            ...prev[idx],
            lastMessage: '📍 Vị trí hiện tại',
            lastMessageTime: time,
            messages: [...(prev[idx].messages || []), newMsg],
          };
          return [updated, ...prev.filter((_, i) => i !== idx)];
        }
        return prev;
      });
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const theme = useMemo(() => {
    return settings.darkMode ? darkTheme : lightTheme;
  }, [settings.darkMode]);

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        isFirebaseActive,
        currentUser,
        chats,
        contacts,
        notifications,
        settings,
        theme,
        unreadChatsCount,
        unreadNotificationsCount,
        login,
        register,
        logout,
        sendMessage,
        sendLocation,
        markChatAsRead,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        updateSetting,
        getChatByUserId,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
