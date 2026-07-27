import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, RadiusScale, useTheme } from './theme';

export type ConfirmActionVariant = 'default' | 'destructive' | 'cancel';

export interface ConfirmAction {
  label: string;
  onPress: () => void;
  variant?: ConfirmActionVariant;
}

interface Props {
  visible: boolean;
  title: string;
  message: string;
  actions: ConfirmAction[];
  onClose: () => void;
}

/**
 * Themed replacement for the native Alert.alert confirmation sheets (mark
 * done / delete / re-commit). Mirrors CommitModal's sheet so every popup in
 * the app shares the same palette, radii, and font regardless of theme.
 */
export function ConfirmModal({ visible, title, message, actions, onClose }: Props) {
  const { colors, mono, shape } = useTheme();
  const { radius, hardEdges } = shape;
  const styles = useMemo(
    () => makeStyles(colors, mono, radius, hardEdges),
    [colors, mono, radius, hardEdges]
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                style={[
                  styles.actionBtn,
                  action.variant === 'destructive' && styles.actionBtnDestructive,
                  action.variant === 'cancel' && styles.actionBtnCancel,
                ]}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
              >
                <Text
                  style={[
                    styles.actionText,
                    action.variant === 'destructive' && styles.actionTextDestructive,
                    action.variant === 'cancel' && styles.actionTextCancel,
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
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
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    message: {
      color: colors.textDim,
      fontSize: 13,
      lineHeight: 20,
    },
    actions: {
      gap: 10,
      marginTop: 4,
    },
    actionBtn: {
      backgroundColor: colors.accent,
      borderRadius: radius.box,
      padding: 16,
      alignItems: 'center',
      ...(hardEdges ? { borderWidth: 2, borderColor: colors.border } : null),
    },
    actionBtnDestructive: {
      backgroundColor: colors.failedCardBg,
      borderWidth: hardEdges ? 2 : 1,
      borderColor: colors.urgent,
    },
    actionBtnCancel: {
      backgroundColor: colors.panel,
      borderWidth: hardEdges ? 2 : 1,
      borderColor: colors.border,
    },
    actionText: {
      fontFamily: mono,
      color: colors.bg,
      fontSize: 15,
      fontWeight: '800',
    },
    actionTextDestructive: {
      color: colors.urgent,
    },
    actionTextCancel: {
      color: colors.textDim,
    },
  });
}
