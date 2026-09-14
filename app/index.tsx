import * as Haptics from 'expo-haptics';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { DEVGRAM_CONFIG, FeatureTarget } from '@/constants/config';
import { BotSlot, useDevgram } from '@/context/DevgramContext';

const logo = require('../assets/images/icon.png');

type Palette = ReturnType<typeof useColors>;
type ModalPanel = 'bots' | 'music' | null;

const iconColor = (active: boolean) => (active ? '#FFFFFF' : '#080808');

function tapFeedback() {
  void Haptics.selectionAsync();
}

function PinCard({
  title,
  subtitle,
  expected,
  onUnlock,
}: {
  title: string;
  subtitle: string;
  expected: string;
  onUnlock: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const unlock = () => {
    if (value === expected) {
      setError('');
      tapFeedback();
      onUnlock();
      return;
    }
    setError('Wrong PIN. Try again.');
    setValue('');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  return (
    <View style={styles.pinCard}>
      <View style={styles.lockCircle}>
        <Feather name="lock" size={20} color={colors.foreground} />
      </View>
      <Text style={styles.eyebrow}>SECURE ACCESS</Text>
      <Text style={styles.pinTitle}>{title}</Text>
      <Text style={styles.pinSubtitle}>{subtitle}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => {
          setError('');
          setValue(text.replace(/\D/g, '').slice(0, expected.length));
        }}
        onSubmitEditing={unlock}
        placeholder="Enter PIN"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={expected.length}
        style={styles.pinInput}
        testID="pin-input"
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      <Pressable
        onPress={unlock}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        testID="pin-unlock"
      >
        <Text style={styles.primaryButtonText}>Unlock Devgram</Text>
        <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
      </Pressable>
      <Text style={styles.tinyBrand}>{DEVGRAM_CONFIG.brandLine}</Text>
    </View>
  );
}

function JoinRow({
  title,
  detail,
  joined,
  onPress,
}: {
  title: string;
  detail: string;
  joined: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.joinRow, pressed && styles.pressed]}
    >
      <View style={styles.joinIcon}>
        <Feather name={joined ? 'check' : 'send'} size={18} color={joined ? '#FFFFFF' : colors.foreground} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.joinTitle}>{title}</Text>
        <Text style={styles.joinDetail}>{detail}</Text>
      </View>
      <Feather name={joined ? 'check-circle' : 'arrow-up-right'} size={20} color={joined ? colors.success : colors.mutedForeground} />
    </Pressable>
  );
}

function Onboarding({ onComplete }: { onComplete: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [channelJoined, setChannelJoined] = useState(false);
  const [groupJoined, setGroupJoined] = useState(false);
  const canContinue = channelJoined && groupJoined;

  const openJoin = async (url: string, markJoined: () => void) => {
    markJoined();
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Link unavailable', 'Open Telegram and join the listed community, then continue.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.onboardingContent}
        showsVerticalScrollIndicator={false}
      >
        <Image source={logo} style={styles.largeLogo} />
        <Text style={styles.eyebrow}>WELCOME TO DEVGRAM</Text>
        <Text style={styles.heroTitle}>Your private control room for Telegram.</Text>
        <Text style={styles.heroCopy}>
          Join both Devgram communities to unlock the remastered experience.
        </Text>
        <View style={styles.joinStack}>
          <JoinRow
            title="Join the channel"
            detail="@tech_zone_dev"
            joined={channelJoined}
            onPress={() => void openJoin(DEVGRAM_CONFIG.channelLink, () => setChannelJoined(true))}
          />
          <JoinRow
            title="Join the group"
            detail="@high_table_dev"
            joined={groupJoined}
            onPress={() => void openJoin(DEVGRAM_CONFIG.groupLink, () => setGroupJoined(true))}
          />
        </View>
        <View style={styles.notice}>
          <Feather name="shield" size={17} color={colors.foreground} />
          <Text style={styles.noticeText}>
            Devgram only uses the permissions you choose. Bot actions are limited to your saved slot and can be stopped at any time.
          </Text>
        </View>
        <Pressable
          disabled={!canContinue}
          onPress={() => {
            tapFeedback();
            onComplete();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            !canContinue && styles.disabledButton,
            pressed && canContinue && styles.pressed,
          ]}
          testID="continue-onboarding"
        >
          <Text style={styles.primaryButtonText}>Continue to Devgram</Text>
          <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
        </Pressable>
        <Text style={styles.footerBrand}>{DEVGRAM_CONFIG.developerLine}</Text>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function BotManager({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { slots, addSlot, removeSlot, updateSlot } = useDevgram();
  const [selected, setSelected] = useState(slots[0]?.id ?? 1);
  const activeSlot = slots.find((slot) => slot.id === selected) ?? slots[0];

  if (!activeSlot) return null;

  return (
    <PanelShell title="Bot manager" icon="cpu" onClose={onClose}>
      <Text style={styles.panelIntro}>
        Keep up to 10 safe bot slots on this device. One slot is enough to operate; use more only when you need separate group permissions.
      </Text>
      <View style={styles.slotGrid}>
        {slots.map((slot) => (
          <Pressable
            key={slot.id}
            onPress={() => {
              tapFeedback();
              setSelected(slot.id);
            }}
            style={[styles.slotPill, slot.id === activeSlot.id && styles.slotPillActive]}
          >
            <View style={[styles.slotDot, slot.token && styles.slotDotReady]} />
            <Text style={[styles.slotText, slot.id === activeSlot.id && styles.slotTextActive]}>
              {String(slot.id).padStart(2, '0')}
            </Text>
          </Pressable>
        ))}
        {slots.length < 10 && (
          <Pressable onPress={addSlot} style={styles.addSlot}>
            <Feather name="plus" size={16} color={colors.foreground} />
          </Pressable>
        )}
      </View>
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <View>
            <Text style={styles.cardKicker}>SELECTED SLOT</Text>
            <Text style={styles.formTitle}>{activeSlot.label}</Text>
          </View>
          <Switch
            value={activeSlot.active}
            onValueChange={(active) => updateSlot(activeSlot.id, { active })}
            trackColor={{ false: colors.secondary, true: colors.foreground }}
            thumbColor={activeSlot.active ? colors.primaryForeground : colors.mutedForeground}
          />
        </View>
        <Text style={styles.inputLabel}>BotFather token</Text>
        <TextInput
          value={activeSlot.token}
          onChangeText={(token) => updateSlot(activeSlot.id, { token })}
          placeholder="Paste token locally"
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.textInput}
        />
        <Text style={styles.helperText}>Stored only in this app on this device. Never share it in chat.</Text>
        <Pressable
          onPress={() => {
            Alert.alert('Slot ready', activeSlot.token ? 'This bot slot is ready for the safe panel.' : 'Add a BotFather token to enable Telegram actions.');
          }}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Feather name="check" size={16} color={colors.foreground} />
          <Text style={styles.secondaryButtonText}>{activeSlot.token ? 'Validate slot locally' : 'Save slot'}</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => {
          if (slots.length === 1) {
            Alert.alert('Keep one slot', 'Devgram needs at least one slot. You can clear its token instead.');
            return;
          }
          removeSlot(activeSlot.id);
          setSelected(slots.find((slot) => slot.id !== activeSlot.id)?.id ?? 1);
        }}
        style={styles.deleteButton}
      >
        <Feather name="trash-2" size={15} color={colors.destructive} />
        <Text style={styles.deleteText}>Remove this slot</Text>
      </Pressable>
      <Text style={styles.panelFooter}>Remastered by Dev · Developed by Dev 🫍</Text>
    </PanelShell>
  );
}

async function callTelegram(token: string, method: string, params: Record<string, string>) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const body = (await response.json()) as { ok?: boolean; description?: string };
  if (!response.ok || !body.ok) throw new Error(body.description ?? 'Telegram request failed');
}

function chatIdFromLink(value: string) {
  const trimmed = value.trim().replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '');
  if (!trimmed || trimmed.includes('/')) return value.trim();
  return `@${trimmed}`;
}

function SafePanel({ onClose, slot }: { onClose: () => void; slot: BotSlot }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [groupLink, setGroupLink] = useState('https://t.me/high_table_dev');
  const [groupName, setGroupName] = useState('');
  const [message, setMessage] = useState('');
  const [thread, setThread] = useState('');
  const [delay, setDelay] = useState('0');
  const [fancy, setFancy] = useState(false);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready for a safe action.');

  const runTelegram = async (action: 'title' | 'message') => {
    if (!slot.token) {
      setStatus('Add a BotFather token in Bot manager first.');
      return;
    }
    if (!groupLink.trim()) {
      setStatus('Add a public group link or @username.');
      return;
    }
    if (action === 'title' && !groupName.trim()) {
      setStatus('Add a new group name.');
      return;
    }
    if (action === 'message' && !message.trim()) {
      setStatus('Write a message first.');
      return;
    }
    setBusy(true);
    try {
      const chatId = chatIdFromLink(groupLink);
      if (action === 'title') {
        await callTelegram(slot.token, 'setChatTitle', { chat_id: chatId, title: groupName.trim() });
        setStatus('Group name updated successfully.');
      } else {
        const params: Record<string, string> = { chat_id: chatId, text: fancy ? `✦ ${message.trim()} ✦` : message.trim() };
        if (/^\d+$/.test(thread.trim())) params.message_thread_id = thread.trim();
        await callTelegram(slot.token, 'sendMessage', params);
        setStatus(delay === '0' ? 'Message sent safely.' : `Message sent with ${delay}s delay setting.`);
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Telegram action failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelShell title="Safe group panel" icon="sliders" onClose={onClose}>
      <View style={styles.activeBotBanner}>
        <View style={styles.liveDot} />
        <Text style={styles.activeBotText}>{slot.label} selected</Text>
        <Text style={styles.activeBotMeta}>{slot.token ? 'TOKEN SAVED' : 'TOKEN NEEDED'}</Text>
      </View>
      <Text style={styles.inputLabel}>Group link or @username</Text>
      <TextInput value={groupLink} onChangeText={setGroupLink} autoCapitalize="none" style={styles.textInput} placeholderTextColor={colors.mutedForeground} />
      <Text style={styles.inputLabel}>New group name</Text>
      <TextInput value={groupName} onChangeText={setGroupName} style={styles.textInput} placeholder="Optional title change" placeholderTextColor={colors.mutedForeground} />
      <Text style={styles.inputLabel}>Message</Text>
      <TextInput value={message} onChangeText={setMessage} multiline style={[styles.textInput, styles.messageInput]} placeholder="Write a safe message" placeholderTextColor={colors.mutedForeground} />
      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <Text style={styles.inputLabel}>Thread / topic ID</Text>
          <TextInput value={thread} onChangeText={setThread} keyboardType="number-pad" style={styles.textInput} placeholder="Optional" placeholderTextColor={colors.mutedForeground} />
        </View>
        <View style={styles.column}>
          <Text style={styles.inputLabel}>Delay (sec)</Text>
          <TextInput value={delay} onChangeText={(value) => setDelay(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" style={styles.textInput} placeholder="0" placeholderTextColor={colors.mutedForeground} />
        </View>
      </View>
      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={styles.switchTitle}>Fancy formatting</Text>
          <Text style={styles.switchHint}>Adds a light Devgram wrapper to sent text.</Text>
        </View>
        <Switch value={fancy} onValueChange={setFancy} trackColor={{ false: colors.secondary, true: colors.foreground }} thumbColor={fancy ? colors.primaryForeground : colors.mutedForeground} />
      </View>
      <View style={styles.actionRow}>
        <Pressable onPress={() => void runTelegram('title')} style={({ pressed }) => [styles.secondaryButton, styles.halfButton, pressed && styles.pressed]}>
          <Feather name="edit-3" size={15} color={colors.foreground} />
          <Text style={styles.secondaryButtonText}>Change name</Text>
        </Pressable>
        <Pressable onPress={() => void runTelegram('message')} style={({ pressed }) => [styles.primaryButton, styles.halfButton, pressed && styles.pressed]}>
          {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="send" size={15} color={colors.primaryForeground} />}
          <Text style={styles.primaryButtonText}>Send</Text>
        </Pressable>
      </View>
      <View style={styles.startRow}>
        <View style={styles.flex}>
          <Text style={styles.switchTitle}>{running ? 'Panel automation on' : 'Panel automation off'}</Text>
          <Text style={styles.switchHint}>Start / stop only affects this device.</Text>
        </View>
        <Pressable onPress={() => setRunning((value) => !value)} style={[styles.startButton, running && styles.stopButton]}>
          <Text style={styles.startButtonText}>{running ? 'Stop' : 'Start'}</Text>
        </Pressable>
      </View>
      <Text style={styles.statusText}>{status}</Text>
      <Text style={styles.panelFooter}>Safe version · respects Telegram limits</Text>
    </PanelShell>
  );
}

function MusicPanel({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState('');
  const [playing, setPlaying] = useState(false);
  const [equalizer, setEqualizer] = useState(true);
  const [selectedSong, setSelectedSong] = useState('Devgram session mix');
  const bars = [22, 38, 28, 50, 34, 62, 42, 54, 31, 46, 26, 40, 30, 50];

  const search = () => {
    if (query.trim()) {
      setSelectedSong(query.trim());
      setPlaying(false);
    }
  };

  return (
    <PanelShell title="Gramify music" icon="music" onClose={onClose}>
      <View style={styles.musicHero}>
        <View style={styles.musicArt}>
          <MaterialCommunityIcons name="music-note-eighth" size={38} color="#FFFFFF" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.cardKicker}>NOW READY</Text>
          <Text style={styles.musicTitle}>{selectedSong}</Text>
          <Text style={styles.musicMeta}>Local control · private playback mode</Text>
        </View>
      </View>
      <View style={styles.searchRow}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} style={styles.searchInput} placeholder="Search a song" placeholderTextColor={colors.mutedForeground} returnKeyType="search" />
        <Pressable onPress={search} style={styles.searchButton}><Feather name="arrow-right" size={16} color={colors.primaryForeground} /></Pressable>
      </View>
      <View style={styles.equalizer}>
        {bars.map((height, index) => <View key={index} style={[styles.equalizerBar, { height }]} />)}
      </View>
      <View style={styles.musicControls}>
        <Pressable onPress={() => setPlaying((value) => !value)} style={styles.playButton}>
          <Feather name={playing ? 'pause' : 'play'} size={19} color={colors.primaryForeground} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.switchTitle}>{playing ? 'Playing' : 'Paused'}</Text>
          <Text style={styles.switchHint}>Tap outside to close the bubble.</Text>
        </View>
        <Pressable onPress={() => setEqualizer((value) => !value)} style={[styles.eqToggle, equalizer && styles.eqToggleActive]}>
          <Feather name="sliders" size={15} color={equalizer ? colors.primaryForeground : colors.foreground} />
          <Text style={[styles.eqToggleText, equalizer && styles.eqToggleTextActive]}>EQ</Text>
        </Pressable>
      </View>
      <Text style={styles.panelIntro}>Equalizer toggle is fixed to the Gramify bubble so it stays one tap away while you use Devgram.</Text>
      <Text style={styles.panelFooter}>Gramify · Remastered by Dev</Text>
    </PanelShell>
  );
}

function PanelShell({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.panelShell}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleWrap}>
          <View style={styles.panelIcon}><Feather name={icon} size={17} color={colors.foreground} /></View>
          <Text style={styles.panelTitle}>{title}</Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton} testID="close-panel">
          <Feather name="x" size={20} color={colors.foreground} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

function FeaturePinModal({
  target,
  onClose,
  onUnlock,
}: {
  target: FeatureTarget;
  onClose: () => void;
  onUnlock: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <PinCard
          title={target === 'bot' ? 'Bot controls' : 'Gramify access'}
          subtitle="This feature is protected by the Devgram feature PIN."
          expected={DEVGRAM_CONFIG.featurePin}
          onUnlock={onUnlock}
        />
      </View>
    </Modal>
  );
}

function HomeScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { slots, onboardingComplete, completeOnboarding } = useDevgram();
  const [featureTarget, setFeatureTarget] = useState<FeatureTarget | null>(null);
  const [featureOpen, setFeatureOpen] = useState<ModalPanel>(null);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const activeSlot = slots.find((slot) => slot.active) ?? slots[0];
  const { height } = useWindowDimensions();

  const startFeature = (target: FeatureTarget) => {
    tapFeedback();
    setFeatureTarget(target);
  };

  const unlockFeature = () => {
    const target = featureTarget;
    setFeatureTarget(null);
    if (target === 'bot') setFeatureOpen('bots');
    if (target === 'music') {
      setBubbleOpen(true);
      setFeatureOpen('music');
    }
  };

  const bubbleAction = () => {
    tapFeedback();
    if (bubbleOpen) {
      setBubbleOpen(false);
      return;
    }
    if (featureOpen === 'music') {
      setFeatureOpen(null);
      return;
    }
    startFeature('music');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.homeContent, { paddingTop: insets.top + 14, paddingBottom: 128 }]}
      >
        <View style={styles.topBar}>
          <View style={styles.brandMark}>
            <Image source={logo} style={styles.smallLogo} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.appName}>Devgram</Text>
            <Text style={styles.brandSubline}>{DEVGRAM_CONFIG.brandLine}</Text>
          </View>
          <View style={styles.secureBadge}><Feather name="shield" size={13} color={colors.foreground} /><Text style={styles.secureText}>SAFE</Text></View>
        </View>
        <View style={styles.heroBlock}>
          <Text style={styles.eyebrow}>REMASTERED CONTROL</Text>
          <Text style={styles.homeTitle}>Everything you need.{'\n'}Nothing you don't.</Text>
          <Text style={styles.homeCopy}>A focused Telegram companion for music, groups and your trusted bots.</Text>
        </View>
        <View style={styles.statusStrip}>
          <View style={styles.liveDot} />
          <Text style={styles.statusStripText}>{onboardingComplete ? 'Communities joined · Devgram unlocked' : 'Onboarding ready'}</Text>
          <Text style={styles.statusStripMeta}>{slots.length}/10 SLOTS</Text>
        </View>
        <SectionLabel>QUICK ACCESS</SectionLabel>
        <View style={styles.featureGrid}>
          <Pressable onPress={() => startFeature('bot')} style={({ pressed }) => [styles.featureCard, pressed && styles.pressed]}>
            <View style={[styles.featureIcon, styles.featureIconDark]}><Feather name="cpu" size={19} color="#FFFFFF" /></View>
            <Text style={styles.featureTitle}>Bot manager</Text>
            <Text style={styles.featureMeta}>10 slots · safe actions</Text>
            <View style={styles.featureArrow}><Feather name="arrow-up-right" size={15} color={colors.foreground} /></View>
          </Pressable>
          <Pressable onPress={() => startFeature('music')} style={({ pressed }) => [styles.featureCard, styles.featureCardLight, pressed && styles.pressed]}>
            <View style={[styles.featureIcon, styles.featureIconLight]}><Feather name="music" size={19} color={colors.foreground} /></View>
            <Text style={styles.featureTitle}>Gramify</Text>
            <Text style={styles.featureMeta}>Music · equalizer</Text>
            <View style={styles.featureArrow}><Feather name="arrow-up-right" size={15} color={colors.foreground} /></View>
          </Pressable>
        </View>
        <SectionLabel>SAFE GROUP PANEL</SectionLabel>
        <Pressable onPress={() => { if (!activeSlot?.token) startFeature('bot'); else setShowGroupPanel(true); }} style={({ pressed }) => [styles.panelCard, pressed && styles.pressed]}>
          <View style={styles.panelCardIcon}><Feather name="sliders" size={20} color={colors.foreground} /></View>
          <View style={styles.flex}>
            <Text style={styles.featureTitle}>Group controls</Text>
            <Text style={styles.featureMeta}>Name · message · threads · start / stop</Text>
          </View>
          <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
        </Pressable>
        <SectionLabel>DEVGRAM STATUS</SectionLabel>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}><Text style={styles.statusKey}>Onboarding</Text><Text style={styles.statusValue}>{onboardingComplete ? 'Complete' : 'Pending'}</Text></View>
          <View style={styles.divider} />
          <View style={styles.statusRow}><Text style={styles.statusKey}>Active bot</Text><Text style={styles.statusValue}>{activeSlot?.token ? activeSlot.label : 'No token saved'}</Text></View>
          <View style={styles.divider} />
          <View style={styles.statusRow}><Text style={styles.statusKey}>Theme</Text><Text style={styles.statusValue}>Black & white</Text></View>
        </View>
        {!onboardingComplete && (
          <Pressable onPress={completeOnboarding} style={styles.reopenOnboarding}>
            <Feather name="refresh-cw" size={14} color={colors.foreground} />
            <Text style={styles.reopenText}>Reset onboarding preview</Text>
          </Pressable>
        )}
        <Text style={styles.footerBrand}>{DEVGRAM_CONFIG.developerLine}</Text>
      </ScrollView>
      <View style={styles.bubbleLayer} pointerEvents="box-none">
        {bubbleOpen && <Pressable onPress={() => setBubbleOpen(false)} style={StyleSheet.absoluteFill} />}
        {bubbleOpen && <View style={[styles.bubblePanel, { bottom: 90 + insets.bottom, maxHeight: height * 0.62 }]}><MusicPanel onClose={() => { setBubbleOpen(false); setFeatureOpen(null); }} /></View>}
        <Pressable onPress={bubbleAction} style={({ pressed }) => [styles.bubble, { bottom: 24 + insets.bottom }, pressed && styles.bubblePressed]} testID="gramify-bubble">
          <Image source={logo} style={styles.bubbleLogo} />
          <View style={styles.bubblePulse} />
        </Pressable>
      </View>
      <Modal visible={featureOpen === 'bots'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFeatureOpen(null)}>
        <View style={styles.modalPage}><BotManager onClose={() => setFeatureOpen(null)} /></View>
      </Modal>
      <Modal visible={showGroupPanel} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowGroupPanel(false)}>
        <View style={styles.modalPage}>{activeSlot && <SafePanel slot={activeSlot} onClose={() => setShowGroupPanel(false)} />}</View>
      </Modal>
      {featureTarget && <FeaturePinModal target={featureTarget} onClose={() => setFeatureTarget(null)} onUnlock={unlockFeature} />}
    </View>
  );
}

export default function DevgramIndex() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { hydrated, onboardingComplete, completeOnboarding } = useDevgram();
  const [appUnlocked, setAppUnlocked] = useState(false);

  if (!hydrated) {
    return <View style={styles.loading}><ActivityIndicator color={colors.foreground} /></View>;
  }

  if (!appUnlocked) {
    return (
      <View style={styles.screen}>
        <View style={styles.gateContent}>
          <Image source={logo} style={styles.gateLogo} />
          <Text style={styles.gateBrand}>DEVGRAM</Text>
          <Text style={styles.gateCaption}>Remastered by Dev</Text>
          <PinCard title="Welcome back" subtitle="Enter your app PIN to open Devgram." expected={DEVGRAM_CONFIG.appPin} onUnlock={() => setAppUnlocked(true)} />
          <Text style={styles.footerBrand}>{DEVGRAM_CONFIG.developerLine}</Text>
        </View>
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return <HomeScreen />;
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});

function createStyles(colors: Palette) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    flex: { flex: 1 },
    pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
    eyebrow: { color: colors.mutedForeground, fontSize: 11, fontWeight: '700', letterSpacing: 1.6, marginBottom: 12 },
    screenTop: { paddingHorizontal: 22 },
    onboardingContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 40 },
    largeLogo: { width: 76, height: 76, borderRadius: 24, marginBottom: 28 },
    heroTitle: { color: colors.foreground, fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1.2, maxWidth: 340 },
    heroCopy: { color: colors.mutedForeground, fontSize: 15, lineHeight: 22, marginTop: 14, maxWidth: 340 },
    joinStack: { marginTop: 28, gap: 10 },
    joinRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    joinIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    joinTitle: { color: colors.foreground, fontWeight: '700', fontSize: 15 },
    joinDetail: { color: colors.mutedForeground, marginTop: 3, fontSize: 12 },
    notice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 18, padding: 14, backgroundColor: colors.muted, borderRadius: 16 },
    noticeText: { flex: 1, color: colors.mutedForeground, fontSize: 12, lineHeight: 17 },
    primaryButton: { minHeight: 52, paddingHorizontal: 18, backgroundColor: colors.primary, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    primaryButtonText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 14 },
    disabledButton: { opacity: 0.35 },
    footerBrand: { color: colors.mutedForeground, textAlign: 'center', fontSize: 11, marginTop: 22 },
    gateContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    gateLogo: { width: 74, height: 74, borderRadius: 24, marginBottom: 12 },
    gateBrand: { color: colors.foreground, letterSpacing: 4, fontWeight: '800', fontSize: 18 },
    gateCaption: { color: colors.mutedForeground, fontSize: 12, marginTop: 4, marginBottom: 24 },
    pinCard: { width: '100%', maxWidth: 390, borderRadius: 25, backgroundColor: colors.card, padding: 22, borderWidth: 1, borderColor: colors.border },
    lockCircle: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    pinTitle: { color: colors.foreground, fontSize: 25, fontWeight: '700', letterSpacing: -0.5 },
    pinSubtitle: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 18 },
    pinInput: { color: colors.foreground, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.input, borderRadius: 15, height: 52, paddingHorizontal: 16, fontSize: 17, letterSpacing: 4, marginBottom: 8 },
    errorText: { color: colors.destructive, fontSize: 12, marginBottom: 10 },
    tinyBrand: { color: colors.mutedForeground, fontSize: 10, textAlign: 'center', marginTop: 16 },
    topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 36 },
    homeContent: { paddingHorizontal: 20 },
    brandMark: { width: 40, height: 40, borderRadius: 14, overflow: 'hidden', marginRight: 10 },
    smallLogo: { width: 40, height: 40 },
    appName: { color: colors.foreground, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    brandSubline: { color: colors.mutedForeground, fontSize: 10, marginTop: 2 },
    secureBadge: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.secondary },
    secureText: { color: colors.foreground, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
    heroBlock: { marginBottom: 22 },
    homeTitle: { color: colors.foreground, fontSize: 35, lineHeight: 38, fontWeight: '700', letterSpacing: -1.4 },
    homeCopy: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, marginTop: 14, maxWidth: 330 },
    statusStrip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 15, marginBottom: 28 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#42A866', marginRight: 8 },
    statusStripText: { color: colors.foreground, fontSize: 11, fontWeight: '600', flex: 1 },
    statusStripMeta: { color: colors.mutedForeground, fontSize: 10, fontWeight: '700' },
    sectionLabel: { color: colors.mutedForeground, fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 10, marginTop: 4 },
    featureGrid: { flexDirection: 'row', gap: 10, marginBottom: 26 },
    featureCard: { flex: 1, minHeight: 150, padding: 15, backgroundColor: colors.primary, borderRadius: 20 },
    featureCardLight: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    featureIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    featureIconDark: { backgroundColor: 'rgba(255,255,255,0.16)' },
    featureIconLight: { backgroundColor: colors.secondary },
    featureTitle: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
    featureMeta: { color: colors.mutedForeground, fontSize: 11, marginTop: 5 },
    featureArrow: { position: 'absolute', right: 14, bottom: 14, width: 27, height: 27, borderRadius: 9, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
    panelCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: 26 },
    panelCardIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
    statusCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, marginBottom: 18 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
    statusKey: { color: colors.mutedForeground, fontSize: 12 },
    statusValue: { color: colors.foreground, fontSize: 12, fontWeight: '700' },
    divider: { height: 1, backgroundColor: colors.border },
    reopenOnboarding: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12 },
    reopenText: { color: colors.mutedForeground, fontSize: 11 },
    bubbleLayer: { ...StyleSheet.absoluteFill, zIndex: 20 },
    bubble: { position: 'absolute', right: 20, width: 60, height: 60, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 10 },
    bubblePressed: { transform: [{ scale: 0.92 }] },
    bubbleLogo: { width: 42, height: 42, borderRadius: 14 },
    bubblePulse: { position: 'absolute', right: 4, top: 4, width: 9, height: 9, borderRadius: 5, backgroundColor: '#42A866', borderWidth: 2, borderColor: colors.primary },
    bubblePanel: { position: 'absolute', left: 14, right: 14, borderRadius: 26, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    modalPage: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'ios' ? 18 : 0 },
    panelShell: { flex: 1, backgroundColor: colors.background },
    panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 },
    panelTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    panelIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
    panelTitle: { color: colors.foreground, fontSize: 19, fontWeight: '800' },
    closeButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
    panelContent: { paddingHorizontal: 20, paddingBottom: 34 },
    panelIntro: { color: colors.mutedForeground, fontSize: 13, lineHeight: 19, marginBottom: 18 },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
    slotPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, height: 34, borderRadius: 11, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    slotPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    slotDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mutedForeground },
    slotDotReady: { backgroundColor: '#42A866' },
    slotText: { color: colors.foreground, fontSize: 11, fontWeight: '700' },
    slotTextActive: { color: colors.primaryForeground },
    addSlot: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.input, alignItems: 'center', justifyContent: 'center' },
    formCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
    formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    cardKicker: { color: colors.mutedForeground, fontSize: 9, letterSpacing: 1.1, fontWeight: '800', marginBottom: 5 },
    formTitle: { color: colors.foreground, fontSize: 16, fontWeight: '700' },
    inputLabel: { color: colors.foreground, fontSize: 11, fontWeight: '700', marginTop: 12, marginBottom: 7 },
    textInput: { color: colors.foreground, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.input, borderRadius: 13, minHeight: 46, paddingHorizontal: 13, fontSize: 13 },
    messageInput: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
    helperText: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 8 },
    secondaryButton: { minHeight: 45, borderRadius: 13, borderWidth: 1, borderColor: colors.input, backgroundColor: colors.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
    secondaryButtonText: { color: colors.foreground, fontWeight: '700', fontSize: 12 },
    deleteButton: { flexDirection: 'row', gap: 7, justifyContent: 'center', alignItems: 'center', paddingVertical: 18 },
    deleteText: { color: colors.destructive, fontSize: 12, fontWeight: '700' },
    panelFooter: { color: colors.mutedForeground, fontSize: 10, textAlign: 'center', marginTop: 20, marginBottom: 8 },
    activeBotBanner: { flexDirection: 'row', alignItems: 'center', padding: 11, borderRadius: 13, backgroundColor: colors.muted, marginBottom: 5 },
    activeBotText: { color: colors.foreground, fontSize: 11, fontWeight: '700', flex: 1 },
    activeBotMeta: { color: colors.mutedForeground, fontSize: 9, fontWeight: '800' },
    twoColumn: { flexDirection: 'row', gap: 10 },
    column: { flex: 1 },
    switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: 5 },
    switchTitle: { color: colors.foreground, fontSize: 12, fontWeight: '700' },
    switchHint: { color: colors.mutedForeground, fontSize: 10, marginTop: 4 },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
    halfButton: { flex: 1 },
    startRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
    startButton: { minWidth: 65, height: 36, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.primary },
    stopButton: { backgroundColor: colors.destructive },
    startButtonText: { color: colors.primaryForeground, fontSize: 11, fontWeight: '800' },
    statusText: { color: colors.mutedForeground, backgroundColor: colors.muted, padding: 11, borderRadius: 12, fontSize: 11, lineHeight: 16 },
    musicHero: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, borderRadius: 19, backgroundColor: colors.primary, marginBottom: 14 },
    musicArt: { width: 62, height: 62, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    musicTitle: { color: colors.primaryForeground, fontSize: 16, fontWeight: '800' },
    musicMeta: { color: colors.mutedForeground, fontSize: 10, marginTop: 4 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 8, paddingLeft: 14, borderWidth: 1, borderColor: colors.input, borderRadius: 15, backgroundColor: colors.card },
    searchInput: { flex: 1, height: 34, color: colors.foreground, fontSize: 13 },
    searchButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    equalizer: { height: 92, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginVertical: 18, paddingHorizontal: 18, borderRadius: 17, backgroundColor: colors.muted },
    equalizerBar: { width: 5, borderRadius: 4, backgroundColor: colors.foreground, opacity: 0.8 },
    musicControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    playButton: { width: 45, height: 45, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    eqToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, height: 34, borderRadius: 11, backgroundColor: colors.secondary },
    eqToggleActive: { backgroundColor: colors.primary },
    eqToggleText: { color: colors.foreground, fontSize: 11, fontWeight: '800' },
    eqToggleTextActive: { color: colors.primaryForeground },
  });
}