import { useState } from 'react';
import {
  Modal,
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
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PURPLE = '#4A168C';
const DARK_TEXT = '#24083C';
const SUB_TEXT = '#280D42';
const GENDERS = ['Male', 'Female', 'Other'];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
];

function formatDob(value) {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join('/');
}

function formatAadhaar(value) {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 12);
  return [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 12)]
    .filter(Boolean)
    .join(' ');
}

function FloatingFieldBox({ label, children, style }) {
  return (
    <View style={[styles.fieldBoxWrap, style]}>
      <View style={styles.floatingLabelPill}>
        <Text style={styles.floatingLabelText}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

export default function EditProfileScreen({ profile, onBack, onSave }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(
    String(profile?.phone || '').replace(/^\+91\s*/, '')
  );
  const [editingPhone, setEditingPhone] = useState(false);
  const [dob, setDob] = useState(profile?.dob || '');
  const [gender, setGender] = useState(profile?.gender || 'Male');
  const [genderModalOpen, setGenderModalOpen] = useState(false);
  const [address, setAddress] = useState(profile?.address || '');
  const [aadhaar, setAadhaar] = useState(profile?.aadhaar || '');
  const [avatarIdx, setAvatarIdx] = useState(profile?.avatarIndex || 0);
  const [savedToast, setSavedToast] = useState(false);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const cycleAvatar = () => {
    setAvatarIdx((prev) => (prev + 1) % AVATAR_PRESETS.length);
  };

  const save = () => {
    const nextName = name.trim();
    if (!nextName) return;
    const cleanPhone = phone.trim()
      ? (phone.trim().startsWith('+91') ? phone.trim() : `+91 ${phone.trim()}`)
      : (profile?.phone || '');
    setSavedToast(true);
    setTimeout(() => {
      onSave?.({
        name: nextName,
        phone: cleanPhone,
        gender,
        dob,
        address: address.trim(),
        aadhaar: aadhaar.trim(),
        avatarIndex: avatarIdx,
      });
    }, 320);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Bar: Circular Back Arrow + Centered "Your Profile" */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} style={styles.backCircleBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={DARK_TEXT} />
        </Pressable>
        <Text style={styles.headerTitle}>Your Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
      >
        {/* Main Profile Card with Top Center Curved Dome / Arch for Avatar */}
        <View style={styles.profileCardContainer}>
          {/* Top Center Dome Arch + Circular Profile Pic + Edit Badge */}
          <View style={styles.domeAvatarAnchor}>
            <View style={styles.domeOuterArch}>
              <Pressable onPress={cycleAvatar} style={styles.avatarRingWrap}>
                <Image
                  source={{ uri: AVATAR_PRESETS[avatarIdx] }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="pencil" size={14} color={PURPLE} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* White Card Body */}
          <View style={styles.whiteFormCard}>
            {/* 1. Full Name */}
            <FloatingFieldBox label="Full Name">
              <View style={styles.fieldRowInner}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter full name"
                  placeholderTextColor="#9D96AD"
                  style={styles.fieldInput}
                />
                {name.length > 0 ? (
                  <Pressable hitSlop={8} onPress={() => setName('')}>
                    <Ionicons name="close-outline" size={20} color="#7A7389" />
                  </Pressable>
                ) : null}
              </View>
            </FloatingFieldBox>

            {/* 2. Mobile */}
            <FloatingFieldBox label="Mobile">
              <View style={styles.fieldRowInner}>
                <TextInput
                  value={phone}
                  onChangeText={(v) =>
                    setPhone(v.replace(/\D/g, '').slice(0, 10))
                  }
                  editable={editingPhone}
                  keyboardType="phone-pad"
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#9D96AD"
                  style={styles.fieldInput}
                />
                <Pressable
                  hitSlop={8}
                  onPress={() => setEditingPhone((v) => !v)}
                >
                  <Text style={styles.changeActionText}>
                    {editingPhone ? 'DONE' : 'CHANGE'}
                  </Text>
                </Pressable>
              </View>
            </FloatingFieldBox>

            {/* 3. Date of birth */}
            <FloatingFieldBox label="Date of birth">
              <View style={styles.fieldRowInner}>
                <TextInput
                  value={dob}
                  onChangeText={(v) => setDob(formatDob(v))}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9D96AD"
                  keyboardType="number-pad"
                  style={styles.fieldInput}
                />
                <Ionicons name="calendar-outline" size={19} color="#7A7389" />
              </View>
            </FloatingFieldBox>

            {/* 4. Gender */}
            <FloatingFieldBox label="Gender">
              <Pressable
                onPress={() => setGenderModalOpen(true)}
                style={styles.fieldRowInner}
              >
                <Text style={styles.fieldValueText}>
                  {gender || 'Select Gender'}
                </Text>
                <View style={styles.genderInlinePills}>
                  {GENDERS.map((g) => {
                    const active = gender === g;
                    return (
                      <Pressable
                        key={g}
                        onPress={() => setGender(g)}
                        style={[
                          styles.genderMiniChip,
                          active && styles.genderMiniChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.genderMiniChipText,
                            active && styles.genderMiniChipTextActive,
                          ]}
                        >
                          {g}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Pressable>
            </FloatingFieldBox>

            {/* 5. Aadhaar Card Number */}
            <FloatingFieldBox label="Aadhaar Card Number">
              <View style={styles.fieldRowInner}>
                <TextInput
                  value={aadhaar}
                  onChangeText={(v) => setAadhaar(formatAadhaar(v))}
                  placeholder="XXXX XXXX XXXX"
                  placeholderTextColor="#9D96AD"
                  keyboardType="number-pad"
                  style={styles.fieldInput}
                />
                <View style={styles.aadhaarVerifiedPill}>
                  <Ionicons
                    name="shield-checkmark"
                    size={13}
                    color="#15803D"
                  />
                  <Text style={styles.aadhaarVerifiedText}>KYC</Text>
                </View>
              </View>
            </FloatingFieldBox>

            {/* 6. Address */}
            <FloatingFieldBox label="Address">
              <View style={[styles.fieldRowInner, styles.addressRowInner]}>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your residential address"
                  placeholderTextColor="#9D96AD"
                  multiline
                  style={[styles.fieldInput, styles.addressInput]}
                />
                {address.length > 0 ? (
                  <Pressable hitSlop={8} onPress={() => setAddress('')}>
                    <Ionicons name="close-outline" size={20} color="#7A7389" />
                  </Pressable>
                ) : null}
              </View>
            </FloatingFieldBox>
          </View>
        </View>
      </ScrollView>

      {/* Saved Confirmation Toast */}
      {savedToast ? (
        <Animated.View
          entering={FadeInDown.duration(220)}
          style={[styles.savedToastPill, { bottom: insets.bottom + 84 }]}
        >
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
          <Text style={styles.savedToastText}>Profile updated!</Text>
        </Animated.View>
      ) : null}

      {/* Bottom Sticky Footer: Update profile */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <Pressable
          onPress={save}
          onPressIn={() => {
            btnScale.value = withSpring(0.97, { damping: 18, stiffness: 280 });
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, { damping: 14, stiffness: 220 });
          }}
        >
          <Animated.View
            style={[
              styles.updateBtn,
              !name.trim() && styles.updateBtnDisabled,
              btnStyle,
            ]}
          >
            <Text
              style={[
                styles.updateBtnText,
                !name.trim() && styles.updateBtnTextDisabled,
              ]}
            >
              Update profile
            </Text>
          </Animated.View>
        </Pressable>
      </View>

      {/* Gender Modal Picker */}
      <Modal
        visible={genderModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGenderModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setGenderModalOpen(false)}
        >
          <View style={styles.genderSheetCard}>
            <Text style={styles.genderSheetTitle}>Select Gender</Text>
            {GENDERS.map((g) => {
              const active = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => {
                    setGender(g);
                    setGenderModalOpen(false);
                  }}
                  style={[
                    styles.genderOptionRow,
                    active && styles.genderOptionRowActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      active && { color: PURPLE, fontWeight: '800' },
                    ]}
                  >
                    {g}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={PURPLE}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F1F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK_TEXT,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 58,
  },
  profileCardContainer: {
    position: 'relative',
  },
  domeAvatarAnchor: {
    position: 'absolute',
    top: -48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  domeOuterArch: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarRingWrap: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#F3E8FF',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 98,
    height: 98,
    borderRadius: 49,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E9DDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 4,
  },
  whiteFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 72,
    paddingBottom: 22,
    gap: 18,
    shadowColor: '#1A0B2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  fieldBoxWrap: {
    borderWidth: 1.2,
    borderColor: '#E3DFEC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    minHeight: 54,
    justifyContent: 'center',
    position: 'relative',
  },
  floatingLabelPill: {
    position: 'absolute',
    top: -9,
    left: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 5,
  },
  floatingLabelText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8E889E',
  },
  fieldRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: DARK_TEXT,
    paddingVertical: 10,
  },
  fieldValueText: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK_TEXT,
    paddingVertical: 12,
  },
  changeActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PURPLE,
    letterSpacing: 0.3,
  },
  genderInlinePills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  genderMiniChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F5F2FA',
    borderWidth: 1,
    borderColor: '#E6E0F0',
  },
  genderMiniChipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  genderMiniChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: SUB_TEXT,
  },
  genderMiniChipTextActive: {
    color: '#FFFFFF',
  },
  aadhaarVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  aadhaarVerifiedText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },
  addressRowInner: {
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  addressInput: {
    minHeight: 54,
    textAlignVertical: 'top',
  },
  savedToastPill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#15803D',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  savedToastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE5F2',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  updateBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  updateBtnDisabled: {
    backgroundColor: '#E9E5F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  updateBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  updateBtnTextDisabled: {
    color: '#9C95AC',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 8, 36, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  genderSheetCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  genderSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK_TEXT,
    marginBottom: 10,
  },
  genderOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  genderOptionRowActive: {
    backgroundColor: '#F5EFFE',
  },
  genderOptionText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: DARK_TEXT,
  },
});
