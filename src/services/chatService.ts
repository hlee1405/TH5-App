import {
  ref,
  push,
  set,
  onValue,
  update,
  get,
} from 'firebase/database';
import { database } from './firebase';
import { Message, Chat } from '../types';

/**
 * Tạo Chat ID duy nhất và cố định cho 2 người dùng (ví dụ: uidA_uidB)
 */
export const getChatId = (uid1: string, uid2: string): string => {
  if (!uid1 || !uid2) return 'general_chat';
  return [uid1, uid2].sort().join('_');
};

/**
 * Định dạng giờ hiện tại theo dạng HH:mm
 */
const getCurrentTimeString = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Gửi tin nhắn văn bản 1-1
 */
export const sendTextMessage = async (
  senderId: string,
  receiverId: string,
  text: string
): Promise<void> => {
  const cleanText = text.trim();
  if (!cleanText || !senderId || !receiverId) return;

  const chatId = getChatId(senderId, receiverId);
  const timestamp = Date.now();
  const time = getCurrentTimeString(timestamp);

  // Tạo ID mới cho tin nhắn
  const messagesRef = ref(database, `messages/${chatId}`);
  const newMessageRef = push(messagesRef);
  const messageId = newMessageRef.key || `msg_${timestamp}`;

  const messageData = {
    id: messageId,
    senderId,
    receiverId,
    text: cleanText,
    time,
    timestamp,
    type: 'text',
  };

  // 1. Lưu tin nhắn vào node messages/${chatId}/${messageId}
  await set(newMessageRef, messageData);

  // 2. Lấy số unread hiện tại của người nhận để tăng thêm 1
  const receiverChatRef = ref(database, `userChats/${receiverId}/${senderId}`);
  let currentUnread = 0;
  try {
    const snap = await get(receiverChatRef);
    if (snap.exists()) {
      currentUnread = snap.val().unreadCount || 0;
    }
  } catch (err) {
    console.debug('Lỗi đọc unreadCount:', err);
  }

  // 3. Cập nhật node cuộc trò chuyện của người gửi (unreadCount = 0)
  await update(ref(database, `userChats/${senderId}/${receiverId}`), {
    chatId,
    partnerId: receiverId,
    lastMessage: cleanText,
    lastMessageTime: time,
    timestamp,
    unreadCount: 0,
  });

  // 4. Cập nhật node cuộc trò chuyện của người nhận (tăng unreadCount)
  await update(receiverChatRef, {
    chatId,
    partnerId: senderId,
    lastMessage: cleanText,
    lastMessageTime: time,
    timestamp,
    unreadCount: currentUnread + 1,
  });
};

/**
 * Gửi tin nhắn vị trí tọa độ 1-1
 */
export const sendLocationMessage = async (
  senderId: string,
  receiverId: string,
  latitude: number,
  longitude: number
): Promise<void> => {
  if (!senderId || !receiverId) return;

  const chatId = getChatId(senderId, receiverId);
  const timestamp = Date.now();
  const time = getCurrentTimeString(timestamp);

  const messagesRef = ref(database, `messages/${chatId}`);
  const newMessageRef = push(messagesRef);
  const messageId = newMessageRef.key || `msg_${timestamp}`;

  const messageData = {
    id: messageId,
    senderId,
    receiverId,
    text: '📍 Vị trí hiện tại',
    time,
    timestamp,
    type: 'location',
    location: {
      latitude,
      longitude,
    },
  };

  // 1. Lưu tin nhắn vị trí
  await set(newMessageRef, messageData);

  // 2. Lấy unread hiện tại của người nhận
  const receiverChatRef = ref(database, `userChats/${receiverId}/${senderId}`);
  let currentUnread = 0;
  try {
    const snap = await get(receiverChatRef);
    if (snap.exists()) {
      currentUnread = snap.val().unreadCount || 0;
    }
  } catch (err) {
    console.debug('Lỗi đọc unreadCount:', err);
  }

  // 3. Cập nhật danh sách trò chuyện
  await update(ref(database, `userChats/${senderId}/${receiverId}`), {
    chatId,
    partnerId: receiverId,
    lastMessage: '📍 Vị trí hiện tại',
    lastMessageTime: time,
    timestamp,
    unreadCount: 0,
  });

  await update(receiverChatRef, {
    chatId,
    partnerId: senderId,
    lastMessage: '📍 Vị trí hiện tại',
    lastMessageTime: time,
    timestamp,
    unreadCount: currentUnread + 1,
  });
};

/**
 * Đặt số tin nhắn chưa đọc về 0 khi người dùng mở cuộc trò chuyện
 */
export const markChatAsReadInFirebase = async (
  currentUserId: string,
  partnerId: string
): Promise<void> => {
  if (!currentUserId || !partnerId) return;
  try {
    const userChatRef = ref(database, `userChats/${currentUserId}/${partnerId}`);
    await update(userChatRef, {
      unreadCount: 0,
    });
  } catch (_error) {
    console.warn('Lỗi khi đánh dấu đã đọc:', _error);
  }
};

/**
 * Lắng nghe danh sách tin nhắn của một cuộc trò chuyện theo thời gian thực
 * Trả về hàm hủy lắng nghe (cleanup) cho useEffect
 */
export const subscribeToMessages = (
  chatId: string,
  currentUserId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  if (!chatId) {
    callback([]);
    return () => {};
  }

  const messagesRef = ref(database, `messages/${chatId}`);

  const unsubscribe = onValue(
    messagesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const list: Message[] = [];
      Object.keys(data).forEach((key) => {
        const item = data[key];
        list.push({
          id: item.id || key,
          senderId: item.senderId,
          text: item.text || '',
          time: item.time || '',
          timestamp: item.timestamp || 0,
          isMe: item.senderId === currentUserId,
          type: item.type || 'text',
          location: item.location || undefined,
        });
      });

      // Sắp xếp tin nhắn tăng dần theo thời gian (cũ ở trên, mới ở dưới)
      list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      callback(list);
    },
    (error) => {
      console.warn('Lỗi lắng nghe tin nhắn:', error);
    }
  );

  return () => {
    unsubscribe();
  };
};

/**
 * Lắng nghe danh sách các cuộc trò chuyện của người dùng hiện tại
 * Kèm theo thông tin người nhận (avatar, name, isOnline) được đồng bộ thời gian thực
 * Cuộc trò chuyện mới nhất luôn nằm trên cùng (sắp xếp giảm dần theo timestamp)
 */
export const subscribeToConversations = (
  currentUserId: string,
  callback: (chats: Chat[]) => void
): (() => void) => {
  if (!currentUserId) {
    callback([]);
    return () => {};
  }

  const userChatsRef = ref(database, `userChats/${currentUserId}`);
  const usersRef = ref(database, 'users');

  let currentUsersData: Record<string, any> = {};

  // Lắng nghe users để lấy avatar và trạng thái online mới nhất
  const unsubUsers = onValue(usersRef, (userSnap) => {
    currentUsersData = userSnap.val() || {};
  });

  const unsubChats = onValue(
    userChatsRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }

      const conversations: Chat[] = [];
      Object.keys(data).forEach((partnerId) => {
        const item = data[partnerId];
        const partnerProfile = currentUsersData[partnerId] || {};

        conversations.push({
          id: item.chatId || getChatId(currentUserId, partnerId),
          user: {
            id: partnerId,
            name: partnerProfile.name || 'Người dùng',
            avatar:
              partnerProfile.avatar ||
              `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(
                partnerProfile.name || partnerId
              )}`,
            isOnline: Boolean(partnerProfile.isOnline),
          },
          lastMessage: item.lastMessage || '',
          lastMessageTime: item.lastMessageTime || '',
          unreadCount: item.unreadCount || 0,
          messages: [],
        });
      });

      // Sắp xếp cuộc trò chuyện mới nhất nằm trên cùng
      conversations.sort((a, b) => {
        const itemA = data[a.user.id];
        const itemB = data[b.user.id];
        const timeA = itemA?.timestamp || 0;
        const timeB = itemB?.timestamp || 0;
        return timeB - timeA;
      });

      callback(conversations);
    },
    (error) => {
      console.warn('Lỗi lắng nghe danh sách cuộc trò chuyện:', error);
    }
  );

  return () => {
    unsubChats();
    unsubUsers();
  };
};
