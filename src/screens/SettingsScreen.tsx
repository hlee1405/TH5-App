import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components/Avatar';
import {
  BellIcon,
  UsersIcon,
  SoundIcon,
  MoonIcon,
  LogoutIcon,
} from '../components/Icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { currentUser, settings, updateSetting, logout, theme } = useApp();
  const colors = theme.colors;

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?',
      [
        {
          text: 'Huỷ',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Screen Header with safe insets */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16) + 4,
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}>
        <Text style={[styles.title, { color: colors.text }]}>Cài đặt</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* 1. Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}>
          <Avatar
            uri={currentUser.avatar}
            name={currentUser.name}
            size={72}
            showOnline={true}
            isOnline={settings.showOnlineStatus}
          />
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: colors.text }]}>{currentUser.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{currentUser.email}</Text>
            <Text style={[styles.profilePhone, { color: colors.textMuted }]}>{currentUser.phone}</Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.activeBadge,
                  {
                    backgroundColor: settings.showOnlineStatus
                      ? (theme.isDark ? '#064E3B' : '#ECFDF5')
                      : (theme.isDark ? '#1E293B' : '#F1F5F9'),
                  },
                ]}>
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: settings.showOnlineStatus ? '#10B981' : '#64748B' },
                  ]}
                />
                <Text
                  style={[
                    styles.activeText,
                    {
                      color: settings.showOnlineStatus
                        ? (theme.isDark ? '#34D399' : '#059669')
                        : '#94A3B8',
                    },
                  ]}>
                  {settings.showOnlineStatus ? 'Trực tuyến' : 'Ẩn trạng thái'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bio quote */}
        <View
          style={[
            styles.bioCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}>
          <Text style={[styles.bioLabel, { color: colors.textMuted }]}>Tiểu sử</Text>
          <Text style={[styles.bioText, { color: colors.textSecondary }]}>
            {currentUser.bio}
          </Text>
        </View>

        {/* 2. Settings Group */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Tùy chọn hệ thống
          </Text>
        </View>

        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}>
          {/* Switch 1: Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View
                style={[
                  styles.settingIconBg,
                  { backgroundColor: theme.isDark ? '#1E3A8A' : '#EFF6FF' },
                ]}>
                <BellIcon size={18} color={colors.primary} />
              </View>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Thông báo tin nhắn
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Nhận thông báo khi có tin nhắn mới
                </Text>
              </View>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(val) => updateSetting('notifications', val)}
              trackColor={{ false: theme.isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
              thumbColor={settings.notifications ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Switch 2: Online Status */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View
                style={[
                  styles.settingIconBg,
                  { backgroundColor: theme.isDark ? '#064E3B' : '#ECFDF5' },
                ]}>
                <UsersIcon size={18} color="#10B981" />
              </View>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Trạng thái trực tuyến
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Hiển thị chấm xanh khi đang online
                </Text>
              </View>
            </View>
            <Switch
              value={settings.showOnlineStatus}
              onValueChange={(val) => updateSetting('showOnlineStatus', val)}
              trackColor={{ false: theme.isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
              thumbColor={settings.showOnlineStatus ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Switch 3: Sound */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View
                style={[
                  styles.settingIconBg,
                  { backgroundColor: theme.isDark ? '#451A03' : '#FEF3C7' },
                ]}>
                <SoundIcon size={18} color={theme.isDark ? '#FBBF24' : '#D97706'} />
              </View>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Âm thanh & Rung
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Phát âm báo khi nhận tin nhắn
                </Text>
              </View>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(val) => updateSetting('soundEnabled', val)}
              trackColor={{ false: theme.isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
              thumbColor={settings.soundEnabled ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Switch 4: Dark Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View
                style={[
                  styles.settingIconBg,
                  { backgroundColor: theme.isDark ? '#1E3A8A' : '#EFF6FF' },
                ]}>
                <MoonIcon
                  size={18}
                  color={theme.isDark ? '#60A5FA' : '#2563EB'}
                  bgColor={theme.isDark ? '#1E3A8A' : '#EFF6FF'}
                />
              </View>
              <View style={styles.settingTexts}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Giao diện tối
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  {theme.isDark ? 'Đang kích hoạt giao diện tối' : 'Tiết kiệm pin và dịu mắt'}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(val) => updateSetting('darkMode', val)}
              trackColor={{ false: theme.isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
              thumbColor={settings.darkMode ? '#FFFFFF' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* 3. Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.dangerBg,
              borderColor: colors.dangerBorder,
            },
          ]}
          activeOpacity={0.8}
          onPress={handleLogout}>
          <LogoutIcon size={18} color={colors.dangerText} />
          <Text style={[styles.logoutText, { color: colors.dangerText }]}>
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 12,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bioCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  bioLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsGroup: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTexts: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  appVersionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appCopyrightText: {
    fontSize: 11,
    marginTop: 2,
  },
});
