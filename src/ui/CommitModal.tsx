import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TaskCapReachedError } from '../task/types';
import { Palette, useTheme } from './theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCommit: (title: string) => void;
}

/**
 * The commit flow (mockup "Commit" screen), presented as a sheet from the FAB.
 * Framed as a deliberate act, not a quick add — the 72:00 preview and the
 * "can't be paused" note come straight from the mockup copy.
 */
export function CommitModal({ visible, onClose, onCommit }: Props) {
  const { colors, themeId, mono } = useTheme();
  const isBrutalist = themeId === 'brutalist';
  const styles = useMemo(
    () => makeStyles(colors, mono, isBrutalist),
    [colors, mono, isBrutalist]
  );
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setTitle('');
    setError(null);
    onClose();
  };

  const submit = () => {
    if (!title.trim()) {
      setError('Give the commitment a title.');
      return;
    }
    try {
      onCommit(title);
      close();
    } catch (e) {
      setError(
        e instanceof TaskCapReachedError
          ? "You're at the active-task cap. Finish or drop one first."
          : 'Could not commit that task.'
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropFill} onPress={close} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Commit</Text>
          <Text style={styles.copy}>
            What will you finish in the next 72 hours? Once you commit, the clock
            doesn&apos;t stop.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. Ship the onboarding redesign"
            placeholderTextColor={colors.textFaint}
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (error) setError(null);
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          <View style={styles.clock}>
            <Text style={styles.clockNum}>72:00</Text>
            <Text style={styles.clockLabel}>
              Hours from the moment you commit
            </Text>
          </View>

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.note}>
              This can&apos;t be paused, extended, or rescheduled. If it&apos;s
              not done in 72 hours, it&apos;s marked failed.
            </Text>
          )}

          <Pressable style={styles.commitBtn} onPress={submit}>
            <Text style={styles.commitBtnText}>Commit for 72 Hours</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(colors: Palette, mono: string | undefined, isBrutalist: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.backdrop,
    },
    backdropFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheet: {
      backgroundColor: colors.bgElevated,
      borderTopLeftRadius: isBrutalist ? 8 : 28,
      borderTopRightRadius: isBrutalist ? 8 : 28,
      borderTopWidth: isBrutalist ? 3 : 1,
      borderColor: colors.border,
      padding: 24,
      paddingBottom: 40,
      gap: 14,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    copy: {
      color: colors.textDim,
      fontSize: 13,
      lineHeight: 20,
    },
    input: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: isBrutalist ? 2 : 1,
      borderRadius: isBrutalist ? 6 : 14,
      padding: 16,
      fontSize: 16,
      color: colors.text,
    },
    clock: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: isBrutalist ? 2 : 1,
      borderRadius: isBrutalist ? 6 : 16,
      padding: 20,
      alignItems: 'center',
    },
    clockNum: {
      fontFamily: mono,
      fontSize: 44,
      fontWeight: '800',
      color: colors.urgent,
    },
    clockLabel: {
      color: colors.textFaint,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginTop: 6,
    },
    note: {
      color: colors.textFaint,
      fontSize: 11.5,
      textAlign: 'center',
      lineHeight: 18,
    },
    error: {
      color: colors.urgent,
      fontSize: 12.5,
      textAlign: 'center',
      lineHeight: 18,
    },
    commitBtn: {
      backgroundColor: colors.accent,
      borderRadius: isBrutalist ? 6 : 16,
      padding: 18,
      alignItems: 'center',
      marginTop: 4,
      ...(isBrutalist ? { borderWidth: 2, borderColor: colors.border } : null),
    },
    commitBtnText: {
      color: colors.bg,
      fontSize: 15.5,
      fontWeight: '800',
    },
  });
}
