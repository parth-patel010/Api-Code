import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';

const { width: SCREEN_W } = Dimensions.get('window');

// Pure Light Theme Palette
const PAGE_BG = '#F8F7FC';
const CARD_BG = '#FFFFFF';
const TEXT_INK = '#190D33';
const TEXT_SLATE = '#524769';
const TEXT_MUTED = '#84789C';
const PURPLE_PRIMARY = '#5B21B6';
const PURPLE_VIOLET = '#7C3AED';
const PURPLE_TINT = '#F3EEFF';
const BORDER_LIGHT = '#EAE4F7';

const EVEGAH_LOGO = require('../assets/login/evegah-logo.png');
const FLEET_PARTNERS_IMG = require('../assets/home/fleet-partners.png');

const HERO_STORY_PHOTO =
  'https://lh3.googleusercontent.com/gps-cs-s/ANWiy9Sv5y_bzYeIRCzdzC_vtHL3lAwhNhzLwbE3lxjKyG28PXE9yNyIJdTltt8X7Pf3Jf4YlChaW31MQq0qklijuZiUfJHFBuIvinW5MAVDQr_oDvhO5l6gpvuNMu2IfuXJSrrb3x1m7BjXvB6d=s1360-w1360-h1020-rw';

const SQUAD_PHOTO =
  'https://lh3.googleusercontent.com/gps-cs-s/ANWiy9SXMdTnjAwnr0knYYf0K7zeeQqQnNeszEgYriXfUrgSOVXOtb91979RnnSID_WaHX3PNd-5WcPLIJ03f1aHmejn3LzoRQkPRm8KlJD9N3oNv_fXVvfMpA42rWxTw14FPij91LCvuXWA9po=s1360-w1360-h1020-rw';

const CULTURE_SLIDES = [
  {
    id: 'culture-1',
    tag: 'INNOVATION Zone',
    uri: 'https://www.evegah.com/images/frame2.webp',
    caption: 'Team Evegah at our Vadodara EV Innovation Zone',
  },
  {
    id: 'culture-2',
    tag: 'GREEN OPERATIONS',
    uri: 'https://lh3.googleusercontent.com/gps-cs-s/ANWiy9R-9lDgiWJtNv_a92NE2VCu8GezJkSs-Od5fQf-q9kNIjHusxkMujPOoZcYBAvLi4SdYZuN7id1YdQo2lrC08gYkevuQDwQcLQ-T0cV8_2axuPo6738TX66VOq3HtWIcFI-KfT-Qt2_viP8=s1360-w1360-h1020-rw',
    caption: 'Collaborating on zero-emission smart fleet operations',
  },
];

const VALUES_LIST = [
  {
    id: 'quality',
    step: '01',
    chip: '50-Point Smart Check',
    icon: 'ribbon',
    accentIcon: 'star',
    tint: '#F3EEFF',
    accent: '#6D28D9',
    title: 'Uncompromising Quality',
    body: 'Every Evegah electric scooter undergoes a 50-point smart diagnostics & battery health inspection before hitting the zone — ensuring a smooth, safe, and worry-free ride every single time.',
  },
  {
    id: 'transparency',
    step: '02',
    chip: '100% Upfront Pricing',
    icon: 'bar-chart',
    accentIcon: 'shield-checkmark',
    tint: '#ECFDF5',
    accent: '#059669',
    title: 'Transparency & Accountability',
    body: 'From upfront per-minute and rental package pricing to real-time BMS battery range and live zone tracking, we keep every ride 100% transparent with zero hidden charges.',
  },
  {
    id: 'personalized',
    step: '03',
    chip: 'Doorstep Flexi Delivery',
    icon: 'bicycle',
    accentIcon: 'sparkles',
    tint: '#EFF6FF',
    accent: '#2563EB',
    title: 'Personalized Experience',
    body: 'Whether you are a daily college commuter, corporate rider, tourist at Atal Sarovar, or last-mile delivery partner, Evegah tailors plans and doorstep Flexi pickup & drop around your life.',
  },
];

const SQUAD_MILESTONES = [
  { year: '2021', title: 'Founded', desc: 'Started in Gujarat' },
  { year: '8+ Cities', title: 'Expanded', desc: '25+ Smart Zones' },
  { year: '2.6L+', title: 'Community', desc: 'Daily EV Riders' },
];

const PARTNER_PILLS = [
  '⚡ Quick-Commerce Fleets',
  '🎓 Smart University Campuses',
  '🌿 Eco-Tourism Corridors',
  '🏢 Corporate Mobility Parks',
  '📦 Last-Mile Delivery Zones',
];

const MEDIA_CARDS = [
  {
    id: 'fe',
    outlet: 'Financial Express',
    tag: 'FEATURE STORY',
    readTime: '3 min read',
    headline:
      'How Evegah is electrifying urban micro-mobility and last-mile delivery across Gujarat',
    uri: 'https://speedforceev.in/blog/wp-content/uploads/2026/08/The-road-to-growth-begins-with-the-right-fleet.Congratulations-to-evegahride-gahride-on-this-e-1.jpg',
  },
  {
    id: 'db',
    outlet: 'Dainik Bhaskar',
    tag: 'CITY EXPANSION',
    readTime: '2 min read',
    headline:
      'Evegah expands smart EV scooter zones across Vadodara, Ahmedabad, Rajkot & Daman',
    uri: 'https://www.evegah.com/images/blog8-hero.webp',
  },
  {
    id: 'afaqs',
    outlet: 'AFAQS',
    tag: 'GEN-Z MOBILITY',
    readTime: '4 min read',
    headline:
      'Young commuters & delivery partners switch to Evegah zero-emission electric scooters',
    uri: 'https://www.evegah.com/images/blog2-hero.webp',
  },
  {
    id: 'et',
    outlet: 'Economic Times',
    tag: 'IOT & GREEN TECH',
    readTime: '3 min read',
    headline:
      'Clean mobility startup Evegah powers green campus & tourism fleets with IoT-enabled EVs',
    uri: 'https://www.evegah.com/images/blog9-hero.webp',
  },
];

const SOLID_STATS = [
  {
    id: 'rating',
    end: 4.8,
    decimals: 1,
    suffix: '/5 ★',
    label: 'TOP RATED APP',
    subtitle:
      "is Evegah's average review rating across Play Store, App Store & Google",
    mascotIcon: 'diamond',
    bgGrad: ['#F5F3FF', '#EDE9FE'],
    border: '#DDD6FE',
    accent: '#6D28D9',
    badgeBg: '#DDD6FE',
  },
  {
    id: 'riders',
    end: 2.6,
    decimals: 1,
    suffix: 'L+',
    label: 'HAPPY RIDERS',
    subtitle:
      'happy riders & delivery partners powered by Evegah electric scooters',
    mascotIcon: 'flash',
    bgGrad: ['#ECFDF5', '#D1FAE5'],
    border: '#A7F3D0',
    accent: '#059669',
    badgeBg: '#A7F3D0',
  },
  {
    id: 'zones',
    end: 25,
    decimals: 0,
    suffix: '+',
    label: '24×7 SMART ZONES',
    subtitle:
      'smart EV pickup & battery swap zones operating 24×7 across cities',
    mascotIcon: 'location',
    bgGrad: ['#EFF6FF', '#DBEAFE'],
    border: '#BFDBFE',
    accent: '#2563EB',
    badgeBg: '#BFDBFE',
  },
];

/* ============================================================================
   ANIMATED NUMBER COUNTER
============================================================================ */
function AnimatedCounter({
  end,
  duration = 1900,
  decimals = 0,
  prefix = '',
  suffix = '',
  triggerKey = 0,
  style,
}) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let raf;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(end * eased);
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setVal(end);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, triggerKey]);

  const formatted =
    decimals > 0
      ? val.toFixed(decimals)
      : Math.round(val).toLocaleString('en-IN');

  return (
    <Text style={style}>
      {prefix}
      {formatted}
      {suffix}
    </Text>
  );
}

/* ============================================================================
   FLOATING ANIMATED ICON EMBLEM FOR VALUES
============================================================================ */
function FloatingValueBadge({ icon, accentIcon, tint, accent, delayMs = 0 }) {
  const floatY = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    floatY.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );
    pulse.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      )
    );
  }, [delayMs, floatY, pulse]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.valueArtCircle, { backgroundColor: tint }, floatStyle]}>
      <Ionicons name={icon} size={26} color={accent} />
      <Animated.View style={[styles.valueGoldDot, dotStyle]}>
        <Ionicons name={accentIcon} size={11} color="#FFFFFF" />
      </Animated.View>
    </Animated.View>
  );
}

export default function AboutScreen({ onBack, onExplore }) {
  const insets = useSafeAreaInsets();
  const [cultureIdx, setCultureIdx] = useState(0);
  const [activeValueId, setActiveValueId] = useState('quality');
  const [statsTrigger, setStatsTrigger] = useState(0);

  const cultureScrollRef = useRef(null);
  const cultureCardW = SCREEN_W - 64; // Inside padded white card

  // Continuous subtle floating animation for the Hero quote badge
  const heroFloat = useSharedValue(0);
  useEffect(() => {
    heroFloat.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, [heroFloat]);

  const heroFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: heroFloat.value }],
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCultureIdx((prev) => {
        const next = (prev + 1) % CULTURE_SLIDES.length;
        cultureScrollRef.current?.scrollTo({
          x: next * cultureCardW,
          animated: true,
        });
        return next;
      });
    }, 3600);
    return () => clearInterval(timer);
  }, [cultureCardW]);

  const handleCallSupport = () => {
    Linking.openURL('tel:18008898791').catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Clean Light Top Navigation Bar */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <Pressable
          hitSlop={12}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
          ]}
        >
          <Ionicons name="arrow-back" size={20} color={TEXT_INK} />
        </Pressable>

        <View style={styles.topCenterCol}>
          <Text style={styles.topHeaderTitle}>About Evegah</Text>
          <View style={styles.topSubRow}>
            <View style={styles.liveGreenDot} />
            <Text style={styles.topHeaderSub}>OUR STORY &amp; MISSION</Text>
          </View>
        </View>

        <View style={styles.headerLogoPill}>
          <Image
            source={EVEGAH_LOGO}
            style={styles.headerLogoImg}
            contentFit="contain"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ====================================================================
            1. EDITORIAL HERO STORY CARD (Pure Light Card with Floating Tags)
        ==================================================================== */}
        <Animated.View entering={cardEnter(0)} style={styles.heroCardOuter}>
          <View style={styles.heroImageFrame}>
            <Image
              source={{ uri: HERO_STORY_PHOTO }}
              style={styles.heroImage}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(25,13,51,0.05)', 'rgba(25,13,51,0.55)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Top-Left Live Rider Counter Pill */}
            <View style={styles.heroTopLeftPill}>
              <Ionicons name="sparkles" size={12} color="#F59E0B" />
              <AnimatedCounter
                end={200000}
                duration={2000}
                suffix="+ Happy Riders"
                triggerKey={statsTrigger}
                style={styles.heroTopLeftPillText}
              />
            </View>

            {/* Top-Right Logo Watermark */}
            <View style={styles.heroLogoWatermark}>
              <Image
                source={EVEGAH_LOGO}
                style={styles.heroWatermarkImg}
                contentFit="contain"
              />
            </View>

            {/* Floating Animated Quote Bubble */}
            <Animated.View style={[styles.floatingQuoteBadge, heroFloatStyle]}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
            </Animated.View>
          </View>

          <View style={styles.heroCardBody}>
            <View style={styles.riderSpotlightTag}>
              <Text style={styles.riderSpotlightTagText}>RIDER SPOTLIGHT</Text>
            </View>

            <Text style={styles.heroStoryTitle}>
              2 Lakh+ happy riders, here&apos;s what one has to say
            </Text>

            <View style={styles.quoteAccentBlock}>
              <Text style={styles.heroStoryQuote}>
                &ldquo;Evegah represents reliability and complete peace of mind
                for my daily commute. From instant QR unlocking to
                well-maintained electric scooters and doorstep Flexi delivery,
                the team goes above and beyond to make sustainable city travel
                effortless.&rdquo;
              </Text>
            </View>

            {/* Author & Action Footer */}
            <View style={styles.heroAuthorFooter}>
              <View style={styles.authorAvatarCircle}>
                <Text style={styles.authorAvatarInitials}>NS</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroStoryAuthorName}>Neha Singh</Text>
                <Text style={styles.heroStoryAuthorRole}>
                  Assistant Manager • Vadodara
                </Text>
              </View>

              <Pressable
                onPress={onExplore}
                style={({ pressed }) => [
                  styles.loveStoriesPillBtn,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text style={styles.loveStoriesPillText}>Love Stories</Text>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={PURPLE_PRIMARY}
                />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* ====================================================================
            2. WHAT'S IMPORTANT TO US (Interactive 3-Pillar Light Cards)
        ==================================================================== */}
        <Animated.View entering={cardEnter(1)} style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <View style={styles.sectionKickerPill}>
                <Ionicons
                  name="compass-outline"
                  size={12}
                  color={PURPLE_VIOLET}
                />
                <Text style={styles.sectionKickerText}>CORE PILLARS</Text>
              </View>
              <Text style={styles.sectionMainHeading}>
                What&apos;s important to us
              </Text>
            </View>
          </View>

          <View style={styles.valuesCardsStack}>
            {VALUES_LIST.map((item, idx) => {
              const isSelected = activeValueId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setActiveValueId(item.id)}
                  style={[
                    styles.valueInteractiveCard,
                    isSelected && {
                      borderColor: item.accent,
                      backgroundColor: '#FFFFFF',
                    },
                  ]}
                >
                  <View style={styles.valueCardTopRow}>
                    <FloatingValueBadge
                      icon={item.icon}
                      accentIcon={item.accentIcon}
                      tint={item.tint}
                      accent={item.accent}
                      delayMs={idx * 250}
                    />

                    <View style={styles.valueHeaderMeta}>
                      <View style={styles.valueChipRow}>
                        <Text
                          style={[styles.valueStepNum, { color: item.accent }]}
                        >
                          PILLAR {item.step}
                        </Text>
                        <View
                          style={[
                            styles.valueFeatureChip,
                            { backgroundColor: item.tint },
                          ]}
                        >
                          <Text
                            style={[
                              styles.valueFeatureChipText,
                              { color: item.accent },
                            ]}
                          >
                            {item.chip}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.valueTitle}>{item.title}</Text>
                    </View>
                  </View>

                  <Text style={styles.valueBody}>{item.body}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ====================================================================
            3. SQUAD EVEGAH SECTION (With 2021 -> 2026 Milestone Strip)
        ==================================================================== */}
        <Animated.View entering={cardEnter(2)} style={styles.sectionBlock}>
          <View style={styles.whiteFeatureCard}>
            <View style={styles.squadPhotoWrap}>
              <Image
                source={{ uri: SQUAD_PHOTO }}
                style={styles.squadPhoto}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(25, 13, 51, 0.65)']}
                style={styles.squadPhotoOverlay}
              >
                <View style={styles.squadBadgePill}>
                  <Ionicons name="people" size={13} color="#FFFFFF" />
                  <Text style={styles.squadBadgeText}>
                    LEADERSHIP &amp; ENGINEERING
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <Text style={styles.sectionMainHeading}>Squad Evegah</Text>

            <Text style={styles.squadParagraph}>
              Looking to change India&apos;s urban commute for the better,
              Evegah&apos;s leadership and engineering squad came together in
              2021 to build a smarter, cleaner, and rider-first electric
              mobility ecosystem.
            </Text>

            <Text style={[styles.squadParagraph, { marginTop: 10 }]}>
              Eight-plus cities and 2.6 Lakh+ riders later, Evegah continues to
              empower daily commuters, students, and last-mile delivery partners
              with zero-emission electric scooters and intelligent
              battery-swapping infrastructure.
            </Text>

            {/* 3-Step Journey Timeline Strip */}
            <View style={styles.milestoneStrip}>
              {SQUAD_MILESTONES.map((m, idx) => (
                <React.Fragment key={m.year}>
                  <View style={styles.milestoneCol}>
                    <Text style={styles.milestoneYear}>{m.year}</Text>
                    <Text style={styles.milestoneTitle}>{m.title}</Text>
                    <Text style={styles.milestoneDesc}>{m.desc}</Text>
                  </View>
                  {idx < SQUAD_MILESTONES.length - 1 ? (
                    <View style={styles.milestoneDivider} />
                  ) : null}
                </React.Fragment>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ====================================================================
            4. CULTURE CAROUSEL SECTION
        ==================================================================== */}
        <Animated.View entering={cardEnter(3)} style={styles.sectionBlock}>
          <View style={styles.whiteFeatureCard}>
            <View style={styles.cultureHeaderRow}>
              <View>
                <View style={styles.sectionKickerPill}>
                  <Ionicons
                    name="heart-outline"
                    size={12}
                    color={PURPLE_VIOLET}
                  />
                  <Text style={styles.sectionKickerText}>LIFE AT EVEGAH</Text>
                </View>
                <Text style={styles.sectionMainHeading}>Culture</Text>
              </View>

              {/* Animated Pill Progress Indicators */}
              <View style={styles.cultureDashRow}>
                {CULTURE_SLIDES.map((s, i) => (
                  <View
                    key={s.id}
                    style={[
                      styles.cultureDash,
                      i === cultureIdx && styles.cultureDashActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            <ScrollView
              ref={cultureScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / cultureCardW
                );
                setCultureIdx(
                  Math.max(0, Math.min(CULTURE_SLIDES.length - 1, idx))
                );
              }}
              style={[styles.cultureCarousel, { width: cultureCardW }]}
            >
              {CULTURE_SLIDES.map((slide) => (
                <View
                  key={slide.id}
                  style={[styles.cultureSlideFrame, { width: cultureCardW }]}
                >
                  <Image
                    source={{ uri: slide.uri }}
                    style={styles.cultureSlideImg}
                    contentFit="cover"
                  />
                  <View style={styles.cultureTopBadge}>
                    <Text style={styles.cultureTopBadgeText}>{slide.tag}</Text>
                  </View>
                  <LinearGradient
                    colors={['transparent', 'rgba(25, 13, 51, 0.8)']}
                    style={styles.cultureCaptionGrad}
                  >
                    <Text style={styles.cultureCaptionText}>
                      {slide.caption}
                    </Text>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>

            <Text style={[styles.squadParagraph, { marginTop: 16 }]}>
              We pride ourselves in prioritizing our riders and partners to
              deliver an unmatched EV mobility experience. In our endeavour to
              challenge convention and electrify every street, we remain rooted
              in fairness, sustainability, and transparency.
            </Text>

            <Pressable
              onPress={onExplore}
              style={({ pressed }) => [
                styles.careerBannerBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={styles.careerBannerLeft}>
                <View style={styles.careerIconCircle}>
                  <Ionicons
                    name="briefcase-outline"
                    size={16}
                    color={PURPLE_PRIMARY}
                  />
                </View>
                <View>
                  <Text style={styles.careerBannerTitle}>
                    Explore careers at Evegah
                  </Text>
                  <Text style={styles.careerBannerSub}>
                    Join our Vadodara &amp; pan-India EV innovation teams
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={PURPLE_PRIMARY}
              />
            </Pressable>
          </View>
        </Animated.View>

        {/* ====================================================================
            5. OUR FLEET & DELIVERY PARTNERS (Soft Alabaster-Lavender Card)
        ==================================================================== */}
        <Animated.View entering={cardEnter(4)} style={styles.sectionBlock}>
          <LinearGradient
            colors={['#F3EEFF', '#FDFCFF']}
            style={styles.partnersLightCard}
          >
            <View style={styles.sectionKickerPill}>
              <Ionicons name="layers-outline" size={12} color={PURPLE_VIOLET} />
              <Text style={styles.sectionKickerText}>ENTERPRISE ECOSYSTEM</Text>
            </View>

            <Text style={styles.sectionMainHeading}>
              Our Fleet &amp; Delivery Partners
            </Text>
            <Text style={styles.partnersSubtext}>
              Trusted by India&apos;s leading quick-commerce platforms, smart
              cities, universities, and eco-tourism Zones
            </Text>

            {/* Uploaded Official Fleet & Delivery Partners Logo Banner */}
            <View style={styles.fleetBannerCard}>
              <Image
                source={FLEET_PARTNERS_IMG}
                style={styles.fleetBannerImage}
                contentFit="contain"
              />
            </View>

            {/* Horizontal Partner Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.partnerTagsRow}
            >
              {PARTNER_PILLS.map((tag) => (
                <View key={tag} style={styles.partnerCategoryPill}>
                  <Text style={styles.partnerCategoryPillText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </LinearGradient>
        </Animated.View>

        {/* ====================================================================
            6. MEDIA COVERAGE (Light Editorial News Cards)
        ==================================================================== */}
        <Animated.View entering={cardEnter(5)} style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRowPadded}>
            <View>
              <View style={styles.sectionKickerPill}>
                <Ionicons
                  name="newspaper-outline"
                  size={12}
                  color={PURPLE_VIOLET}
                />
                <Text style={styles.sectionKickerText}>IN THE PRESS</Text>
              </View>
              <Text style={styles.sectionMainHeading}>Media Coverage</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={268}
            contentContainerStyle={styles.mediaScrollContent}
          >
            {MEDIA_CARDS.map((media) => (
              <Pressable
                key={media.id}
                style={({ pressed }) => [
                  styles.mediaLightCard,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={styles.mediaThumbWrap}>
                  <Image
                    source={{ uri: media.uri }}
                    style={styles.mediaThumbImg}
                    contentFit="cover"
                  />
                  <View style={styles.mediaTagBadge}>
                    <Text style={styles.mediaTagBadgeText}>{media.tag}</Text>
                  </View>
                </View>

                <View style={styles.mediaCardBody}>
                  <View style={styles.mediaMetaTop}>
                    <Text style={styles.mediaOutletPill}>{media.outlet}</Text>
                    <Text style={styles.mediaReadTime}>{media.readTime}</Text>
                  </View>

                  <Text style={styles.mediaHeadlineLight} numberOfLines={3}>
                    {media.headline}
                  </Text>

                  <View style={styles.mediaReadArticleRow}>
                    <Text style={styles.mediaReadArticleText}>
                      Read full story
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={13}
                      color={PURPLE_PRIMARY}
                    />
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ====================================================================
            7. SOLID EVEGAH STATS (Pastel Light Cards + Live Counter Animation)
        ==================================================================== */}
        <Animated.View entering={cardEnter(6)} style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRowPadded}>
            <View>
              <View style={styles.sectionKickerPill}>
                <Ionicons
                  name="trending-up-outline"
                  size={12}
                  color="#059669"
                />
                <Text style={[styles.sectionKickerText, { color: '#059669' }]}>
                  VERIFIED IMPACT
                </Text>
              </View>
              <Text style={styles.sectionMainHeading}>Solid Evegah Stats</Text>
            </View>

            <Pressable
              hitSlop={10}
              onPress={() => setStatsTrigger((t) => t + 1)}
              style={styles.replayStatsPill}
            >
              <Ionicons name="refresh" size={13} color={PURPLE_PRIMARY} />
              <Text style={styles.replayStatsText}>Replay</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={268}
            contentContainerStyle={styles.statsScrollContent}
          >
            {SOLID_STATS.map((stat) => (
              <LinearGradient
                key={stat.id}
                colors={stat.bgGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.solidStatLightCard, { borderColor: stat.border }]}
              >
                <View style={styles.solidStatTopRow}>
                  <View
                    style={[
                      styles.solidStatLabelPill,
                      { backgroundColor: '#FFFFFF' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.solidStatLabelText,
                        { color: stat.accent },
                      ]}
                    >
                      {stat.label}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.solidStatIconCircle,
                      { backgroundColor: '#FFFFFF' },
                    ]}
                  >
                    <Ionicons
                      name={stat.mascotIcon}
                      size={18}
                      color={stat.accent}
                    />
                  </View>
                </View>

                <AnimatedCounter
                  end={stat.end}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                  duration={2000}
                  triggerKey={statsTrigger}
                  style={[styles.solidStatValue, { color: TEXT_INK }]}
                />

                <Text style={styles.solidStatSub}>{stat.subtitle}</Text>
              </LinearGradient>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ====================================================================
            8. 100% LIGHT-THEMED EVEGAH BRAND FOOTER
        ==================================================================== */}
        <LinearGradient
          colors={['#F3EEFF', '#EDE9FE', '#E4DCFA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.lightFooterContainer,
            { paddingBottom: Math.max(insets.bottom + 24, 38) },
          ]}
        >
          {/* Top Brand + Toll-Free Support Card */}
          <View style={styles.footerWhiteCard}>
            <View style={styles.footerTopRow}>
              <View style={styles.footerLogoBadge}>
                <Image
                  source={EVEGAH_LOGO}
                  style={styles.footerLogoImg}
                  contentFit="contain"
                />
              </View>

              <Pressable
                onPress={handleCallSupport}
                style={({ pressed }) => [
                  styles.footerCallBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="call" size={14} color="#FFFFFF" />
                <Text style={styles.footerCallText}>1800 889 8791</Text>
              </Pressable>
            </View>

            <Text style={styles.footerDescLight}>
              Evegah is India&apos;s trusted full-stack electric scooter rental
              and last-mile fleet mobility platform. Our mission is to make
              urban commuting and hyperlocal deliveries 100% electric,
              affordable, and hassle-free.
            </Text>

            {/* Social Media Pills */}
            <View style={styles.footerSocialRow}>
              {[
                { icon: 'logo-instagram', label: 'Instagram' },
                { icon: 'logo-linkedin', label: 'LinkedIn' },
                { icon: 'logo-facebook', label: 'Facebook' },
                { icon: 'logo-twitter', label: 'X' },
              ].map((s) => (
                <Pressable key={s.icon} style={styles.footerSocialLightBtn}>
                  <Ionicons name={s.icon} size={16} color={PURPLE_PRIMARY} />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.footerBottomMeta}>
            <Text style={styles.footerCopyrightLight}>
              © {new Date().getFullYear()} Evegah Mobility Pvt. Ltd. All rights
              reserved.
            </Text>
            <Text style={styles.footerMadeWithLove}>
              Crafted for cleaner Indian cities 🌿
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },

  /* Top Light Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_LIGHT,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: PURPLE_TINT,
    borderWidth: 1,
    borderColor: '#E2D6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenterCol: {
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: TEXT_INK,
    letterSpacing: -0.3,
  },
  topSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  topHeaderSub: {
    fontSize: 9.5,
    fontWeight: '800',
    color: TEXT_MUTED,
    letterSpacing: 0.9,
  },
  headerLogoPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  headerLogoImg: {
    width: 62,
    height: 20,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    gap: 18,
  },

  /* 1. Editorial Hero Story Card */
  heroCardOuter: {
    marginHorizontal: 16,
    backgroundColor: CARD_BG,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    shadowColor: '#240646',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  heroImageFrame: {
    width: '100%',
    height: 220,
    backgroundColor: '#EDE9FE',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTopLeftPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroTopLeftPillText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: TEXT_INK,
  },
  heroLogoWatermark: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  heroWatermarkImg: {
    width: 58,
    height: 18,
  },
  floatingQuoteBadge: {
    position: 'absolute',
    right: 18,
    bottom: -18,
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: PURPLE_VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: PURPLE_VIOLET,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  heroCardBody: {
    padding: 18,
    paddingTop: 20,
  },
  riderSpotlightTag: {
    alignSelf: 'flex-start',
    backgroundColor: PURPLE_TINT,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    marginBottom: 8,
  },
  riderSpotlightTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: PURPLE_VIOLET,
    letterSpacing: 0.7,
  },
  heroStoryTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '900',
    color: TEXT_INK,
    letterSpacing: -0.3,
  },
  quoteAccentBlock: {
    marginTop: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#DDD6FE',
  },
  heroStoryQuote: {
    fontSize: 13.5,
    lineHeight: 21,
    color: TEXT_SLATE,
    fontStyle: 'italic',
  },
  heroAuthorFooter: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3EFFA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PURPLE_TINT,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarInitials: {
    fontSize: 13,
    fontWeight: '900',
    color: PURPLE_PRIMARY,
  },
  heroStoryAuthorName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: TEXT_INK,
  },
  heroStoryAuthorRole: {
    fontSize: 11.5,
    fontWeight: '500',
    color: TEXT_MUTED,
    marginTop: 1,
  },
  loveStoriesPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PURPLE_TINT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  loveStoriesPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: PURPLE_PRIMARY,
  },

  /* Shared Section Layouts */
  sectionBlock: {
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderRowPadded: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionKickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: PURPLE_TINT,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    marginBottom: 6,
  },
  sectionKickerText: {
    fontSize: 10,
    fontWeight: '800',
    color: PURPLE_VIOLET,
    letterSpacing: 0.7,
  },
  sectionMainHeading: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    color: TEXT_INK,
    letterSpacing: -0.3,
  },

  /* 2. Values Stack */
  valuesCardsStack: {
    gap: 12,
  },
  valueInteractiveCard: {
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: BORDER_LIGHT,
    shadowColor: '#240646',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  valueCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  valueArtCircle: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  valueGoldDot: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  valueHeaderMeta: {
    flex: 1,
  },
  valueChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  valueStepNum: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  valueFeatureChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  valueFeatureChipText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  valueTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: TEXT_INK,
    letterSpacing: -0.2,
  },
  valueBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: TEXT_SLATE,
  },

  /* 3. Squad Evegah Card */
  whiteFeatureCard: {
    backgroundColor: CARD_BG,
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    shadowColor: '#240646',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  squadPhotoWrap: {
    width: '100%',
    height: 205,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#EDE9FE',
    position: 'relative',
  },
  squadPhoto: {
    width: '100%',
    height: '100%',
  },
  squadPhotoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
  },
  squadBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 10,
  },
  squadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.7,
  },
  squadParagraph: {
    fontSize: 13.5,
    lineHeight: 21,
    color: TEXT_SLATE,
    marginTop: 8,
  },
  milestoneStrip: {
    marginTop: 18,
    backgroundColor: '#F8F7FC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneCol: {
    flex: 1,
    alignItems: 'center',
  },
  milestoneYear: {
    fontSize: 15,
    fontWeight: '900',
    color: PURPLE_PRIMARY,
  },
  milestoneTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: TEXT_INK,
    marginTop: 2,
  },
  milestoneDesc: {
    fontSize: 10,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  milestoneDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2D6FA',
  },

  /* 4. Culture Carousel */
  cultureHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cultureCarousel: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  cultureSlideFrame: {
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EDE9FE',
  },
  cultureSlideImg: {
    width: '100%',
    height: '100%',
  },
  cultureTopBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  cultureTopBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: PURPLE_PRIMARY,
    letterSpacing: 0.6,
  },
  cultureCaptionGrad: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cultureCaptionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cultureDashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cultureDash: {
    width: 14,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#DDD6FE',
  },
  cultureDashActive: {
    width: 26,
    backgroundColor: PURPLE_PRIMARY,
  },
  careerBannerBtn: {
    marginTop: 16,
    backgroundColor: PURPLE_TINT,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  careerBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  careerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careerBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: TEXT_INK,
  },
  careerBannerSub: {
    fontSize: 11,
    fontWeight: '500',
    color: TEXT_SLATE,
    marginTop: 1,
  },

  /* 5. Fleet & Delivery Partners Light Card */
  partnersLightCard: {
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2D6FA',
  },
  partnersSubtext: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 19,
    color: TEXT_SLATE,
  },
  fleetBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    shadowColor: '#240646',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  fleetBannerImage: {
    width: '100%',
    height: 125,
  },
  partnerTagsRow: {
    paddingTop: 12,
    gap: 8,
  },
  partnerCategoryPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2D6FA',
  },
  partnerCategoryPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PURPLE_PRIMARY,
  },

  /* 6. Media Coverage Light Cards */
  mediaScrollContent: {
    gap: 14,
    paddingRight: 16,
  },
  mediaLightCard: {
    width: 254,
    backgroundColor: CARD_BG,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    shadowColor: '#240646',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  mediaThumbWrap: {
    width: '100%',
    height: 132,
    backgroundColor: '#EDE9FE',
    position: 'relative',
  },
  mediaThumbImg: {
    width: '100%',
    height: '100%',
  },
  mediaTagBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  mediaTagBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: PURPLE_PRIMARY,
    letterSpacing: 0.5,
  },
  mediaCardBody: {
    padding: 14,
    justifyContent: 'space-between',
    flex: 1,
  },
  mediaMetaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mediaOutletPill: {
    fontSize: 12,
    fontWeight: '900',
    color: PURPLE_VIOLET,
  },
  mediaReadTime: {
    fontSize: 11,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  mediaHeadlineLight: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '700',
    color: TEXT_INK,
  },
  mediaReadArticleRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaReadArticleText: {
    fontSize: 12,
    fontWeight: '800',
    color: PURPLE_PRIMARY,
  },

  /* 7. Solid Evegah Stats Light Pastel Cards */
  replayStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  replayStatsText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: PURPLE_PRIMARY,
  },
  statsScrollContent: {
    gap: 14,
    paddingRight: 16,
  },
  solidStatLightCard: {
    width: 254,
    minHeight: 158,
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 16,
    justifyContent: 'space-between',
  },
  solidStatTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  solidStatLabelPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  solidStatLabelText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  solidStatIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidStatValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 8,
  },
  solidStatSub: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
    color: TEXT_SLATE,
    fontWeight: '600',
  },

  /* 8. Pure Light Brand Footer */
  lightFooterContainer: {
    marginTop: 8,
    paddingTop: 22,
    paddingHorizontal: 16,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderTopColor: '#DDD6FE',
  },
  footerWhiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2D6FA',
    shadowColor: '#240646',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  footerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerLogoBadge: {
    backgroundColor: PURPLE_TINT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2D6FA',
  },
  footerLogoImg: {
    width: 72,
    height: 24,
  },
  footerCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PURPLE_PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  footerCallText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerDescLight: {
    marginTop: 14,
    fontSize: 12.5,
    lineHeight: 19,
    color: TEXT_SLATE,
  },
  footerSocialRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerSocialLightBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: PURPLE_TINT,
    borderWidth: 1,
    borderColor: '#E2D6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBottomMeta: {
    marginTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  footerCopyrightLight: {
    fontSize: 11.5,
    fontWeight: '700',
    color: TEXT_SLATE,
    textAlign: 'center',
  },
  footerMadeWithLove: {
    fontSize: 11,
    fontWeight: '600',
    color: PURPLE_PRIMARY,
  },
});