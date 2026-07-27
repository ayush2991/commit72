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
import {
  DEFAULT_TASK_DURATION_HOURS,
  TASK_DURATION_OPTIONS_HOURS,
  TaskCapReachedError,
  TaskDurationHours,
} from '../task/types';
import { Palette, RadiusScale, useTheme } from './theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCommit: (title: string, durationHours: TaskDurationHours) => void;
}

/**
 * The commit flow (mockup "Commit" screen), presented as a sheet from the FAB.
 * Framed as a deliberate act, not a quick add — the 72:00 preview and the
 * "can't be paused" note come straight from the mockup copy.
 */
export function CommitModal({ visible, onClose, onCommit }: Props) {
  const { colors, mono, shape } = useTheme();
  const { radius, hardEdges } = shape;
  const styles = useMemo(
    () => makeStyles(colors, mono, radius, hardEdges),
    [colors, mono, radius, hardEdges]
  );
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [durationHours, setDurationHours] = useState<TaskDurationHours>(
    DEFAULT_TASK_DURATION_HOURS
  );

  const close = () => {
    setTitle('');
    setError(null);
    setDurationHours(DEFAULT_TASK_DURATION_HOURS);
    onClose();
  };

  const submit = () => {
    if (!title.trim()) {
      setError('Give the commitment a title.');
      return;
    }
    try {
      onCommit(title, durationHours);
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
            What will you finish in the next {durationHours} hours? Once you
            commit, the clock doesn&apos;t stop.
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

          <View style={styles.durationRow}>
            {TASK_DURATION_OPTIONS_HOURS.map((hours) => {
              const selected = hours === durationHours;
              return (
                <Pressable
                  key={hours}
                  style={[
                    styles.durationOption,
                    selected && styles.durationOptionSelected,
                  ]}
                  onPress={() => setDurationHours(hours)}
                >
                  <Text
                    style={[
                      styles.durationOptionText,
                      selected && styles.durationOptionTextSelected,
                    ]}
                  >
                    {hours}h
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.clock}>
            <Text style={styles.clockNum}>{`${durationHours}:00`}</Text>
            <Text style={styles.clockLabel}>
              Hours from the moment you commit
            </Text>
          </View>

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <Text style={styles.note}>
              This can&apos;t be paused, extended, or rescheduled. If it&apos;s
              not done in {durationHours} hours, it&apos;s marked failed.
            </Text>
          )}

          <Pressable style={styles.commitBtn} onPress={submit}>
            <Text style={styles.commitBtnText}>
              Commit for {durationHours} Hours
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(
  colors: Palette,
  mono: string | undefined,
  radius: RadiusScale,
  hardEdges: boolean
) {
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
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      borderTopWidth: hardEdges ? 3 : 1,
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
      borderWidth: hardEdges ? 2 : 1,
      borderRadius: radius.field,
      padding: 16,
      fontSize: 16,
      color: colors.text,
    },
    durationRow: {
      flexDirection: 'row',
      gap: 10,
    },
    durationOption: {
      flex: 1,
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: hardEdges ? 2 : 1,
      borderRadius: radius.field,
      paddingVertical: 12,
      alignItems: 'center',
    },
    durationOptionSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    durationOptionText: {
      color: colors.textDim,
      fontSize: 14,
      fontWeight: '700',
    },
    durationOptionTextSelected: {
      color: colors.bg,
    },
    clock: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: hardEdges ? 2 : 1,
      borderRadius: radius.box,
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
      borderRadius: radius.box,
      padding: 18,
      alignItems: 'center',
      marginTop: 4,
      ...(hardEdges ? { borderWidth: 2, borderColor: colors.border } : null),
    },
    commitBtnText: {
      color: colors.bg,
      fontSize: 15.5,
      fontWeight: '800',
    },
  });
}
