import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, Chat } from '../types';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import { SearchBar } from '../components/SearchBar';
import { ChatBubbleIcon } from '../components/Icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { chats, markChatAsRead, currentUser, theme } = useApp();
  const colors = theme.colors;
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc cuộc trò chuyện theo ô tìm kiếm
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase().trim();
    return chats.filter(
      (chat) =>
        chat.user.name.toLowerCase().includes(q) ||
        chat.lastMessage.toLowerCase().includes(q)
    );
  }, [chats, searchQuery]);

  const handleOpenChat = (chat: Chat) => {
    markChatAsRead(chat.user.id);
    navigation.navigate('ChatDetail', {
      chatId: chat.id,
      userId: chat.user.id,
      userName: chat.user.name,
      userAvatar: chat.user.avatar,
      isOnline: chat.user.isOnline,
    });
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          { borderBottomColor: colors.border },
          hasUnread && { backgroundColor: colors.unreadBg },
        ]}
        activeOpacity={0.7}
        onPress={() => handleOpenChat(item)}>
        {/* Ảnh đại diện */}
        <Avatar
          uri={item.user.avatar}
          name={item.user.name}
          size={52}
          showOnline={true}
          isOnline={item.user.isOnline}
        />

        {/* Thông tin cuộc trò chuyện */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {item.user.name}
            </Text>
            <Text
              style={[
                styles.timeText,
                { color: colors.textMuted },
                hasUnread && { color: colors.primary, fontWeight: '700' },
              ]}>
              {item.lastMessageTime}
            </Text>
          </View>

          <View style={styles.chatFooter}>
            <Text
              style={[
                styles.lastMessage,
                { color: colors.textSecondary },
                hasUnread && { color: colors.text, fontWeight: '700' },
              ]}
              numberOfLines={1}>
              {item.lastMessage}
            </Text>

            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.badgeBg }]}>
                <Text style={[styles.unreadCount, { color: colors.badgeText }]}>
                  {item.unreadCount > 9 ? '9+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Screen Header with safe area insets */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16) + 4,
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>
            Xin chào, {currentUser.name}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Tin nhắn</Text>
        </View>
        <Avatar
          uri={currentUser.avatar}
          name={currentUser.name}
          size={40}
          showOnline={true}
          isOnline={true}
        />
      </View>

      {/* Ô tìm kiếm cuộc trò chuyện */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Tìm kiếm người dùng hoặc tin nhắn..."
      />

      {/* Danh sách cuộc trò chuyện */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.inputBg },
              ]}>
              <ChatBubbleIcon size={28} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Không tìm thấy cuộc trò chuyện
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {searchQuery
                ? `Không có kết quả nào khớp với "${searchQuery}"`
                : 'Hộp thư hiện đang trống'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderBottomWidth: 1,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
