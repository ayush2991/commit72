import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { Palette, ThemeId, useTheme } from './theme';

const THEME_OPTIONS: { id: ThemeId; label: string; description: string }[] = [
  { id: 'default', label: 'Default', description: 'Follows your device light/dark setting.' },
  { id: 'brutalist', label: 'Brutalist Block', description: 'High-contrast paper & ink.' },
];

export function ProfileScreen() {
  const { colors } = useTheme();
  const themeId = useThemeStore((s) => s.themeId);
  const setThemeId = useThemeStore((s) => s.setThemeId);
  const isBrutalist = themeId === 'brutalist';
  const styles = useMemo(() => makeStyles(colors, isBrutalist), [colors, isBrutalist]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.sub}>Settings</Text>
      </View>

      <Text style={styles.sectionLabel}>Appearance</Text>
      <View style={styles.section}>
        {THEME_OPTIONS.map((option, i) => {
          const selected = themeId === option.id;
          return (
            <Pressable
              key={option.id}
              style={[styles.row, i > 0 && styles.rowBorder]}
              onPress={() => setThemeId(option.id)}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{option.label}</Text>
                <Text style={styles.rowDescription}>{option.description}</Text>
              </View>
              <Text style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? '●' : '○'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(colors: Palette, isBrutalist: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      marginBottom: 18,
      ...(isBrutalist
        ? { borderBottomWidth: 3, borderBottomColor: colors.border, paddingBottom: 12 }
        : null),
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    sub: {
      color: colors.textDim,
      fontSize: 13,
      marginTop: 2,
    },
    sectionLabel: {
      color: colors.textFaint,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    section: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: isBrutalist ? 2 : 1,
      borderRadius: isBrutalist ? 8 : 16,
      overflow: 'hidden',
      ...(isBrutalist
        ? {
            shadowColor: colors.border,
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 4,
          }
        : null),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      gap: 12,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowText: {
      flex: 1,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 15.5,
      fontWeight: '600',
    },
    rowDescription: {
      color: colors.textFaint,
      fontSize: 12,
      marginTop: 2,
    },
    radio: {
      color: colors.textFaint,
      fontSize: 18,
    },
    radioSelected: {
      color: colors.accent,
    },
  });
}
