import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ModePreference, useThemeStore } from '../store/themeStore';
import { PetPicker } from './PetPicker';
import { Palette, THEME_ORDER, THEME_REGISTRY, ThemeShape, ThemeType, useTheme } from './theme';

const MODE_OPTIONS: { value: ModePreference; label: string; description: string }[] = [
  { value: 'system', label: 'System', description: 'Follows your device setting.' },
  { value: 'light', label: 'Light', description: 'Bright background, dark text.' },
  { value: 'dark', label: 'Dark', description: 'Dark background, light text.' },
];

export function SettingsScreen() {
  const { colors, shape, type } = useTheme();
  const themeId = useThemeStore((s) => s.themeId);
  const setThemeId = useThemeStore((s) => s.setThemeId);
  const modePreference = useThemeStore((s) => s.modePreference);
  const setModePreference = useThemeStore((s) => s.setModePreference);
  const styles = useMemo(() => makeStyles(colors, shape, type), [colors, shape, type]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.rootContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <Text style={styles.sectionLabel}>Mode</Text>
      <View style={styles.section}>
        {MODE_OPTIONS.map((option, i) => {
          const selected = modePreference === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.row, i > 0 && styles.rowBorder]}
              onPress={() => setModePreference(option.value)}
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

      <Text style={[styles.sectionLabel, styles.companionLabel]}>Appearance</Text>
      <View style={styles.section}>
        {THEME_ORDER.map((id, i) => {
          const option = THEME_REGISTRY[id];
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

      <Text style={[styles.sectionLabel, styles.companionLabel]}>Companion</Text>
      <PetPicker />
    </ScrollView>
  );
}

function makeStyles(colors: Palette, shape: ThemeShape, type: ThemeType) {
  const hardEdges = shape.hardEdges;
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    rootContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    header: {
      marginBottom: 18,
      ...(hardEdges
        ? { borderBottomWidth: 3, borderBottomColor: colors.border, paddingBottom: 12 }
        : null),
    },
    title: {
      color: colors.text,
      fontFamily: type.display,
      fontSize: 26,
      fontWeight: type.titleWeight,
      letterSpacing: type.titleTracking,
      textTransform: type.titleCase,
    },
    sectionLabel: {
      color: colors.textFaint,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    companionLabel: {
      marginTop: 22,
    },
    section: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: hardEdges ? 2 : 1,
      borderRadius: hardEdges ? 8 : 16,
      overflow: 'hidden',
      ...(hardEdges
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
      fontFamily: type.body,
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
