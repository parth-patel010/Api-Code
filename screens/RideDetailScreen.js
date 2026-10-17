import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
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

const STATUS_THEME = {
  ongoing: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#059669',
    dot: '#10B981',
    icon: 'flash',
  },
  upcoming: {
    bg: '#F5F3FF',
    border: '#DDD6FE',
    text: '#6D28D9',
    dot: '#7C3AED',
    icon: 'time',
  },
  completed: {
    bg: '#DCFCE7',
    border: '#BBF7D0',
    text: '#15803D',
    dot: '#16A34A',
    icon: 'checkmark-circle',
  },
};

function rupee(amount) {
  return `₹${Math.abs(Math.round(amount || 0)).toLocaleString('en-IN')}`;
}

export default function RideDetailScreen({ ride, onBack }) {
  const insets = useSafeAreaInsets();
  const [copiedTx, setCopiedTx] = useState(false);
  const [invoiceDownloaded, setInvoiceDownloaded] = useState(false);

  if (!ride) return null;

  const theme = STATUS_THEME[ride.status] || STATUS_THEME.completed;
  const txId = `TXN_${ride.id || 'EVG89421'}`;

  const copyTxId = async () => {
    await Clipboard.setStringAsync(txId);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 1800);
  };

  const handleDownloadInvoice = () => {
    setInvoiceDownloaded(true);
    Alert.alert(
      'Invoice Ready',
      `Tax Invoice for booking #${ride.id} has been generated and saved to your device receipts.`,
      [{ text: 'OK' }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Ride Support',
      'Evegah 24/7 Helpline: 1800 889 8791\nOur support team is ready to assist you with this booking.',
      [{ text: 'Close' }]
    );
  };

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

          {/* Top Navigation Row */}
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
              <Text style={styles.topBarTitle}>Ride Summary</Text>
              <Text style={styles.topBarSub}>BOOKING #{ride.id}</Text>
            </View>

            <Pressable
              hitSlop={10}
              onPress={handleDownloadInvoice}
              style={({ pressed }) => [
                styles.topIconBtn,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons
                name={invoiceDownloaded ? 'checkmark-done' : 'download-outline'}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Floating Vehicle & Telemetry Showcase Card */}
        <Animated.View entering={cardEnter(0)} style={styles.heroCardWrap}>
          <View style={styles.heroVehicleCard}>
            {/* Top Status & Plan Strip */}
            <View style={styles.heroCardTopStrip}>
              <View style={styles.planPill}>
                <Ionicons name="Sparkles" size={12} color={BRAND_VIOLET} />
                <Text style={styles.planPillText}>
                  {ride.plan || 'Daily'} Pass
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: theme.bg, borderColor: theme.border },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: theme.dot }]}
                />
                <Text style={[styles.statusBadgeText, { color: theme.text }]}>
                  {ride.statusLabel}
                </Text>
              </View>
            </View>

            {/* Main Vehicle Identity Row */}
            <View style={styles.vehicleMainRow}>
              <View style={styles.vehicleTextCol}>
                <Text style={styles.vehicleTitle} numberOfLines={1}>
                  {ride.vehicle}
                </Text>
                <Text style={styles.vehicleTagline}>
                  {ride.line || 'Smart Electric Scooter'}
                </Text>
                <View style={styles.verifiedZoneTag}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={13}
                    color="#059669"
                  />
                  <Text style={styles.verifiedZoneText}>
                    Evegah Verified Mobility
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.vehicleImageBox,
                  { backgroundColor: ride.tint || '#F5F3FF' },
                ]}
              >
                <Image
                  source={ride.image}
                  style={styles.vehicleImage}
                  contentFit="contain"
                />
              </View>
            </View>

            {/* 3-Column Telemetry Strip */}
            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryBox}>
                <View
                  style={[
                    styles.telemetryIconCircle,
                    { backgroundColor: '#FEF9C3' },
                  ]}
                >
                  <Ionicons name="battery-charging" size={15} color="#CA8A04" />
                </View>
                <View>
                  <Text style={styles.telemetryLabel}>BATTERY</Text>
                  <Text style={styles.telemetryVal}>
                    {ride.battery || '95%'}
                  </Text>
                </View>
              </View>

              <View style={styles.telemetryDivider} />

              <View style={styles.telemetryBox}>
                <View
                  style={[
                    styles.telemetryIconCircle,
                    { backgroundColor: '#F3E8FF' },
                  ]}
                >
                  <Ionicons name="navigate" size={14} color={BRAND_VIOLET} />
                </View>
                <View>
                  <Text style={styles.telemetryLabel}>DISTANCE</Text>
                  <Text style={styles.telemetryVal}>
                    {ride.distance || '14.2 km'}
                  </Text>
                </View>
              </View>

              <View style={styles.telemetryDivider} />

              <View style={styles.telemetryBox}>
                <View
                  style={[
                    styles.telemetryIconCircle,
                    { backgroundColor: '#E0F2FE' },
                  ]}
                >
                  <Ionicons name="time" size={15} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.telemetryLabel}>DURATION</Text>
                  <Text style={styles.telemetryVal}>
                    {ride.span || 'Daily'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.bodyContainer}>
          {/* Route & Station Schedule Card */}
          <Animated.View entering={cardEnter(1)} style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View
                  style={[
                    styles.sectionIconBox,
                    { backgroundColor: '#F5F3FF' },
                  ]}
                >
                  <Ionicons
                    name="git-Pull-request-outline"
                    size={17}
                    color={BRAND_VIOLET}
                  />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Route & Schedule</Text>
                  <Text style={styles.sectionSubtitle}>
                    Pickup & drop-off station logs
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.routeTimelineWrap}>
              {/* Pickup Station Block */}
              <View style={styles.stationRow}>
                <View style={styles.timelineRail}>
                  <View style={styles.pickupOuterRing}>
                    <View style={styles.pickupInnerDot} />
                  </View>
                  <View style={styles.railConnector} />
                </View>

                <View style={styles.stationCard}>
                  <View style={styles.stationCardTop}>
                    <View style={styles.stationTagPickup}>
                      <Text style={styles.stationTagPickupText}>PICKUP Zone</Text>
                    </View>
                    <View style={styles.timestampWrap}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color="#64748B"
                      />
                      <Text style={styles.timestampText}>{ride.pickupWhen}</Text>
                    </View>
                  </View>

                  <Text style={styles.stationName}>{ride.pickup} Station</Text>
                  <Text style={styles.stationAddress}>
                    Evegah Mobility Zone · {ride.pickup}, Vadodara
                  </Text>
                </View>
              </View>

              {/* Drop-off Station Block */}
              <View style={styles.stationRow}>
                <View style={styles.timelineRail}>
                  <View style={styles.dropSquareNode} />
                </View>

                <View style={[styles.stationCard, { marginBottom: 0 }]}>
                  <View style={styles.stationCardTop}>
                    <View style={styles.stationTagDrop}>
                      <Text style={styles.stationTagDropText}>DROP-OFF Zone</Text>
                    </View>
                    <View style={styles.timestampWrap}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color="#64748B"
                      />
                      <Text style={styles.timestampText}>{ride.dropWhen}</Text>
                    </View>
                  </View>

                  <Text style={styles.stationName}>{ride.drop} Station</Text>
                  <Text style={styles.stationAddress}>
                    Evegah Mobility Zone · {ride.drop}, Vadodara
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Digital Tax Receipt & Payment Summary Card */}
          <Animated.View entering={cardEnter(2)} style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <View
                  style={[
                    styles.sectionIconBox,
                    { backgroundColor: '#ECFDF5' },
                  ]}
                >
                  <Ionicons name="receipt-outline" size={17} color="#059669" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Payment Summary</Text>
                  <Text style={styles.sectionSubtitle}>
                    Inclusive of taxes & security deposit
                  </Text>
                </View>
              </View>

              <View style={styles.paymentMethodPill}>
                <Ionicons name="flash" size={11} color={BRAND_PURPLE_ACCENT} />
                <Text style={styles.paymentMethodPillText}>
                  {ride.method || 'UPI'}
                </Text>
              </View>
            </View>

            {/* Line Items */}
            <View style={styles.billTable}>
              <View style={styles.billLine}>
                <Text style={styles.billLabel}>
                  Base Rental Plan ({ride.plan || 'Daily'})
                </Text>
                <Text style={styles.billAmount}>{rupee(ride.fare)}</Text>
              </View>

              <View style={styles.billLine}>
                <Text style={styles.billLabel}>Platform & Taxes</Text>
                <Text style={styles.billIncludedTag}>Included</Text>
              </View>

              <View style={styles.billLine}>
                <View style={styles.depositLabelGroup}>
                  <Text style={styles.billLabel}>Security Deposit</Text>
                  <View
                    style={[
                      styles.depositMiniPill,
                      ride.depositBack
                        ? styles.depositMiniReturned
                        : styles.depositMiniHeld,
                    ]}
                  >
                    <Text
                      style={[
                        styles.depositMiniText,
                        { color: ride.depositBack ? '#15803D' : '#B45309' },
                      ]}
                    >
                      {ride.depositBack ? 'Refunded' : 'Refundable'}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.billAmount,
                    ride.depositBack && { color: '#15803D' },
                  ]}
                >
                  {ride.depositBack ? '₹0' : rupee(ride.deposit || 250)}
                </Text>
              </View>
            </View>

            {/* Perforated Ticket Divider */}
            <View style={styles.ticketDividerRow}>
              <View style={styles.ticketNotchLeft} />
              <View style={styles.ticketDashedLine} />
              <View style={styles.ticketNotchRight} />
            </View>

            {/* Grand Total Row */}
            <View style={styles.grandTotalRow}>
              <View>
                <Text style={styles.grandTotalLabel}>Total Fare Paid</Text>
                <Text style={styles.grandTotalSub}>
                  Paid via {ride.method || 'UPI (Verified)'}
                </Text>
              </View>
              <Text style={styles.grandTotalAmount}>{rupee(ride.fare)}</Text>
            </View>

            {/* Copyable Transaction ID Bar */}
            <Pressable
              onPress={copyTxId}
              style={({ pressed }) => [
                styles.txBar,
                pressed && { backgroundColor: '#F1F5F9' },
              ]}
            >
              <View style={styles.txBarLeft}>
                <View style={styles.txIconCircle}>
                  <Ionicons
                    name="finger-print-outline"
                    size={15}
                    color="#64748B"
                  />
                </View>
                <View>
                  <Text style={styles.txKicker}>TRANSACTION ID</Text>
                  <Text style={styles.txCodeText}>{txId}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.copyChip,
                  copiedTx && styles.copyChipSuccess,
                ]}
              >
                <Ionicons
                  name={copiedTx ? 'checkmark-circle' : 'copy-outline'}
                  size={14}
                  color={copiedTx ? '#15803D' : BRAND_PURPLE_ACCENT}
                />
                <Text
                  style={[
                    styles.copyChipText,
                    copiedTx && { color: '#15803D' },
                  ]}
                >
                  {copiedTx ? 'Copied' : 'Copy'}
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* 2-Column Quick Support & Invoice Actions */}
          <Animated.View entering={cardEnter(3)} style={styles.quickActionsGrid}>
            <Pressable
              onPress={handleDownloadInvoice}
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
                  name={
                    invoiceDownloaded
                      ? 'checkmark-circle'
                      : 'document-text-outline'
                  }
                  size={20}
                  color={BRAND_VIOLET}
                />
              </View>
              <Text style={styles.quickActionTitle}>
                {invoiceDownloaded ? 'Saved Receipt' : 'Tax Invoice'}
              </Text>
              <Text style={styles.quickActionSub}>Download PDF</Text>
            </Pressable>

            <Pressable
              onPress={handleSupport}
              style={({ pressed }) => [
                styles.quickActionCard,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: '#FEF2F2' },
                ]}
              >
                <Ionicons name="headset-outline" size={20} color="#DC2626" />
              </View>
              <Text style={styles.quickActionTitle}>24/7 Helpline</Text>
              <Text style={styles.quickActionSub}>Get Ride Support</Text>
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
            <Ionicons name="bicycle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBottomText}>Back to My Rides</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6FB',
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
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.68)',
    letterSpacing: 1,
    marginTop: 2,
  },

  /* Floating Hero Vehicle Card */
  heroCardWrap: {
    paddingHorizontal: 16,
    marginTop: -56,
    zIndex: 20,
  },
  heroVehicleCard: {
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
  },
  heroCardTopStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 10,
  },
  planPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: BRAND_VIOLET,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  vehicleMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vehicleTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  vehicleTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  vehicleTagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  verifiedZoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  verifiedZoneText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  vehicleImageBox: {
    width: 96,
    height: 86,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImage: {
    width: 84,
    height: 72,
  },

  /* 3-Column Telemetry Strip */
  telemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  telemetryBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  telemetryIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  telemetryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  telemetryDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0',
  },

  /* Main Body Container */
  bodyContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },

  /* Section Cards */
  sectionCard: {
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
    overflow: 'hidden',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  sectionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },

  /* Route Timeline */
  routeTimelineWrap: {
    paddingLeft: 2,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timelineRail: {
    width: 22,
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 14,
  },
  pickupOuterRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_VIOLET,
  },
  railConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#DDD6FE',
    marginVertical: 4,
  },
  dropSquareNode: {
    width: 13,
    height: 13,
    borderRadius: 4,
    borderWidth: 2.5,
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  stationCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stationCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stationTagPickup: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  stationTagPickupText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  stationTagDrop: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  stationTagDropText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.5,
  },
  timestampWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestampText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  stationName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  stationAddress: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },

  /* Payment & Receipt Card */
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  paymentMethodPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: BRAND_PURPLE_ACCENT,
  },
  billTable: {
    gap: 11,
  },
  billLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
  },
  billAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  billIncludedTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  depositLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  depositMiniPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  depositMiniReturned: {
    backgroundColor: '#DCFCE7',
  },
  depositMiniHeld: {
    backgroundColor: '#FEF3C7',
  },
  depositMiniText: {
    fontSize: 10,
    fontWeight: '800',
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
    backgroundColor: '#F4F6FB',
    marginLeft: -9,
    borderWidth: 1,
    borderColor: '#E8EDF5',
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
    backgroundColor: '#F4F6FB',
    marginRight: -9,
    borderWidth: 1,
    borderColor: '#E8EDF5',
  },

  /* Grand Total Row */
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  grandTotalSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  grandTotalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: BRAND_PURPLE_ACCENT,
  },

  /* Transaction ID Copy Box */
  txBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  txBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  txCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
  },
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copyChipSuccess: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  copyChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND_PURPLE_ACCENT,
  },

  /* 2-Column Quick Support & Invoice Grid */
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