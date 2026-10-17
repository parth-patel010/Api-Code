import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardEnter } from '../utils/cardEnter';
const SUPPORT_ART = require('../assets/help/support-art.png');

const PURPLE = '#4A168C';
const PHONE = '+918980966376';
const EMAIL = 'support@evegah.com';

const FAQS = [
  { q: 'How do I unlock a scooter?', a: 'Open Scan and tap the frame, or unlock a scooter next to you from Bluetooth.' },
  { q: 'What if the battery dies mid-ride?', a: 'If the battery drops below 10%, park in a zone and end the ride. You can swap scooters.' },
  { q: 'Where should I park?', a: 'Park in an Evegah zone shown on the map.' },
  { q: 'How do I top up my wallet?', a: 'Open Wallet, add an amount, and pay with UPI or card.' },
  { q: 'How do I cancel a booking?', a: 'Call or email support. They will help with the booking.' },
  { q: 'How can I change my pickup time?', a: 'Set the time on the rent page before you pay. After that, call support.' },
  { q: 'How does the security deposit work?', a: 'The deposit is ₹250 and refundable. Pay it at checkout, or later before pickup.' },
  { q: 'What if the scooter has a problem?', a: 'Park in a zone, end the ride, and call support.' },
];

const PROMPTS = ['Unlock', 'Parking', 'Wallet', 'Deposit'];

function replyFor(text) {
  const q = String(text || '').toLowerCase();
  if (q.includes('unlock') || q.includes('scan') || q.includes('bluetooth')) {
    return 'Open Scan and frame the code, or connect from Bluetooth if the scooter is beside you.';
  }
  if (q.includes('battery') || q.includes('charge')) {
    return 'If the battery falls under 10%, park in a zone and end the ride. You can take another scooter.';
  }
  if (q.includes('park') || q.includes('zone')) {
    return 'Park inside an Evegah zone on the map so the ride can close cleanly.';
  }
  if (q.includes('wallet') || q.includes('upi') || q.includes('pay')) {
    return 'Open Wallet, choose an amount, and pay with UPI. The balance is ready for the next ride.';
  }
  if (q.includes('cancel') || q.includes('booking')) {
    return 'Share the booking id here, or call +91 89809 66376 and the team will close it.';
  }
  if (q.includes('deposit')) {
    return 'The security deposit is ₹250. It is paid at checkout and returned after a clean ride.';
  }
  if (q.includes('helmet')) {
    return 'A helmet is included with the ride and shows on your bill.';
  }
  return 'I can help with unlocking, parking, the wallet, or a booking. You can also call +91 89809 66376.';
}

export default function HelpScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const [chatOn, setChatOn] = useState(false);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'hi', from: 'team', text: 'Hi, this is Evegah support. Ask about a ride, the wallet, or parking.' },
  ]);
  const needle = String(query || '').trim().toLowerCase();
  const visible = FAQS.filter((item) => String(item?.q || '').toLowerCase().includes(needle) || String(item?.a || '').toLowerCase().includes(needle));

  const send = (text) => {
    const body = text.trim();
    if (!body || typing) return;
    const mine = { id: `${Date.now()}`, from: 'me', text: body };
    setMessages((list) => [...list, mine]);
    setDraft('');
    setTyping(true);
    setTimeout(() => {
      setMessages((list) => [...list, { id: `${Date.now()}-r`, from: 'team', text: replyFor(body) }]);
      setTyping(false);
    }, 700);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={8} style={styles.back} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <Animated.View entering={cardEnter(0)} style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>SUPPORT</Text>
            <Text style={styles.title}>We're here to help</Text>
            <Text style={styles.subtitle}>Mon – Sun, 8:00 AM to 10:00 PM</Text>
          </View>
          <Image source={SUPPORT_ART} style={styles.heroArt} contentFit="contain" contentPosition="right" />
        </Animated.View>

        <Pressable onPress={() => setChatOn(true)}>
          <LinearGradient
            colors={['#7C3AED', '#6D28D9', '#5B21B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.live}
          >
            <View style={styles.liveIcon}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.liveCopy}>
              <Text style={styles.liveTitle}>Live chat</Text>
              <Text style={styles.liveText}>Talk with support about a ride</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        <View style={styles.contacts}>
          <Pressable style={styles.contact} onPress={() => Linking.openURL(`tel:${PHONE}`)}>
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={18} color={PURPLE} />
            </View>
            <Text style={styles.contactTitle}>Call</Text>
            <Text style={styles.contactText}>+91 89809 66376</Text>
          </Pressable>
          <Pressable style={styles.contact} onPress={() => Linking.openURL(`mailto:${EMAIL}`)}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={18} color={PURPLE} />
            </View>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactText}>support@evegah.com</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#8A8496" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search questions"
            placeholderTextColor="#A39AAD"
            style={styles.field}
          />
        </View>

        <Text style={styles.section}>Frequently asked questions</Text>
        <Animated.View layout={LinearTransition.duration(320)} entering={cardEnter(2)} style={styles.list}>
          {visible.length === 0 ? (
            <Text style={styles.empty}>No matching question.</Text>
          ) : (
            visible.map((item, index) => {
              const on = open === item.q;
              return (
                <Animated.View
                  key={item.q}
                  layout={LinearTransition.duration(320).easing(Easing.out(Easing.cubic))}
                  style={[styles.row, index > 0 && styles.rowLine]}
                >
                  <Pressable onPress={() => setOpen(on ? null : item.q)}>
                    <View style={styles.rowTop}>
                      <Text style={styles.question}>{item.q}</Text>
                      <Ionicons name={on ? 'chevron-up' : 'chevron-down'} size={16} color="#8A8496" />
                    </View>
                    {on ? (
                      <Animated.Text
                        entering={FadeInDown.duration(320).easing(Easing.out(Easing.cubic))}
                        style={styles.answer}
                      >
                        {item.a}
                      </Animated.Text>
                    ) : null}
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>

      {/* Full-Screen Live Chat Popup Modal */}
      <Modal
        visible={chatOn}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setChatOn(false)}
      >
        <KeyboardAvoidingView
          style={styles.chatRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <StatusBar style="light" />
          {/* Luxury Brand Purple Header */}
          <LinearGradient
            colors={['#25084A', '#4A168C', '#6B21A8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.chatHead, { paddingTop: Math.max(insets.top + 6, 20) }]}
          >
            <Pressable
              hitSlop={10}
              style={styles.chatBackBtn}
              onPress={() => setChatOn(false)}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.chatHeadInfo}>
              <View style={styles.chatTitleRow}>
                <Text style={styles.chatTitle}>Evegah Live Support</Text>
                <View style={styles.activeDot} />
              </View>
              <Text style={styles.chatSub}>Online • Dedicated Concierge</Text>
            </View>

            <Pressable
              hitSlop={10}
              style={styles.chatPhoneBtn}
              onPress={() => Linking.openURL(`tel:${PHONE}`)}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={styles.thread}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.chatDateBadge}>
              <Text style={styles.chatDateText}>Today</Text>
            </View>

            {messages.map((item) => {
              const isMe = item.from === 'me';
              return (
                <View
                  key={item.id}
                  style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowTeam]}
                >
                  {!isMe ? (
                    <LinearGradient
                      colors={['#4A168C', '#7C3AED']}
                      style={styles.teamAvatar}
                    >
                      <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                    </LinearGradient>
                  ) : null}

                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleTeam,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isMe && styles.bubbleTextMe,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            })}

            {typing ? (
              <View style={[styles.msgRow, styles.msgRowTeam]}>
                <LinearGradient
                  colors={['#4A168C', '#7C3AED']}
                  style={styles.teamAvatar}
                >
                  <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                </LinearGradient>
                <View style={[styles.bubble, styles.bubbleTeam, styles.typingBubble]}>
                  <Text style={styles.typing}>Concierge is typing…</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.promptSection}>
              <Text style={styles.promptHeading}>Quick Suggestions</Text>
              <View style={styles.prompts}>
                {PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    style={styles.prompt}
                    onPress={() => send(prompt)}
                  >
                    <Ionicons name="sparkles" size={12} color={PURPLE} />
                    <Text style={styles.promptText}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.composer,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask Evegah support anything…"
              placeholderTextColor="#9CA3AF"
              style={styles.composerField}
              onSubmitEditing={() => send(draft)}
            />
            <Pressable
              style={[styles.send, !draft.trim() && styles.sendDisabled]}
              onPress={() => send(draft)}
              disabled={!draft.trim()}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F4FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#1C1C1C',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSide: {
    width: 36,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#F3EEFB',
    borderRadius: 24,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 8,
    minHeight: 118,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroCopy: {
    flex: 1,
    zIndex: 1,
  },
  heroArt: {
    width: 176,
    height: 128,
  },
  kicker: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 6,
    color: '#1C1430',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    color: '#6E6878',
    fontSize: 13,
  },
  live: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveCopy: {
    flex: 1,
  },
  liveTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  liveText: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
  },
  contacts: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  contact: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '800',
  },
  contactText: {
    color: '#6E6878',
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrap: {
    marginTop: 14,
    marginHorizontal: 16,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  field: {
    flex: 1,
    color: '#1C1C1C',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    marginHorizontal: 18,
    color: '#1C1430',
    fontSize: 18,
    fontWeight: '800',
  },
  list: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  empty: {
    paddingVertical: 18,
    color: '#8A8496',
    textAlign: 'center',
  },
  row: {
    paddingVertical: 14,
  },
  rowLine: {
    borderTopWidth: 1,
    borderTopColor: '#F4F1F7',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  question: {
    flex: 1,
    color: '#1C1C1C',
    fontSize: 14,
    fontWeight: '700',
  },
  answer: {
    marginTop: 8,
    color: '#6E6878',
    fontSize: 13,
    lineHeight: 19,
  },
  chatRoot: {
    flex: 1,
    backgroundColor: '#F8F7FD',
  },
  chatHead: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#25084A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  chatBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeadInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  chatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  chatSub: {
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 11.5,
    fontWeight: '500',
  },
  chatPhoneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thread: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  chatDateBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#EBE7F7',
    marginBottom: 6,
  },
  chatDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B21A8',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowTeam: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  msgRowMe: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
  },
  teamAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTeam: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#ECE8F7',
    shadowColor: '#25084A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bubbleMe: {
    backgroundColor: PURPLE,
    borderBottomRightRadius: 4,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },
  bubbleText: {
    color: '#1E1B26',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  bubbleTextMe: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  typingBubble: {
    paddingVertical: 8,
  },
  typing: {
    color: '#7C3AED',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  promptSection: {
    marginTop: 10,
    paddingTop: 8,
  },
  promptHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  prompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E3D7FA',
    shadowColor: '#25084A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  promptText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: '700',
  },
  composer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECE8F7',
  },
  composerField: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F3F0FA',
    paddingHorizontal: 16,
    color: '#1E1B26',
    fontSize: 14,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  sendDisabled: {
    backgroundColor: '#C4B5FD',
    shadowOpacity: 0,
  },
});
