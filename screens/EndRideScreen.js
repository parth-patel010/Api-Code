import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const BRAND_PURPLE = '#240B4C';
const BRAND_PURPLE_ACCENT = '#5B21B6';
const BRAND_VIOLET = '#7C3AED';
const GOLD = '#F59E0B';
const PAGE = '#F4F6FB';

const RATING_FEEDBACK = [
  '',
  'Could be better 😕',
  'Below average 😐',
  'Good journey 🙂',
  'Great ride! 🚀',
  'Outstanding experience! ⚡',
];

const COMPLIMENTS = [
  'Smooth ride',
  'Clean scooter',
  'Long range',
  'Easy to park',
  'Instant unlock',
  'Brakes responsive',
];

const ISSUES = [
  'Low battery',
  'Brakes weak',
  'App issue',
  'Helmet missing',
  'Tyre pressure',
  'Parking zone full',
];

function InteractiveStar({ index, active, onPress }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(1.35, { duration: 120, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 10, stiffness: 260 })
    );
    onPress();
  };

  return (
    <Pressable hitSlop={8} onPress={handlePress}>
      <Animated.View style={[styles.starTouchBox, active && styles.starTouchBoxActive, animatedStyle]}>
        <Ionicons
          name={active ? 'star' : 'star-outline'}
          size={30}
          color={active ? GOLD : '#CBD5E1'}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function EndRideScreen({
  vehicle,
  trip,
  receipt,
  summary,
  onDone,
}) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([
    'Smooth ride',
    'Instant unlock',
  ]);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [invoiceSaved, setInvoiceSaved] = useState(false);

  // Pulse animation for the success lock ring
  const pulseRingScale = useSharedValue(1);
  const pulseRingOpacity = useSharedValue(0.7);

  // Button spring scale
  const doneBtnScale = useSharedValue(1);
  const invoiceBtnScale = useSharedValue(1);

  useEffect(() => {
    pulseRingScale.value = withRepeat(
      withTiming(1.42, { duration: 1800, easing: Easing.out(Easing.cubic) }),
      -1,
      false
    );
    pulseRingOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 400 }),
        withTiming(0, { duration: 1400 })
      ),
      -1,
      false
    );
  }, []);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRingScale.value }],
    opacity: pulseRingOpacity.value,
  }));

  const doneBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: doneBtnScale.value }],
  }));

  const invoiceBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: invoiceBtnScale.value }],
  }));

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleDownloadInvoice = () => {
    setInvoiceSaved(true);
    Alert.alert(
      'Tax Invoice Downloaded',
      `Official receipt for booking #${receipt?.bookingId || 'EVG29976125'} has been saved to your downloads and emailed to your address.`,
      [{ text: 'OK' }]
    );
  };

  const isLowRating = rating > 0 && rating <= 3;
  const tagList = isLowRating ? ISSUES : COMPLIMENTS;

  const bookingId = receipt?.bookingId || 'EVG29976125';
  const durationText = summary?.elapsed || '24 mins';
  const distanceKm = summary?.distance || '5.4';
  const co2SavedKg = ((parseFloat(distanceKm) || 5.4) * 0.18).toFixed(2);
  const totalPaid = receipt?.total ?? 150;
  const depositRefund = receipt?.depositWhen === 'now' ? 250 : 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: insets.bottom + 110 },
        ]}
      >
        {/* Top Deep Purple Celebration Header (Logo Removed) */}
        <LinearGradient
          colors={['#120529', '#250952', '#3B0F7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroHeader, { paddingTop: insets.top + 12 }]}
        >
          {/* Ambient Glow Orbs */}
          <View style={styles.glowOrbTop} pointerEvents="none" />
          <View style={styles.glowOrbRight} pointerEvents="none" />

          {/* Clean Top Bar without Logo */}
          <View style={styles.topBar}>
            <View style={styles.sessionStatusPill}>
              <View style={styles.sessionLiveDot} />
              <Text style={styles.sessionStatusText}>RIDE SESSION ENDED</Text>
            </View>

            <View style={styles.bookingBadge}>
              <Ionicons name="receipt-outline" size={12} color="#E9D5FF" />
              <Text style={styles.bookingBadgeText}>#{bookingId}</Text>
            </View>
          </View>

          {/* Animated Success Checkmark with Pulsing Ring */}
          <View style={styles.celebrationWrap}>
            <Animated.View style={[styles.pulseRing, pulseRingStyle]} />
            <Animated.View
              entering={ZoomIn.duration(550).springify()}
              style={styles.lockBadge}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.lockBadgeGradient}
              >
                <Ionicons name="checkmark-done" size={32} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </View>

          <Animated.Text
            entering={FadeInDown.duration(400)}
            style={styles.heroTitle}
          >
            Ride Completed!
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.duration(450)}
            style={styles.heroSubtitle}
          >
            Scooter is securely locked at the Zone & billing is closed.
          </Animated.Text>
        </LinearGradient>

        {/* Floating Telemetry Bridge Card */}
        <Animated.View entering={cardEnter(0)} style={styles.floatingStatsWrap}>
          <View style={styles.floatingOverviewCard}>
            <View style={styles.statCol}>
              <View
                style={[styles.statIconWrap, { backgroundColor: '#F5F3FF' }]}
              >
                <Ionicons name="time-outline" size={18} color={BRAND_VIOLET} />
              </View>
              <Text style={styles.statVal}>{durationText}</Text>
              <Text style={styles.statLbl}>DURATION</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <View
                style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}
              >
                <Ionicons name="navigate-outline" size={17} color="#2563EB" />
              </View>
              <Text style={styles.statVal}>{distanceKm} km</Text>
              <Text style={styles.statLbl}>DISTANCE</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <View
                style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}
              >
                <Ionicons name="leaf-outline" size={17} color="#059669" />
              </View>
              <Text style={[styles.statVal, { color: '#059669' }]}>
                {co2SavedKg} kg
              </Text>
              <Text style={styles.statLbl}>CO₂ SAVED</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.cardsContainer}>
          {/* Vehicle & Route Summary Card */}
          <Animated.View entering={cardEnter(1)} style={styles.contentCard}>
            <View style={styles.vehicleHeaderRow}>
              <View
                style={[
                  styles.vehicleAvatarBox,
                  { backgroundColor: vehicle?.tint || '#F5F3FF' },
                ]}
              >
                {vehicle?.image ? (
                  <Image
                    source={vehicle.image}
                    style={styles.vehicleAvatarImg}
                    contentFit="contain"
                  />
                ) : (
                  <Ionicons name="bicycle" size={26} color={BRAND_VIOLET} />
                )}
              </View>

              <View style={styles.vehicleTitleCol}>
                <Text style={styles.vehicleName} numberOfLines={1}>
                  {vehicle?.name || 'Evegah Smart EV'}
                </Text>
                <Text style={styles.vehicleLine}>
                  {vehicle?.line || 'Silent city commuter'}
                </Text>
              </View>

              <View style={styles.ecoBadgePill}>
                <Ionicons name="flash" size={12} color="#15803D" />
                <Text style={styles.ecoBadgeText}>100% EV</Text>
              </View>
            </View>

            {/* Route Station Sub-Cards */}
            <View style={styles.routeBox}>
              <View style={styles.routeStopRow}>
                <View style={styles.routeRailCol}>
                  <View style={styles.pickupDotOuter}>
                    <View style={styles.pickupDotInner} />
                  </View>
                  <View style={styles.routeRailLine} />
                </View>

                <View style={styles.routeStopInfo}>
                  <View style={styles.routeTagRow}>
                    <Text style={styles.routeStopTag}>PICKUP Zone</Text>
                  </View>
                  <Text style={styles.routeStopName} numberOfLines={1}>
                    {trip?.pickupName || 'Gotri Zone, Vadodara'}
                  </Text>
                </View>
              </View>

              <View style={styles.routeStopRow}>
                <View style={styles.routeRailCol}>
                  <View style={styles.dropSquareNode} />
                </View>

                <View style={[styles.routeStopInfo, { paddingBottom: 0 }]}>
                  <View style={styles.routeTagRow}>
                    <Text
                      style={[styles.routeStopTag, { color: BRAND_VIOLET }]}
                    >
                      PARKED & LOCKED
                    </Text>
                  </View>
                  <Text style={styles.routeStopName} numberOfLines={1}>
                    {trip?.dropName || 'Manjalpur Zone, Vadodara'}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Interactive Experience Rating Card */}
          <Animated.View entering={cardEnter(2)} style={styles.contentCard}>
            <View style={styles.ratingHeaderBlock}>
              <View style={styles.ratingKickerPill}>
                <Ionicons name="sparkles" size={12} color={BRAND_VIOLET} />
                <Text style={styles.ratingKickerText}>RIDE FEEDBACK</Text>
              </View>
              <Text style={styles.ratingHeading}>How was your ride?</Text>
              <Text style={styles.ratingSub}>
                Your feedback helps keep our Vadodara fleet in top shape
              </Text>
            </View>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((val) => (
                <InteractiveStar
                  key={val}
                  index={val}
                  active={rating >= val}
                  onPress={() => setRating(val)}
                />
              ))}
            </View>

            {rating > 0 ? (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={styles.feedbackMoodPill}
              >
                <Text style={styles.ratingFeedbackWord}>
                  {RATING_FEEDBACK[rating]}
                </Text>
              </Animated.View>
            ) : null}

            {/* Compliment / Issue Tags */}
            <View style={styles.tagsSection}>
              <Text style={styles.tagsHeading}>
                {isLowRating
                  ? 'What could be improved?'
                  : 'What stood out on this trip?'}
              </Text>
              <View style={styles.tagsRow}>
                {tagList.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[styles.tagPill, active && styles.tagPillActive]}
                    >
                      <Ionicons
                        name={active ? 'checkmark-circle' : 'add-circle-outline'}
                        size={14}
                        color={active ? '#FFFFFF' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.tagPillText,
                          active && styles.tagPillTextActive,
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Optional Note Input */}
            <TextInput
              value={feedbackNote}
              onChangeText={setFeedbackNote}
              placeholder={
                isLowRating
                  ? 'Tell us what went wrong so we can fix it right away…'
                  : 'Add a quick note or compliment for our team (optional)…'
              }
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              style={styles.feedbackInput}
            />
          </Animated.View>

          {/* Perforated Payment & Refund Summary Card */}
          <Animated.View entering={cardEnter(3)} style={styles.contentCard}>
            <View style={styles.billHeaderRow}>
              <View style={styles.billIconBox}>
                <Ionicons name="receipt-outline" size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.billSectionTitle}>
                  Payment & Refund Summary
                </Text>
                <Text style={styles.billSectionSub}>
                  Final settlement receipt for #{bookingId}
                </Text>
              </View>
              <View style={styles.paidStatusPill}>
                <Ionicons name="checkmark-circle" size={13} color="#15803D" />
                <Text style={styles.paidStatusPillText}>Settled</Text>
              </View>
            </View>

            <View style={styles.billLinesWrap}>
              <View style={styles.billLine}>
                <Text style={styles.billLineLabel}>Ride Plan Charges</Text>
                <Text style={styles.billLineValue}>₹{totalPaid}</Text>
              </View>

              <View style={styles.billLine}>
                <Text style={styles.billLineLabel}>Taxes & Zone Fee</Text>
                <Text style={styles.includedTag}>Included</Text>
              </View>

              {depositRefund > 0 ? (
                <View style={styles.billLine}>
                  <View style={styles.depositLabelRow}>
                    <Text style={styles.billLineLabel}>
                      Security Deposit Refund
                    </Text>
                    <View style={styles.refundProgressPill}>
                      <Text style={styles.refundProgressText}>
                        Auto-Initiated
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.billLineValue, { color: '#059669' }]}>
                    ₹{depositRefund}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Perforated Ticket Cutout Divider */}
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
                  Paid via UPI • Instant Receipt
                </Text>
              </View>
              <Text style={styles.grandTotalAmount}>₹{totalPaid}</Text>
            </View>

            {depositRefund > 0 ? (
              <View style={styles.depositNoteBanner}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.depositNoteText}>
                  Your refundable deposit of ₹{depositRefund} has been released
                  and will reflect in your source account within 2–4 hours.
                </Text>
              </View>
            ) : null}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <Pressable
          onPress={handleDownloadInvoice}
          onPressIn={() => {
            invoiceBtnScale.value = withSpring(0.96);
          }}
          onPressOut={() => {
            invoiceBtnScale.value = withSpring(1);
          }}
          style={styles.invoiceBtnWrap}
        >
          <Animated.View style={[styles.invoiceBtn, invoiceBtnStyle]}>
            <Ionicons
              name={
                invoiceSaved ? 'checkmark-circle' : 'document-text-outline'
              }
              size={18}
              color={BRAND_VIOLET}
            />
            <Text style={styles.invoiceBtnText}>
              {invoiceSaved ? 'Invoice Saved' : 'Tax Invoice'}
            </Text>
          </Animated.View>
        </Pressable>

        <Pressable
          onPress={onDone}
          onPressIn={() => {
            doneBtnScale.value = withSpring(0.96);
          }}
          onPressOut={() => {
            doneBtnScale.value = withSpring(1);
          }}
          style={styles.doneBtnWrap}
        >
          <Animated.View style={[styles.doneBtn, doneBtnStyle]}>
            <LinearGradient
              colors={['#5B21B6', '#3B0F7A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneBtnGradient}
            >
              <Text style={styles.doneBtnText}>Back to Home</Text>
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
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
  scrollBody: {
    paddingBottom: 120,
  },

  /* Hero Header */
  heroHeader: {
    paddingHorizontal: 18,
    paddingBottom: 62,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  glowOrbTop: {
    position: 'absolute',
    top: -60,
    left: -30,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },
  glowOrbRight: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sessionStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  sessionLiveDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  sessionStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#F3E8FF',
    letterSpacing: 1,
  },
  bookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  bookingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  /* Animated Checkmark Ring */
  celebrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 86,
    marginTop: 4,
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
  },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  lockBadgeGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  heroTitle: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.76)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },

  /* Floating Telemetry Bridge Card */
  floatingStatsWrap: {
    paddingHorizontal: 16,
    marginTop: -40,
    zIndex: 20,
  },
  floatingOverviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLbl: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#E2E8F0',
  },

  /* Main Body Cards Container */
  cardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  contentCard: {
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

  /* Vehicle & Route Card */
  vehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleAvatarBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleAvatarImg: {
    width: 50,
    height: 44,
  },
  vehicleTitleCol: {
    flex: 1,
    paddingRight: 8,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  vehicleLine: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  ecoBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
  },
  ecoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },

  /* Route Sub-Box */
  routeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  routeStopRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  routeRailCol: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 2,
  },
  pickupDotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  routeRailLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 3,
  },
  dropSquareNode: {
    width: 11,
    height: 11,
    borderRadius: 3,
    borderWidth: 2.2,
    borderColor: BRAND_VIOLET,
    backgroundColor: '#FFFFFF',
  },
  routeStopInfo: {
    flex: 1,
    paddingBottom: 12,
  },
  routeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  routeStopTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
  routeStopName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },

  /* Rating Card */
  ratingHeaderBlock: {
    alignItems: 'center',
  },
  ratingKickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    marginBottom: 8,
  },
  ratingKickerText: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_VIOLET,
    letterSpacing: 0.6,
  },
  ratingHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  ratingSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 3,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  starTouchBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starTouchBoxActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  feedbackMoodPill: {
    alignSelf: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 12,
  },
  ratingFeedbackWord: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND_PURPLE_ACCENT,
  },
  tagsSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tagsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagPillActive: {
    backgroundColor: BRAND_PURPLE,
    borderColor: BRAND_PURPLE,
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tagPillTextActive: {
    color: '#FFFFFF',
  },
  feedbackInput: {
    marginTop: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 74,
  },

  /* Bill & Refund Summary Card */
  billHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 16,
  },
  billIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billSectionTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  billSectionSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  paidStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
  },
  paidStatusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  billLinesWrap: {
    gap: 11,
  },
  billLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billLineLabel: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '600',
  },
  billLineValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  includedTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  depositLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refundProgressPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  refundProgressText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },

  /* Perforated Ticket Cutout Divider */
  ticketDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
    marginHorizontal: -18,
  },
  ticketNotchLeft: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PAGE,
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
    backgroundColor: PAGE,
    marginRight: -9,
    borderWidth: 1,
    borderColor: '#E8EDF5',
  },

  /* Grand Total Row */
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grandTotalLabel: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  grandTotalSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  grandTotalAmount: {
    fontSize: 23,
    fontWeight: '900',
    color: BRAND_PURPLE_ACCENT,
  },
  depositNoteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  depositNoteText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#065F46',
    lineHeight: 17,
  },

  /* Sticky Bottom Action Bar */
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  invoiceBtnWrap: {
    flex: 0.42,
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  invoiceBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: BRAND_PURPLE_ACCENT,
  },
  doneBtnWrap: {
    flex: 0.58,
  },
  doneBtn: {
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: BRAND_PURPLE_ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  doneBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});