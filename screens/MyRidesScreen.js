import React, { useEffect, useState, useMemo } from 'react';
import {
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
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import { apiGet, last10, shortDate } from '../services/api';

const BRAND_PURPLE = '#240B4C';
const BRAND_PURPLE_ACCENT = '#5B21B6';
const BRAND_VIOLET = '#7C3AED';

const IMAGES = {
  mink: require('../assets/home/vehicle-mink.png'),
  city: require('../assets/home/vehicle-city.png'),
  fly: require('../assets/home/vehicle-fly.png'),
  pro: require('../assets/home/vehicle-pro.png'),
};

const CITY_SCOOTER_HERO = require('../assets/home/vehicle-city.png');
const EMPTY_ART = require('../assets/home/no-bookings.png');

function artFor(name) {
  const value = String(name || '').toLowerCase();
  if (value.includes('mink')) return { image: IMAGES.mink, tint: '#F5F3FF', line: 'Smooth city miles' };
  if (value.includes('City')) return { image: IMAGES.city, tint: '#F5F3FF', line: 'Power for every route' };
  if (value.includes('fly')) return { image: IMAGES.fly, tint: '#EEF2FF', line: 'Light for every day' };
  if (value.includes('pro')) return { image: IMAGES.pro, tint: '#FFF7ED', line: 'Built for longer rides' };
  return { image: IMAGES.city, tint: '#F5F3FF', line: 'Quiet across town' };
}

function rideStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status.includes('ongoing') || status.includes('active') || status.includes('start')) return ['ongoing', 'Ongoing'];
  if (status.includes('upcoming') || status.includes('confirm')) return ['upcoming', 'Upcoming'];
  return ['completed', 'Completed'];
}

function mapRide(item) {
  const [status, statusLabel] = rideStatus(item.status);
  const art = artFor(item.vehicle_model || item.evegah_model_name);
  return {
    id: item.reservation_id || item.id,
    status,
    statusLabel,
    vehicle: item.vehicle_model || item.evegah_model_name || 'Evegah City',
    line: art.line,
    tint: art.tint,
    image: art.image,
    pickup: item.pickup_zone || item.pickup_location || 'Gotri',
    drop: item.drop_zone || item.drop_location || item.pickup_zone || 'Manjalpur',
    pickupWhen: shortDate(item.start_date || item.pickup_date || item.created_at),
    dropWhen: shortDate(item.end_date || item.drop_date || item.created_at),
    distance: item.distance_km ? `${item.distance_km} km` : '—',
    battery: item.battery_pct != null ? `${Math.round(item.battery_pct)}%` : '—',
    plan: item.package_type || 'Standard',
    fare: Number(item.fare || item.total_amount || 0),
    deposit: Number(item.deposit_amount || item.security_deposit || 0),
    depositBack: String(item.deposit_status || '').toLowerCase().includes('return'),
    method: item.payment_method || 'UPI',
  };
}

const FILTERS = [
  { id: 'all', label: 'All Rides', icon: 'layers-outline' },
  { id: 'ongoing', label: 'Ongoing', icon: 'flash-outline' },
  { id: 'upcoming', label: 'Upcoming', icon: 'calendar-outline' },
  { id: 'completed', label: 'Completed', icon: 'checkmark-done-outline' },
];

const STATUS_THEME = {
  ongoing: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#059669',
    dot: '#10B981',
  },
  upcoming: {
    bg: '#F5F3FF',
    border: '#DDD6FE',
    text: '#6D28D9',
    dot: '#7C3AED',
  },
  completed: {
    bg: '#F1F5F9',
    border: '#E2E8F0',
    text: '#475569',
    dot: '#64748B',
  },
};

export default function MyRidesScreen({
  onOpenHome,
  onOpenScan,
  onOpenProfile,
  onOpenWallet,
  onOpenRide,
  phone,
}) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const mobile = last10(phone);
    if (!mobile) return;
    apiGet(`/reservations?mobile=${mobile}&limit=20`)
      .then((body) => {
        const list = body?.data || [];
        setRides(list.map(mapRide));
      })
      .catch(() => {});
  }, [phone]);

  const reset = () => {
    setFilter('all');
    setQuery('');
  };

  const needle = String(query || '').trim().toLowerCase();
  const visible = useMemo(() => {
    return rides.filter((ride) => {
      const statusOk = filter === 'all' || ride.status === filter;
      const text = `${ride.vehicle} ${ride.id} ${ride.pickup} ${ride.drop}`.toLowerCase();
      return statusOk && (!needle || text.includes(needle));
    });
  }, [rides, filter, needle]);

  const countFor = (id) =>
    id === 'all' ? rides.length : rides.filter((ride) => ride.status === id).length;

  const activeOrUpcomingCount = useMemo(
    () => rides.filter((r) => r.status === 'upcoming' || r.status === 'ongoing').length,
    [rides]
  );
  const completedCount = useMemo(
    () => rides.filter((r) => r.status === 'completed').length,
    [rides]
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Header */}
        <LinearGradient
          colors={['#120529', '#250952', '#3B0F7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroHeader, { paddingTop: insets.top + 14 }]}
        >
          {/* Ambient Background Glows */}
          <View style={styles.glowOrbTop} pointerEvents="none" />
          <View style={styles.glowOrbRight} pointerEvents="none" />

          {/* Top Bar */}
          <View style={styles.topHeaderRow}>
            <View style={styles.kickerPill}>
              <View style={styles.kickerLiveDot} />
              <Text style={styles.topKicker}>EVEGAH Rides</Text>
            </View>
            {visible.length > 0 && (
              <Pressable
                hitSlop={10}
                onPress={() => onOpenRide?.(visible[0])}
                style={styles.latestQuickBtn}
              >
                <Text style={styles.latestQuickText}>Latest Ride</Text>
                <Ionicons name="arrow-up-right-box-outline" size={14} color="#E9D5FF" />
              </Pressable>
            )}
          </View>

          {/* Hero Content + Scooter Artwork */}
          <View style={styles.heroMainRow}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Every ride,in {'\n'}one place.</Text>
              <Text style={styles.heroSubtitle}>
                Track routes, battery stats, invoices & security deposits.
              </Text>
            </View>

            <Image
              source={CITY_SCOOTER_HERO}
              style={styles.heroScooter}
              contentFit="contain"
            />
          </View>

          {/* Unified Glass Telemetry Strip */}
          <View style={styles.glassSummaryBar}>
            <Pressable
              onPress={() => setFilter('all')}
              style={styles.glassStatItem}
            >
              <Text style={styles.glassStatValue}>{rides.length}</Text>
              <Text style={styles.glassStatLabel}>Total Bookings</Text>
            </Pressable>

            <View style={styles.glassStatDivider} />

            <Pressable
              onPress={() => setFilter('upcoming')}
              style={styles.glassStatItem}
            >
              <View style={styles.glassStatValRow}>
                <Text style={[styles.glassStatValue, { color: '#DDD6FE' }]}>
                  {activeOrUpcomingCount}
                </Text>
                {activeOrUpcomingCount > 0 && <View style={styles.activePulseDot} />}
              </View>
              <Text style={styles.glassStatLabel}>Scheduled</Text>
            </Pressable>

            <View style={styles.glassStatDivider} />

            <Pressable
              onPress={() => setFilter('completed')}
              style={styles.glassStatItem}
            >
              <Text style={[styles.glassStatValue, { color: '#A7F3D0' }]}>
                {completedCount}
              </Text>
              <Text style={styles.glassStatLabel}>Completed</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Floating Search Bar overlapping the header bottom */}
        <View style={styles.floatingSearchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={19} color="#64748B" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by vehicle, zone or ID (e.g. EVG14)..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />
            {query.length > 0 ? (
              <Pressable hitSlop={10} onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={19} color="#94A3B8" />
              </Pressable>
            ) : (
              <View style={styles.searchShortcutBadge}>
                <Ionicons name="sparkles-outline" size={13} color={BRAND_VIOLET} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.bodyContainer}>
          {/* Filter Segmented Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTERS.map((item) => {
              const active = filter === item.id;
              const count = countFor(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={15}
                    color={active ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={[
                      styles.filterBadge,
                      active && styles.filterBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        active && styles.filterBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Section Header */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.listSectionTitle}>
              {filter === 'all' ? 'Recent Activity' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Rides`}
            </Text>
            {(filter !== 'all' || query.length > 0) && (
              <Pressable onPress={reset} hitSlop={8}>
                <Text style={styles.clearFilterLink}>Reset filters</Text>
              </Pressable>
            )}
          </View>

          {/* Ride Cards List */}
          <View style={styles.ridesList}>
            {visible.length > 0 ? (
              visible.map((ride, index) => {
                const theme = STATUS_THEME[ride.status] || STATUS_THEME.completed;

                return (
                  <Animated.View
                    key={ride.id}
                    entering={cardEnter(index)}
                    style={styles.rideCardOuter}
                  >
                    <Pressable
                      onPress={() => onOpenRide?.(ride)}
                      style={({ pressed }) => [
                        styles.rideCard,
                        pressed && styles.rideCardPressed,
                      ]}
                    >
                      {/* Top Strip: Booking ID + Plan Pill + Status Pill */}
                      <View style={styles.cardMetaTopRow}>
                        <View style={styles.bookingIdWrap}>
                          <Text style={styles.bookingIdText}>#{ride.id}</Text>
                          <View style={styles.metaDot} />
                          <Text style={styles.planTypeText}>{ride.plan}</Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: theme.bg, borderColor: theme.border },
                          ]}
                        >
                          <View
                            style={[styles.statusBadgeDot, { backgroundColor: theme.dot }]}
                          />
                          <Text style={[styles.statusBadgeText, { color: theme.text }]}>
                            {ride.statusLabel}
                          </Text>
                        </View>
                      </View>

                      {/* Main Vehicle Showcase Row */}
                      <View style={styles.vehicleRow}>
                        <View style={[styles.vehicleThumbBox, { backgroundColor: ride.tint }]}>
                          <Image
                            source={ride.image}
                            style={styles.vehicleThumbImg}
                            contentFit="contain"
                          />
                        </View>

                        <View style={styles.vehicleTitleCol}>
                          <Text style={styles.vehicleName} numberOfLines={1}>
                            {ride.vehicle}
                          </Text>
                          <Text style={styles.vehicleTagline} numberOfLines={1}>
                            {ride.line}
                          </Text>

                          {/* Mini Telemetry Specs */}
                          <View style={styles.telemetryPillsRow}>
                            <View style={styles.telemetryChip}>
                              <Ionicons name="time-outline" size={12} color="#64748B" />
                              <Text style={styles.telemetryChipText}>{ride.span}</Text>
                            </View>
                            <View style={styles.telemetryChip}>
                              <Ionicons name="navigate-outline" size={12} color="#64748B" />
                              <Text style={styles.telemetryChipText}>{ride.distance}</Text>
                            </View>
                            <View style={styles.telemetryChip}>
                              <Ionicons name="battery-charging-outline" size={12} color="#16A34A" />
                              <Text style={[styles.telemetryChipText, { color: '#15803D' }]}>
                                {ride.battery}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Route Box with Timestamps */}
                      <View style={styles.routeContainer}>
                        {/* Pickup Row */}
                        <View style={styles.routeStopRow}>
                          <View style={styles.routeNodeCol}>
                            <View style={styles.pickupDot} />
                            <View style={styles.routeVerticalLine} />
                          </View>
                          <View style={styles.routeStopContent}>
                            <View style={styles.routeStopTop}>
                              <Text style={styles.routeZoneLabel}>PICKUP</Text>
                              <Text style={styles.routeTimeText}>{ride.pickupWhen}</Text>
                            </View>
                            <Text style={styles.routeZoneName} numberOfLines={1}>
                              {ride.pickup}
                            </Text>
                          </View>
                        </View>

                        {/* Dropoff Row */}
                        <View style={styles.routeStopRow}>
                          <View style={styles.routeNodeCol}>
                            <View style={styles.dropSquare} />
                          </View>
                          <View style={[styles.routeStopContent, { paddingBottom: 0 }]}>
                            <View style={styles.routeStopTop}>
                              <Text style={styles.routeZoneLabel}>DROP-OFF</Text>
                              <Text style={styles.routeTimeText}>{ride.dropWhen}</Text>
                            </View>
                            <Text style={styles.routeZoneName} numberOfLines={1}>
                              {ride.drop}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Dashed Ticket Divider */}
                      <View style={styles.ticketDividerRow}>
                        <View style={styles.ticketCutoutLeft} />
                        <View style={styles.ticketDashedLine} />
                        <View style={styles.ticketCutoutRight} />
                      </View>

                      {/* Card Footer: Payment & Deposit Status + Total Fare */}
                      <View style={styles.cardFooter}>
                        <View style={styles.footerLeftCol}>
                          <View style={styles.paymentMethodBadge}>
                            <Ionicons name="card-outline" size={13} color="#475569" />
                            <Text style={styles.paymentMethodText}>{ride.method}</Text>
                          </View>
                          <View
                            style={[
                              styles.depositBadge,
                              ride.depositBack
                                ? styles.depositBadgeReturned
                                : styles.depositBadgeHeld,
                            ]}
                          >
                            <Ionicons
                              name={ride.depositBack ? 'shield-checkmark-outline' : 'lock-closed-outline'}
                              size={12}
                              color={ride.depositBack ? '#15803D' : '#B45309'}
                            />
                            <Text
                              style={[
                                styles.depositBadgeText,
                                { color: ride.depositBack ? '#15803D' : '#B45309' },
                              ]}
                            >
                              {ride.depositBack
                                ? 'Deposit Refunded'
                                : `₹${ride.deposit} Deposit`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.footerRightCol}>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.fareLabel}>Total Bill</Text>
                            <Text style={styles.fareAmount}>₹{ride.fare}</Text>
                          </View>
                          <View style={styles.cardArrowCircle}>
                            <Ionicons name="chevron-forward" size={16} color={BRAND_PURPLE_ACCENT} />
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            ) : (
              <Animated.View entering={cardEnter(0)} style={styles.emptyCard}>
                <View style={styles.emptyArtCircle}>
                  <Image source={EMPTY_ART} style={styles.emptyArt} contentFit="contain" />
                </View>
                <Text style={styles.emptyTitle}>
                  No {filter !== 'all' ? filter : ''} rides found
                </Text>
                <Text style={styles.emptySubtitle}>
                  We couldn't find any bookings matching your current filter or search criteria.
                </Text>
                <Pressable onPress={reset} style={styles.resetButton}>
                  <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.resetButtonText}>Show All Bookings</Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modern Docked Bottom Navigation */}
      <View style={[styles.tabBarWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.tabBar}>
          <Pressable style={styles.tabItem} onPress={onOpenHome}>
            <Ionicons name="home-outline" size={21} color="#94A3B8" />
            <Text style={styles.tabLabel}>Home</Text>
          </Pressable>

          <Pressable style={styles.tabItem}>
            <View style={styles.activeTabIndicator} />
            <Ionicons name="bicycle" size={22} color={BRAND_PURPLE_ACCENT} />
            <Text style={[styles.tabLabel, styles.tabLabelActive]}>My Rides</Text>
          </Pressable>

          <Pressable style={styles.scanTabItem} onPress={onOpenScan}>
            <LinearGradient
              colors={['#6D28D9', '#4C1D95']}
              style={styles.scanFloatingBtn}
            >
              <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.scanTabLabel}>Scan</Text>
          </Pressable>

          <Pressable style={styles.tabItem} onPress={onOpenWallet}>
            <Ionicons name="wallet-outline" size={21} color="#94A3B8" />
            <Text style={styles.tabLabel}>Wallet</Text>
          </Pressable>

          <Pressable style={styles.tabItem} onPress={onOpenProfile}>
            <Ionicons name="person-outline" size={21} color="#94A3B8" />
            <Text style={styles.tabLabel}>Profile</Text>
          </Pressable>
        </View>
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
    paddingBottom: 115,
  },

  /* Hero Header */
  heroHeader: {
    paddingHorizontal: 20,
    paddingBottom: 42,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  glowOrbTop: {
    position: 'absolute',
    top: -70,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },
  glowOrbRight: {
    position: 'absolute',
    bottom: -30,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  kickerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
    marginRight: 6,
  },
  topKicker: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#F3E8FF',
    letterSpacing: 1.1,
  },
  latestQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
  },
  latestQuickText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E9D5FF',
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.74)',
    lineHeight: 19,
  },
  heroScooter: {
    width: 142,
    height: 138,
    marginRight: -10,
  },

  /* Glass Summary Telemetry Bar */
  glassSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 13,
    paddingHorizontal: 8,
  },
  glassStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  glassStatValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  glassStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  activePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#A78BFA',
  },
  glassStatLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
  },
  glassStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },

  /* Floating Search Bar */
  floatingSearchWrap: {
    paddingHorizontal: 16,
    marginTop: -24,
    zIndex: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  searchShortcutBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Body Container */
  bodyContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  /* Filter Pills */
  filterScroll: {
    gap: 8,
    paddingBottom: 18,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: BRAND_PURPLE,
    borderColor: BRAND_PURPLE,
    shadowColor: BRAND_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6.5,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },

  /* List Section Header */
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  clearFilterLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: BRAND_VIOLET,
  },

  /* Ride Cards */
  ridesList: {
    gap: 16,
  },
  rideCardOuter: {
    borderRadius: 24,
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  rideCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.992 }],
  },

  /* Card Top Meta Row */
  cardMetaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookingIdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  metaDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 7,
  },
  planTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_VIOLET,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* Vehicle Showcase Row */
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  vehicleThumbBox: {
    width: 74,
    height: 74,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  vehicleThumbImg: {
    width: 64,
    height: 56,
  },
  vehicleTitleCol: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 17.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  vehicleTagline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
    marginBottom: 8,
  },
  telemetryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  telemetryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  telemetryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  /* Route Container */
  routeContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  routeStopRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  routeNodeCol: {
    width: 18,
    alignItems: 'center',
    marginRight: 8,
    paddingTop: 3,
  },
  pickupDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: BRAND_VIOLET,
  },
  routeVerticalLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#DDD6FE',
    marginVertical: 3,
  },
  dropSquare: {
    width: 9,
    height: 9,
    borderRadius: 2.5,
    borderWidth: 2,
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  routeStopContent: {
    flex: 1,
    paddingBottom: 10,
  },
  routeStopTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  routeZoneLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  routeTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  routeZoneName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },

  /* Ticket Cutout Divider */
  ticketDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    marginHorizontal: -16,
  },
  ticketCutoutLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F4F6FB',
    marginLeft: -8,
    borderWidth: 1,
    borderColor: '#E8EDF5',
  },
  ticketDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  ticketCutoutRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F4F6FB',
    marginRight: -8,
    borderWidth: 1,
    borderColor: '#E8EDF5',
  },

  /* Card Footer */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  depositBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  depositBadgeReturned: {
    backgroundColor: '#DCFCE7',
  },
  depositBadgeHeld: {
    backgroundColor: '#FEF3C7',
  },
  depositBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footerRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  fareAmount: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Empty State */
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 38,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyArtCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyArt: {
    width: 115,
    height: 115,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  resetButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND_PURPLE_ACCENT,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 16,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Bottom Navigation Dock */
  tabBarWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  activeTabIndicator: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: BRAND_PURPLE_ACCENT,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  tabLabelActive: {
    color: BRAND_PURPLE_ACCENT,
    fontWeight: '800',
  },
  scanTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFloatingBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: BRAND_PURPLE_ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  scanTabLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 3,
  },
});