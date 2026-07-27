import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, ThemeType, useTheme } from './theme';

export type Tab = 'timeline' | 'profile';

interface Props {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: 'timeline', label: 'Timeline', glyph: '⏱' },
  { id: 'profile', label: 'Profile', glyph: '☺' },
];

export function TabBar({ activeTab, onChange }: Props) {
  const { colors, shape, type } = useTheme();
  const styles = useMemo(() => makeStyles(colors, shape.hardEdges, type), [colors, shape, type]);

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        const label = active && type.tabActivePrefix ? `${type.tabActivePrefix}${tab.label}` : tab.label;
        return (
          <Pressable key={tab.id} style={styles.tab} onPress={() => onChange(tab.id)}>
            <Text style={[styles.glyph, active && styles.glyphActive]}>{tab.glyph}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const TAB_BAR_HEIGHT = 64;

function makeStyles(colors: Palette, hardEdges: boolean, type: ThemeType) {
  return StyleSheet.create({
    bar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: TAB_BAR_HEIGHT,
      flexDirection: 'row',
      backgroundColor: colors.bgElevated,
      borderTopWidth: hardEdges ? 3 : 1,
      borderTopColor: colors.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    glyph: {
      fontSize: 18,
      color: colors.textFaint,
    },
    glyphActive: {
      color: colors.accent,
    },
    label: {
      fontFamily: type.body,
      fontSize: 11,
      fontWeight: '600',
      color: colors.textFaint,
    },
    labelActive: {
      color: colors.text,
    },
  });
}
