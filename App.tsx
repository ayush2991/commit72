import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { AppState, Platform, StatusBar as RNStatusBar, StyleSheet, View } from 'react-native';
import { useTaskStore } from './src/store/taskStore';
import { TimelineScreen } from './src/ui/TimelineScreen';
import { Palette, useTheme } from './src/ui/theme';

export default function App() {
  const { scheme, colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sweep = useTaskStore((s) => s.sweep);

  useEffect(() => {
    // A ticking clock is what makes derived status live: deriveStatus is a pure
    // function of `now`, so React only re-reads it if `now` advances. sweep()
    // also persists failed/auto-deleted transitions (TECH_DESIGN.md §4).
    const interval = setInterval(sweep, 1000);

    // Self-heal on resume: mobile OSes don't run us in the background, so the
    // authoritative correction happens when the app returns to the foreground.
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') sweep();
    });

    sweep();
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [sweep]);

  return (
    <View style={styles.container}>
      <TimelineScreen />
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingTop:
        Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) + 12 : 64,
    },
  });
}
