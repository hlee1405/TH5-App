import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, Message } from '../types';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import {
  ChevronLeftIcon,
  SendIcon,
  ChatBubbleIcon,
  LocationPinIcon,
} from '../components/Icons';
import {
  getChatId,
  isFirebaseConfigured,
  subscribeToMessages,
  subscribeToUser,
  requestLocationPermission,
  getCurrentLocation,
  openLocationInGoogleMaps,
} from '../services';

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ChatDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { userId, userName, userAvatar, isOnline: initialOnline } = route.params;

  const { currentUser, sendMessage, sendLocation, markChatAsRead, chats, theme } = useApp();
  const colors = theme.colors;

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerStatus, setPartnerStatus] = useState({
    name: userName,
    avatar: userAvatar,
    isOnline: initialOnline ?? false,
  });
  const [isLocating, setIsLocating] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chatId = useMemo(() => {
    return getChatId(currentUser.id, userId);
  }, [currentUser.id, userId]);

  // Lắng nghe tin nhắn và trạng thái của người chat theo thời gian thực
  // Hủy lắng nghe trong cleanup của useEffect để tin nhắn không bị hiện lặp
  useEffect(() => {
    if (!chatId || !userId) return;

    // 1. Đánh dấu đã đọc cuộc trò chuyện này
    markChatAsRead(userId);

    // Nếu chưa cấu hình Firebase, tải từ danh sách tin nhắn mẫu / local
    if (!isFirebaseConfigured()) {
      const existing = chats.find((c) => c.user.id === userId || c.id === chatId);
      if (existing) {
        setMessages(existing.messages || []);
      }
      return;
    }

    // 2. Lắng nghe tin nhắn thời gian thực
    const unsubscribeMessages = subscribeToMessages(chatId, currentUser.id, (incomingMessages) => {
      setMessages(incomingMessages);
      // Tự động cuộn xuống tin nhắn mới nhất
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });

    // 3. Lắng nghe trạng thái online/offline của đối phương
    const unsubscribePartner = subscribeToUser(userId, (partnerData) => {
      if (partnerData) {
        setPartnerStatus({
          name: partnerData.name || userName,
          avatar: partnerData.avatar || userAvatar,
          isOnline: partnerData.isOnline ?? false,
        });
      }
    });

    // Hủy đăng ký khi rời màn hình
    return () => {
      unsubscribeMessages();
      unsubscribePartner();
    };
  }, [chatId, userId, currentUser.id, markChatAsRead, userName, userAvatar, chats]);

  // Gửi tin nhắn văn bản
  const handleSendText = async () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;

    setInputText('');
    try {
      await sendMessage(userId, textToSend);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.warn('Lỗi khi gửi tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại!');
    }
  };

  // Gửi vị trí hiện tại
  const handleSendLocation = async () => {
    setIsLocating(true);
    try {
      // 1. Xin quyền vị trí
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Quyền truy cập bị từ chối',
          'Ứng dụng không thể lấy vị trí do bạn đã từ chối quyền truy cập vị trí trên thiết bị.'
        );
        setIsLocating(false);
        return;
      }

      // 2. Lấy tọa độ hiện tại
      const coords = await getCurrentLocation();

      // 3. Gửi tin nhắn vị trí lên Firebase
      await sendLocation(userId, coords.latitude, coords.longitude);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.warn('Lỗi lấy vị trí:', error);
      Alert.alert(
        'Không thể xác định vị trí',
        'Vui lòng bật định vị GPS trên điện thoại của bạn và thử lại.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  // Render từng tin nhắn trong danh sách
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.isMe ?? (item.senderId === currentUser.id);
    const isLocation = item.type === 'location' && item.location;

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowPartner,
        ]}>
        {!isMe && (
          <Avatar
            uri={partnerStatus.avatar}
            name={partnerStatus.name}
            size={30}
            showOnline={false}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isMe
              ? [styles.bubbleMe, { backgroundColor: colors.primary }]
              : [
                  styles.bubblePartner,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ],
            isLocation && styles.bubbleLocation,
          ]}>
          {isLocation ? (
            /* Tin nhắn vị trí */
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                openLocationInGoogleMaps(
                  item.location!.latitude,
                  item.location!.longitude
                )
              }>
              <View style={styles.locationHeaderRow}>
                <LocationPinIcon size={20} color={isMe ? '#FFFFFF' : '#EF4444'} />
                <Text
                  style={[
                    styles.locationTitle,
                    { color: isMe ? '#FFFFFF' : colors.text },
                  ]}>
                  Vị trí đã chia sẻ
                </Text>
              </View>

              <View
                style={[
                  styles.coordsCard,
                  {
                    backgroundColor: isMe
                      ? 'rgba(255, 255, 255, 0.15)'
                      : colors.inputBg,
                  },
                ]}>
                <Text
                  style={[
                    styles.coordsText,
                    { color: isMe ? '#E0E7FF' : colors.textSecondary },
                  ]}>
                  Tọa độ: {item.location!.latitude.toFixed(5)}, {item.location!.longitude.toFixed(5)}
                </Text>
                <Text
                  style={[
                    styles.openMapActionText,
                    { color: isMe ? '#FFFFFF' : colors.primary },
                  ]}>
                  Nhấn để mở trên Google Maps ↗
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            /* Tin nhắn chữ thông thường */
            <Text
              style={[
                styles.messageText,
                isMe
                  ? styles.messageTextMe
                  : [styles.messageTextPartner, { color: colors.text }],
              ]}>
              {item.text}
            </Text>
          )}

          {/* Thời gian gửi tin nhắn */}
          <Text
            style={[
              styles.messageTime,
              isMe
                ? styles.messageTimeMe
                : [styles.messageTimePartner, { color: colors.textMuted }],
            ]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Header cuộc trò chuyện */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16) + 4,
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeftIcon size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerUserInfo}>
          <Avatar
            uri={partnerStatus.avatar}
            name={partnerStatus.name}
            size={38}
            showOnline={true}
            isOnline={partnerStatus.isOnline}
          />
          <View style={styles.headerTexts}>
            <Text
              style={[styles.headerName, { color: colors.text }]}
              numberOfLines={1}>
              {partnerStatus.name}
            </Text>
            <View style={styles.headerStatusRow}>
              <View
                style={[
                  styles.headerStatusDot,
                  {
                    backgroundColor: partnerStatus.isOnline
                      ? '#10B981'
                      : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.headerStatusText,
                  {
                    color: partnerStatus.isOnline
                      ? '#10B981'
                      : colors.textMuted,
                  },
                ]}>
                {partnerStatus.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Vùng hiển thị tin nhắn */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[styles.chatArea, { backgroundColor: colors.background }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.inputBg },
                ]}>
                <ChatBubbleIcon size={26} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Chưa có tin nhắn nào. Bắt đầu trò chuyện thời gian thực với{' '}
                {partnerStatus.name}!
              </Text>
            </View>
          }
        />

        {/* Khung nhập tin nhắn & nút vị trí */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.headerBg,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ]}>
          {/* Nút 📍 Gửi vị trí hiện tại */}
          <TouchableOpacity
            style={[
              styles.locationBtn,
              { backgroundColor: colors.inputBg },
              isLocating && { opacity: 0.6 },
            ]}
            onPress={handleSendLocation}
            disabled={isLocating}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            {isLocating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <LocationPinIcon size={20} color="#EF4444" />
            )}
          </TouchableOpacity>

          {/* Ô nhập tin nhắn văn bản */}
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.inputBg,
                color: colors.text,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
          />

          {/* Nút gửi tin nhắn (không cho gửi tin rỗng) */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length > 0
                ? [styles.sendButtonActive, { backgroundColor: colors.primary }]
                : [styles.sendButtonDisabled, { backgroundColor: colors.inputBg }],
            ]}
            onPress={handleSendText}
            disabled={!inputText.trim()}>
            <SendIcon
              size={16}
              color={inputText.trim().length > 0 ? '#FFFFFF' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTexts: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  headerStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 3,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowPartner: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
  },
  bubbleMe: {
    borderBottomRightRadius: 3,
    marginLeft: 40,
  },
  bubblePartner: {
    borderBottomLeftRadius: 3,
    marginLeft: 8,
    borderWidth: 1,
  },
  bubbleLocation: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 210,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  coordsCard: {
    borderRadius: 10,
    padding: 8,
    marginTop: 4,
  },
  coordsText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  openMapActionText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextPartner: {},
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: '#E0E7FF',
  },
  messageTimePartner: {},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  locationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 7,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {},
  sendButtonDisabled: {},
});
