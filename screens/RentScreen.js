import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Image as RNImage,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useEventListener } from 'expo';
import { BlurTargetView, BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  ReduceMotion,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
import LocationScreen, { EVEGAH_ZONES } from './LocationScreen';

const { width: SCREEN_W } = Dimensions.get('window');

// 100% Light Theme Palette
const PAGE_BG = '#F8F7FC';
const CARD_BG = '#FFFFFF';
const TEXT_INK = '#190D33';
const TEXT_SLATE = '#524769';
const TEXT_MUTED = '#84789C';
const BRAND_PURPLE_ACCENT = '#5B21B6';
const BRAND_VIOLET = '#7C3AED';
const PURPLE_TINT = '#F3EEFF';
const BORDER_LIGHT = '#EAE4F7';

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const TOAST_OFFSCREEN_Y = -120;
const TOAST_ENTER_MS = 560;
const TOAST_EXIT_MS = 480;
const TOAST_VISIBLE_MS = 4000;
const TOAST_EASE_IN = Easing.bezier(0.4, 0, 0.2, 1);

const INTRO_VIDEO = require('../assets/intro-ride.mp4');
const GLIDE_RATE = 1.5;
const SCOOTER_WIDTH = 60;
const SCOOTER_HEIGHT = 32;
const TRAIL_WIDTH = 30;
const RIDE_GROUP_WIDTH = SCOOTER_WIDTH + TRAIL_WIDTH;
const ROAD_DASHES = Array.from({ length: 16 }, (_, index) => index);
const VIDEO_MARKS = [0, 1.5, 3, 4.5, 6, 7.5, 9.2];

// ============================================================================
// FULL SLIDER CONSTANTS & ALL 3 SLIDES (CARD-FRAMED LIGHT THEME PARALLAX)
// ============================================================================
const SLIDE_WIDTH = SCREEN_W;
const SLIDE_HEIGHT = Math.round(SCREEN_W * (310 / 401));
const SLIDER1_FRONT_W = Math.round(SCREEN_W * 0.54);
const SLIDER1_FRONT_H = Math.round(SLIDER1_FRONT_W * (1024 / 1536));
const SLIDER2_FRONT_W = Math.round(SCREEN_W * 0.54);
const SLIDER2_FRONT_H = Math.round(SLIDER2_FRONT_W * (1142 / 1377));
const SLIDER3_FRONT_W = Math.round(SCREEN_W * 0.46);
const SLIDER3_FRONT_H = Math.round(SLIDER3_FRONT_W * (1568 / 1003));

const RENT_SLIDES = [
  {
    id: 'slide-1',
    tabTitle: 'Festive Pass',
    kind: 'navratri',
    bg: require('../assets/rent/slider-1.png'),
    front: require('../assets/rent/slider1-bg.png'),
    frontWidth: SLIDER1_FRONT_W,
    frontHeight: SLIDER1_FRONT_H,
    frontRight: -6,
    frontBottom: 12,
    cta: 'Rent EVs',
  },
  {
    id: 'slide-2',
    tabTitle: 'Smart Way',
    kind: 'headline',
    bg: require('../assets/rent/slider-2.png'),
    front: require('../assets/rent/slider2-bg.png'),
    frontWidth: SLIDER2_FRONT_W,
    frontHeight: SLIDER2_FRONT_H,
    frontRight: -2,
    frontBottom: 10,
    lines: ['Rent your EV', 'for the', 'Smart Way'],
    cta: 'Rent EV',
  },
  {
    id: 'slide-3',
    tabTitle: 'Zero Deposit',
    kind: 'smart',
    bg: require('../assets/rent/slider-3.png'),
    front: require('../assets/rent/slider3-front.png'),
    frontWidth: SLIDER3_FRONT_W,
    frontHeight: SLIDER3_FRONT_H,
    frontRight: -4,
    frontBottom: 6,
    lines: ['Smart Way', 'to Ride'],
    subLines: ['Zero deposit plan', 'options'],
    cta: 'Go With EV',
  },
];
const RENT_LOOP = [...RENT_SLIDES, RENT_SLIDES[0]];

const ZONES = [
  { id: 'gotri', name: 'Gotri', shortName: 'Gotri', area: 'Gotri Main Road', distance: '1.2 km' },
  { id: 'manjalpur', name: 'Manjalpur', shortName: 'Manjalpur', area: 'Manjalpur Main Road', distance: '2.8 km' },
  { id: 'aatapi', name: 'Aatapi', shortName: 'Aatapi', area: 'Ajwa Nimeta Road', distance: '4.5 km' },
  { id: 'kpgu', name: 'KPGU', shortName: 'KPGU', area: 'Babaria Institute Campus', distance: '5.1 km' },
];

function startOfDay(offset) {
  const date = new Date(2026, 9, 14);
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

const DAYS = [
  startOfDay(0),
  startOfDay(1),
  startOfDay(2),
  startOfDay(3),
  startOfDay(4),
  startOfDay(5),
  startOfDay(6),
];

function dayName(date, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-IN', { weekday: 'short' });
}

function clockToDate(day, time) {
  if (!day || !time) return null;
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  const out = new Date(day.getTime());
  out.setHours(hours, minutes, 0, 0);
  return out;
}

function spanLabel(start, end) {
  if (!start || !end) return '';
  const diffMins = Math.max(30, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
  const totalHours = Math.floor(diffMins / 60);
  const remMins = diffMins % 60;
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;

  if (days === 0) {
    if (remMins === 0) return `${totalHours} ${totalHours === 1 ? 'hr' : 'hrs'}`;
    return `${totalHours}h ${remMins}m`;
  }
  if (remHours === 0 && remMins === 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  return `${days}d ${remHours}h${remMins > 0 ? ` ${remMins}m` : ''}`;
}

// ============================================================================
// PRECISION CLOCK CONSTANTS (12 HOURS + ALL 60 MINUTES 00–59)
// ============================================================================
const CLOCK_SIZE = 264;
const CLOCK_CENTER = CLOCK_SIZE / 2;
const CLOCK_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLOCK_MAJOR_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ALL_60_MINUTES = Array.from({ length: 60 }, (_, i) => i);

function parseClock(value) {
  if (!value) return { hour: 8, minute: 0, meridiem: 'AM' };
  const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hour: 8, minute: 0, meridiem: 'AM' };
  const h = parseInt(match[1], 10) || 8;
  const m = Math.max(0, Math.min(59, parseInt(match[2], 10) || 0));
  return {
    hour: h,
    minute: m,
    meridiem: match[3].toUpperCase() === 'PM' ? 'PM' : 'AM',
  };
}

function formatClock(hour, minute, meridiem) {
  const h = parseInt(hour, 10) || 12;
  const m = String(Math.max(0, Math.min(59, Number(minute) || 0))).padStart(2, '0');
  return `${h}:${m} ${meridiem}`;
}

// Fixed ringSpot: centers perfectly around CLOCK_CENTER
function ringSpot(index, count, orbitRadius, itemSize = 36) {
  const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
  const half = itemSize / 2;
  return {
    left: CLOCK_CENTER + orbitRadius * Math.cos(angle) - half,
    top: CLOCK_CENTER + orbitRadius * Math.sin(angle) - half,
  };
}

const CAL_ANCHOR = new Date(2026, 9, 14);

function monthCells(cursor) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const total = new Date(year, month + 1, 0).getDate();
  const lead = first.getDay();
  const cells = [];
  for (let i = 0; i < lead; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= total; day += 1) {
    cells.push(new Date(year, month, day));
  }
  return cells;
}

function dayInWindow(day) {
  if (!day) return false;
  const start = new Date(
    CAL_ANCHOR.getFullYear(),
    CAL_ANCHOR.getMonth(),
    CAL_ANCHOR.getDate()
  );
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 90);
  return day.getTime() >= start.getTime() && day.getTime() <= end.getTime();
}

function rangeCaption(start, end) {
  if (!start) return 'Select trip dates';
  const sText = start.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  if (!end) return `${sText} (Pick return date)`;
  const eText = end.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
  return `${sText} → ${eText}`;
}

function missingStep({
  pickupZone,
  dropPlace,
  pickupDay,
  pickupTime,
  dropDay,
  dropTime,
}) {
  if (!pickupZone) return 'Choose pickup Zone';
  if (!dropPlace) return 'Choose drop Zone';
  if (!pickupDay) return 'Choose pickup date';
  if (!pickupTime) return 'Choose pickup time';
  if (!dropDay) return 'Choose drop date';
  if (!dropTime) return 'Choose drop time';
  return null;
}

// ============================================================================
// MERGE SLIDE COMPONENT (MULTI-LAYER PARALLAX FOR ALL 3 SLIDES)
// ============================================================================
function MergeSlide({ index, slide, scrollX }) {
  const bgStyle = useAnimatedStyle(() => {
    const input = [
      (index - 1) * SLIDE_WIDTH,
      index * SLIDE_WIDTH,
      (index + 1) * SLIDE_WIDTH,
    ];
    return {
      opacity: interpolate(
        scrollX.value,
        input,
        [0, 1, 0],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateX: interpolate(
            scrollX.value,
            input,
            [SLIDE_WIDTH * 0.24, 0, -SLIDE_WIDTH * 0.24],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollX.value,
            input,
            [1.04, 1, 1.04],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const copyStyle = useAnimatedStyle(() => {
    const input = [
      (index - 1) * SLIDE_WIDTH,
      index * SLIDE_WIDTH,
      (index + 1) * SLIDE_WIDTH,
    ];
    return {
      opacity: interpolate(
        scrollX.value,
        [
          input[0] + SLIDE_WIDTH * 0.14,
          input[1],
          input[2] - SLIDE_WIDTH * 0.14,
        ],
        [0, 1, 0],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateX: interpolate(
            scrollX.value,
            input,
            [SLIDE_WIDTH * 0.56, 0, -SLIDE_WIDTH * 0.56],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const frontStyle = useAnimatedStyle(() => {
    const input = [
      (index - 1) * SLIDE_WIDTH,
      index * SLIDE_WIDTH,
      (index + 1) * SLIDE_WIDTH,
    ];
    return {
      opacity: interpolate(
        scrollX.value,
        [
          input[0] + SLIDE_WIDTH * 0.08,
          input[1],
          input[2] - SLIDE_WIDTH * 0.08,
        ],
        [0, 1, 0],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateX: interpolate(
            scrollX.value,
            input,
            [SLIDE_WIDTH * 0.82, 0, -SLIDE_WIDTH * 0.82],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollX.value,
            input,
            [0.93, 1, 0.93],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <View pointerEvents="none" style={styles.slide}>
      <Animated.View style={[styles.slideBgWrap, bgStyle]}>
        <Image source={slide.bg} style={styles.slideImage} contentFit="cover" />
        {slide.kind !== 'navratri' ? (
          <LinearGradient
            colors={[
              'rgba(10, 12, 18, 0.58)',
              'rgba(10, 12, 18, 0.22)',
              'transparent',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.78, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.slideCopyWrap, copyStyle]}>
        {slide.kind === 'navratri' ? (
          <View style={styles.navratriEmblem}>
            <View style={styles.navratriArchRow}>
              <View style={styles.navratriArchWing} />
              <View style={styles.navratriArchDome}>
                <Ionicons name="sparkles" size={12} color="#B51F38" />
              </View>
              <View style={styles.navratriArchWing} />
            </View>
            <Text style={styles.navratriHelloText}>HELLO,</Text>
            <Text style={styles.navratriMainText}>RIDERS</Text>
            <View style={styles.navratriSwirlBar} />
          </View>
        ) : (
          <View style={styles.slideHeadlineBlock}>
            <View style={styles.slideAccentVector}>
              <View style={styles.slideAccentDot} />
              <View style={styles.slideAccentLine} />
            </View>
            {slide.lines?.map((line) => (
              <Text key={line} style={styles.slideHeadlineText}>
                {line}
              </Text>
            ))}
            {slide.subLines ? (
              <View style={styles.slideSubBlock}>
                {slide.subLines.map((sub) => (
                  <Text key={sub} style={styles.slideSubText}>
                    {sub}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        )}

        <View
          style={[
            styles.slideCtaBtn,
            slide.kind === 'navratri' && styles.slideCtaBtnGold,
          ]}
        >
          <Text style={styles.slideCtaText}>{slide.cta}</Text>
        </View>
      </Animated.View>

      {slide.front ? (
        <Animated.View
          style={[
            styles.slideFrontWrap,
            {
              width: slide.frontWidth,
              height: slide.frontHeight,
              right: slide.frontRight ?? 0,
              bottom: slide.frontBottom,
            },
            frontStyle,
          ]}
        >
          <Image
            source={slide.front}
            style={styles.slideFrontImage}
            contentFit="contain"
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ============================================================================
// POPUP SHELL (LIGHT THEME)
// ============================================================================
function PopupShell({ blurTarget, onClose, children }) {
  const opacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardTranslateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 240, easing: EASE });
    cardScale.value = withSpring(1, { damping: 20, stiffness: 260 });
    cardTranslateY.value = withSpring(0, { damping: 20, stiffness: 260 });
  }, [cardScale, cardTranslateY, opacity]);

  const requestClose = useCallback(() => {
    opacity.value = withTiming(0, { duration: 180, easing: EASE });
    cardScale.value = withTiming(0.94, { duration: 180, easing: EASE });
    cardTranslateY.value = withTiming(
      18,
      { duration: 180, easing: EASE },
      (done) => {
        if (done && onClose) runOnJS(onClose)();
      }
    );
  }, [cardScale, cardTranslateY, onClose, opacity]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
  }));

  return (
    <View style={styles.popupRoot}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          styles.popupBackdrop,
          backdropStyle,
        ]}
      >
        <BlurView
          intensity={42}
          tint="light"
          blurTarget={blurTarget}
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={requestClose}
        />
      </Animated.View>
      <Animated.View style={[styles.popupCard, cardStyle]}>
        {typeof children === 'function' ? children(requestClose) : children}
      </Animated.View>
    </View>
  );
}

// ============================================================================
// PRECISION CLOCK POPUP (HOURS 1-12 + EXACT 60 MINUTES 00-59)
// ============================================================================
function ClockPopup({ blurTarget, time, title, onClose, onConfirm }) {
  const initial = useMemo(() => parseClock(time), [time]);
  const [clockMode, setClockMode] = useState('hour'); // 'hour' | 'minute'
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(Number(initial.minute) || 0);
  const [meridiem, setMeridiem] = useState(initial.meridiem);
  const minStripRef = useRef(null);

  const hourOrbitRadius = CLOCK_CENTER - 32;
  const minOrbitRadius = CLOCK_CENTER - 30;

  // Scroll the 00-59 minute strip to keep the active minute centered
  useEffect(() => {
    if (clockMode === 'minute') {
      const timer = setTimeout(() => {
        minStripRef.current?.scrollTo({
          x: Math.max(0, minute * 44 - 100),
          animated: true,
        });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [clockMode, minute]);

  // Handle touch / drag anywhere on the circular clock face for exact 00-59 min or 1-12 hr
  const handleDialTouch = (evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    const dx = locationX - CLOCK_CENTER;
    const dy = locationY - CLOCK_CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 18) return; // Ignore center pin taps

    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    if (clockMode === 'hour') {
      let pickedHour = Math.round(deg / 30) % 12;
      if (pickedHour === 0) pickedHour = 12;
      setHour(pickedHour);
    } else {
      const pickedMin = Math.round(deg / 6) % 60;
      setMinute(pickedMin);
    }
  };

  const handleDialTouchRelease = (evt) => {
    handleDialTouch(evt);
    if (clockMode === 'hour') {
      setTimeout(() => setClockMode('minute'), 160);
    }
  };

  const stepMinute = (delta) => {
    setClockMode('minute');
    setMinute((prev) => (prev + delta + 60) % 60);
  };

  // Compute clock hand angle & tip coordinates
  const activeAngleDeg =
    clockMode === 'hour' ? (hour % 12) * 30 : (minute % 60) * 6;
  const activeAngleRad = ((activeAngleDeg - 90) * Math.PI) / 180;
  const activeRadius = clockMode === 'hour' ? hourOrbitRadius : minOrbitRadius;
  const handTipX = CLOCK_CENTER + activeRadius * Math.cos(activeAngleRad);
  const handTipY = CLOCK_CENTER + activeRadius * Math.sin(activeAngleRad);

  return (
    <PopupShell blurTarget={blurTarget} onClose={onClose}>
      {(requestClose) => (
        <>
          <View style={styles.clockPopupHeaderRow}>
            <View>
              <Text style={styles.popupTitle}>{title}</Text>
              <Text style={styles.popupHint}>
                {clockMode === 'hour'
                  ? 'Tap or drag on dial to pick hour (1–12)'
                  : 'Tap or drag on dial for exact minute (00–59)'}
              </Text>
            </View>
            <Pressable
              hitSlop={10}
              onPress={requestClose}
              style={styles.popupCloseCircle}
            >
              <Ionicons name="close" size={18} color={TEXT_SLATE} />
            </Pressable>
          </View>

          {/* Digital Time Readout Bar with HR / MIN Switcher, -1/+1m Stepper & AM/PM */}
          <View style={styles.clockDigitalHeader}>
            <View style={styles.clockDigitalBox}>
              <Pressable
                style={[
                  styles.clockDigitalPart,
                  clockMode === 'hour' && styles.clockDigitalPartActive,
                ]}
                onPress={() => setClockMode('hour')}
              >
                <Text
                  style={[
                    styles.clockDigitalNum,
                    clockMode === 'hour' && styles.clockDigitalNumActive,
                  ]}
                >
                  {String(hour).padStart(2, '0')}
                </Text>
                <Text
                  style={[
                    styles.clockDigitalLabel,
                    clockMode === 'hour' && styles.clockDigitalLabelActive,
                  ]}
                >
                  HR
                </Text>
              </Pressable>

              <Text style={styles.clockDigitalColon}>:</Text>

              <Pressable
                style={[
                  styles.clockDigitalPart,
                  clockMode === 'minute' && styles.clockDigitalPartActive,
                ]}
                onPress={() => setClockMode('minute')}
              >
                <Text
                  style={[
                    styles.clockDigitalNum,
                    clockMode === 'minute' && styles.clockDigitalNumActive,
                  ]}
                >
                  {String(minute).padStart(2, '0')}
                </Text>
                <Text
                  style={[
                    styles.clockDigitalLabel,
                    clockMode === 'minute' && styles.clockDigitalLabelActive,
                  ]}
                >
                  MIN
                </Text>
              </Pressable>
            </View>

            {/* Exact 1-Minute Stepper Buttons (-1m / +1m) */}
            <View style={styles.minuteStepperGroup}>
              <Pressable
                hitSlop={6}
                onPress={() => stepMinute(-1)}
                style={styles.minuteStepBtn}
              >
                <Text style={styles.minuteStepBtnText}>−1m</Text>
              </Pressable>
              <Pressable
                hitSlop={6}
                onPress={() => stepMinute(1)}
                style={styles.minuteStepBtn}
              >
                <Text style={styles.minuteStepBtnText}>+1m</Text>
              </Pressable>
            </View>

            {/* AM / PM Segmented Control */}
            <View style={styles.clockMeridiemBox}>
              {['AM', 'PM'].map((m) => {
                const on = meridiem === m;
                return (
                  <Pressable
                    key={m}
                    style={[
                      styles.clockMeridiemBtn,
                      on && styles.clockMeridiemBtnOn,
                    ]}
                    onPress={() => setMeridiem(m)}
                  >
                    <Text
                      style={[
                        styles.clockMeridiemBtnText,
                        on && styles.clockMeridiemBtnTextOn,
                      ]}
                    >
                      {m}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Mode Toggle Tabs */}
          <View style={styles.clockGuideRow}>
            <Pressable
              onPress={() => setClockMode('hour')}
              style={[
                styles.clockGuideBadge,
                clockMode === 'hour' && styles.clockGuideBadgeActive,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={13}
                color={clockMode === 'hour' ? '#FFFFFF' : BRAND_PURPLE_ACCENT}
              />
              <Text
                style={[
                  styles.clockGuideText,
                  clockMode === 'hour' && { color: '#FFFFFF' },
                ]}
              >
                1. Hour (1–12)
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setClockMode('minute')}
              style={[
                styles.clockGuideBadge,
                clockMode === 'minute' && styles.clockGuideBadgeActive,
              ]}
            >
              <Ionicons
                name="locate-outline"
                size={13}
                color={clockMode === 'minute' ? '#FFFFFF' : BRAND_PURPLE_ACCENT}
              />
              <Text
                style={[
                  styles.clockGuideText,
                  clockMode === 'minute' && { color: '#FFFFFF' },
                ]}
              >
                2. Exact Minute (00–59)
              </Text>
            </Pressable>
          </View>

          {/* ================================================================
              CENTERED ANALOG CLOCK DIAL (12 HOURS + 60 MINUTE TICKS)
          ================================================================ */}
          <View
            style={styles.clock}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleDialTouch}
            onResponderMove={handleDialTouch}
            onResponderRelease={handleDialTouchRelease}
          >
            {/* 60 Minute Tick Marks around the perimeter */}
            {ALL_60_MINUTES.map((m) => {
              const isMajor = m % 5 === 0;
              const isSelectedMin = clockMode === 'minute' && minute === m;
              const tickRadius = CLOCK_CENTER - 10;
              const angle = (m / 60) * 2 * Math.PI - Math.PI / 2;
              const x = CLOCK_CENTER + tickRadius * Math.cos(angle);
              const y = CLOCK_CENTER + tickRadius * Math.sin(angle);

              return (
                <View
                  key={`tick-${m}`}
                  pointerEvents="none"
                  style={[
                    styles.clockMinuteTick,
                    isMajor && styles.clockMinuteTickMajor,
                    isSelectedMin && styles.clockMinuteTickSelected,
                    {
                      left: x - (isMajor ? 2 : 1.5),
                      top: y - (isMajor ? 2 : 1.5),
                    },
                  ]}
                />
              );
            })}

            {/* Rotating Clock Hand Line from Center to Active Selection */}
            <View
              pointerEvents="none"
              style={[
                styles.clockHandContainer,
                {
                  transform: [{ rotate: `${activeAngleDeg}deg` }],
                },
              ]}
            >
              <View
                style={[
                  styles.clockHandStem,
                  { height: activeRadius - 14 },
                ]}
              />
            </View>

            {/* Active Selection Highlight Bubble at Hand Tip */}
            <View
              pointerEvents="none"
              style={[
                styles.clockHandTipBubble,
                {
                  left: handTipX - 19,
                  top: handTipY - 19,
                },
              ]}
            >
              <Text style={styles.clockHandTipText}>
                {clockMode === 'hour'
                  ? hour
                  : String(minute).padStart(2, '0')}
              </Text>
            </View>

            {/* Center Pivot Hub */}
            <View pointerEvents="none" style={styles.clockCenterHub}>
              <View style={styles.clockCenterHubDot} />
            </View>

            {/* 12 Hour Labels OR 12 Major 5-Min Labels */}
            {(clockMode === 'hour' ? CLOCK_HOURS : CLOCK_MAJOR_MINUTES).map(
              (val, index) => {
                const orbit =
                  clockMode === 'hour' ? hourOrbitRadius : minOrbitRadius;
                const spot = ringSpot(index, 12, orbit, 38);
                const isSelected =
                  clockMode === 'hour' ? hour === val : minute === val;

                return (
                  <Pressable
                    key={`${clockMode}-${val}`}
                    style={[styles.clockNum, spot]}
                    onPress={() => {
                      if (clockMode === 'hour') {
                        setHour(val);
                        setClockMode('minute');
                      } else {
                        setMinute(val);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.clockNumText,
                        isSelected && styles.clockNumTextOn,
                      ]}
                    >
                      {clockMode === 'hour'
                        ? val
                        : String(val).padStart(2, '0')}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          {/* All 60 Individual Minutes (00–59) Scrubber Bar */}
          <View style={styles.all60StripWrap}>
            <Text style={styles.all60StripTitle}>
              ALL 60 MINUTES (00–59) — TAP ANY EXACT MINUTE:
            </Text>
            <ScrollView
              ref={minStripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.all60ScrollContent}
            >
              {ALL_60_MINUTES.map((m) => {
                const active = minute === m;
                return (
                  <Pressable
                    key={`min-pill-${m}`}
                    onPress={() => {
                      setClockMode('minute');
                      setMinute(m);
                    }}
                    style={[
                      styles.exactMinPill,
                      active && styles.exactMinPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.exactMinPillText,
                        active && styles.exactMinPillTextActive,
                      ]}
                    >
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.popupActions}>
            <Pressable style={styles.popupCancel} onPress={requestClose}>
              <Text style={styles.popupCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.popupSet}
              onPress={() => {
                onConfirm(formatClock(hour, minute, meridiem));
                requestClose();
              }}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.popupSetText}>
                Set {formatClock(hour, minute, meridiem)}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </PopupShell>
  );
}

// ============================================================================
// DATE POPUP (LIGHT THEME)
// ============================================================================
function DatePopup({ blurTarget, pickupDay, dropDay, onClose, onConfirm }) {
  const [cursor, setCursor] = useState(() =>
    pickupDay ? new Date(pickupDay) : new Date(CAL_ANCHOR)
  );
  const [draftStart, setDraftStart] = useState(() =>
    pickupDay ? new Date(pickupDay) : null
  );
  const [draftEnd, setDraftEnd] = useState(() =>
    dropDay ? new Date(dropDay) : null
  );

  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const monthTitle = cursor.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const prevAllowed =
    cursor.getFullYear() > CAL_ANCHOR.getFullYear() ||
    (cursor.getFullYear() === CAL_ANCHOR.getFullYear() &&
      cursor.getMonth() > CAL_ANCHOR.getMonth());

  const nextAllowed = (() => {
    const maxDate = new Date(CAL_ANCHOR);
    maxDate.setDate(maxDate.getDate() + 90);
    return cursor.getTime() < maxDate.getTime();
  })();

  const handlePick = (day) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(day);
      setDraftEnd(null);
      return;
    }
    if (day.getTime() < draftStart.getTime()) {
      setDraftStart(day);
      setDraftEnd(null);
      return;
    }
    setDraftEnd(day);
  };

  return (
    <PopupShell blurTarget={blurTarget} onClose={onClose}>
      {(requestClose) => (
        <>
          <Text style={styles.popupTitle}>Select Trip Dates</Text>
          <Text style={styles.popupHint}>
            {rangeCaption(draftStart, draftEnd)}
          </Text>

          <View style={styles.monthRow}>
            <Pressable
              disabled={!prevAllowed}
              style={[styles.monthBtn, !prevAllowed && styles.monthBtnOff]}
              onPress={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
                )
              }
            >
              <Ionicons name="chevron-back" size={18} color={TEXT_INK} />
            </Pressable>
            <Text style={styles.monthLabel}>{monthTitle}</Text>
            <Pressable
              disabled={!nextAllowed}
              style={[styles.monthBtn, !nextAllowed && styles.monthBtnOff]}
              onPress={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
                )
              }
            >
              <Ionicons name="chevron-forward" size={18} color={TEXT_INK} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, index) => (
              <Text key={index} style={styles.weekText}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {cells.map((day, index) => {
              if (!day) return <View key={index} style={styles.calCell} />;
              const allowed = dayInWindow(day);
              const isStart =
                draftStart && day.getTime() === draftStart.getTime();
              const isEnd = draftEnd && day.getTime() === draftEnd.getTime();
              const isMid =
                draftStart &&
                draftEnd &&
                day.getTime() > draftStart.getTime() &&
                day.getTime() < draftEnd.getTime();

              return (
                <View key={index} style={styles.calCell}>
                  {isMid && <View style={[styles.calBand, styles.calBandMid]} />}
                  {isStart && draftEnd && (
                    <View style={[styles.calBand, styles.calBandStart]} />
                  )}
                  {isEnd && <View style={[styles.calBand, styles.calBandEnd]} />}
                  <Pressable
                    disabled={!allowed}
                    style={[
                      styles.calDay,
                      (isStart || isEnd) && styles.calDayOn,
                    ]}
                    onPress={() => handlePick(day)}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        !allowed && styles.calDayOff,
                        isMid && styles.calDayBetween,
                        (isStart || isEnd) && styles.calDayTextOn,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={styles.popupActions}>
            <Pressable style={styles.popupCancel} onPress={requestClose}>
              <Text style={styles.popupCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!draftStart}
              style={[styles.popupSet, !draftStart && styles.popupSetOff]}
              onPress={() => {
                onConfirm(draftStart, draftEnd || draftStart);
                requestClose();
              }}
            >
              <Text style={styles.popupSetText}>Confirm Dates</Text>
            </Pressable>
          </View>
        </>
      )}
    </PopupShell>
  );
}

// ============================================================================
// MAIN RENT SCREEN (100% LIGHT THEME + ALL 3 SLIDES VISIBLE + 60-MIN CLOCK)
// ============================================================================
export default function RentScreen({
  vehicle,
  selectedZone,
  onBack,
  onContinue,
}) {
  const insets = useSafeAreaInsets();
  const blurTargetRef = useRef(null);
  const listRef = useRef(null);

  // Hidden video player for animation marker tracking
  const player = useVideoPlayer(INTRO_VIDEO, (video) => {
    video.loop = false;
    video.muted = true;
    video.playbackRate = GLIDE_RATE;
    video.timeUpdateEventInterval = 0.05;
    video.currentTime = 0;
    video.pause();
  });
  const targetRef = useRef(0);
  const movingRef = useRef(false);
  const stepRef = useRef(0);
  const settledStepRef = useRef(-1);

  // Booking Parameters
  const availableZones = EVEGAH_ZONES?.length ? EVEGAH_ZONES : ZONES;
  const [sameDrop, setSameDrop] = useState(true);
  const [pickupZone, setPickupZone] = useState(
    () => selectedZone || EVEGAH_ZONES?.[0] || ZONES[0]
  );
  const [dropZone, setDropZone] = useState(
    () => selectedZone || EVEGAH_ZONES?.[0] || ZONES[0]
  );
  const [pickupDay, setPickupDay] = useState(() => startOfDay(0));
  const [dropDay, setDropDay] = useState(() => startOfDay(1));
  const [pickupTime, setPickupTime] = useState('8:00 AM');
  const [dropTime, setDropTime] = useState('8:00 AM');
  const [deliveryAnywhere, setDeliveryAnywhere] = useState(false);

  // Location selection modal
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationFor, setLocationFor] = useState('pickup');

  // Clock & Date popups
  const [clockFor, setClockFor] = useState(null);
  const [dateFor, setDateFor] = useState(null);

  // CTA Scooter Animation
  const [riding, setRiding] = useState(false);
  const buttonWidthRef = useRef(SCREEN_W - 32);
  const btnScale = useSharedValue(1);
  const textShift = useSharedValue(0);
  const textFade = useSharedValue(1);
  const arrowShift = useSharedValue(0);
  const lineShift = useSharedValue(40);
  const scooterX = useSharedValue(-RIDE_GROUP_WIDTH);

  // Full 3-Slide Hero Slider (Auto-loop + Manual Switcher Pills)
  const slideScrollRef = useRef(null);
  const slidePageRef = useRef(0);
  const slideTimerRef = useRef(null);
  const slideScrollX = useSharedValue(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const onSlideScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      slideScrollX.value = event.contentOffset.x;
    },
  });

  const syncNativeSlideScroll = (targetPage) => {
    if (targetPage >= RENT_SLIDES.length) {
      slidePageRef.current = 0;
      slideScrollX.value = 0;
      slideScrollRef.current?.scrollTo({ x: 0, animated: false });
      setActiveSlideIndex(0);
    } else {
      slidePageRef.current = targetPage;
      slideScrollRef.current?.scrollTo({
        x: targetPage * SLIDE_WIDTH,
        animated: false,
      });
      setActiveSlideIndex(targetPage);
    }
  };

  const stopAutoSlide = () => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    slideTimerRef.current = null;
  };

  const startAutoSlide = () => {
    stopAutoSlide();
    slideTimerRef.current = setInterval(() => {
      const next = slidePageRef.current + 1;
      slideScrollX.value = withTiming(
        next * SLIDE_WIDTH,
        {
          duration: 1400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        },
        (finished) => {
          if (finished) {
            runOnJS(syncNativeSlideScroll)(next);
          }
        }
      );
    }, 4000);
  };

  const jumpToSlide = (idx) => {
    stopAutoSlide();
    slidePageRef.current = idx;
    setActiveSlideIndex(idx);
    slideScrollX.value = withTiming(idx * SLIDE_WIDTH, { duration: 420 });
    slideScrollRef.current?.scrollTo({
      x: idx * SLIDE_WIDTH,
      animated: true,
    });
    startAutoSlide();
  };

  useEffect(() => {
    startAutoSlide();
    return stopAutoSlide;
  }, []);

  // Toast System
  const [toastMessage, setToastMessage] = useState(null);
  const [toastTick, setToastTick] = useState(0);
  const toastTimerRef = useRef(null);
  const toastHidingRef = useRef(false);
  const toastOpacity = useSharedValue(0);
  const toastTranslateY = useSharedValue(TOAST_OFFSCREEN_Y);
  const toastScale = useSharedValue(0.96);

  const dropPlace = sameDrop ? pickupZone : dropZone;
  const pickupAt = clockToDate(pickupDay, pickupTime);
  const dropAt = clockToDate(dropDay, dropTime);
  const duration = pickupAt && dropAt ? spanLabel(pickupAt, dropAt) : '';
  const showDuration = Boolean(
    pickupZone &&
      dropPlace &&
      pickupDay &&
      pickupTime &&
      dropDay &&
      dropTime &&
      duration
  );
  const ready = showDuration;

  const step = [
    pickupZone,
    dropPlace,
    pickupDay,
    pickupTime,
    dropDay,
    dropTime,
  ].filter(Boolean).length;
  stepRef.current = step;

  const pickupDayIndex = pickupDay
    ? DAYS.findIndex((item) => item.getTime() === pickupDay.getTime())
    : -1;
  const dropDayIndex = dropDay
    ? DAYS.findIndex((item) => item.getTime() === dropDay.getTime())
    : -1;

  const markSettled = () => {
    settledStepRef.current = stepRef.current;
    movingRef.current = false;
    player.pause();
  };

  useEffect(() => {
    const target = VIDEO_MARKS[Math.min(step, VIDEO_MARKS.length - 1)];
    targetRef.current = target;
    const now = player.currentTime || 0;
    if (target <= now + 0.05) {
      markSettled();
      return;
    }
    if (movingRef.current && player.playing) return;
    movingRef.current = true;
    player.playbackRate = GLIDE_RATE;
    player.play();
  }, [player, step]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (!movingRef.current) return;
    if (currentTime + 0.05 < targetRef.current) return;
    markSettled();
  });

  const finishHideToast = useCallback(() => {
    toastHidingRef.current = false;
    setToastMessage(null);
  }, []);

  const hideToast = useCallback(() => {
    if (toastHidingRef.current) return;
    toastHidingRef.current = true;
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    cancelAnimation(toastOpacity);
    cancelAnimation(toastTranslateY);
    cancelAnimation(toastScale);
    toastOpacity.value = withTiming(0, { duration: 360, easing: TOAST_EASE_IN });
    toastScale.value = withTiming(0.97, {
      duration: TOAST_EXIT_MS,
      easing: TOAST_EASE_IN,
    });
    toastTranslateY.value = withTiming(
      TOAST_OFFSCREEN_Y,
      { duration: TOAST_EXIT_MS, easing: TOAST_EASE_IN },
      (finished) => {
        if (finished) runOnJS(finishHideToast)();
      }
    );
  }, [finishHideToast, toastOpacity, toastScale, toastTranslateY]);

  const showToast = useCallback(
    (message) => {
      if (!message) return;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastHidingRef.current = false;
      setToastMessage(message);
      setToastTick((tick) => tick + 1);
      toastTimerRef.current = setTimeout(hideToast, TOAST_VISIBLE_MS);
    },
    [hideToast]
  );

  useEffect(() => {
    if (!toastMessage) return;
    cancelAnimation(toastOpacity);
    cancelAnimation(toastTranslateY);
    cancelAnimation(toastScale);
    toastOpacity.value = 0;
    toastTranslateY.value = TOAST_OFFSCREEN_Y;
    toastScale.value = 0.94;
    toastOpacity.value = withTiming(1, { duration: TOAST_ENTER_MS, easing: EASE });
    toastScale.value = withSpring(1, {
      damping: 18,
      stiffness: 240,
      reduceMotion: ReduceMotion.Never,
    });
    toastTranslateY.value = withSpring(0, {
      damping: 18,
      stiffness: 220,
      reduceMotion: ReduceMotion.Never,
    });
  }, [toastMessage, toastOpacity, toastScale, toastTick, toastTranslateY]);

  const toastAnimStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [
      { translateY: toastTranslateY.value },
      { scale: toastScale.value },
    ],
  }));
  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));
  const continueTextStyle = useAnimatedStyle(() => ({
    opacity: textFade.value,
    transform: [{ translateY: textShift.value }],
  }));
  const rideLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lineShift.value }],
  }));
  const scooterSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scooterX.value }],
  }));

  const finishRide = () => {
    setRiding(false);
    onContinue?.({
      pickupName: pickupZone?.shortName || pickupZone?.name || 'Gotri',
      pickupZone,
      dropName: dropPlace?.shortName || dropPlace?.name || 'Gotri',
      dropZone: dropPlace,
      pickupAt: pickupAt?.getTime() || null,
      dropAt: dropAt?.getTime() || null,
      pickupDate: pickupDay,
      dropDate: dropDay,
      pickupTime,
      dropTime,
      durationText: duration,
      deliveryAnywhere: Boolean(deliveryAnywhere),
    });
  };

  const playContinueRide = () => {
    if (riding) return;
    setRiding(true);
    textShift.value = 0;
    textFade.value = 1;
    arrowShift.value = 0;
    lineShift.value = 40;
    textShift.value = withTiming(-46, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    textFade.value = withTiming(0, { duration: 180 });
    arrowShift.value = withTiming(72, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
    lineShift.value = withDelay(
      240,
      withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) })
    );
    scooterX.value = -RIDE_GROUP_WIDTH;
    scooterX.value = withDelay(
      440,
      withTiming(
        buttonWidthRef.current,
        { duration: 1100, easing: Easing.inOut(Easing.cubic) },
        (finished) => {
          if (!finished) return;
          lineShift.value = withTiming(
            40,
            { duration: 200, easing: Easing.in(Easing.cubic) },
            (roadDone) => {
              if (!roadDone) return;
              textShift.value = withTiming(0, {
                duration: 220,
                easing: Easing.out(Easing.cubic),
              });
              textFade.value = withTiming(1, { duration: 180 });
              arrowShift.value = withTiming(
                0,
                { duration: 240, easing: Easing.out(Easing.cubic) },
                (backDone) => {
                  if (backDone) runOnJS(finishRide)();
                }
              );
            }
          );
        }
      )
    );
  };

  const choosePickupTime = (time) => {
    if (!pickupZone) {
      showToast('Select pickup station');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop station');
      return;
    }
    if (!pickupDay) {
      showToast('Select date');
      return;
    }
    setPickupTime(time);
  };

  const chooseDropTime = (time) => {
    if (!pickupZone) {
      showToast('Select pickup station');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop station');
      return;
    }
    if (!pickupDay) {
      showToast('Select date');
      return;
    }
    if (!pickupTime) {
      showToast('Select time');
      return;
    }
    if (!dropDay) {
      showToast('Select drop date');
      return;
    }
    setDropTime(time);
  };

  const openClock = (which) => {
    if (!pickupZone) {
      showToast('Select pickup station');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop station');
      return;
    }
    if (!pickupDay) {
      showToast('Select date');
      return;
    }
    if (which === 'drop') {
      if (!pickupTime) {
        showToast('Select time');
        return;
      }
      if (!dropDay) {
        showToast('Select drop date');
        return;
      }
    }
    setClockFor(which);
  };

  const openDate = () => {
    if (!pickupZone) {
      showToast('Select pickup station');
      return;
    }
    if (!dropPlace) {
      showToast('Select drop station');
      return;
    }
    setDateFor('range');
  };

  return (
    <View style={styles.root}>
      <BlurTargetView
        ref={blurTargetRef}
        collapsable={false}
        style={styles.blurTarget}
      >
        <StatusBar style="dark" />

        {/* ====================================================================
            CLEAN LIGHT TOP NAVIGATION HEADER
        ==================================================================== */}
        <View style={[styles.lightTopHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable
            hitSlop={10}
            style={({ pressed }) => [
              styles.lightBackBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={20} color={TEXT_INK} />
          </Pressable>

          <View style={styles.lightHeaderTitleCol}>
            <Text style={styles.lightHeaderTitle}>Rent Your EV</Text>
            <Text style={styles.lightHeaderSubtitle}>
              CONFIGURE &amp; RESERVE RIDE
            </Text>
          </View>

          <Pressable
            hitSlop={8}
            style={styles.lightZonePill}
            onPress={() => {
              setLocationFor('pickup');
              setLocationModalOpen(true);
            }}
          >
            <View style={styles.liveGreenDot} />
            <Text style={styles.lightZonePillText}>
              {pickupZone?.shortName || 'Vadodara'}
            </Text>
            <Ionicons name="chevron-down" size={13} color={BRAND_PURPLE_ACCENT} />
          </Pressable>
        </View>

        {/* ====================================================================
            MAIN SCROLLVIEW (HERO 3-SLIDE BANNER + BOOKING FORM)
        ==================================================================== */}
        <ScrollView
          ref={listRef}
          style={styles.formScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.formScrollContent,
            { paddingBottom: insets.bottom + 125 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* ==================================================================
              ALL 3 SLIDES VISIBLE PARALLAX SHOWCASE + INTERACTIVE SLIDE TABS
          ================================================================== */}
          <View style={styles.heroBannerSection}>
            <View style={styles.sliderContainer}>
              {RENT_LOOP.map((slide, index) => (
                <MergeSlide
                  key={index}
                  index={index}
                  slide={slide}
                  scrollX={slideScrollX}
                />
              ))}

              {/* Swipe Touch Overlay */}
              <Animated.ScrollView
                ref={slideScrollRef}
                horizontal
                pagingEnabled
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={onSlideScroll}
                onScrollBeginDrag={stopAutoSlide}
                onMomentumScrollEnd={(event) => {
                  const page = Math.round(
                    event.nativeEvent.contentOffset.x / SLIDE_WIDTH
                  );
                  if (page >= RENT_SLIDES.length) {
                    slidePageRef.current = 0;
                    slideScrollX.value = 0;
                    slideScrollRef.current?.scrollTo({ x: 0, animated: false });
                    setActiveSlideIndex(0);
                  } else {
                    slidePageRef.current = page;
                    slideScrollX.value = page * SLIDE_WIDTH;
                    setActiveSlideIndex(page);
                  }
                  startAutoSlide();
                }}
                style={styles.sliderTouch}
              >
                {RENT_LOOP.map((_, index) => (
                  <View key={index} style={styles.slideSpacer} />
                ))}
              </Animated.ScrollView>

              {/* Hidden 0x0 VideoView for animation state tracking */}
              <View style={{ width: 0, height: 0, overflow: 'hidden' }}>
                <VideoView
                  player={player}
                  style={{ width: 1, height: 1 }}
                  nativeControls={false}
                  allowsPictureInPicture={false}
                  surfaceType="textureView"
                />
              </View>
            </View>

            {/* 3-Slide Interactive Switcher Bar (Shows all 3 slides clearly) */}
            <View style={styles.slideSwitcherBar}>
              {RENT_SLIDES.map((s, idx) => {
                const isAct = activeSlideIndex === idx;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => jumpToSlide(idx)}
                    style={[
                      styles.slideSwitcherPill,
                      isAct && styles.slideSwitcherPillActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.slideSwitcherNumBadge,
                        isAct && styles.slideSwitcherNumBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slideSwitcherNumText,
                          isAct && styles.slideSwitcherNumTextActive,
                        ]}
                      >
                        0{idx + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.slideSwitcherLabel,
                        isAct && styles.slideSwitcherLabelActive,
                      ]}
                      numberOfLines={1}
                    >
                      {s.tabTitle}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.cardsPaddingWrap}>
            {/* 1. PICKUP & RETURN STATION CARD */}
            <Animated.View entering={cardEnter(0)} style={styles.sectionCard}>
              <View style={styles.sectionHeadRow}>
                <View
                  style={[
                    styles.sectionIconCircle,
                    { backgroundColor: PURPLE_TINT },
                  ]}
                >
                  <Ionicons name="location" size={17} color={BRAND_VIOLET} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeadText}>Station &amp; Zone</Text>
                  <Text style={styles.sectionSubText}>
                    Choose your Vadodara EV pickup &amp; return point
                  </Text>
                </View>
              </View>

              {/* Connected Pickup / Drop Station Selector Box */}
              <View style={styles.routeBox}>
                <Pressable
                  onPress={() => {
                    setLocationFor('pickup');
                    setLocationModalOpen(true);
                  }}
                  style={({ pressed }) => [
                    styles.stationSelectRow,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View style={styles.stationNodeCol}>
                    <View style={styles.pickupDotOuter}>
                      <View style={styles.pickupDotInner} />
                    </View>
                    {!sameDrop && <View style={styles.stationConnectorLine} />}
                  </View>

                  <View style={styles.stationCopyCol}>
                    <Text style={styles.stationTagLabel}>PICKUP ZONE</Text>
                    <Text style={styles.stationNameText} numberOfLines={1}>
                      {pickupZone?.name || 'Select a pickup zone'}
                    </Text>
                    <Text style={styles.stationAreaSub} numberOfLines={1}>
                      {pickupZone?.address ||
                        pickupZone?.area ||
                        'Evegah Verified Charging Station'}
                    </Text>
                  </View>

                  <View style={styles.changeStationPill}>
                    <Text style={styles.changeStationPillText}>Select</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={13}
                      color={BRAND_PURPLE_ACCENT}
                    />
                  </View>
                </Pressable>

                {!sameDrop ? (
                  <Animated.View entering={FadeIn.duration(240)}>
                    <View style={styles.stationDivider} />
                    <Pressable
                      onPress={() => {
                        setLocationFor('drop');
                        setLocationModalOpen(true);
                      }}
                      style={({ pressed }) => [
                        styles.stationSelectRow,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <View style={styles.stationNodeCol}>
                        <View style={styles.dropSquareNode} />
                      </View>

                      <View style={styles.stationCopyCol}>
                        <Text
                          style={[
                            styles.stationTagLabel,
                            { color: '#DB2777' },
                          ]}
                        >
                          RETURN ZONE
                        </Text>
                        <Text style={styles.stationNameText} numberOfLines={1}>
                          {dropZone?.name || 'Select drop station'}
                        </Text>
                        <Text style={styles.stationAreaSub} numberOfLines={1}>
                          {dropZone?.address ||
                            dropZone?.area ||
                            'Different return Zone'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.changeStationPill,
                          { backgroundColor: '#FDF2F8' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.changeStationPillText,
                            { color: '#DB2777' },
                          ]}
                        >
                          Select
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={13}
                          color="#DB2777"
                        />
                      </View>
                    </Pressable>
                  </Animated.View>
                ) : null}
              </View>

              {/* Same Return Station Checkbox Row */}
              <Pressable
                onPress={() => {
                  const next = !sameDrop;
                  setSameDrop(next);
                  if (next) setDropZone(pickupZone);
                }}
                style={styles.sameDropRow}
              >
                <View
                  style={[
                    styles.toggleCheckbox,
                    sameDrop && styles.toggleCheckboxOn,
                  ]}
                >
                  {sameDrop ? (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  ) : null}
                </View>
                <Text style={styles.sameDropLabel}>
                  Return scooter to same pickup station
                </Text>
              </Pressable>
            </Animated.View>

            {/* 2. RIDE SCHEDULE (PICKUP & DROP TIMELINE) CARD */}
            <Animated.View entering={cardEnter(1)} style={styles.sectionCard}>
              <View style={styles.sectionHeadRow}>
                <View
                  style={[
                    styles.sectionIconCircle,
                    { backgroundColor: '#ECFDF5' },
                  ]}
                >
                  <Ionicons name="calendar" size={17} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeadText}>Trip Schedule</Text>
                  <Text style={styles.sectionSubText}>
                    Choose exact pickup &amp; return date and minute
                  </Text>
                </View>
              </View>

              {/* Pickup Schedule Row */}
              <Text style={styles.dtSubHeading}>START RIDE</Text>
              <View style={styles.dtRow}>
                <Pressable style={styles.dtBox} onPress={openDate}>
                  <View style={styles.dtBoxInner}>
                    <Ionicons
                      name="calendar-outline"
                      size={17}
                      color={BRAND_VIOLET}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dtBoxLabel}>PICKUP DATE</Text>
                      <Text style={styles.dtBoxValue} numberOfLines={1}>
                        {pickupDay
                          ? pickupDayIndex >= 0
                            ? dayName(pickupDay, pickupDayIndex)
                            : pickupDay.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })
                          : 'Select Date'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={14} color={TEXT_MUTED} />
                  </View>
                </Pressable>

                <Pressable
                  style={styles.dtBox}
                  onPress={() => openClock('pickup')}
                >
                  <View style={styles.dtBoxInner}>
                    <Ionicons
                      name="time-outline"
                      size={17}
                      color={BRAND_VIOLET}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dtBoxLabel}>EXACT TIME</Text>
                      <Text style={styles.dtBoxValue} numberOfLines={1}>
                        {pickupTime || 'Select Time'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={14} color={TEXT_MUTED} />
                  </View>
                </Pressable>
              </View>

              {/* Center Duration Bridge Indicator */}
              <View style={styles.dtDividerRow}>
                <View style={styles.dtDividerLine} />
                <View style={styles.dtSpanPill}>
                  <Ionicons name="timer-outline" size={13} color="#059669" />
                  <Text style={styles.dtSpanText}>
                    {duration ? duration : 'Select Duration'}
                  </Text>
                </View>
                <View style={styles.dtDividerLine} />
              </View>

              {/* Drop / Return Schedule Row */}
              <Text style={[styles.dtSubHeading, { color: '#059669' }]}>
                END RIDE
              </Text>
              <View style={styles.dtRow}>
                <Pressable style={styles.dtBox} onPress={openDate}>
                  <View style={styles.dtBoxInner}>
                    <Ionicons
                      name="calendar-outline"
                      size={17}
                      color="#059669"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dtBoxLabel}>RETURN DATE</Text>
                      <Text style={styles.dtBoxValue} numberOfLines={1}>
                        {dropDay
                          ? dropDayIndex >= 0
                            ? dayName(dropDay, dropDayIndex)
                            : dropDay.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })
                          : 'Select Date'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={14} color={TEXT_MUTED} />
                  </View>
                </Pressable>

                <Pressable
                  style={styles.dtBox}
                  onPress={() => openClock('drop')}
                >
                  <View style={styles.dtBoxInner}>
                    <Ionicons name="time-outline" size={17} color="#059669" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dtBoxLabel}>EXACT TIME</Text>
                      <Text style={styles.dtBoxValue} numberOfLines={1}>
                        {dropTime || 'Select Time'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={14} color={TEXT_MUTED} />
                  </View>
                </Pressable>
              </View>
            </Animated.View>

            {/* 3. DOORSTEP FLEXI DELIVERY & PICKUP CARD */}
            <Animated.View entering={cardEnter(2)} style={styles.sectionCard}>
              <View style={styles.sectionHeadRow}>
                <View
                  style={[
                    styles.sectionIconCircle,
                    { backgroundColor: '#FFFBEB' },
                  ]}
                >
                  <Ionicons name="bicycle" size={17} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionHeadText}>Delivery Anywhere</Text>
                  <Text style={styles.sectionSubText}>
                    Doorstep scooter handover &amp; return collection
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setDeliveryAnywhere((v) => !v)}
                style={styles.deliveryOptionRow}
              >
                <View style={styles.deliveryOptionInfo}>
                  <View style={styles.deliveryTitleRow}>
                    <Text style={styles.deliveryOptionTitle}>
                      Doorstep Flexi Delivery &amp; Pickup
                    </Text>
                    <View style={styles.flexiTagPill}>
                      <Text style={styles.flexiTagText}>Optional</Text>
                    </View>
                  </View>
                  <Text style={styles.deliveryOptionSub}>
                    We deliver the sanitized EV to your doorstep &amp; collect
                    it when your trip ends
                  </Text>
                </View>

                <View
                  style={[
                    styles.toggleCheckbox,
                    deliveryAnywhere && styles.toggleCheckboxOn,
                  ]}
                >
                  {deliveryAnywhere ? (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>

            {/* 4. LIVE BOOKING OVERVIEW TICKET (Visible when ready - NO PRICES) */}
            {showDuration ? (
              <Animated.View
                entering={FadeInDown.duration(320)}
                style={styles.summaryTicketCard}
              >
                <View style={styles.summaryLeftRow}>
                  <View style={styles.summaryThumbBox}>
                    <Ionicons
                      name="shield-checkmark"
                      size={20}
                      color="#059669"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.summaryVerifiedRow}>
                      <Text style={styles.summaryModelName}>
                        {pickupZone?.shortName || pickupZone?.name} →{' '}
                        {dropPlace?.shortName || dropPlace?.name}
                      </Text>
                      <View style={styles.summaryReadyBadge}>
                        <View style={styles.summaryReadyDot} />
                        <Text style={styles.summaryReadyBadgeText}>
                          READY ({duration})
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.summaryRouteText} numberOfLines={1}>
                      {pickupTime} ({dayName(pickupDay, pickupDayIndex)}) →{' '}
                      {dropTime} ({dayName(dropDay, dropDayIndex)})
                    </Text>
                    {deliveryAnywhere ? (
                      <Text style={styles.summaryFlexiSubText}>
                        ✓ Doorstep Flexi Delivery &amp; Pickup included
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>

        {/* ====================================================================
            STICKY BOTTOM DOCK WITH ANIMATED SCOOTER CTA BUTTON
        ==================================================================== */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          {!ready ? (
            <View style={styles.bottomHintRow}>
              <Ionicons
                name="information-circle-outline"
                size={15}
                color={TEXT_SLATE}
              />
              <Text style={styles.bottomHintText}>
                {missingStep({
                  pickupZone,
                  dropPlace,
                  pickupDay,
                  pickupTime,
                  dropDay,
                  dropTime,
                }) || 'Complete your station & schedule details above'}
              </Text>
            </View>
          ) : null}

          <Pressable
            disabled={riding}
            onPress={() => {
              const missed = missingStep({
                pickupZone,
                dropPlace,
                pickupDay,
                pickupTime,
                dropDay,
                dropTime,
              });
              if (missed) {
                showToast(missed);
                return;
              }
              playContinueRide();
            }}
            onPressIn={() => {
              if (riding) return;
              btnScale.value = withSpring(0.97, {
                damping: 18,
                stiffness: 280,
              });
            }}
            onPressOut={() => {
              btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
            }}
          >
            <Animated.View
              onLayout={(event) => {
                buttonWidthRef.current = event.nativeEvent.layout.width;
              }}
              style={[styles.searchEvBtn, btnAnimStyle]}
            >
              <LinearGradient
                colors={['#6D28D9', '#4C1D95']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />

              <Animated.View style={[styles.ctaLabelRow, continueTextStyle]}>
                <Ionicons name="flash" size={17} color="#FDE047" />
                <Text style={styles.searchEvBtnText}>
                  Search Available EVs
                </Text>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </Animated.View>

              {riding ? (
                <>
                  <Animated.View
                    style={[styles.rideLine, rideLineStyle]}
                    pointerEvents="none"
                  >
                    {ROAD_DASHES.map((dash) => (
                      <View key={dash} style={styles.roadDash} />
                    ))}
                  </Animated.View>

                  <Animated.View
                    style={[styles.scooterWrap, scooterSlideStyle]}
                    pointerEvents="none"
                  >
                    <View style={styles.speedLines}>
                      <View style={[styles.speedDash, styles.speedDashLong]} />
                      <View style={[styles.speedDash, styles.speedDashMid]} />
                      <View style={[styles.speedDash, styles.speedDashShort]} />
                    </View>
                    <RNImage
                      source={require('../assets/login/evegah-scooter.png')}
                      style={styles.scooter}
                      resizeMode="contain"
                    />
                  </Animated.View>
                </>
              ) : null}
            </Animated.View>
          </Pressable>
        </View>
      </BlurTargetView>

      {/* ====================================================================
          FULL SCREEN LOCATION SELECTION MODAL
      ==================================================================== */}
      <Modal
        visible={locationModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setLocationModalOpen(false)}
      >
        <LocationScreen
          onBack={() => setLocationModalOpen(false)}
          onSelectZone={(selectedZoneObj) => {
            const matched =
              availableZones.find((z) => z.id === selectedZoneObj.id) ||
              selectedZoneObj;
            if (locationFor === 'drop') {
              setDropZone(matched);
            } else {
              setPickupZone(matched);
              if (sameDrop) setDropZone(matched);
            }
            setLocationModalOpen(false);
          }}
        />
      </Modal>

      {/* ====================================================================
          CLOCK POPUP MODAL (EXACT 00–59 MINUTE & HOUR PICKER)
      ==================================================================== */}
      {clockFor ? (
        <ClockPopup
          blurTarget={blurTargetRef}
          title={
            clockFor === 'drop' ? 'Select Return Time' : 'Select Pickup Time'
          }
          time={clockFor === 'drop' ? dropTime : pickupTime}
          onClose={() => setClockFor(null)}
          onConfirm={(time) => {
            if (clockFor === 'drop') chooseDropTime(time);
            else choosePickupTime(time);
          }}
        />
      ) : null}

      {/* ====================================================================
          CALENDAR DATE PICKUP & DROP POPUP MODAL
      ==================================================================== */}
      {dateFor ? (
        <DatePopup
          blurTarget={blurTargetRef}
          pickupDay={pickupDay}
          dropDay={dropDay}
          onClose={() => setDateFor(null)}
          onConfirm={(start, end) => {
            setPickupDay(start);
            setDropDay(end);
          }}
        />
      ) : null}

      {/* ====================================================================
          FLOATING ERROR / VALIDATION TOAST BANNER
      ==================================================================== */}
      {toastMessage ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            { top: Math.max(insets.top, 12) + 12 },
            toastAnimStyle,
          ]}
        >
          <View style={styles.toastIconBox}>
            <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

// ============================================================================
// STYLESHEET (100% LIGHT THEME + CENTERED 60-MIN CLOCK)
// ============================================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  blurTarget: {
    flex: 1,
  },

  /* Light Top Header */
  lightTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
    zIndex: 20,
  },
  lightBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: PURPLE_TINT,
    borderWidth: 1,
    borderColor: '#E2D6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightHeaderTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  lightHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: TEXT_INK,
    letterSpacing: -0.3,
  },
  lightHeaderSubtitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: TEXT_MUTED,
    letterSpacing: 0.9,
    marginTop: 1,
  },
  lightZonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PURPLE_TINT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  lightZonePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND_PURPLE_ACCENT,
  },
  liveGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },

  /* Hero 3-Slide Banner + Switcher Bar */
  heroBannerSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
    paddingBottom: 12,
  },
  sliderContainer: {
    width: SCREEN_W,
    height: SLIDE_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#EDE9FE',
  },
  sliderTouch: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  slideSpacer: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
  },
  slide: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  slideBgWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideCopyWrap: {
    position: 'absolute',
    left: 18,
    top: 44,
    zIndex: 3,
    maxWidth: SCREEN_W * 0.52,
  },
  slideHeadlineBlock: {
    gap: 2,
  },
  slideAccentVector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  slideAccentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  slideAccentLine: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#34D399',
  },
  slideHeadlineText: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  slideSubBlock: {
    marginTop: 6,
    gap: 1,
  },
  slideSubText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  slideCtaBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: BRAND_PURPLE_ACCENT,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  slideCtaBtnGold: {
    backgroundColor: '#B51F38',
  },
  slideCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  slideFrontWrap: {
    position: 'absolute',
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideFrontImage: {
    width: '100%',
    height: '100%',
  },
  navratriEmblem: {
    alignItems: 'flex-start',
  },
  navratriArchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  navratriArchWing: {
    width: 14,
    height: 1.5,
    backgroundColor: '#FFD24C',
  },
  navratriArchDome: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD24C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navratriHelloText: {
    color: '#FFD24C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  navratriMainText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  navratriSwirlBar: {
    width: 48,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#FFD24C',
    marginTop: 4,
  },

  /* 3-Slide Switcher Bar (All 3 slides clearly selectable) */
  slideSwitcherBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  slideSwitcherPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F8F7FC',
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  slideSwitcherPillActive: {
    backgroundColor: PURPLE_TINT,
    borderColor: BRAND_VIOLET,
  },
  slideSwitcherNumBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: '#EAE4F7',
  },
  slideSwitcherNumBadgeActive: {
    backgroundColor: BRAND_PURPLE_ACCENT,
  },
  slideSwitcherNumText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: TEXT_SLATE,
  },
  slideSwitcherNumTextActive: {
    color: '#FFFFFF',
  },
  slideSwitcherLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: TEXT_SLATE,
  },
  slideSwitcherLabelActive: {
    color: BRAND_PURPLE_ACCENT,
    fontWeight: '900',
  },

  /* Form ScrollView */
  formScroll: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  formScrollContent: {
    paddingBottom: 30,
  },
  cardsPaddingWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },

  /* Section Card Tokens */
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    shadowColor: '#240646',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeadText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: TEXT_INK,
    letterSpacing: -0.2,
  },
  sectionSubText: {
    fontSize: 11.5,
    color: TEXT_SLATE,
    marginTop: 1,
    fontWeight: '500',
  },

  /* Zone Route Box */
  routeBox: {
    backgroundColor: '#F8F7FC',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: BORDER_LIGHT,
    padding: 12,
  },
  stationSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  stationNodeCol: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BRAND_VIOLET,
  },
  stationConnectorLine: {
    width: 2,
    height: 28,
    backgroundColor: '#DDD6FE',
    marginVertical: 3,
  },
  dropSquareNode: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#DB2777',
  },
  stationCopyCol: {
    flex: 1,
  },
  stationTagLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: BRAND_VIOLET,
    letterSpacing: 0.6,
  },
  stationNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_INK,
    marginTop: 1,
    letterSpacing: -0.2,
  },
  stationAreaSub: {
    fontSize: 11,
    color: TEXT_SLATE,
    marginTop: 2,
  },
  changeStationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: PURPLE_TINT,
  },
  changeStationPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: BRAND_PURPLE_ACCENT,
  },
  stationDivider: {
    height: 1,
    backgroundColor: BORDER_LIGHT,
    marginVertical: 8,
    marginLeft: 30,
  },
  sameDropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3EFFA',
  },
  toggleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: '#B8ADD1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  toggleCheckboxOn: {
    backgroundColor: BRAND_PURPLE_ACCENT,
    borderColor: BRAND_PURPLE_ACCENT,
  },
  sameDropLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: TEXT_SLATE,
  },

  /* Date/Time Section */
  dtSubHeading: {
    fontSize: 10.5,
    fontWeight: '900',
    color: BRAND_VIOLET,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  dtRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dtBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BORDER_LIGHT,
    backgroundColor: '#F8F7FC',
  },
  dtBoxInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  dtBoxLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: TEXT_MUTED,
    letterSpacing: 0.4,
  },
  dtBoxValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: TEXT_INK,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  dtDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 8,
  },
  dtDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER_LIGHT,
  },
  dtSpanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dtSpanText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#059669',
  },

  /* Delivery Option Row */
  deliveryOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8F7FC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  deliveryOptionInfo: {
    flex: 1,
  },
  deliveryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deliveryOptionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: TEXT_INK,
  },
  flexiTagPill: {
    backgroundColor: PURPLE_TINT,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flexiTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: BRAND_VIOLET,
  },
  deliveryOptionSub: {
    fontSize: 11,
    color: TEXT_SLATE,
    marginTop: 4,
    lineHeight: 15,
  },

  /* Live Booking Overview Ticket */
  summaryTicketCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#BBF7D0',
  },
  summaryLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryThumbBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryModelName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#14532D',
    flex: 1,
  },
  summaryReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  summaryReadyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  summaryReadyBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#16A34A',
    letterSpacing: 0.4,
  },
  summaryRouteText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '700',
    marginTop: 3,
  },
  summaryFlexiSubText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '700',
    marginTop: 3,
  },

  /* Bottom Dock Bar & Animated CTA */
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER_LIGHT,
    shadowColor: '#240646',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bottomHintText: {
    fontSize: 11.5,
    color: TEXT_SLATE,
    fontWeight: '600',
    flex: 1,
  },
  searchEvBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: BRAND_PURPLE_ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: BRAND_PURPLE_ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchEvBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  rideLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 14,
    height: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roadDash: {
    width: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  scooterWrap: {
    position: 'absolute',
    left: 0,
    bottom: 16,
    width: RIDE_GROUP_WIDTH,
    height: SCOOTER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedLines: {
    width: TRAIL_WIDTH,
    height: 16,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  speedDash: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  speedDashLong: { width: 22 },
  speedDashMid: { width: 14 },
  speedDashShort: { width: 8 },
  scooter: {
    width: SCOOTER_WIDTH,
    height: SCOOTER_HEIGHT,
  },

  /* Toast System */
  toast: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 14,
  },
  toastIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Popups (Clock & Date - Light Theme) */
  popupRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    elevation: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  popupBackdrop: {
    backgroundColor: 'rgba(25, 13, 51, 0.35)',
  },
  popupCard: {
    width: '100%',
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    shadowColor: '#240646',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 18,
  },
  clockPopupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popupCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EFFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitle: {
    color: TEXT_INK,
    fontSize: 18,
    fontWeight: '900',
  },
  popupHint: {
    marginTop: 2,
    color: TEXT_SLATE,
    fontSize: 11.5,
    fontWeight: '600',
  },
  popupActions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  popupCancel: {
    flex: 0.42,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F3EFFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCancelText: {
    color: TEXT_SLATE,
    fontSize: 14,
    fontWeight: '800',
  },
  popupSet: {
    flex: 0.58,
    height: 46,
    borderRadius: 14,
    backgroundColor: BRAND_PURPLE_ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupSetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  popupSetOff: { opacity: 0.4 },

  /* ==========================================================================
     PRECISION CLOCK DIAL STYLES (CENTERED + HAND + ALL 60 MINUTES)
  ========================================================================== */
  clockDigitalHeader: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#F8F7FC',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: BORDER_LIGHT,
  },
  clockDigitalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clockDigitalPart: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: BORDER_LIGHT,
  },
  clockDigitalPartActive: {
    backgroundColor: PURPLE_TINT,
    borderColor: BRAND_PURPLE_ACCENT,
  },
  clockDigitalNum: {
    fontSize: 20,
    fontWeight: '900',
    color: TEXT_SLATE,
  },
  clockDigitalNumActive: {
    color: BRAND_PURPLE_ACCENT,
  },
  clockDigitalLabel: {
    marginLeft: 3,
    fontSize: 9,
    fontWeight: '800',
    color: TEXT_MUTED,
  },
  clockDigitalLabelActive: {
    color: BRAND_PURPLE_ACCENT,
  },
  clockDigitalColon: {
    fontSize: 18,
    fontWeight: '900',
    color: TEXT_MUTED,
  },
  minuteStepperGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  minuteStepBtn: {
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  minuteStepBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_PURPLE_ACCENT,
  },
  clockMeridiemBox: {
    flexDirection: 'row',
    backgroundColor: '#EAE4F7',
    borderRadius: 10,
    padding: 2.5,
    gap: 2,
  },
  clockMeridiemBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clockMeridiemBtnOn: {
    backgroundColor: BRAND_PURPLE_ACCENT,
  },
  clockMeridiemBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: TEXT_SLATE,
  },
  clockMeridiemBtnTextOn: {
    color: '#FFFFFF',
  },
  clockGuideRow: {
    marginTop: 10,
    marginBottom: 6,
    flexDirection: 'row',
    gap: 8,
  },
  clockGuideBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: PURPLE_TINT,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  clockGuideBadgeActive: {
    backgroundColor: BRAND_PURPLE_ACCENT,
    borderColor: BRAND_PURPLE_ACCENT,
  },
  clockGuideText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: BRAND_PURPLE_ACCENT,
  },

  /* Centered Circular Clock Face */
  clock: {
    marginTop: 6,
    alignSelf: 'center',
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: '#F8F7FC',
    borderWidth: 2,
    borderColor: '#E2D6FA',
    position: 'relative',
  },
  clockMinuteTick: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  clockMinuteTickMajor: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
  },
  clockMinuteTickSelected: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_VIOLET,
  },
  clockHandContainer: {
    position: 'absolute',
    left: CLOCK_CENTER - 1.5,
    top: 0,
    width: 3,
    height: CLOCK_SIZE,
    alignItems: 'center',
  },
  clockHandStem: {
    position: 'absolute',
    bottom: CLOCK_CENTER,
    width: 2.5,
    backgroundColor: BRAND_VIOLET,
    borderRadius: 2,
  },
  clockHandTipBubble: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND_PURPLE_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_PURPLE_ACCENT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 3,
  },
  clockHandTipText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
  },
  clockCenterHub: {
    position: 'absolute',
    left: CLOCK_CENTER - 10,
    top: CLOCK_CENTER - 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: BRAND_VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  clockCenterHubDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_PURPLE_ACCENT,
  },
  clockNum: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  clockNumText: {
    color: TEXT_INK,
    fontSize: 13,
    fontWeight: '800',
  },
  clockNumTextOn: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  /* All 60 Minutes (00–59) Scrubber Strip */
  all60StripWrap: {
    marginTop: 12,
    backgroundColor: '#F8F7FC',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  all60StripTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  all60ScrollContent: {
    gap: 6,
    paddingRight: 8,
  },
  exactMinPill: {
    width: 38,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exactMinPillActive: {
    backgroundColor: BRAND_PURPLE_ACCENT,
    borderColor: BRAND_PURPLE_ACCENT,
  },
  exactMinPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: TEXT_SLATE,
  },
  exactMinPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  /* Calendar Popup Styles */
  monthRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EFFA',
  },
  monthBtnOff: { opacity: 0.4 },
  monthLabel: {
    color: TEXT_INK,
    fontSize: 15,
    fontWeight: '800',
  },
  weekRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  weekText: {
    width: '14.28%',
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '800',
  },
  calGrid: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calBand: {
    position: 'absolute',
    top: 4,
    height: 36,
    backgroundColor: '#EDE9FE',
  },
  calBandMid: { left: 0, right: 0 },
  calBandStart: { left: '50%', right: 0 },
  calBandEnd: { left: 0, right: '50%' },
  calDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    zIndex: 1,
  },
  calDayOn: { backgroundColor: BRAND_PURPLE_ACCENT },
  calDayText: {
    color: TEXT_INK,
    fontSize: 13,
    fontWeight: '700',
  },
  calDayOff: { color: '#CBD5E1' },
  calDayBetween: {
    color: BRAND_PURPLE_ACCENT,
    fontWeight: '800',
  },
  calDayTextOn: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});