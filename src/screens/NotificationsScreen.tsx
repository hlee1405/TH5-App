import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationItem } from '../types';
import { useApp } from '../context/AppContext';
import {
  ChatBubbleIcon,
  UserIcon,
  BellIcon,
  CheckIcon,
} from '../components/Icons';

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount,
    theme,
  } = useApp();
  const colors = theme.colors;

  const renderIconForType = (type: NotificationItem['type'], isRead: boolean) => {
    const iconColor = !isRead ? colors.primary : colors.textMuted;

    switch (type) {
      case 'message':
        return <ChatBubbleIcon size={20} color={iconColor} />;
      case 'friend':
        return <UserIcon size={20} color={iconColor} />;
      case 'system':
      default:
        return <BellIcon size={20} color={iconColor} />;
    }
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread
            ? [
                styles.itemUnread,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.primaryBorder,
                  borderLeftColor: colors.primary,
                },
              ]
            : [
                styles.itemRead,
                {
                  backgroundColor: theme.isDark ? colors.card : '#F8FAFC',
                  borderColor: colors.border,
                },
              ],
        ]}
        activeOpacity={0.7}
        onPress={() => markNotificationAsRead(item.id)}>
        {/* Biểu tượng phân loại */}
        <View
          style={[
            styles.iconWrapper,
            isUnread
              ? { backgroundColor: colors.primaryLight }
              : { backgroundColor: colors.inputBg },
          ]}>
          {renderIconForType(item.type, item.isRead)}
        </View>

        {/* Nội dung thông báo */}
        <View style={styles.contentWrapper}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.itemTitle,
                isUnread
                  ? [styles.textUnreadBold, { color: colors.text }]
                  : [styles.textReadNormal, { color: colors.textSecondary }],
              ]}>
              {item.title}
            </Text>
            {isUnread && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>

          <Text
            style={[
              styles.itemContent,
              isUnread
                ? { color: colors.text, fontWeight: '500' }
                : { color: colors.textMuted },
            ]}>
            {item.content}
          </Text>

          <View style={styles.footerRow}>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {item.time}
            </Text>

            {isUnread ? (
              <TouchableOpacity
                style={[styles.markReadBtn, { backgroundColor: colors.primaryLight }]}
                onPress={() => markNotificationAsRead(item.id)}>
                <Text style={[styles.markReadText, { color: colors.primary }]}>
                  Đánh dấu đã đọc
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.readStatusWrapper}>
                <CheckIcon size={12} color={colors.textMuted} />
                <Text style={[styles.statusReadText, { color: colors.textMuted }]}>
                  Đã xem
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
          <Text style={[styles.title, { color: colors.text }]}>Thông báo</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {unreadNotificationsCount > 0
              ? `${unreadNotificationsCount} thông báo chưa đọc`
              : 'Tất cả thông báo đã được xem'}
          </Text>
        </View>

        {unreadNotificationsCount > 0 && (
          <TouchableOpacity
            style={[
              styles.markAllBtn,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primaryBorder,
              },
            ]}
            onPress={markAllNotificationsAsRead}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Đã đọc tất cả
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Danh sách thông báo */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconCircle,
                { backgroundColor: colors.inputBg },
              ]}>
              <BellIcon size={28} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Chưa có thông báo nào
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Khi có tin nhắn mới hoặc sự kiện tài khoản, bạn sẽ nhận được thông báo tại đây.
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    gap: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  itemUnread: {
    borderLeftWidth: 3.5,
  },
  itemRead: {},
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
  },
  textUnreadBold: {
    fontWeight: '700',
  },
  textReadNormal: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  itemContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
  },
  markReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '600',
  },
  readStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusReadText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
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
    paddingHorizontal: 30,
  },
});
