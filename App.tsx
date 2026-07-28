import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Platform, StatusBar as RNStatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTaskStore } from './src/store/taskStore';
import { ProfileScreen } from './src/ui/ProfileScreen';
import { Tab, TabBar } from './src/ui/TabBar';
import { TimelineScreen } from './src/ui/TimelineScreen';
import { Palette, useTheme } from './src/ui/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { scheme, colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sweep = useTaskStore((s) => s.sweep);
  const [activeTab, setActiveTab] = useState<Tab>('timeline');

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
      <View style={styles.screen}>
        {activeTab === 'timeline' ? <TimelineScreen /> : <ProfileScreen />}
      </View>
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
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
    screen: {
      flex: 1,
    },
  });
}
