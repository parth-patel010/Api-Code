import React, { useEffect, useRef, useState } from 'react';
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
import MapView, { Circle, Marker, Polyline, UrlTile } from 'react-native-maps';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiGet } from '../services/api';

const BRAND_PURPLE = '#4A168C';
const BRAND_PURPLE_LIGHT = '#7C3AED';
const DARK_NAVY = '#0F172A';

const PLACES = {
  Bill: { latitude: 22.2587, longitude: 73.1496 },
  Gotri: { latitude: 22.3106, longitude: 73.1248 },
  Alkapuri: { latitude: 22.3106, longitude: 73.1726 },
  Manjalpur: { latitude: 22.2705, longitude: 73.1889 },
  Aatapi: { latitude: 22.3488, longitude: 73.1612 },
  KPGU: { latitude: 22.3694, longitude: 73.1086 },
};

const RIDE_MODES = [
  { id: 'eco', label: 'Eco', fullLabel: 'Eco Mode', baseSpeed: 19, rangeKm: 72, icon: 'leaf' },
  { id: 'city', label: 'City', fullLabel: 'City Mode', baseSpeed: 27, rangeKm: 58, icon: 'flash' },
  { id: 'sport', label: 'Sport', fullLabel: 'Sport Mode', baseSpeed: 36, rangeKm: 46, icon: 'rocket' },
];

const EXTEND_OPTIONS = [
  { id: '2h', label: '+2 Hours', sub: 'Quick city errand extension', hours: 2, price: 39, tag: 'Quick' },
  { id: '6h', label: '+6 Hours', sub: 'Half-day shift extension', hours: 6, price: 79, tag: 'Popular' },
  { id: '1d', label: '+1 Day (24 hrs)', sub: 'Full 24-hour package extension', hours: 24, price: 119, tag: 'Best Value' },
  { id: '3d', label: '+3 Days', sub: 'Multi-day commuter extension', hours: 72, price: 329, tag: 'Save 12%' },
  { id: '7d', label: '+7 Days (Weekly)', sub: 'Weekly fleet saver pack', hours: 168, price: 699, tag: 'Super Saver' },
];

function placeFor(name) {
  const key = Object.keys(PLACES).find((item) =>
    String(name || '').toLowerCase().includes(item.toLowerCase())
  );
  return PLACES[key] || PLACES.Bill;
}

function buildRouteWaypoints(from) {
  return [
    from,
    { latitude: from.latitude + 0.0022, longitude: from.longitude - 0.0014 },
    { latitude: from.latitude + 0.0046, longitude: from.longitude + 0.0008 },
    { latitude: from.latitude + 0.0068, longitude: from.longitude + 0.0028 },
    { latitude: from.latitude + 0.0085, longitude: from.longitude + 0.0042 },
  ];
}

function clock(total) {
  const safe = Math.max(0, total);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function formatDropTimeOnly(ms) {
  if (!ms) return '8:00 AM';
  const d = new Date(ms);
  return d
    .toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase();
}

function formatDropDate(ms) {
  if (!ms) return 'Scheduled';
  const d = new Date(ms);
  return `${d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })} · ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
}

function getTopDownVehicleAsset(name) {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('city')) return require('../assets/home/city-top.png');
  if (lower.includes('fly')) return require('../assets/home/fly-top.png');
  if (lower.includes('pro')) return require('../assets/home/pro-top.png');
  return require('../assets/home/mink-top.png');
}

export default function RideScreen({
  vehicle,
  trip,
  receipt,
  onBack,
  onExtendRide,
  onEnd,
}) {
  const insets = useSafeAreaInsets();
  const [seconds, setSeconds] = useState(1);
  const [rideMode, setRideMode] = useState('city');
  const [pausedLock, setPausedLock] = useState(false);
  const [hazardOn, setHazardOn] = useState(false);
  const [quickToast, setQuickToast] = useState(null);
  const [extraMs, setExtraMs] = useState(0);
  const [extraFareTotal, setExtraFareTotal] = useState(0);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedExtendId, setSelectedExtendId] = useState('1d');
  const [extendBanner, setExtendBanner] = useState(null);

  // BMS Live Telemetry & Auto Scan State
  const [bmsStatus, setBmsStatus] = useState('connected');
  const [bmsSoc, setBmsSoc] = useState(86);
  const [bmsBatteryId, setBmsBatteryId] = useState('EVG-B42');
  const [bmsTemp, setBmsTemp] = useState(32);
  const [bmsVoltage, setBmsVoltage] = useState(54.2);
  const [bmsDetailOpen, setBmsDetailOpen] = useState(false);

  const mapRef = useRef(null);
  const btnScale = useSharedValue(1);
  const scanSpin = useSharedValue(0);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const scanSpinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scanSpin.value}deg` }],
  }));

  const triggerQuickAction = (msg) => {
    setQuickToast(msg);
    setTimeout(() => {
      setQuickToast((prev) => (prev === msg ? null : prev));
    }, 2300);
  };

  // Auto scan BMS logic on mount or user tap
  const runAutoScanBms = () => {
    setBmsStatus('scanning');
    scanSpin.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );
    triggerQuickAction('Scanning Bluetooth BLE & CAN bus for BMS...');

    setTimeout(() => {
      setBmsStatus('connecting');
      apiGet('/batteries/stats')
        .then((body) => {
          const liveSoc = body?.avg_soc ? Math.round(body.avg_soc) : 88;
          setBmsSoc(liveSoc);
        })
        .catch(() => {});

      apiGet('/batteries')
        .then((rows) => {
          if (Array.isArray(rows) && rows.length > 0) {
            const first = rows[0];
            if (first.battery_id) setBmsBatteryId(first.battery_id);
            if (first.soc) setBmsSoc(Math.round(Number(first.soc)));
            if (first.voltage) setBmsVoltage(Number(first.voltage));
            if (first.temperature) setBmsTemp(Number(first.temperature));
          }
        })
        .catch(() => {});

      setTimeout(() => {
        setBmsStatus('connected');
        scanSpin.value = 0;
        triggerQuickAction(`BMS Synced · Live SOC: ${bmsSoc}% (${bmsBatteryId})`);
      }, 900);
    }, 1200);
  };

  useEffect(() => {
    runAutoScanBms();
  }, []);

  const startCoord = placeFor(trip?.pickupName);
  const waypoints = buildRouteWaypoints(startCoord);
  const progress = Math.min(0.88, 0.42 + (seconds % 90) * 0.005);
  const segCount = waypoints.length - 1;
  const exactIdx = progress * segCount;
  const segIdx = Math.min(segCount - 1, Math.floor(exactIdx));
  const segFrac = exactIdx - segIdx;
  const pA = waypoints[segIdx];
  const pB = waypoints[segIdx + 1];
  const position = {
    latitude: pA.latitude + (pB.latitude - pA.latitude) * segFrac,
    longitude: pA.longitude + (pB.longitude - pA.longitude) * segFrac,
  };
  const midCalloutCoord = waypoints[2];

  const baseDropAt = trip?.dropAt || Date.now() + 24 * 3600 * 1000;
  const effectiveDropAt = baseDropAt + extraMs;
  const bookingIdText = receipt?.bookingId || 'EVG39745433';

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((value) => (pausedLock ? value : value + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [pausedLock]);

  const activeModeObj =
    RIDE_MODES.find((m) => m.id === rideMode) || RIDE_MODES[1];
  const speed = pausedLock
    ? 0
    : activeModeObj.baseSpeed + Math.round(2 * Math.sin(seconds / 5));
  const distance = (seconds / 3600) * 22;
  const chosenOption =
    EXTEND_OPTIONS.find((item) => item.id === selectedExtendId) ||
    EXTEND_OPTIONS[2];
  const previewNewDropAt = effectiveDropAt + chosenOption.hours * 3600 * 1000;

  const selectRideMode = (modeObj) => {
    setRideMode(modeObj.id);
    triggerQuickAction(`Switched to ${modeObj.fullLabel} (${modeObj.rangeKm} km est.)`);
  };

  const handleConfirmExtend = () => {
    const addedMs = chosenOption.hours * 3600 * 1000;
    const nextExtraMs = extraMs + addedMs;
    const nextExtraFare = extraFareTotal + chosenOption.price;
    setExtraMs(nextExtraMs);
    setExtraFareTotal(nextExtraFare);
    setExtendModalOpen(false);
    setExtendBanner({
      label: chosenOption.label,
      newDropText: formatDropDate(baseDropAt + nextExtraMs),
      price: chosenOption.price,
    });
    onExtendRide?.({
      addedHours: chosenOption.hours,
      addedPrice: chosenOption.price,
      newDropAt: baseDropAt + nextExtraMs,
    });
  };

  const recenterMap = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: (startCoord.latitude + position.latitude) / 2,
        longitude: (startCoord.longitude + position.longitude) / 2,
        latitudeDelta: 0.014,
        longitudeDelta: 0.014,
      },
      450
    );
  };

  const socColor =
    bmsSoc < 20 ? '#EF4444' : bmsSoc < 40 ? '#F59E0B' : '#10B981';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Full-Bleed Map Viewport */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          mapType="none"
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: (startCoord.latitude + position.latitude) / 2,
            longitude: (startCoord.longitude + position.longitude) / 2,
            latitudeDelta: 0.014,
            longitudeDelta: 0.014,
          }}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          showsCompass={false}
          loadingBackgroundColor="#E2E8F0"
        >
          <UrlTile
            urlTemplate="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />

          {/* Origin Zone Zone Halo */}
          <Circle
            center={startCoord}
            radius={90}
            fillColor="rgba(16, 185, 129, 0.16)"
            strokeColor="rgba(16, 185, 129, 0.4)"
            strokeWidth={1.5}
          />

          {/* Active Route Polyline */}
          <Polyline
            coordinates={waypoints}
            strokeColor={BRAND_PURPLE}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />

          {/* Origin Zone Pin */}
          <Marker coordinate={startCoord} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.originMarkerOuter}>
              <View style={styles.originMarkerInner} />
            </View>
          </Marker>

          {/* Mid-Route Turn Navigation Pill */}
          <Marker coordinate={midCalloutCoord} anchor={{ x: 0.5, y: 1.15 }}>
            <View style={styles.routeCalloutBubble}>
              <LinearGradient
                colors={[BRAND_PURPLE, BRAND_PURPLE_LIGHT]}
                style={styles.routeCalloutIconWrap}
              >
                <Ionicons name="navigate" size={12} color="#FFFFFF" />
              </LinearGradient>
              <View>
                <Text style={styles.routeCalloutDist}>2.3 km to Drop</Text>
                <Text style={styles.routeCalloutTime}>~8 mins via Gotri Rd</Text>
              </View>
            </View>
          </Marker>

          {/* Rider Live Pulse Halo */}
          <Circle
            center={position}
            radius={75}
            fillColor="rgba(124, 58, 237, 0.14)"
            strokeColor="rgba(124, 58, 237, 0.32)"
            strokeWidth={1.5}
          />

          {/* Top-Down 3D Scooter Marker */}
          <Marker coordinate={position} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.scooterMarkerWrap}>
              <View style={styles.scooterMarkerHalo} />
              <Image
                source={getTopDownVehicleAsset(vehicle?.name)}
                style={styles.scooterMarkerImg}
                contentFit="contain"
              />
            </View>
          </Marker>
        </MapView>

        {/* Subtle Map Attribution */}
        <View style={styles.osmBadge}>
          <Text style={styles.osmBadgeText}>Leaflet · © OpenStreetMap</Text>
        </View>

        {/* Top Floating Cockpit HUD Bar */}
        <View style={[styles.topHudBar, { top: insets.top + 8 }]}>
          <Pressable hitSlop={10} style={styles.hudCircleBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={21} color={DARK_NAVY} />
          </Pressable>

          <Pressable
            style={styles.hudCenterPill}
            onPress={() =>
              triggerQuickAction(
                `Active Zone: ${trip?.pickupName || 'Bill Zone'} · Support 1800 889 8791`
              )
            }
          >
            <View
              style={[
                styles.hudLiveBadge,
                pausedLock && { backgroundColor: '#FEF3C7' },
              ]}
            >
              <View
                style={[
                  styles.hudPulseDot,
                  pausedLock && { backgroundColor: '#D97706' },
                ]}
              />
              <Text
                style={[
                  styles.hudLiveBadgeText,
                  pausedLock && { color: '#B45309' },
                ]}
              >
                {pausedLock ? 'PAUSED' : 'LIVE'}
              </Text>
            </View>
            <Text style={styles.hudBookingId}>{bookingIdText}</Text>
            <Ionicons name="chevron-down" size={14} color="#64748B" />
          </Pressable>

          <Pressable
            hitSlop={10}
            style={styles.hudSosBtn}
            onPress={() => Linking.openURL('tel:18008898791')}
          >
            <Ionicons name="call" size={15} color="#E11D48" />
            <Text style={styles.hudSosText}>SOS</Text>
          </Pressable>
        </View>

        {/* Floating Map Action Stack (Right Side) */}
        <View style={styles.mapRightStack}>
          <Pressable style={styles.mapToolBtn} onPress={recenterMap}>
            <Ionicons name="locate" size={20} color={BRAND_PURPLE} />
          </Pressable>
          <Pressable
            style={styles.mapToolBtn}
            onPress={() =>
              triggerQuickAction(
                `Routing to ${trip?.dropName || 'Bill Zone, Vadodara'}`
              )
            }
          >
            <Ionicons name="compass-outline" size={21} color={BRAND_PURPLE} />
          </Pressable>
        </View>

        {/* Extended Ride Banner */}
        {extendBanner ? (
          <Animated.View
            entering={FadeInDown.duration(260)}
            style={[styles.extendBannerCard, { top: insets.top + 62 }]}
          >
            <View style={styles.extendBannerIcon}>
              <Ionicons name="checkmark-sharp" size={15} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.extendBannerTitle}>
                Extended by {extendBanner.label} (+₹{extendBanner.price})
              </Text>
              <Text style={styles.extendBannerSub}>
                New drop: {extendBanner.newDropText}
              </Text>
            </View>
            <Pressable hitSlop={8} onPress={() => setExtendBanner(null)}>
              <Ionicons name="close" size={17} color="#065F46" />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Floating Telemetry Toast Pill */}
        {quickToast ? (
          <Animated.View
            entering={FadeInDown.duration(220)}
            style={[styles.toastPill, { top: insets.top + 62 }]}
          >
            <View style={styles.toastIconPulse}>
              <Ionicons name="radio" size={13} color="#A7F3D0" />
            </View>
            <Text style={styles.toastText} numberOfLines={1}>
              {quickToast}
            </Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Bottom Ride Control Deck Sheet */}
      <View
        style={[
          styles.deckSheet,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <View style={styles.sheetGrabber} />

        {/* 1. Vehicle Identity & Mode Switcher Header */}
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleAvatarBox}>
            <Image
              source={
                vehicle?.image || require('../assets/vehicles/mink-left.png')
              }
              style={styles.vehicleAvatarImg}
              contentFit="contain"
            />
          </View>

          <View style={styles.vehicleTitleCol}>
            <View style={styles.vehicleNameLine}>
              <Text style={styles.vehicleName} numberOfLines={1}>
                {vehicle?.name || 'Evegah Mink'}
              </Text>
              <View style={styles.iotVerifiedChip}>
                <Ionicons name="Hardware-chip-outline" size={11} color={BRAND_PURPLE} />
                <Text style={styles.iotVerifiedText}>IoT Connected</Text>
              </View>
            </View>
            <Text style={styles.vehicleRouteSub} numberOfLines={1}>
              {trip?.pickupName || 'Gotri Zone'} → {trip?.dropName || 'Bill Zone'}
            </Text>
          </View>

          {/* Compact 3-Mode Pill Switcher */}
          <View style={styles.modeSegmentWrap}>
            {RIDE_MODES.map((m) => {
              const active = m.id === rideMode;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => selectRideMode(m)}
                  style={[
                    styles.modeMiniBtn,
                    active && styles.modeMiniBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeMiniBtnText,
                      active && styles.modeMiniBtnTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 2. Dark-Violet EV Speedometer & Telemetry Cockpit Banner */}
        <LinearGradient
          colors={['#130526', '#28094E', '#3D1073']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cockpitCluster}
        >
          {/* Left: Elapsed Duration */}
          <View style={styles.cockpitSideCol}>
            <View style={styles.cockpitLabelRow}>
              <Ionicons name="time-outline" size={12} color="#C4B5FD" />
              <Text style={styles.cockpitKicker}>DURATION</Text>
            </View>
            <Text style={styles.cockpitSideValue}>{clock(seconds)}</Text>
            <Text style={styles.cockpitSideSub}>
              {pausedLock ? 'Motor Locked' : 'Active Timer'}
            </Text>
          </View>

          <View style={styles.cockpitVerticalDivider} />

          {/* Center: Prominent Speedometer */}
          <View style={styles.cockpitCenterCol}>
            <Text style={styles.speedHeroNumber}>{speed}</Text>
            <Text style={styles.speedHeroUnit}>KM/H · {activeModeObj.label.toUpperCase()}</Text>
          </View>

          <View style={styles.cockpitVerticalDivider} />

          {/* Right: Trip Distance */}
          <View style={[styles.cockpitSideCol, { alignItems: 'flex-end' }]}>
            <View style={styles.cockpitLabelRow}>
              <Text style={styles.cockpitKicker}>DISTANCE</Text>
              <Ionicons name="Analytics-outline" size={12} color="#C4B5FD" />
            </View>
            <Text style={styles.cockpitSideValue}>
              {distance.toFixed(1)} <Text style={styles.cockpitSmallUnit}>km</Text>
            </Text>
            <Text style={styles.cockpitSideSub}>
              Est. {activeModeObj.rangeKm} km range
            </Text>
          </View>
        </LinearGradient>

        {/* 3. BMS Telemetry Card + Drop Schedule Card */}
        <View style={styles.cardsTwoCol}>
          {/* Live BMS Battery Card */}
          <Pressable
            onPress={() => setBmsDetailOpen(true)}
            style={styles.bmsCard}
          >
            <View style={styles.bmsCardHeader}>
              <View style={styles.bmsLabelCluster}>
                <View
                  style={[
                    styles.bmsDotIndicator,
                    { backgroundColor: socColor },
                  ]}
                />
                <Text style={styles.cardSmallTitle}>BMS PACK</Text>
              </View>

              <Pressable
                hitSlop={8}
                onPress={(e) => {
                  e.stopPropagation();
                  runAutoScanBms();
                }}
                style={[
                  styles.bmsSyncChip,
                  bmsStatus === 'connected' && styles.bmsSyncChipConnected,
                ]}
              >
                <Animated.View
                  style={bmsStatus === 'scanning' ? scanSpinStyle : null}
                >
                  <Ionicons
                    name={
                      bmsStatus === 'scanning'
                        ? 'sync'
                        : bmsStatus === 'connected'
                        ? 'bluetooth'
                        : 'refresh'
                    }
                    size={11}
                    color={bmsStatus === 'connected' ? BRAND_PURPLE : '#2563EB'}
                  />
                </Animated.View>
                <Text
                  style={[
                    styles.bmsSyncChipText,
                    bmsStatus === 'connected' && { color: BRAND_PURPLE },
                  ]}
                >
                  {bmsStatus === 'scanning'
                    ? 'Scan...'
                    : bmsStatus === 'connecting'
                    ? 'Sync...'
                    : 'Synced'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.bmsMainReadoutRow}>
              <Text style={[styles.bmsBigPercent, { color: socColor }]}>
                {bmsSoc}%
              </Text>
              <Text style={styles.bmsRangeMeta}>
                ~{activeModeObj.rangeKm} km · {bmsVoltage}V
              </Text>
            </View>

            {/* 5-Cell Segmented Battery Bar */}
            <View style={styles.segmentedBarRow}>
              {[20, 40, 60, 80, 100].map((threshold, idx) => {
                const filled = bmsSoc >= threshold - 12;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.batteryCellSegment,
                      filled && { backgroundColor: socColor },
                    ]}
                  />
                );
              })}
            </View>
          </Pressable>

          {/* Drop By Schedule Card */}
          <Pressable
            onPress={() => setExtendModalOpen(true)}
            style={styles.dropScheduleCard}
          >
            <View style={styles.bmsCardHeader}>
              <View style={styles.bmsLabelCluster}>
                <Ionicons name="time" size={13} color={BRAND_PURPLE} />
                <Text style={styles.cardSmallTitle}>RETURN BY</Text>
              </View>
              <View style={styles.extendMiniTag}>
                <Text style={styles.extendMiniTagText}>+EXTEND</Text>
              </View>
            </View>

            <Text style={styles.dropBigTime}>
              {formatDropTimeOnly(effectiveDropAt)}
            </Text>

            <Text style={styles.dropZoneSubText} numberOfLines={1}>
              {extraFareTotal > 0
                ? `Extended (+₹${extraFareTotal})`
                : `At ${trip?.dropName || 'Bill Zone'}`}
            </Text>
          </Pressable>
        </View>

        {/* 4. Quick Hardware Controls (Pause Immobilizer | Beep EV | Hazard) */}
        <View style={styles.hardwareControlsRow}>
          <Pressable
            onPress={() => {
              const next = !pausedLock;
              setPausedLock(next);
              triggerQuickAction(
                next
                  ? 'Immobilizer Engaged — Rear Wheel Locked'
                  : 'Immobilizer Released — Ready to Ride'
              );
            }}
            style={[
              styles.hwSwitchBtn,
              pausedLock && styles.hwSwitchBtnActiveAmber,
            ]}
          >
            <View
              style={[
                styles.hwIconCircle,
                pausedLock && { backgroundColor: '#FEF3C7' },
              ]}
            >
              <Ionicons
                name={pausedLock ? 'lock-open' : 'pause'}
                size={15}
                color={pausedLock ? '#D97706' : '#334155'}
              />
            </View>
            <View>
              <Text
                style={[
                  styles.hwSwitchTitle,
                  pausedLock && { color: '#B45309' },
                ]}
              >
                {pausedLock ? 'Resume' : 'Pause'}
              </Text>
              <Text style={styles.hwSwitchSub}>
                {pausedLock ? 'Locked' : 'Lock EV'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() =>
              triggerQuickAction('BEEP! Horn & Turn Indicators Flashed')
            }
            style={styles.hwSwitchBtn}
          >
            <View style={styles.hwIconCircle}>
              <Ionicons name="volume-high" size={16} color={BRAND_PURPLE} />
            </View>
            <View>
              <Text style={styles.hwSwitchTitle}>Beep EV</Text>
              <Text style={styles.hwSwitchSub}>Find Ride</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              const next = !hazardOn;
              setHazardOn(next);
              triggerQuickAction(
                next ? 'Hazard Lights Flashing' : 'Hazard Lights Turned Off'
              );
            }}
            style={[
              styles.hwSwitchBtn,
              hazardOn && styles.hwSwitchBtnActiveRose,
            ]}
          >
            <View
              style={[
                styles.hwIconCircle,
                { backgroundColor: '#FFE4E6' },
              ]}
            >
              <Ionicons name="warning" size={15} color="#E11D48" />
            </View>
            <View>
              <Text
                style={[
                  styles.hwSwitchTitle,
                  { color: '#E11D48' },
                ]}
              >
                Hazard
              </Text>
              <Text style={styles.hwSwitchSub}>
                {hazardOn ? 'Blinking' : 'Blinkers'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 5. Primary Bottom CTA Row (Extend Ride + End Ride) */}
        <View style={styles.primaryCtaRow}>
          <Pressable
            onPress={() => setExtendModalOpen(true)}
            style={({ pressed }) => [
              styles.secondaryExtendBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="add-circle" size={18} color={BRAND_PURPLE} />
            <Text style={styles.secondaryExtendBtnText}>Extend Ride</Text>
          </Pressable>

          <Animated.View style={[styles.primaryEndBtnWrap, btnStyle]}>
            <Pressable
              onPressIn={() => {
                btnScale.value = withSpring(0.96, {
                  damping: 16,
                  stiffness: 280,
                });
              }}
              onPressOut={() => {
                btnScale.value = withSpring(1, {
                  damping: 16,
                  stiffness: 280,
                });
              }}
              onPress={() => {
                onEnd?.({
                  elapsed: clock(seconds),
                  distance: ((seconds / 3600) * 22).toFixed(1),
                });
              }}
              style={styles.primaryEndTouch}
            >
              <LinearGradient
                colors={[BRAND_PURPLE, '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryEndGradient}
              >
                <Text style={styles.primaryEndText}>End & Lock Ride</Text>
                <View style={styles.primaryEndIconPill}>
                  <Ionicons
                    name="lock-closed"
                    size={14}
                    color={BRAND_PURPLE}
                  />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* Modal 1: Extend Ride Bottom Sheet */}
      <Modal
        visible={extendModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setExtendModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setExtendModalOpen(false)}
          />

          <View
            style={[
              styles.modalSheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.sheetGrabber} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Extend Your EV Rental</Text>
                <Text style={styles.modalSubtitle}>
                  Instant top-up without visiting the Zone
                </Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => setExtendModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#334155" />
              </Pressable>
            </View>

            {/* Drop Schedule Comparison Banner */}
            <View style={styles.scheduleBridgeCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleKicker}>CURRENT DROP</Text>
                <Text style={styles.scheduleTimeVal}>
                  {formatDropDate(effectiveDropAt)}
                </Text>
              </View>

              <View style={styles.scheduleArrowCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={BRAND_PURPLE}
                />
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={[styles.scheduleKicker, { color: BRAND_PURPLE }]}>
                  NEW DROP TIME
                </Text>
                <Text
                  style={[styles.scheduleTimeVal, { color: BRAND_PURPLE }]}
                >
                  {formatDropDate(previewNewDropAt)}
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.extendOptionsScroll}
            >
              {EXTEND_OPTIONS.map((opt) => {
                const active = opt.id === selectedExtendId;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setSelectedExtendId(opt.id)}
                    style={[
                      styles.extendOptionCard,
                      active && styles.extendOptionCardActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        active && styles.radioOuterActive,
                      ]}
                    >
                      {active ? <View style={styles.radioInner} /> : null}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.extendOptTitleRow}>
                        <Text
                          style={[
                            styles.extendOptLabel,
                            active && { color: BRAND_PURPLE },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <View
                          style={[
                            styles.extendOptTag,
                            active && styles.extendOptTagActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.extendOptTagText,
                              active && { color: '#FFFFFF' },
                            ]}
                          >
                            {opt.tag}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.extendOptSub}>{opt.sub}</Text>
                    </View>

                    <Text
                      style={[
                        styles.extendOptPrice,
                        active && { color: BRAND_PURPLE },
                      ]}
                    >
                      ₹{opt.price}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={handleConfirmExtend}
              style={styles.confirmExtendCta}
            >
              <Text style={styles.confirmExtendCtaText}>
                Confirm Extension · ₹{chosenOption.price}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Live BMS Diagnostic Telemetry Sheet */}
      <Modal
        visible={bmsDetailOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setBmsDetailOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setBmsDetailOpen(false)}
          />
          <View
            style={[
              styles.bmsModalSheet,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <View style={styles.sheetGrabber} />

            <View style={styles.bmsModalHeader}>
              <View style={styles.bmsModalTitleCluster}>
                <LinearGradient
                  colors={[BRAND_PURPLE, BRAND_PURPLE_LIGHT]}
                  style={styles.bmsModalIconBox}
                >
                  <Ionicons name="hardware-chip" size={19} color="#FFFFFF" />
                </LinearGradient>
                <View>
                  <Text style={styles.modalTitle}>Smart BMS Diagnostics</Text>
                  <Text style={styles.modalSubtitle}>
                    Pack ID: {bmsBatteryId} · CAN Bus Telemetry
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setBmsDetailOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#334155" />
              </Pressable>
            </View>

            {/* 4-Tile Diagnostic Telemetry Grid */}
            <View style={styles.bmsMetricsGrid}>
              <View style={styles.bmsDiagTile}>
                <Text style={styles.bmsDiagKicker}>STATE OF CHARGE</Text>
                <Text style={[styles.bmsDiagValue, { color: socColor }]}>
                  {bmsSoc}%
                </Text>
                <Text style={styles.bmsDiagSub}>
                  ~{activeModeObj.rangeKm} km remaining
                </Text>
              </View>

              <View style={styles.bmsDiagTile}>
                <Text style={styles.bmsDiagKicker}>PACK VOLTAGE</Text>
                <Text style={styles.bmsDiagValue}>{bmsVoltage} V</Text>
                <Text style={styles.bmsDiagSub}>Nominal 51.2V LiFePO4</Text>
              </View>

              <View style={styles.bmsDiagTile}>
                <Text style={styles.bmsDiagKicker}>CELL TEMP</Text>
                <Text style={styles.bmsDiagValue}>{bmsTemp}°C</Text>
                <Text style={styles.bmsDiagSub}>Thermal Normal</Text>
              </View>

              <View style={styles.bmsDiagTile}>
                <Text style={styles.bmsDiagKicker}>PACK HEALTH</Text>
                <Text style={[styles.bmsDiagValue, { color: '#10B981' }]}>
                  98% SOH
                </Text>
                <Text style={styles.bmsDiagSub}>Balanced Cells</Text>
              </View>
            </View>

            <View style={styles.bmsLiveStatusBanner}>
              <Ionicons
                name={
                  bmsStatus === 'connected' ? 'shield-checkmark' : 'sync'
                }
                size={18}
                color={bmsStatus === 'connected' ? '#059669' : BRAND_PURPLE}
              />
              <Text style={styles.bmsLiveStatusText}>
                {bmsStatus === 'connected'
                  ? 'Live BLE & CAN bus link active · Encrypted Evegah Telemetry'
                  : 'Scanning vehicle controller for real-time battery frames...'}
              </Text>
            </View>

            <Pressable
              onPress={runAutoScanBms}
              style={styles.confirmExtendCta}
            >
              <Ionicons name="refresh" size={17} color="#FFFFFF" />
              <Text style={styles.confirmExtendCtaText}>
                Re-Scan & Sync BMS Now
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  osmBadge: {
    position: 'absolute',
    left: 14,
    bottom: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  osmBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Map Markers */
  originMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  originMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  routeCalloutBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
  },
  routeCalloutIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCalloutDist: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK_NAVY,
  },
  routeCalloutTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  scooterMarkerWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scooterMarkerHalo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.5)',
  },
  scooterMarkerImg: {
    width: 44,
    height: 44,
  },

  /* Top Floating HUD Bar */
  topHudBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hudCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  hudCenterPill: {
    height: 42,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  hudLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hudPulseDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },
  hudLiveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  hudBookingId: {
    fontSize: 13.5,
    fontWeight: '800',
    color: DARK_NAVY,
    letterSpacing: 0.3,
  },
  hudSosBtn: {
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 21,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  hudSosText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#E11D48',
  },

  /* Floating Right Map Tools */
  mapRightStack: {
    position: 'absolute',
    right: 14,
    bottom: 28,
    gap: 10,
  },
  mapToolBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
  },

  /* Floating Toasts */
  extendBannerCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  extendBannerIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extendBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#065F46',
  },
  extendBannerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  toastPill: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 8.5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastIconPulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Bottom Cockpit Deck Sheet */
  deckSheet: {
    marginTop: -18,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 16,
  },
  sheetGrabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },

  /* Row 1: Vehicle & Mode Switcher */
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleAvatarBox: {
    width: 56,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleAvatarImg: {
    width: 48,
    height: 38,
  },
  vehicleTitleCol: {
    flex: 1,
  },
  vehicleNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '900',
    color: DARK_NAVY,
    letterSpacing: -0.3,
  },
  iotVerifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  iotVerifiedText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: BRAND_PURPLE,
  },
  vehicleRouteSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  modeSegmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 11,
  },
  modeMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modeMiniBtnActive: {
    backgroundColor: BRAND_PURPLE,
  },
  modeMiniBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  modeMiniBtnTextActive: {
    color: '#FFFFFF',
  },

  /* Row 2: Dark-Violet Speedometer Cockpit Cluster */
  cockpitCluster: {
    marginTop: 12,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cockpitSideCol: {
    flex: 1,
  },
  cockpitLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cockpitKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#C4B5FD',
    letterSpacing: 0.7,
  },
  cockpitSideValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  cockpitSmallUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DDD6FE',
  },
  cockpitSideSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.62)',
    marginTop: 1,
  },
  cockpitVerticalDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginHorizontal: 10,
  },
  cockpitCenterCol: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  speedHeroNumber: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 33,
    fontVariant: ['tabular-nums'],
  },
  speedHeroUnit: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.6,
    marginTop: 1,
  },

  /* Row 3: BMS + Return Schedule Cards */
  cardsTwoCol: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  bmsCard: {
    flex: 1.15,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropScheduleCard: {
    flex: 0.85,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  bmsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bmsLabelCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bmsDotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cardSmallTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  bmsSyncChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bmsSyncChipConnected: {
    backgroundColor: '#F3E8FF',
  },
  bmsSyncChipText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2563EB',
  },
  bmsMainReadoutRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 5,
  },
  bmsBigPercent: {
    fontSize: 18,
    fontWeight: '900',
  },
  bmsRangeMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  segmentedBarRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 7,
  },
  batteryCellSegment: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
  },
  extendMiniTag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  extendMiniTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: BRAND_PURPLE,
  },
  dropBigTime: {
    fontSize: 17,
    fontWeight: '900',
    color: DARK_NAVY,
    marginTop: 4,
  },
  dropZoneSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },

  /* Row 4: Hardware Switch Deck */
  hardwareControlsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  hwSwitchBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  hwSwitchBtnActiveAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
  },
  hwSwitchBtnActiveRose: {
    backgroundColor: '#FFF1F2',
    borderColor: '#E11D48',
  },
  hwIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hwSwitchTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK_NAVY,
  },
  hwSwitchSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Row 5: Bottom Primary CTAs */
  primaryCtaRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryExtendBtn: {
    flex: 0.9,
    height: 50,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: BRAND_PURPLE,
    backgroundColor: '#FAF5FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryExtendBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: BRAND_PURPLE,
  },
  primaryEndBtnWrap: {
    flex: 1.25,
  },
  primaryEndTouch: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: BRAND_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryEndGradient: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 9,
  },
  primaryEndText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  primaryEndIconPill: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '82%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: DARK_NAVY,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
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
  scheduleBridgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  scheduleKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  scheduleTimeVal: {
    fontSize: 12,
    fontWeight: '800',
    color: DARK_NAVY,
    marginTop: 3,
  },
  scheduleArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  extendOptionsScroll: {
    maxHeight: 280,
  },
  extendOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 9,
  },
  extendOptionCardActive: {
    borderColor: BRAND_PURPLE,
    backgroundColor: '#FAF5FF',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: BRAND_PURPLE,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_PURPLE,
  },
  extendOptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  extendOptLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK_NAVY,
  },
  extendOptTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  extendOptTagActive: {
    backgroundColor: BRAND_PURPLE,
  },
  extendOptTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#475569',
  },
  extendOptSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  extendOptPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: DARK_NAVY,
  },
  confirmExtendCta: {
    marginTop: 8,
    height: 52,
    borderRadius: 15,
    backgroundColor: BRAND_PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmExtendCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* BMS Modal Sheet */
  bmsModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  bmsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bmsModalTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bmsModalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmsMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  bmsDiagTile: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 13,
  },
  bmsDiagKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  bmsDiagValue: {
    fontSize: 21,
    fontWeight: '900',
    color: DARK_NAVY,
    marginVertical: 4,
  },
  bmsDiagSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  bmsLiveStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  bmsLiveStatusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
});