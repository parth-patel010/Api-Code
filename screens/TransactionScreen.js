import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const BRAND_PURPLE = '#240B4C';
const BRAND_PURPLE_ACCENT = '#5B21B6';
const BRAND_VIOLET = '#7C3AED';
const PAGE = '#F4F6FB';

export default function TransactionScreen({ tx, onBack }) {
  const insets = useSafeAreaInsets();
  const [copiedKey, setCopiedKey] = useState(null);
  const [receiptSaved, setReceiptSaved] = useState(false);

  if (!tx) return null;

  const copy = async (value, key) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const isCredit = Boolean(tx.credit);

  const handleDownloadReceipt = () => {
    setReceiptSaved(true);
    Alert.alert(
      'Receipt Downloaded',
      `Official payment invoice for ${tx.id || 'transaction'} saved to downloads.`
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Help & Support',
      'Evegah 24/7 Support Hotline: 1800 889 8791\nOur payments team will assist you with any questions.'
    );
  };

  const rows = [
    {
      label: 'Date & Time',
      value: tx.date || 'Today',
      icon: 'calendar-outline',
      iconBg: '#F1F5F9',
      iconColor: '#475569',
    },
    {
      label: 'Payment Status',
      value: tx.status || 'Completed',
      statusPill: true,
      icon: 'shield-checkmark-outline',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
    },
    {
      label: 'Payment Method',
      value: tx.method || 'UPI (Google Pay)',
      icon: 'card-outline',
      iconBg: '#F5F3FF',
      iconColor: BRAND_VIOLET,
    },
    tx.id
      ? {
          label: 'Transaction ID',
          value: tx.id,
          copy: true,
          key: 'txId',
          icon: 'finger-print-outline',
          iconBg: '#EFF6FF',
          iconColor: '#2563EB',
        }
      : null,
    tx.booking
      ? {
          label: 'Booking Reference',
          value: `#${tx.booking}`,
          rawValue: tx.booking,
          copy: true,
          key: 'booking',
          icon: 'bicycle-outline',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
        }
      : null,
  ].filter(Boolean);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Deep Purple Hero Header */}
        <LinearGradient
          colors={['#120529', '#250952', '#3B0F7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroHeader, { paddingTop: insets.top + 10 }]}
        >
          {/* Ambient Glow Orbs */}
          <View style={styles.glowOrbTop} pointerEvents="none" />
          <View style={styles.glowOrbRight} pointerEvents="none" />

          {/* Top Navigation Bar */}
          <View style={styles.topBar}>
            <Pressable
              hitSlop={10}
              onPress={onBack}
              style={({ pressed }) => [
                styles.topIconBtn,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.topCenterCol}>
              <Text style={styles.topBarTitle}>Payment Receipt</Text>
              <Text style={styles.topBarSub}>EVEGAH PAY VOUCHER</Text>
            </View>

            <Pressable
              hitSlop={10}
              onPress={() =>
                Alert.alert(
                  'Statement',
                  `Official receipt statement for #${tx.id} generated.`
                )
              }
              style={({ pressed }) => [
                styles.topIconBtn,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons name="share-social-outline" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Floating Amount & Voucher Hero Card */}
        <Animated.View entering={cardEnter(0)} style={styles.heroCardWrap}>
          <View style={styles.voucherCard}>
            {/* Top Row: Entry Type Pill + Status Badge */}
            <View style={styles.voucherTopRow}>
              <View
                style={[
                  styles.txTypePill,
                  isCredit
                    ? { backgroundColor: '#ECFDF5' }
                    : { backgroundColor: '#F5F3FF' },
                ]}
              >
                <Ionicons
                  name={isCredit ? 'arrow-down-circle' : 'arrow-up-circle'}
                  size={14}
                  color={isCredit ? '#059669' : BRAND_VIOLET}
                />
                <Text
                  style={[
                    styles.txTypePillText,
                    { color: isCredit ? '#059669' : BRAND_VIOLET },
                  ]}
                >
                  {isCredit ? 'WALLET CREDIT' : 'RIDE / WALLET DEBIT'}
                </Text>
              </View>

              <View style={styles.verifiedStatusPill}>
                <View style={styles.verifiedDot} />
                <Text style={styles.verifiedStatusText}>
                  {tx.status || 'Completed'}
                </Text>
              </View>
            </View>

            {/* Center Amount Showcase */}
            <View style={styles.amountShowcase}>
              <View
                style={[
                  styles.heroIconRing,
                  isCredit
                    ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                    : { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
                ]}
              >
                <Ionicons
                  name={isCredit ? 'wallet-outline' : 'bicycle-outline'}
                  size={26}
                  color={isCredit ? '#059669' : BRAND_VIOLET}
                />
              </View>

              <Text
                style={[
                  styles.heroAmountText,
                  isCredit ? styles.heroAmountCredit : styles.heroAmountDebit,
                ]}
              >
                {tx.amount || '₹0.00'}
              </Text>

              <Text style={styles.heroTxTitle}>
                {tx.title || 'Transaction'}
              </Text>
              <Text style={styles.heroTxSubtitle}>
                {tx.detail || 'Evegah Mobility Wallet'}
              </Text>
            </View>

            {/* Perforated Ticket Cutout Divider */}
            <View style={styles.ticketDividerRow}>
              <View style={styles.ticketNotchLeft} />
              <View style={styles.ticketDashedLine} />
              <View style={styles.ticketNotchRight} />
            </View>

            {/* Quick Timestamp & Method Strip */}
            <View style={styles.voucherFooterRow}>
              <View style={styles.voucherFooterItem}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.voucherFooterText}>
                  {tx.date || 'Today'}
                </Text>
              </View>
              <View style={styles.voucherFooterDot} />
              <View style={styles.voucherFooterItem}>
                <Ionicons name="flash-outline" size={14} color={BRAND_VIOLET} />
                <Text
                  style={[
                    styles.voucherFooterText,
                    { color: BRAND_PURPLE_ACCENT, fontWeight: '800' },
                  ]}
                >
                  {tx.method || 'UPI'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.bodyContainer}>
          {/* Itemized Transaction Breakdown Card */}
          <Animated.View entering={cardEnter(1)} style={styles.detailsCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBox}>
                <Ionicons name="list-outline" size={18} color={BRAND_VIOLET} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Transaction Breakdown</Text>
                <Text style={styles.sectionSub}>
                  Official passbook & settlement log
                </Text>
              </View>
            </View>

            <View style={styles.rowsContainer}>
              {rows.map((row, idx) => {
                const isLast = idx === rows.length - 1 && !tx.note;
                return (
                  <View
                    key={row.label}
                    style={[
                      styles.detailItemRow,
                      !isLast && styles.detailItemBorder,
                    ]}
                  >
                    <View style={styles.detailLeftGroup}>
                      <View
                        style={[
                          styles.rowMiniIcon,
                          { backgroundColor: row.iconBg },
                        ]}
                      >
                        <Ionicons
                          name={row.icon}
                          size={15}
                          color={row.iconColor}
                        />
                      </View>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                    </View>

                    <View style={styles.detailRightGroup}>
                      {row.statusPill ? (
                        <View style={styles.inlineSuccessBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={13}
                            color="#15803D"
                          />
                          <Text style={styles.inlineSuccessText}>
                            {row.value}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {row.value}
                        </Text>
                      )}

                      {row.copy ? (
                        <Pressable
                          hitSlop={10}
                          onPress={() =>
                            copy(row.rawValue || row.value, row.key)
                          }
                          style={[
                            styles.copyBtn,
                            copiedKey === row.key && styles.copyBtnSuccess,
                          ]}
                        >
                          <Ionicons
                            name={
                              copiedKey === row.key
                                ? 'checkmark-circle'
                                : 'copy-outline'
                            }
                            size={13}
                            color={
                              copiedKey === row.key
                                ? '#15803D'
                                : BRAND_PURPLE_ACCENT
                            }
                          />
                          <Text
                            style={[
                              styles.copyBtnText,
                              copiedKey === row.key && { color: '#15803D' },
                            ]}
                          >
                            {copiedKey === row.key ? 'Copied' : 'Copy'}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}

              {/* Remarks / Note Block if present */}
              {tx.note ? (
                <View style={styles.remarksBox}>
                  <View style={styles.remarksHeader}>
                    <Ionicons
                      name="document-text-outline"
                      size={13}
                      color="#64748B"
                    />
                    <Text style={styles.remarksKicker}>REMARKS & NOTES</Text>
                  </View>
                  <Text style={styles.remarksText}>{tx.note}</Text>
                </View>
              ) : null}
            </View>

            {/* 256-Bit Security Footer Banner */}
            <View style={styles.securityStrip}>
              <View style={styles.securityIconWrap}>
                <Ionicons name="lock-closed" size={14} color="#059669" />
              </View>
              <Text style={styles.securityStripText}>
                256-bit Encrypted Transaction • Verified by Razorpay
              </Text>
            </View>
          </Animated.View>

          {/* 2-Column Quick Actions: Download Receipt & Support */}
          <Animated.View entering={cardEnter(2)} style={styles.quickActionsGrid}>
            <Pressable
              onPress={handleDownloadReceipt}
              style={({ pressed }) => [
                styles.quickActionCard,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: '#F5F3FF' },
                ]}
              >
                <Ionicons
                  name={receiptSaved ? 'checkmark-circle' : 'download-outline'}
                  size={20}
                  color={BRAND_VIOLET}
                />
              </View>
              <Text style={styles.quickActionTitle}>
                {receiptSaved ? 'Receipt Saved' : 'Download PDF'}
              </Text>
              <Text style={styles.quickActionSub}>Official Invoice</Text>
            </Pressable>

            <Pressable
              onPress={handleSupport}
              style={({ pressed }) => [
                styles.quickActionCard,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View
                style={[styles.quickActionIcon, { backgroundColor: '#FEF2F2' }]}
              >
                <Ionicons name="headset-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.quickActionTitle}>Need Help?</Text>
              <Text style={styles.quickActionSub}>24/7 Payment Support</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Dock CTA */}
      <View
        style={[
          styles.bottomDock,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.primaryBottomBtn,
            pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
          ]}
        >
          <LinearGradient
            colors={['#5B21B6', '#3B0F7A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBottomGradient}
          >
            <Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBottomText}>Done</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },

  /* Hero Header */
  heroHeader: {
    paddingHorizontal: 18,
    paddingBottom: 76,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  glowOrbTop: {
    position: 'absolute',
    top: -60,
    left: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },
  glowOrbRight: {
    position: 'absolute',
    bottom: -40,
    right: -30,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenterCol: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  topBarSub: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.68)',
    letterSpacing: 1.1,
    marginTop: 2,
  },

  /* Floating Voucher Hero Card */
  heroCardWrap: {
    paddingHorizontal: 16,
    marginTop: -56,
    zIndex: 20,
  },
  voucherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  voucherTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  txTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 10,
  },
  txTypePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  verifiedStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },

  /* Center Amount Showcase */
  amountShowcase: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  heroIconRing: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroAmountText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroAmountCredit: {
    color: '#059669',
  },
  heroAmountDebit: {
    color: '#0F172A',
  },
  heroTxTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  heroTxSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },

  /* Perforated Ticket Divider */
  ticketDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: -18,
  },
  ticketNotchLeft: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PAGE,
    marginLeft: -9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ticketDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginHorizontal: 10,
  },
  ticketNotchRight: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PAGE,
    marginRight: -9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  /* Voucher Footer Strip */
  voucherFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  voucherFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  voucherFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  voucherFooterDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },

  /* Main Body */
  bodyContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },

  /* Breakdown Card */
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 16,
  },
  sectionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },

  /* Breakdown Rows */
  rowsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowMiniIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  detailRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '58%',
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  inlineSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  inlineSuccessText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copyBtnSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_PURPLE_ACCENT,
  },

  /* Remarks Box */
  remarksBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  remarksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  remarksKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  remarksText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
  },

  /* Security Strip */
  securityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  securityIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityStripText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
  },

  /* 2-Column Quick Actions Grid */
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1.5,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickActionSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },

  /* Sticky Bottom Bar */
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  primaryBottomBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: BRAND_PURPLE_ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryBottomGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
  },
  primaryBottomText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});