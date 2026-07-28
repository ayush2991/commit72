import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, ThemeShape, useTheme } from './theme';

export type Tab = 'timeline' | 'profile';

interface Props {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'timeline', label: 'Timeline', icon: 'clock' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

const ICON_SIZE = 22;
const BAR_CONTENT_HEIGHT = 52;

export function TabBar({ activeTab, onChange }: Props) {
  const { colors, shape } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, shape, insets.bottom), [colors, shape, insets.bottom]);

  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            style={styles.tab}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Feather name={tab.icon} size={ICON_SIZE} color={active ? colors.accent : colors.textFaint} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: Palette, shape: ThemeShape, insetBottom: number) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      height: BAR_CONTENT_HEIGHT + insetBottom,
      paddingBottom: insetBottom,
      backgroundColor: colors.bgElevated,
      borderTopWidth: shape.hardEdges ? 3 : 1,
      borderTopColor: colors.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrap: {
      width: 48,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: shape.hardEdges ? shape.radius.box : 999,
    },
    iconWrapActive: {
      backgroundColor: colors.panel2,
    },
  });
}
