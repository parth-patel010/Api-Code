import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
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
import { requestAadhaarOtp, verifyAadhaarOtp, getKycStatus, last10 } from '../services/api';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

// Evegah Dashboard Brand Palette
const PURPLE = '#4A168C';
const PURPLE_DEEP = '#24083C';
const PURPLE_SUB = '#280D42';
const PURPLE_TINT = '#F6F0FD';
const PURPLE_BORDER = '#E7DBF8';
const TEXT_MUTED = '#6E657F';
const GREEN_SUCCESS = '#12804A';
const GREEN_BG = '#E7F7ED';

function formatAadhaarDisplay(val) {
  const str = String(val || '').trim();
  if (!str) return 'XXXX  XXXX  XXXX';
  const clean = str.replace(/\s+/g, ' ');
  if (clean.includes('X') || clean.includes('x')) {
    return clean.replace(/\s+/g, '  ');
  }
  const digits = str.replace(/\D/g, '');
  if (digits.length === 12) {
    return `XXXX  XXXX  ${digits.slice(-4)}`;
  }
  return clean;
}

// 3-Step Flow (Step 2 removed as requested)
const KYC_STEPS = [
  { id: 1, label: 'Aadhaar' },
  { id: 2, label: 'Verify' },
  { id: 3, label: 'Details' },
];

function formatAadhaarInput(val) {
  const digits = String(val || '')
    .replace(/\D/g, '')
    .slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

export default function KycScreen({
  kyc,
  profile,
  onBack,
  onStep,
  onKycComplete,
}) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1); // 1 = Enter Aadhaar, 2 = Enter OTP, 3 = Aadhaar Details

  // Form State
  const [aadhaarNumber, setAadhaarNumber] = useState(
    profile?.aadhaar ? formatAadhaarInput(profile.aadhaar) : ''
  );
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [activeOtpIdx, setActiveOtpIdx] = useState(0);
  const [resendTimer, setResendTimer] = useState(30);
  const [confirmedDetails, setConfirmedDetails] = useState(true);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccessComplete, setIsSuccessComplete] = useState(false);
  const [referenceId, setReferenceId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [verifiedRider, setVerifiedRider] = useState(null);

  const otpInputRefs = useRef([]);
  const isVerifyingRef = useRef(false);

  // Check if rider is already verified on mount
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      const phoneNum = profile?.phone || '';
      if (!phoneNum) return;
      try {
        const cleanPhone = last10(phoneNum);
        if (cleanPhone.length === 10) {
          const res = await getKycStatus(cleanPhone);
          if (isMounted && res.data?.is_verified && res.data?.rider_name) {
            setVerifiedRider({
              name: res.data.rider_name || '',
              dob: res.data.date_of_birth || '',
              gender: res.data.gender || '',
              aadhaar: res.data.aadhaar_number || '',
              address: res.data.address || '',
              avatar: res.data.photo_url || null,
              photo: res.data.photo_url || null,
              kyc_status: 'Verified',
            });
            setCurrentStep(3);
          }
        }
      } catch (_) {}
    };
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [profile?.phone]);

  // Animation values
  const floatAnim = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const progressLine = useSharedValue(0.15);
  const cardTilt = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(6, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.98, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  // Update progress line animation when step changes
  useEffect(() => {
    const target = currentStep === 1 ? 0.15 : currentStep === 2 ? 0.55 : 1.0;
    progressLine.value = withSpring(target, { damping: 15, stiffness: 120 });
  }, [currentStep]);

  // Resend OTP countdown
  useEffect(() => {
    let interval = null;
    if (currentStep === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, resendTimer]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressLine.value * 100}%`,
  }));

  // Step 1 -> Step 2: Request Aadhaar OTP from backend
  const handleContinueAadhaar = async () => {
    const raw = aadhaarNumber.replace(/\D/g, '');
    if (raw.length !== 12) {
      setErrorMessage('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    Keyboard.dismiss();
    setErrorMessage(null);
    setIsSendingOtp(true);

    try {
      const riderMobile = profile?.phone || '';
      const response = await requestAadhaarOtp(raw, riderMobile);

      const refId = response.data?.reference_id || response.reference_id;
      if (!refId) {
        throw new Error(response.message || 'Failed to initiate OTP session. Please retry.');
      }

      setReferenceId(String(refId));
      setCurrentStep(2);
      setResendTimer(30);
      setOtpValues(['', '', '', '', '', '']);
      setActiveOtpIdx(0);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 350);
    } catch (err) {
      console.warn('Aadhaar Send OTP Error:', err);
      setErrorMessage(err.message || 'Failed to send OTP to Aadhaar registered mobile.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSendingOtp) return;
    const raw = aadhaarNumber.replace(/\D/g, '');
    if (raw.length !== 12) return;
    isVerifyingRef.current = false;
    setIsVerifying(false);
    setErrorMessage(null);
    setIsSendingOtp(true);

    try {
      const riderMobile = profile?.phone || '';
      const response = await requestAadhaarOtp(raw, riderMobile);
      const refId = response.data?.reference_id || response.reference_id;
      if (refId) {
        setReferenceId(String(refId));
      }
      setResendTimer(30);
      setOtpValues(['', '', '', '', '', '']);
      setActiveOtpIdx(0);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2 -> Step 3: Verify OTP with backend & UIDAI
  const handleVerifyOtp = async () => {
    if (isVerifyingRef.current) return;
    const entered = otpValues.join('');
    if (entered.length < 6) {
      setErrorMessage('Please enter the full 6-digit OTP code');
      return;
    }
    if (!referenceId) {
      setErrorMessage('Session expired. Please restart Aadhaar verification.');
      setCurrentStep(1);
      return;
    }

    isVerifyingRef.current = true;
    Keyboard.dismiss();
    setErrorMessage(null);
    setIsVerifying(true);

    try {
      const riderMobile = profile?.phone || '';
      const response = await verifyAadhaarOtp(referenceId, entered, riderMobile);

      const data = response.data || {};
      const userPhoto = data.photo || data.photo_link || null;
      const verifiedInfo = {
        name: data.name || profile?.name || '',
        dob: data.date_of_birth || profile?.dob || '',
        gender: data.gender || profile?.gender || '',
        aadhaar: data.masked_aadhaar || formatAadhaarInput(aadhaarNumber),
        address: data.address || profile?.address || '',
        avatar: userPhoto,
        photo: userPhoto,
        care_of: data.care_of || '',
        reference_id: data.reference_id || referenceId,
        kyc_status: 'Verified',
      };

      setVerifiedRider(verifiedInfo);
      setCurrentStep(3);
      onStep?.('front');
      onStep?.('back');
      onStep?.('selfie');
    } catch (err) {
      console.warn('Aadhaar Verify OTP Error:', err);
      setErrorMessage(err.message || 'Invalid OTP code entered. Please try again.');
    } finally {
      setIsVerifying(false);
      isVerifyingRef.current = false;
    }
  };

  // Step 3 -> Proceed / Finish
  const handleProceedComplete = () => {
    if (!confirmedDetails) return;
    setIsSuccessComplete(true);
    onStep?.('front');
    onStep?.('back');
    onStep?.('selfie');
    const finalData = verifiedRider || displayUser;
    if (onKycComplete) {
      onKycComplete(finalData);
    }
    setTimeout(() => {
      onBack?.();
    }, 1200);
  };

  const handleOtpChange = (val, idx) => {
    const clean = val.replace(/\D/g, '');
    const next = [...otpValues];
    if (clean.length > 1) {
      // Pasted full OTP
      const chars = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        next[i] = chars[i] || '';
      }
      setOtpValues(next);
      setActiveOtpIdx(Math.min(5, chars.length));
      if (chars.length === 6) {
        Keyboard.dismiss();
      }
      return;
    }
    next[idx] = clean.slice(-1);
    setOtpValues(next);
    if (clean && idx < 5) {
      setActiveOtpIdx(idx + 1);
      otpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otpValues[idx] && idx > 0) {
      const next = [...otpValues];
      next[idx - 1] = '';
      setOtpValues(next);
      setActiveOtpIdx(idx - 1);
      otpInputRefs.current[idx - 1]?.focus();
    }
  };

  const rawAadhaarLen = aadhaarNumber.replace(/\D/g, '').length;
  const isAadhaarValid = rawAadhaarLen === 12;
  const isOtpComplete = otpValues.join('').length === 6;

  const displayUser = verifiedRider || {
    name: profile?.name || '',
    dob: profile?.dob || '',
    gender: profile?.gender || '',
    aadhaar: aadhaarNumber || profile?.aadhaar || '',
    address: profile?.address || '',
    avatar: profile?.avatar || null,
    photo: profile?.avatar || null,
    care_of: profile?.care_of || '',
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          hitSlop={12}
          style={styles.backBtn}
          onPress={() => {
            if (currentStep > 1) {
              setCurrentStep((s) => s - 1);
            } else {
              onBack?.();
            }
          }}
        >
          <Ionicons name="chevron-back" size={20} color={PURPLE_DEEP} />
        </Pressable>
        <Text style={styles.headerTitle}>Aadhaar e-KYC</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* 3-Step Stepper Header */}
      <View style={styles.stepperWrap}>
        <View style={styles.stepperBarBackground}>
          <Animated.View style={[styles.stepperBarFill, progressStyle]} />
        </View>

        <View style={styles.stepperRow}>
          {KYC_STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <View key={step.id} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isCurrent && styles.stepCircleCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumText,
                        (isCompleted || isCurrent) && styles.stepNumTextActive,
                      ]}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabelText,
                    (isCompleted || isCurrent) && styles.stepLabelTextActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: insets.bottom + 36 },
        ]}
      >
        {/* ============================================================== */}
        {/* PAGE 1: ENTER AADHAAR NUMBER                                    */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <Animated.View
            entering={FadeInDown.duration(320)}
            exiting={FadeOutLeft.duration(240)}
            style={styles.stepContainer}
          >
            <View style={styles.titleSection}>
              <Text style={styles.heroTitle}>Enter Aadhaar Number</Text>
              <Text style={styles.heroSubtitle}>
                We use Aadhaar e-KYC to verify your identity securely with UIDAI (via DigiLocker/Setu).
              </Text>
            </View>

            {/* 3D Realistic Aadhaar Card Illustration */}
            <Animated.View style={[styles.aadhaarCardStage, floatStyle]}>
              <LinearGradient
                colors={['#FFFFFF', '#FDFBFF', '#F9F5FD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aadhaarCardGraphic}
              >
                {/* 4 Purple Scan Focus Corners */}
                <View style={[styles.scanCorner, styles.scanCornerTL]} />
                <View style={[styles.scanCorner, styles.scanCornerTR]} />
                <View style={[styles.scanCorner, styles.scanCornerBL]} />
                <View style={[styles.scanCorner, styles.scanCornerBR]} />

                {/* Card Top: National Emblem + Tricolor Flag + UIDAI Sunburst */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.emblemBadge}>
                    <Ionicons name="shield-checkmark" size={18} color={PURPLE} />
                  </View>

                  <View style={styles.tricolorStripe}>
                    <View style={styles.stripeSaffron} />
                    <View style={styles.stripeWhite} />
                    <View style={styles.stripeGreen} />
                  </View>

                  {/* UIDAI Sunburst Logo */}
                  <View style={styles.uidaiSunWrap}>
                    <Ionicons name="sunny" size={24} color="#EA580C" />
                    <View style={styles.uidaiRedFinger}>
                      <Ionicons name="finger-print" size={13} color="#C2410C" />
                    </View>
                  </View>
                </View>

                {/* Card Body: Photo Silhouette + Info Skeuomorphic Lines */}
                <View style={styles.cardBodyRow}>
                  <View style={styles.cardPhotoBox}>
                    <Ionicons name="person" size={32} color="#94A3B8" />
                  </View>
                  <View style={styles.cardInfoLines}>
                    <View style={[styles.cardLinePlaceholder, { width: '85%' }]} />
                    <View style={[styles.cardLinePlaceholder, { width: '60%' }]} />
                    <View style={[styles.cardLinePlaceholder, { width: '70%' }]} />
                  </View>
                </View>

                {/* Card Bottom: Masked Aadhaar Digits */}
                <View style={styles.cardBottomRow}>
                  <Text style={styles.cardAadhaarPreview}>
                    {aadhaarNumber.length >= 4
                      ? `${aadhaarNumber.slice(0, 4)} XXXX ${aadhaarNumber.slice(9) || 'XXXX'}`
                      : 'XXXX XXXX XXXX'}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Input Box: Aadhaar Number */}
            <View style={styles.inputCardWrapper}>
              <Text style={styles.fieldLabel}>Aadhaar Number</Text>
              <View
                style={[
                  styles.aadhaarInputField,
                  isAadhaarValid && styles.aadhaarInputFieldValid,
                ]}
              >
                <View style={styles.fingerprintIconCircle}>
                  <Ionicons name="finger-print" size={20} color={PURPLE} />
                </View>

                <TextInput
                  value={aadhaarNumber}
                  onChangeText={(txt) => setAadhaarNumber(formatAadhaarInput(txt))}
                  keyboardType="number-pad"
                  maxLength={14}
                  placeholder="Enter 12 digit Aadhaar number"
                  placeholderTextColor="#9CA3AF"
                  style={styles.aadhaarTextInput}
                />

                {aadhaarNumber ? (
                  <Pressable
                    hitSlop={10}
                    onPress={() => setAadhaarNumber('')}
                    style={styles.clearInputBtn}
                  >
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Continue Button */}
            <Pressable
              onPress={handleContinueAadhaar}
              disabled={!isAadhaarValid || isSendingOtp}
              style={({ pressed }) => [
                styles.primaryBtn,
                (!isAadhaarValid || isSendingOtp) && styles.primaryBtnDisabled,
                pressed && isAadhaarValid && !isSendingOtp && styles.primaryBtnPressed,
              ]}
            >
              {isSendingOtp ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Sending OTP...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>

            {/* Security Guarantee Pill */}
            <View style={styles.securityPill}>
              <View style={styles.securityCheckCircle}>
                <Ionicons name="checkmark-circle" size={20} color={GREEN_SUCCESS} />
              </View>
              <View style={styles.securityCopy}>
                <Text style={styles.securityTitle}>Your data is encrypted and secure</Text>
                <Text style={styles.securitySubtitle}>
                  We follow UIDAI guidelines and do not store your Aadhaar number.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ============================================================== */}
        {/* PAGE 2: ENTER OTP (Step 2 in 3-Step Flow)                        */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <Animated.View
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(240)}
            style={styles.stepContainer}
          >
            <View style={styles.titleSection}>
              <Text style={styles.heroTitle}>Enter OTP</Text>
              <Text style={styles.heroSubtitle}>
                We have sent a 6-digit OTP to your Aadhaar linked mobile number.
              </Text>
            </View>

            {/* 3D Phone + Speech Bubble Creative Illustration */}
            <Animated.View style={[styles.otpArtStage, floatStyle]}>
              <View style={styles.otpPhoneGraphic}>
                {/* Phone Speaker Notch */}
                <View style={styles.phoneSpeaker} />

                {/* Floating OTP Speech Bubble */}
                <Animated.View style={[styles.otpSpeechBubble, pulseStyle]}>
                  <View style={styles.otpSunThumb}>
                    <Ionicons name="finger-print" size={13} color="#C2410C" />
                  </View>
                  <View style={styles.otpDotRow}>
                    <View style={styles.otpBubbleDot} />
                    <View style={styles.otpBubbleDot} />
                    <View style={styles.otpBubbleDot} />
                    <View style={styles.otpBubbleDot} />
                  </View>
                </Animated.View>
              </View>
            </Animated.View>

            {/* 6 Digit OTP Input Boxes */}
            <View style={styles.otpBoxesRow}>
              {otpValues.map((digit, idx) => {
                const isFocused = activeOtpIdx === idx;
                const isFilled = digit.length > 0;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.otpBox,
                      isFocused && styles.otpBoxFocused,
                      isFilled && styles.otpBoxFilled,
                    ]}
                  >
                    <TextInput
                      ref={(r) => {
                        otpInputRefs.current[idx] = r;
                      }}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      onFocus={() => setActiveOtpIdx(idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={styles.otpBoxText}
                    />
                  </View>
                );
              })}
            </View>

            {/* Resend OTP Row */}
            <View style={styles.resendOtpRow}>
              <Text style={styles.resendPromptText}>Didn't receive OTP? </Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendCountdownText}>
                  Resend in 00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                </Text>
              ) : (
                <Pressable
                  hitSlop={8}
                  disabled={isSendingOtp}
                  onPress={handleResendOtp}
                >
                  <Text style={[styles.resendActionText, isSendingOtp && { opacity: 0.5 }]}>
                    {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  {/expired|reference|busy|source|again/i.test(errorMessage) ? (
                    <Pressable
                      onPress={handleResendOtp}
                      disabled={isSendingOtp}
                      style={styles.retryResendBtn}
                    >
                      <Ionicons name="refresh" size={13} color="#B91C1C" />
                      <Text style={styles.retryResendText}>
                        {isSendingOtp ? 'Sending New OTP...' : 'Request Fresh OTP'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Verify & Proceed Button */}
            <Pressable
              onPress={handleVerifyOtp}
              disabled={!isOtpComplete || isVerifying}
              style={({ pressed }) => [
                styles.primaryBtn,
                (!isOtpComplete || isVerifying) && styles.primaryBtnDisabled,
                pressed && isOtpComplete && !isVerifying && styles.primaryBtnPressed,
              ]}
            >
              {isVerifying ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Verifying with UIDAI...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Verify OTP</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>

            {/* Change Aadhaar Number Shortcut */}
            <Pressable
              hitSlop={8}
              onPress={() => setCurrentStep(1)}
              style={styles.changeAadhaarLinkRow}
            >
              <Ionicons name="create-outline" size={15} color={PURPLE} />
              <Text style={styles.changeAadhaarLinkText}>Change Aadhaar Number</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ============================================================== */}
        {/* PAGE 3: AADHAAR DETAILS (Step 3 in 3-Step Flow)                  */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <Animated.View
            entering={FadeInRight.duration(300)}
            style={styles.stepContainer}
          >
            {/* Top Success Banner */}
            <View style={styles.successBannerCard}>
              <View style={styles.successCheckCircle}>
                <Ionicons name="checkmark-circle" size={26} color={GREEN_SUCCESS} />
              </View>
              <View style={styles.successBannerCopy}>
                <Text style={styles.successBannerTitle}>Aadhaar Verified Successfully</Text>
                <Text style={styles.successBannerSub}>
                  Details fetched from UIDAI via DigiLocker.
                </Text>
              </View>
            </View>

            {/* Real Aadhaar Card (Front Face) */}
            <View style={styles.aadhaarCardRealFront}>
              {/* Government Header */}
              <View style={styles.aadhaarGovHeader}>
                <View style={styles.emblemCol}>
                  <View style={styles.emblemBadge}>
                    <Ionicons name="shield-checkmark" size={17} color={PURPLE} />
                  </View>
                  <View style={styles.govTextWrap}>
                    <Text style={styles.govHindiText}>भारत सरकार</Text>
                    <Text style={styles.govEngText}>GOVERNMENT OF INDIA</Text>
                  </View>
                </View>

                <View style={styles.uidaiCol}>
                  <View style={styles.uidaiTextWrap}>
                    <Text style={styles.uidaiHindiText}>भारतीय विशिष्ट पहचान प्राधिकरण</Text>
                    <Text style={styles.uidaiEngText}>UIDAI - Government of India</Text>
                  </View>
                  <View style={styles.uidaiSunWrap}>
                    <Ionicons name="sunny" size={20} color="#EA580C" />
                    <View style={styles.uidaiRedFinger}>
                      <Ionicons name="finger-print" size={11} color="#C2410C" />
                    </View>
                  </View>
                </View>
              </View>

              {/* Tricolor Stripe */}
              <View style={styles.aadhaarTricolorStripe}>
                <View style={styles.stripeSaff} />
                <View style={styles.stripeWht} />
                <View style={styles.stripeGrn} />
              </View>

              {/* Main Card Content */}
              <View style={styles.aadhaarMainContent}>
                {/* Left: Real Photo from UIDAI */}
                <View style={styles.aadhaarPhotoWrap}>
                  {displayUser.avatar || displayUser.photo ? (
                    <Image
                      source={{ uri: displayUser.avatar || displayUser.photo }}
                      style={styles.aadhaarRealPhoto}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.aadhaarPhotoPlaceholder}>
                      <Ionicons name="person" size={38} color="#94A3B8" />
                      <View style={styles.aadhaarPhotoVerifyBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={GREEN_SUCCESS} />
                      </View>
                    </View>
                  )}
                </View>

                {/* Middle: Real Extracted Details */}
                <View style={styles.aadhaarInfoCol}>
                  <Text style={styles.aadhaarLabelHindi}>नाम / Name</Text>
                  <Text style={styles.aadhaarValName} numberOfLines={2}>
                    {displayUser.name || 'Verified Citizen'}
                  </Text>

                  <Text style={styles.aadhaarLabelHindi}>जन्म तिथि / DOB</Text>
                  <Text style={styles.aadhaarValText}>
                    {displayUser.dob || 'Verified by UIDAI'}
                  </Text>

                  <Text style={styles.aadhaarLabelHindi}>लिंग / Gender</Text>
                  <Text style={styles.aadhaarValText}>
                    {displayUser.gender || 'Verified'}
                  </Text>

                  {displayUser.care_of ? (
                    <>
                      <Text style={styles.aadhaarLabelHindi}>आत्मज / C/O</Text>
                      <Text style={styles.aadhaarValText} numberOfLines={1}>
                        {displayUser.care_of}
                      </Text>
                    </>
                  ) : null}
                </View>

                {/* Right: Secure QR Code Representation */}
                <View style={styles.aadhaarQrWrap}>
                  <View style={styles.aadhaarQrGraphic}>
                    <Ionicons name="qr-code-outline" size={36} color="#0F172A" />
                  </View>
                  <Text style={styles.aadhaarQrLabel}>Offline e-KYC</Text>
                </View>
              </View>

              {/* Bottom: Big Masked Aadhaar Number */}
              <View style={styles.aadhaarNumberRow}>
                <Text style={styles.aadhaarBigNumber}>
                  {formatAadhaarDisplay(displayUser.aadhaar)}
                </Text>
              </View>

              {/* Signature Tagline */}
              <View style={styles.aadhaarTaglineRow}>
                <Text style={styles.aadhaarTaglineText}>
                  मेरा आधार, मेरी पहचान
                </Text>
              </View>
            </View>

            {/* Real Aadhaar Card (Back Face: Residential Address) */}
            <View style={styles.aadhaarCardRealBack}>
              <View style={styles.aadhaarBackHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location" size={16} color="#DC2626" />
                  <Text style={styles.aadhaarBackTitle}>पता / Address</Text>
                </View>
                <View style={styles.aadhaarDocVerifiedBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#15803D" />
                  <Text style={styles.aadhaarDocVerifiedText}>UIDAI Verified</Text>
                </View>
              </View>

              {/* Tricolor Stripe on Back */}
              <View style={[styles.aadhaarTricolorStripe, { marginVertical: 4 }]} />

              <Text style={styles.aadhaarAddressText}>
                {displayUser.address || 'Address verified and linked to UIDAI record.'}
              </Text>

              <View style={styles.aadhaarVerifiedPill}>
                <Ionicons name="checkmark-circle" size={15} color="#10B981" />
                <Text style={styles.aadhaarVerifiedPillText}>
                  Cryptographically Verified via Sandbox.co.in OKYC
                </Text>
              </View>
            </View>

            {/* Confirmation Checkbox */}
            <Pressable
              onPress={() => setConfirmedDetails((v) => !v)}
              style={styles.confirmCheckRow}
            >
              <View
                style={[
                  styles.confirmCheckbox,
                  confirmedDetails && styles.confirmCheckboxActive,
                ]}
              >
                {confirmedDetails ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <Text style={styles.confirmCheckText}>
                I confirm that the above details are correct and belong to me.
              </Text>
            </Pressable>

            {/* Final Proceed Button */}
            <Pressable
              onPress={handleProceedComplete}
              disabled={!confirmedDetails || isSuccessComplete}
              style={({ pressed }) => [
                styles.primaryBtn,
                (!confirmedDetails || isSuccessComplete) && styles.primaryBtnDisabled,
                pressed && confirmedDetails && styles.primaryBtnPressed,
              ]}
            >
              {isSuccessComplete ? (
                <>
                  <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>KYC Verified!</Text>
                </>
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Proceed</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F6FC',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBF6',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7F3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PURPLE_DEEP,
    letterSpacing: -0.3,
  },
  headerRightPlaceholder: {
    width: 38,
  },

  /* 3-Step Stepper Component */
  stepperWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE7F6',
    position: 'relative',
  },
  stepperBarBackground: {
    position: 'absolute',
    top: 29,
    left: 48,
    right: 48,
    height: 3,
    backgroundColor: '#EBE4F4',
    borderRadius: 2,
    zIndex: 1,
  },
  stepperBarFill: {
    height: '100%',
    backgroundColor: PURPLE,
    borderRadius: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  stepItem: {
    alignItems: 'center',
    width: 60,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4C9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleCompleted: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  stepCircleCurrent: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A819C',
  },
  stepNumTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepLabelText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8A819C',
  },
  stepLabelTextActive: {
    color: PURPLE_DEEP,
    fontWeight: '800',
  },

  /* Scroll Body */
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  stepContainer: {
    width: '100%',
  },
  titleSection: {
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PURPLE_DEEP,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_MUTED,
    fontWeight: '500',
    textAlign: 'center',
  },

  /* 3D Realistic Aadhaar Card Illustration */
  aadhaarCardStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  aadhaarCardGraphic: {
    width: Math.min(SCREEN_W - 36, 320),
    height: 194,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE7F6',
    padding: 16,
    position: 'relative',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  scanCorner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: PURPLE,
  },
  scanCornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  scanCornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  scanCornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  scanCornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emblemBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tricolorStripe: {
    width: 80,
    height: 14,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  stripeSaffron: {
    height: 4.5,
    backgroundColor: '#FF9933',
  },
  stripeWhite: {
    height: 4.5,
    backgroundColor: '#FFFFFF',
  },
  stripeGreen: {
    height: 4.5,
    backgroundColor: '#138808',
  },
  uidaiSunWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  uidaiRedFinger: {
    position: 'absolute',
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
  },
  cardPhotoBox: {
    width: 52,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardInfoLines: {
    flex: 1,
    gap: 7,
  },
  cardLinePlaceholder: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  cardBottomRow: {
    marginTop: 22,
    alignItems: 'center',
  },
  cardAadhaarPreview: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 2.2,
  },

  /* Input Box */
  inputCardWrapper: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE_DEEP,
    marginBottom: 8,
  },
  aadhaarInputField: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DFD7EC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: '#24083C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  aadhaarInputFieldValid: {
    borderColor: PURPLE,
    backgroundColor: '#FCFAFF',
  },
  fingerprintIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F5EEFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aadhaarTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: PURPLE_DEEP,
    letterSpacing: 1.2,
  },
  clearInputBtn: {
    padding: 4,
  },

  /* Primary Button */
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: PURPLE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: '#C8B9DC',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* Security Pill */
  securityPill: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF6',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GREEN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityCopy: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE_DEEP,
  },
  securitySubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    lineHeight: 16,
    color: TEXT_MUTED,
  },

  /* PAGE 2: OTP STYLES */
  otpArtStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  otpPhoneGraphic: {
    width: 108,
    height: 142,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: PURPLE,
    alignItems: 'center',
    paddingTop: 10,
    position: 'relative',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  phoneSpeaker: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  otpSpeechBubble: {
    position: 'absolute',
    top: 36,
    right: -24,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE7F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  otpSunThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDotRow: {
    flexDirection: 'row',
    gap: 3,
  },
  otpBubbleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: PURPLE,
  },

  /* OTP Boxes */
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DFD7EC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#24083C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  otpBoxFocused: {
    borderColor: PURPLE,
    backgroundColor: '#FCFAFF',
    shadowColor: PURPLE,
    shadowOpacity: 0.2,
    elevation: 3,
  },
  otpBoxFilled: {
    borderColor: PURPLE,
    backgroundColor: '#FAF5FF',
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '800',
    color: PURPLE_DEEP,
    textAlign: 'center',
    width: '100%',
  },
  resendOtpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resendPromptText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  resendCountdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE,
  },
  resendActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: PURPLE,
  },
  changeAadhaarLinkRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  changeAadhaarLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE,
  },

  /* PAGE 3: AADHAAR DETAILS STYLES */
  successBannerCard: {
    borderRadius: 16,
    backgroundColor: GREEN_BG,
    borderWidth: 1,
    borderColor: '#B7E8C9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  successCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBannerCopy: {
    flex: 1,
  },
  successBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D6838',
  },
  successBannerSub: {
    marginTop: 1,
    fontSize: 11.5,
    color: '#12804A',
    fontWeight: '500',
  },
  detailsCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE7F6',
    padding: 16,
    shadowColor: '#24083C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 18,
  },
  detailsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  detailsCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PURPLE_DEEP,
  },
  editDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F5EEFC',
  },
  editDetailsText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PURPLE,
  },
  detailsUserRow: {
    flexDirection: 'row',
    gap: 14,
  },
  detailsAvatarImage: {
    width: 68,
    height: 78,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  detailsUserMeta: {
    flex: 1,
    gap: 7,
  },
  detailFieldBlock: {},
  detailFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A819C',
  },
  detailFieldValueName: {
    marginTop: 1,
    fontSize: 15,
    fontWeight: '800',
    color: PURPLE_DEEP,
  },
  detailFieldValue: {
    marginTop: 1,
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE_SUB,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#F3EEFA',
    marginVertical: 14,
  },
  detailsFieldSection: {},
  detailFieldValueAadhaar: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: '800',
    color: PURPLE_DEEP,
    letterSpacing: 1.4,
  },
  detailsAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailFieldValueAddress: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: PURPLE_SUB,
  },
  locationPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5EEFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  /* Confirmation Checkbox */
  confirmCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  confirmCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.8,
    borderColor: '#C4B5DC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  confirmCheckboxActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  confirmCheckText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    color: PURPLE_SUB,
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
    lineHeight: 18,
  },
  retryResendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  retryResendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
    textDecorationLine: 'underline',
  },

  /* Real Aadhaar Card UI (Front) */
  aadhaarCardRealFront: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4CEBF',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#1A0E2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  aadhaarGovHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE1',
  },
  emblemCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  govTextWrap: {
    justifyContent: 'center',
  },
  govHindiText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  govEngText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.4,
  },
  uidaiCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uidaiTextWrap: {
    alignItems: 'flex-end',
  },
  uidaiHindiText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C2410C',
  },
  uidaiEngText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#475569',
  },
  aadhaarTricolorStripe: {
    height: 3,
    flexDirection: 'row',
    marginVertical: 6,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  stripeSaff: { flex: 1, backgroundColor: '#FF9933' },
  stripeWht: { flex: 1, backgroundColor: '#FFFFFF' },
  stripeGrn: { flex: 1, backgroundColor: '#138808' },

  aadhaarMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  aadhaarPhotoWrap: {
    width: 80,
    height: 98,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aadhaarRealPhoto: {
    width: '100%',
    height: '100%',
  },
  aadhaarPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  aadhaarPhotoVerifyBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  aadhaarInfoCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  aadhaarLabelHindi: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
  },
  aadhaarValName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  aadhaarValText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  aadhaarQrWrap: {
    width: 58,
    height: 62,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  aadhaarQrGraphic: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
  },
  aadhaarQrLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: '#475569',
    marginTop: 2,
  },

  aadhaarNumberRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  aadhaarBigNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 2.5,
  },
  aadhaarTaglineRow: {
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  aadhaarTaglineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: 0.8,
  },

  /* Real Aadhaar Card (Back: Address) */
  aadhaarCardRealBack: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D4CEBF',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#1A0E2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  aadhaarBackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aadhaarBackTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  aadhaarDocVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aadhaarDocVerifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  aadhaarAddressText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#334155',
    fontWeight: '600',
    paddingVertical: 4,
  },
  aadhaarVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    gap: 6,
  },
  aadhaarVerifiedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
});

