import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
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
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, apiPost, getUserMobile, last10 } from '../services/api';

const BRAND_PURPLE = '#4A168C';
const BRAND_PURPLE_LIGHT = '#7C3AED';
const BRAND_SURFACE = '#F4F5F9';
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

const DAY_RATE = {
  'Evegah Fly': 149,
  'Evegah Mink': 199,
  'Evegah City': 229,
  'Evegah Pro': 299,
  'Evegah CIty': 189,
};

const DEPOSIT = 250;
const FLEXI_BASE_FARE = 150;

const CHECKOUT_COUPONS = [
  {
    id: 'first50',
    title: 'Flat ₹50 OFF on First Evegah Ride',
    subtitle: 'Use code FIRST50',
    code: 'FIRST50',
    discount: 50,
    bullets: [
      'Valid on your first Evegah electric scooter booking.',
      'Applicable across Hourly, Daily & Monthly plans.',
    ],
  },
  {
    id: 'navratri100',
    title: 'Navratri Fest • Flat ₹100 OFF',
    subtitle: 'Use code NAVRATRI100',
    code: 'NAVRATRI100',
    discount: 100,
    bullets: [
      'Festive special coupon for Garba & night EV rides.',
      'Includes free battery swap at any 24/7 Evegah Zone.',
    ],
  },
  {
    id: 'diwali200',
    title: 'Diwali Dhamaka • Flat ₹200 OFF',
    subtitle: 'Use code DIWALI200',
    code: 'DIWALI200',
    discount: 200,
    bullets: [
      'Festive reward coupon on multi-day or weekly EV plans.',
      'Applicable on Evegah Fly, Mink, City & Pro scooters.',
    ],
  },
  {
    id: 'winter40',
    title: 'Winter Ride • Flat ₹40 OFF above ₹149',
    subtitle: 'Use code WINTER40',
    code: 'WINTER40',
    discount: 40,
    bullets: [
      'This offer is personalised for your winter morning rides.',
      'Applicable on order worth ₹149 or above.',
    ],
  },
];

function rupee(amount) {
  const sign = amount < 0 ? '−' : '';
  return `${sign}₹${Math.abs(Math.round(amount)).toLocaleString('en-IN')}`;
}

function billDays(start, end) {
  if (!start || !end || end <= start) return 1;
  const hours = (end - start) / 36e5;
  return Math.max(1, Math.ceil(hours / 24));
}

function spanLabel(start, end) {
  if (!start || !end || end <= start) return '1 Day';
  const hours = Math.round((end - start) / 36e5);
  if (hours < 24) return hours <= 1 ? '1 Hr' : `${hours} Hrs`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 Day' : `${days} Days`;
}

function whenLine(ms) {
  if (!ms) return 'Today · 10:00 AM';
  const date = new Date(ms);
  const day = date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${day} · ${time}`;
}

function Segment({ value, onChange }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const markW = Math.max((width - 8) / 2, 0);

  useEffect(() => {
    x.value = withTiming(value === 'now' ? 0 : markW, {
      duration: 300,
      easing: EASE,
      reduceMotion: ReduceMotion.Never,
    });
  }, [markW, value, x]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      style={styles.segment}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.segmentMark, { width: markW }, markStyle]}
      />
      {[
        ['now', 'Pay Now', '₹250 Refundable'],
        ['later', 'At Pickup', 'Pay at Zone'],
      ].map(([id, title, sub]) => {
        const on = value === id;
        return (
          <Pressable
            key={id}
            style={styles.segmentBtn}
            onPress={() => onChange(id)}
          >
            <Text style={[styles.segmentTitle, on && styles.segmentTitleOn]}>
              {title}
            </Text>
            <Text style={[styles.segmentSub, on && styles.segmentSubOn]}>
              {sub}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function PayScreen({ vehicle, trip, phone, profile, onBack, onPay }) {
  const insets = useSafeAreaInsets();
  const [offerOn, setOfferOn] = useState(true);
  const [appliedCode, setAppliedCode] = useState('FIRST50');
  const [appliedDiscountAmt, setAppliedDiscountAmt] = useState(50);
  const [couponPopupOpen, setCouponPopupOpen] = useState(false);
  const [expandedMap, setExpandedMap] = useState({
    first50: true,
    navratri100: false,
    diwali200: false,
    winter40: false,
  });
  const [depositWhen, setDepositWhen] = useState('now');
  const [method, setMethod] = useState('gpay');
  const [couponsList, setCouponsList] = useState(CHECKOUT_COUPONS);

  useEffect(() => {
    apiGet('/coupons')
      .then((body) => {
        const list = body?.data || body?.coupons || body || [];
        if (Array.isArray(list) && list.length > 0) {
          setCouponsList(
            list.map((c, idx) => ({
              id: String(c.id || c.code || `coupon-${idx}`),
              title: c.title || (c.discount ? `Flat ₹${c.discount} OFF` : 'Special Discount'),
              subtitle: `Use code ${c.code || 'EVEGAH'}`,
              code: String(c.code || 'EVEGAH').toUpperCase(),
              discount: Number(c.discount || 50),
              bullets: [
                c.description || 'Valid on Evegah electric scooter booking.',
                'Includes free battery swap at Evegah zones.',
              ],
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handlePayPress = async () => {
    const mobile = last10(phone || profile?.phone) || getUserMobile() || '';
    const riderName = profile?.name || 'Evegah Rider';
    let resId = `RES-${Date.now().toString().slice(-6)}`;
    try {
      const res = await apiPost('/reservations', {
        vehicle_id: vehicle?.id || 'city',
        model_name: vehicle?.name || 'Evegah City',
        mobile,
        pickup_at: trip?.pickupAt,
        drop_at: trip?.dropAt,
        pickup_zone: trip?.pickupName || 'Gotri',
        drop_zone: trip?.dropName || 'Gotri',
        fare,
        deposit,
        total_amount: total,
        payment_method: method === 'card' ? 'PayU India' : method === 'wallet' ? 'Evegah Wallet' : 'ICICI UPI',
        coupon_applied: offerOn ? appliedCode : null,
      });
      if (res?.data?.id || res?.id) {
        resId = String(res?.data?.id || res?.id);
      }
    } catch (e) {}

    // Link real live payment gateway
    if (method === 'gpay' || method === 'phonepe' || method === 'paytm') {
      try {
        const upiRes = await apiPost('/payments/icici/initiate', {
          amount: total,
          rider_name: riderName,
          mobile,
          notes: 'Evegah EV Ride Booking',
          purpose: 'ride',
          reservation_id: resId,
        });
        const upiString = upiRes?.data?.upi_string || upiRes?.qrString;
        if (upiString) {
          Linking.openURL(upiString).catch(() => {});
        }
      } catch (e) {}
    } else if (method === 'card') {
      // PayU Cards / NetBanking / Hosted Checkout
      try {
        const payuRes = await apiPost('/payments/payu/initiate', {
          amount: total,
          rider_name: riderName,
          mobile,
          email: mobile ? `rider_${mobile}@evegah.com` : 'rider@evegah.com',
          purpose: 'ride',
          reservation_id: resId,
          return_url: 'https://evegah.cloud/payment/success',
        });
        const checkoutUrl = payuRes?.data?.checkout_url || payuRes?.data?.action_url;
        if (checkoutUrl) {
          Linking.openURL(checkoutUrl).catch(() => {});
        }
      } catch (e) {}
    }

    onPay?.({
      fare,
      flexiFee,
      discount,
      deposit,
      total,
      days,
      method,
      depositWhen,
      offerOn,
      appliedCode: offerOn ? appliedCode : null,
      reservationId: resId,
    });
  };

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const days = billDays(trip?.pickupAt, trip?.dropAt);
  const rate = DAY_RATE[vehicle?.name] || DAY_RATE['Evegah Mink'];
  const fare = rate * days;
  const flexiEnabled = Boolean(trip?.flexiEnabled || vehicle?.flexiEnabled);
  const flexiFee = flexiEnabled ? FLEXI_BASE_FARE : 0;
  const discount = offerOn ? Math.min(appliedDiscountAmt, fare) : 0;
  const deposit = depositWhen === 'now' ? DEPOSIT : 0;
  const total = Math.max(0, fare + flexiFee - discount + deposit);
  const span = spanLabel(trip?.pickupAt, trip?.dropAt);

  const pickupLabel =
    trip?.flexiPickupAddress ||
    vehicle?.flexiPickupAddress ||
    trip?.pickupName ||
    'Gotri Zone';
  const dropLabel =
    trip?.flexiDropAddress ||
    vehicle?.flexiDropAddress ||
    trip?.dropName ||
    'Manjalpur Station';

  const methodNames = {
    gpay: 'Google Pay',
    phonepe: 'PhonePe',
    paytm: 'Paytm UPI',
    card: 'Card',
    wallet: 'Evegah Wallet',
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Sleek Curved Hero Header */}
      <LinearGradient
        colors={['#0F041D', '#230844', '#3D1073']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroHeader, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.topBar}>
          <Pressable hitSlop={12} onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.topCenterCol}>
            <Text style={styles.topBarTitle}>Review & Pay</Text>
            <Text style={styles.topBarSubtitle}>
              {span} Rental • Instant Confirmation
            </Text>
          </View>

          <View style={styles.secureBadgePill}>
            <Ionicons name="lock-closed" size={11} color="#34D399" />
            <Text style={styles.secureBadgeText}>SSL</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 125 },
        ]}
      >
        {/* 1. Overlapping Boarding-Pass Vehicle & Route Card */}
        <Animated.View entering={cardEnter(0)} style={styles.heroCard}>
          {/* Top Vehicle Showcase */}
          <View style={styles.vehicleHeaderRow}>
            <View style={styles.vehicleMetaCol}>
              <View style={styles.planTagRow}>
                <View style={styles.planPill}>
                  <Text style={styles.planPillText}>{span.toUpperCase()} PLAN</Text>
                </View>
                <View style={styles.chargePill}>
                  <Ionicons name="flash" size={11} color="#059669" />
                  <Text style={styles.chargePillText}>
                    {vehicle?.range || '85 km'} range
                  </Text>
                </View>
              </View>

              <Text style={styles.vehicleName}>
                {vehicle?.name || 'Evegah Smart EV'}
              </Text>
              <Text style={styles.vehicleSubtitle}>
                {vehicle?.line || 'Zero-emission smart city scooter'}
              </Text>
            </View>

            <View
              style={[
                styles.vehicleArtBox,
                { backgroundColor: vehicle?.tint || '#F3E8FF' },
              ]}
            >
              {vehicle?.image ? (
                <Image
                  source={vehicle.image}
                  style={styles.vehicleImg}
                  contentFit="contain"
                />
              ) : (
                <Ionicons name="bicycle" size={36} color={BRAND_PURPLE} />
              )}
            </View>
          </View>

          {/* Boarding Pass Perforation Line */}
          <View style={styles.ticketDividerWrap}>
            <View style={styles.notchLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.notchRight} />
          </View>

          {/* Horizontal-Style Timeline Blocks */}
          <View style={styles.timelineContainer}>
            <View style={styles.timelineStopBox}>
              <View style={styles.stopHeaderRow}>
                <View style={styles.dotPickup} />
                <Text style={styles.stopTypeLabel}>
                  {flexiEnabled ? 'FLEXI DELIVERY' : 'PICKUP Zone'}
                </Text>
              </View>
              <Text style={styles.stopStationName} numberOfLines={1}>
                {pickupLabel}
              </Text>
              <Text style={styles.stopTimeText}>{whenLine(trip?.pickupAt)}</Text>
            </View>

            <View style={styles.timelineArrowBridge}>
              <View style={styles.bridgeLine} />
              <View style={styles.bridgeCircle}>
                <Ionicons name="arrow-forward" size={13} color={BRAND_PURPLE} />
              </View>
              <View style={styles.bridgeLine} />
            </View>

            <View style={[styles.timelineStopBox, { alignItems: 'flex-end' }]}>
              <View style={styles.stopHeaderRow}>
                <Text style={styles.stopTypeLabel}>
                  {flexiEnabled ? 'FLEXI RETURN' : 'DROP Zone'}
                </Text>
                <View style={styles.dotDrop} />
              </View>
              <Text
                style={[styles.stopStationName, { textAlign: 'right' }]}
                numberOfLines={1}
              >
                {dropLabel}
              </Text>
              <Text style={styles.stopTimeText}>{whenLine(trip?.dropAt)}</Text>
            </View>
          </View>
        </Animated.View>

        {/* 2. Perforated Ticket Voucher Card */}
        <Animated.View entering={cardEnter(1)}>
          <Pressable
            onPress={() => setCouponPopupOpen(true)}
            style={[
              styles.voucherCard,
              offerOn && styles.voucherCardApplied,
            ]}
          >
            <View style={styles.voucherStubLeft}>
              <LinearGradient
                colors={
                  offerOn
                    ? ['#059669', '#10B981']
                    : [BRAND_PURPLE, BRAND_PURPLE_LIGHT]
                }
                style={styles.voucherIconBadge}
              >
                <Ionicons
                  name={offerOn ? 'checkmark-sharp' : 'pricetag'}
                  size={18}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>

            <View style={styles.voucherContentCol}>
              <View style={styles.voucherTitleRow}>
                <Text style={styles.voucherCodeTitle}>
                  {offerOn ? `'${appliedCode}' Applied` : 'Apply Promo Coupon'}
                </Text>
                {offerOn ? (
                  <View style={styles.voucherSavedTag}>
                    <Text style={styles.voucherSavedTagText}>
                      −{rupee(discount)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.voucherSubText}>
                {offerOn
                  ? `You save ₹${discount} instantly on this ride`
                  : 'Unlock up to ₹200 off on festival & first rides'}
              </Text>
            </View>

            <View style={styles.voucherActionCol}>
              {offerOn ? (
                <Pressable
                  hitSlop={10}
                  onPress={(e) => {
                    e.stopPropagation();
                    setOfferOn(false);
                  }}
                >
                  <Text style={styles.voucherRemoveBtn}>CHANGE</Text>
                </Pressable>
              ) : (
                <View style={styles.voucherBrowsePill}>
                  <Text style={styles.voucherBrowseText}>VIEW</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={BRAND_PURPLE}
                  />
                </View>
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* 3. Security Deposit Toggle Card */}
        <Animated.View entering={cardEnter(2)} style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleCluster}>
              <View
                style={[styles.sectionIconWrap, { backgroundColor: '#EDE9FE' }]}
              >
                <Ionicons
                  name="shield-half-sharp"
                  size={16}
                  color={BRAND_PURPLE}
                />
              </View>
              <View>
                <Text style={styles.sectionHeaderTitle}>Security Deposit</Text>
                <Text style={styles.sectionHeaderSub}>
                  100% auto-refunded when ride ends
                </Text>
              </View>
            </View>
            <Text style={styles.depositAmountBadge}>{rupee(DEPOSIT)}</Text>
          </View>

          <Segment value={depositWhen} onChange={setDepositWhen} />

          <View style={styles.depositHintRow}>
            <Ionicons
              name={
                depositWhen === 'now'
                  ? 'flash-outline'
                  : 'time-outline'
              }
              size={14}
              color="#64748B"
            />
            <Text style={styles.depositHintText}>
              {depositWhen === 'now'
                ? 'Fastest Zone handoff — zero paperwork or payment queue at pickup.'
                : `Pay only ride fare now. Authorize ${rupee(DEPOSIT)} at the Zone before starting.`}
            </Text>
          </View>
        </Animated.View>

        {/* 4. Streamlined Payment Methods (UPI Grid + Full Rows) */}
        <Animated.View entering={cardEnter(3)} style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleCluster}>
              <View
                style={[styles.sectionIconWrap, { backgroundColor: '#DCFCE7' }]}
              >
                <Ionicons name="flash" size={16} color="#15803D" />
              </View>
              <View>
                <Text style={styles.sectionHeaderTitle}>Payment Method</Text>
                <Text style={styles.sectionHeaderSub}>
                  Instant UPI or saved instruments
                </Text>
              </View>
            </View>
          </View>

          {/* Express UPI 3-Tile Row */}
          <Text style={styles.subGroupLabel}>INSTANT UPI APPS</Text>
          <View style={styles.upiGridRow}>
            {[
              { id: 'gpay', label: 'Google Pay', tag: 'FASTEST' },
              { id: 'phonepe', label: 'PhonePe' },
              { id: 'paytm', label: 'Paytm' },
            ].map((upi) => {
              const active = method === upi.id;
              return (
                <Pressable
                  key={upi.id}
                  onPress={() => setMethod(upi.id)}
                  style={[styles.upiTile, active && styles.upiTileActive]}
                >
                  {upi.tag ? (
                    <View style={styles.upiTopMiniTag}>
                      <Text style={styles.upiTopMiniTagText}>{upi.tag}</Text>
                    </View>
                  ) : null}

                  <View style={styles.upiLogoCenter}>
                    {upi.id === 'gpay' && (
                      <View style={styles.gpayBadge}>
                        <Text style={styles.gpayG}>G</Text>
                        <Text style={styles.gpayPay}>Pay</Text>
                      </View>
                    )}
                    {upi.id === 'phonepe' && (
                      <View style={styles.phonepeBadge}>
                        <Text style={styles.phonepeText}>पे</Text>
                      </View>
                    )}
                    {upi.id === 'paytm' && (
                      <View style={styles.paytmBadge}>
                        <Text style={styles.paytmDark}>pay</Text>
                        <Text style={styles.paytmCyan}>tm</Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.upiTileLabel,
                      active && styles.upiTileLabelActive,
                    ]}
                  >
                    {upi.label}
                  </Text>

                  <View
                    style={[
                      styles.upiCheckCircle,
                      active && styles.upiCheckCircleActive,
                    ]}
                  >
                    {active ? (
                      <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Cards & Wallet List */}
          <Text style={[styles.subGroupLabel, { marginTop: 14 }]}>
            WALLET & CARDS
          </Text>
          <View style={styles.otherMethodsCol}>
            {[
              {
                id: 'wallet',
                name: 'Evegah Ride Wallet',
                sub: 'Available Balance: ₹850',
                badge: '1-TAP PAY',
              },
              {
                id: 'card',
                name: 'Credit / Debit Card',
                sub: 'Visa, Mastercard, RuPay supported',
              },
            ].map((item) => {
              const active = method === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setMethod(item.id)}
                  style={[
                    styles.altMethodRow,
                    active && styles.altMethodRowActive,
                  ]}
                >
                  <LinearGradient
                    colors={
                      item.id === 'wallet'
                        ? [BRAND_PURPLE, BRAND_PURPLE_LIGHT]
                        : ['#1E293B', '#334155']
                    }
                    style={styles.altMethodIcon}
                  >
                    <Ionicons
                      name={item.id === 'wallet' ? 'wallet' : 'card'}
                      size={16}
                      color="#FFFFFF"
                    />
                  </LinearGradient>

                  <View style={{ flex: 1 }}>
                    <View style={styles.altMethodTitleLine}>
                      <Text
                        style={[
                          styles.altMethodName,
                          active && { color: BRAND_PURPLE, fontWeight: '800' },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.badge ? (
                        <View style={styles.altBadgePill}>
                          <Text style={styles.altBadgeText}>{item.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.altMethodSub}>{item.sub}</Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      active && styles.radioCircleActive,
                    ]}
                  >
                    {active ? <View style={styles.radioInnerDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* 5. Receipt-Style Invoice Breakdown */}
        <Animated.View entering={cardEnter(4)} style={styles.sectionCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.sectionHeaderTitle}>Bill Summary</Text>
            <Text style={styles.gstTagText}>INCLUSIVE OF GST</Text>
          </View>

          <View style={styles.billItemsList}>
            <View style={styles.billLineItem}>
              <Text style={styles.billItemName}>
                Rental Fare ({days === 1 ? '1 Day' : `${days} Days`} @ {rupee(rate)}/day)
              </Text>
              <Text style={styles.billItemAmt}>{rupee(fare)}</Text>
            </View>

            {flexiEnabled ? (
              <View style={styles.billLineItem}>
                <Text style={styles.billItemName}>
                  Flexi Doorstep Delivery & Pickup
                </Text>
                <Text style={styles.billItemAmt}>{rupee(flexiFee)}</Text>
              </View>
            ) : null}

            {discount > 0 ? (
              <View style={styles.billLineItem}>
                <View style={styles.discountRowLabel}>
                  <Ionicons name="sparkles" size={13} color="#16A34A" />
                  <Text style={styles.discountLabelText}>
                    Promo Discount ({appliedCode})
                  </Text>
                </View>
                <Text style={styles.discountAmtText}>−{rupee(discount)}</Text>
              </View>
            ) : null}

            <View style={styles.billLineItem}>
              <Text style={styles.billItemName}>
                Refundable Security Deposit
              </Text>
              <Text
                style={[
                  styles.billItemAmt,
                  !deposit && { color: '#64748B', fontWeight: '600' },
                ]}
              >
                {deposit ? rupee(deposit) : 'Pay at Pickup'}
              </Text>
            </View>
          </View>

          <View style={styles.receiptDivider} />

          <View style={styles.netPayableRow}>
            <View>
              <Text style={styles.netPayableLabel}>Net Payable Today</Text>
              <Text style={styles.netPayableSub}>
                {depositWhen === 'now'
                  ? `Includes ₹${DEPOSIT} refundable deposit`
                  : `Excludes ₹${DEPOSIT} deposit due at pickup`}
              </Text>
            </View>
            <Text style={styles.netPayableValue}>{rupee(total)}</Text>
          </View>

          {discount > 0 ? (
            <View style={styles.savingsFooterBanner}>
              <Ionicons name="happy-outline" size={15} color="#15803D" />
              <Text style={styles.savingsFooterText}>
                Yay! You are saving {rupee(discount)} on this booking
              </Text>
            </View>
          ) : null}
        </Animated.View>

        {/* 6. Compact 2-Column Trust & Policy Strip */}
        <Animated.View entering={cardEnter(5)} style={styles.policyGrid}>
          <View style={styles.policyTile}>
            <View style={[styles.policyMiniIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="id-card-outline" size={16} color="#2563EB" />
            </View>
            <Text style={styles.policyTileTitle}>Quick KYC at Zone</Text>
            <Text style={styles.policyTileSub}>
              Bring Original Driving Licence & Gov ID at pickup.
            </Text>
          </View>

          <View style={styles.policyTile}>
            <View style={[styles.policyMiniIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="refresh-circle-outline" size={17} color="#D97706" />
            </View>
            <Text style={styles.policyTileTitle}>Free Cancellation</Text>
            <Text style={styles.policyTileSub}>
              100% refund up to 2 hrs before pickup time.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky Bottom Checkout Action Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <View style={styles.bottomPriceCol}>
          <View style={styles.payingViaChip}>
            <Text style={styles.payingViaText}>
              VIA {methodNames[method]?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.bottomPriceText}>{rupee(total)}</Text>
        </View>

        <Pressable
          onPress={handlePayPress}
          onPressIn={() => {
            btnScale.value = withSpring(0.96, { damping: 18, stiffness: 300 });
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
          style={styles.payCtaWrap}
        >
          <Animated.View style={[styles.payCtaTouch, btnStyle]}>
            <LinearGradient
              colors={['#4A168C', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payCtaGradient}
            >
              <Text style={styles.payCtaText}>Confirm & Pay</Text>
              <View style={styles.payCtaArrowCircle}>
                <Ionicons name="arrow-forward" size={16} color={BRAND_PURPLE} />
              </View>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>

      {/* Bottom Sheet Modal: Coupons */}
      <Modal
        visible={couponPopupOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setCouponPopupOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setCouponPopupOpen(false)}
          />

          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 22) },
            ]}
          >
            <View style={styles.modalGrabber} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Evegah Offers & Coupons</Text>
                <Text style={styles.modalSubtitle}>
                  Select a promo code to maximize your ride savings
                </Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => setCouponPopupOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#1E293B" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalListContent}
            >
              {couponsList.map((item) => {
                const open = expandedMap[item.id] !== false;
                const isCurrent = offerOn && appliedCode === item.code;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.modalCouponCard,
                      isCurrent && styles.modalCouponCardActive,
                    ]}
                  >
                    <View style={styles.modalCouponTopRow}>
                      <View style={styles.modalCodePill}>
                        <Ionicons
                          name="pricetag"
                          size={12}
                          color={BRAND_PURPLE}
                        />
                        <Text style={styles.modalCodePillText}>{item.code}</Text>
                      </View>

                      <Pressable
                        onPress={() => {
                          setAppliedCode(item.code);
                          setAppliedDiscountAmt(item.discount || 50);
                          setOfferOn(true);
                          setCouponPopupOpen(false);
                        }}
                        style={[
                          styles.modalApplyBtn,
                          isCurrent && styles.modalApplyBtnCurrent,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalApplyBtnText,
                            isCurrent && styles.modalApplyBtnTextCurrent,
                          ]}
                        >
                          {isCurrent ? 'APPLIED ✓' : 'APPLY'}
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={styles.modalCouponMainTitle}>{item.title}</Text>

                    <Pressable
                      onPress={() =>
                        setExpandedMap((prev) => ({
                          ...prev,
                          [item.id]: !open,
                        }))
                      }
                      style={styles.modalDetailsToggle}
                    >
                      <Text style={styles.modalDetailsToggleText}>
                        {open ? 'Hide details' : 'View offer terms'}
                      </Text>
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#64748B"
                      />
                    </Pressable>

                    {open ? (
                      <View style={styles.modalBulletsWrap}>
                        {item.bullets.map((b, idx) => (
                          <View key={idx} style={styles.modalBulletLine}>
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color="#10B981"
                            />
                            <Text style={styles.modalBulletText}>{b}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BRAND_SURFACE,
  },

  /* Hero Header */
  heroHeader: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
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
    letterSpacing: 0.2,
  },
  topBarSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    marginTop: 1,
  },
  secureBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  secureBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#A7F3D0',
  },

  /* Scroll Container */
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },

  /* Overlapping Boarding-Pass Hero Card */
  heroCard: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleMetaCol: {
    flex: 1,
    paddingRight: 12,
  },
  planTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  planPill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_PURPLE,
    letterSpacing: 0.5,
  },
  chargePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chargePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  vehicleName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  vehicleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  vehicleArtBox: {
    width: 78,
    height: 78,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleImg: {
    width: 68,
    height: 56,
  },

  /* Perforated Ticket Divider */
  ticketDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: -18,
  },
  notchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND_SURFACE,
    marginLeft: -8,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  notchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND_SURFACE,
    marginRight: -8,
  },

  /* Horizontal Route Journey */
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineStopBox: {
    flex: 1,
  },
  stopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  dotPickup: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_PURPLE,
  },
  dotDrop: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: BRAND_PURPLE,
    backgroundColor: '#FFFFFF',
  },
  stopTypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  stopStationName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  stopTimeText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  timelineArrowBridge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bridgeLine: {
    width: 12,
    height: 1.5,
    backgroundColor: '#DDD6FE',
  },
  bridgeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Voucher Card */
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  voucherCardApplied: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  voucherStubLeft: {
    marginRight: 12,
  },
  voucherIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherContentCol: {
    flex: 1,
  },
  voucherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voucherCodeTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  voucherSavedTag: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  voucherSavedTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  voucherSubText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  voucherActionCol: {
    marginLeft: 8,
  },
  voucherRemoveBtn: {
    fontSize: 11.5,
    fontWeight: '800',
    color: BRAND_PURPLE,
    letterSpacing: 0.4,
  },
  voucherBrowsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  voucherBrowseText: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_PURPLE,
  },

  /* Standard Section Card */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeaderSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  depositAmountBadge: {
    fontSize: 16,
    fontWeight: '900',
    color: BRAND_PURPLE,
  },

  /* Segment Control */
  segment: {
    height: 52,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    position: 'relative',
  },
  segmentMark: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTitleOn: {
    color: BRAND_PURPLE,
    fontWeight: '800',
  },
  segmentSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  segmentSubOn: {
    color: '#6D28D9',
    fontWeight: '600',
  },
  depositHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  depositHintText: {
    flex: 1,
    fontSize: 11.5,
    color: '#64748B',
  },

  /* Payment Methods - UPI Grid */
  subGroupLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  upiGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  upiTile: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  upiTileActive: {
    backgroundColor: '#FAF5FF',
    borderColor: BRAND_PURPLE,
  },
  upiTopMiniTag: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  upiTopMiniTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  upiLogoCenter: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  upiTileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  upiTileLabelActive: {
    color: BRAND_PURPLE,
    fontWeight: '800',
  },
  upiCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiCheckCircleActive: {
    backgroundColor: BRAND_PURPLE,
    borderColor: BRAND_PURPLE,
  },

  /* Branded Badges */
  gpayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gpayG: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4285F4',
    marginRight: 1,
  },
  gpayPay: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  phonepeBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#5F259F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonepeText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  paytmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paytmDark: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#002970',
  },
  paytmCyan: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#00BAF2',
  },

  /* Other Payment Rows */
  otherMethodsCol: {
    gap: 9,
  },
  altMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  altMethodRowActive: {
    borderColor: BRAND_PURPLE,
    backgroundColor: '#FAF5FF',
  },
  altMethodIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  altMethodTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  altMethodName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  altBadgePill: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  altBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: BRAND_PURPLE,
  },
  altMethodSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: BRAND_PURPLE,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_PURPLE,
  },

  /* Receipt Bill Breakdown */
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gstTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  billItemsList: {
    gap: 10,
  },
  billLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billItemName: {
    fontSize: 13.5,
    color: '#475569',
  },
  billItemAmt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountRowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountLabelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#16A34A',
  },
  discountAmtText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  netPayableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netPayableLabel: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  netPayableSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  netPayableValue: {
    fontSize: 22,
    fontWeight: '900',
    color: BRAND_PURPLE,
  },
  savingsFooterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 14,
  },
  savingsFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  /* 2-Col Policy Grid */
  policyGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  policyTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  policyMiniIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  policyTileTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  policyTileSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 15.5,
  },

  /* Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomPriceCol: {
    paddingRight: 16,
  },
  payingViaChip: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  payingViaText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  bottomPriceText: {
    fontSize: 23,
    fontWeight: '900',
    color: '#0F172A',
  },
  payCtaWrap: {
    flex: 1,
  },
  payCtaTouch: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: BRAND_PURPLE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  payCtaGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 10,
  },
  payCtaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  payCtaArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Coupon Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '82%',
  },
  modalGrabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalListContent: {
    gap: 12,
    paddingBottom: 20,
  },
  modalCouponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modalCouponCardActive: {
    borderColor: BRAND_PURPLE,
    backgroundColor: '#FAF5FF',
  },
  modalCouponTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
  },
  modalCodePillText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: BRAND_PURPLE,
    letterSpacing: 0.6,
  },
  modalApplyBtn: {
    backgroundColor: BRAND_PURPLE,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9,
  },
  modalApplyBtnCurrent: {
    backgroundColor: '#DCFCE7',
  },
  modalApplyBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalApplyBtnTextCurrent: {
    color: '#15803D',
  },
  modalCouponMainTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalDetailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  modalDetailsToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalBulletsWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  modalBulletLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalBulletText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
});