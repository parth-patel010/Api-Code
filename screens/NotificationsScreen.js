import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, last10, shortDate } from '../services/api';

const PURPLE = '#4A168C';
const PURPLE_DEEP = '#24083C';
const PURPLE_SUB = '#280D42';
const TEXT_MUTED = '#736B82';
const FILTERS = ['All', 'Rides', 'Wallet', 'Offers', 'System'];

const NOTIF_ICONS = {
  Rides: { icon: 'bicycle', bg: '#EDE4F7', color: PURPLE },
  Wallet: { icon: 'wallet-outline', bg: '#E0F2FE', color: '#0284C7' },
  Offers: { icon: 'pricetag-outline', bg: '#FEF3C7', color: '#D97706' },
  System: { icon: 'information-circle-outline', bg: '#F1F5F9', color: '#64748B' },
};

function kindFor(type) {
  const value = String(type || '').toLowerCase();
  if (value.includes('ride') || value.includes('book')) return 'Rides';
  if (value.includes('pay') || value.includes('wallet')) return 'Wallet';
  if (value.includes('promo') || value.includes('offer')) return 'Offers';
  return 'System';
}

export default function NotificationsScreen({
  notes,
  phone,
  onRead,
  onReadAll,
  onBack,
}) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const [items, setItems] = useState(notes || []);

  useEffect(() => {
    const mobile = last10(phone);
    if (!mobile) return;
    apiGet(`/notifications?mobile=${mobile}`)
      .then((body) => {
        const rows = body?.data || [];
        if (!rows.length) return;
        setItems(
          rows.map((item) => ({
            id: String(item.id),
            kind: kindFor(item.type),
            title: item.title,
            text: item.message,
            time: shortDate(item.created_at),
            read: Boolean(item.read),
          }))
        );
      })
      .catch(() => {});
  }, [phone]);

  const visible = items.filter((item) => filter === 'All' || item.kind === filter);
  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Sober Minimal Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable hitSlop={8} style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color={PURPLE_DEEP} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadgePill}>
              <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
            </View>
          ) : null}
        </View>

        {unreadCount > 0 ? (
          <Pressable
            hitSlop={8}
            onPress={() => {
              setItems((list) => list.map((item) => ({ ...item, read: true })));
              onReadAll?.();
            }}
            style={styles.markAllBtn}
          >
            <Text style={styles.markAllText}>Mark read</Text>
          </Pressable>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </View>

      {/* Clean Category Filter Strip */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {FILTERS.map((item) => {
            const on = filter === item;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[styles.filterChip, on && styles.filterChipOn]}
              >
                <Text style={[styles.filterChipText, on && styles.filterChipTextOn]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {visible.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={24} color="#A39BAE" />
            </View>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You have no {filter === 'All' ? '' : String(filter || '').toLowerCase()} alerts right now.
            </Text>
          </View>
        ) : (
          visible.map((item, index) => {
            const conf = NOTIF_ICONS[item.kind] || NOTIF_ICONS.System;
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 45).duration(240)}
              >
                <Pressable
                  onPress={() => {
                    setItems((list) =>
                      list.map((row) =>
                        row.id === item.id ? { ...row, read: true } : row
                      )
                    );
                    onRead?.(item.id);
                  }}
                  style={[
                    styles.notifRow,
                    !item.read && styles.notifRowUnread,
                  ]}
                >
                  {/* Category Accent Dot / Icon Circle */}
                  <View style={[styles.kindIconCircle, { backgroundColor: conf.bg }]}>
                    <Ionicons name={conf.icon} size={16} color={conf.color} />
                  </View>

                  <View style={styles.notifContent}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.notifTitle,
                          !item.read && styles.notifTitleUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.notifTime}>{item.time}</Text>
                    </View>

                    <Text style={styles.notifText} numberOfLines={2}>
                      {item.text}
                    </Text>
                  </View>

                  {!item.read ? <View style={styles.unreadPip} /> : null}
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF5',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F3FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PURPLE_DEEP,
    letterSpacing: -0.3,
  },
  unreadBadgePill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE,
  },
  markAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE,
  },
  headerRightSpacer: {
    width: 36,
  },

  /* Filter Strip */
  filtersWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F0F7',
    paddingVertical: 10,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F3F8',
  },
  filterChipOn: {
    backgroundColor: PURPLE,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#635B72',
  },
  filterChipTextOn: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* List */
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 8,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ECE8F2',
  },
  notifRowUnread: {
    borderColor: '#E1D3F3',
    backgroundColor: '#FCFBFE',
  },
  kindIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notifContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#383244',
    flex: 1,
  },
  notifTitleUnread: {
    color: PURPLE_DEEP,
    fontWeight: '800',
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#938B9F',
  },
  notifText: {
    fontSize: 12.5,
    lineHeight: 17,
    color: '#615A6E',
    fontWeight: '500',
  },
  unreadPip: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: PURPLE,
    marginTop: 6,
  },

  /* Empty State */
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F0ECF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PURPLE_DEEP,
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
