import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { deriveStatus, isActiveStatus } from '../task/deriveStatus';
import { Task } from '../task/types';
import { useTaskStore } from '../store/taskStore';
import { CommitModal } from './CommitModal';
import { sortForTimeline } from './format';
import { TaskCard } from './TaskCard';
import { Palette, useTheme } from './theme';

export function TimelineScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tasks = useTaskStore((s) => s.tasks);
  const now = useTaskStore((s) => s.now);
  const commit = useTaskStore((s) => s.commit);
  const complete = useTaskStore((s) => s.complete);
  const recommit = useTaskStore((s) => s.recommit);
  const remove = useTaskStore((s) => s.remove);

  const [modalOpen, setModalOpen] = useState(false);

  const ordered = useMemo(() => sortForTimeline(tasks, now), [tasks, now]);
  const activeCount = useMemo(
    () => tasks.filter((t) => isActiveStatus(deriveStatus(t, now))).length,
    [tasks, now]
  );

  // Tap a card to act on it. The available actions depend on the derived
  // status, keeping the lifecycle rules from TaskService reachable from the UI.
  const onPressTask = (task: Task) => {
    const status = deriveStatus(task, now);
    if (status === 'failed') {
      Alert.alert(task.title, 'This clock ran out.', [
        { text: 'Re-commit, 72h', onPress: () => tryRecommit(task) },
        { text: 'Let it go', style: 'destructive', onPress: () => remove(task.id) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (status === 'done') {
      Alert.alert(task.title, 'Completed.', [
        { text: 'Delete', style: 'destructive', onPress: () => remove(task.id) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    Alert.alert(task.title, 'Mark this commitment done?', [
      { text: 'Mark done', onPress: () => complete(task.id) },
      { text: 'Delete', style: 'destructive', onPress: () => remove(task.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const tryRecommit = (task: Task) => {
    try {
      recommit(task.id);
    } catch {
      Alert.alert("Can't re-commit", 'You are at the active-task cap.');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Next 72</Text>
        <Text style={styles.sub}>
          {activeCount === 1
            ? '1 active commitment'
            : `${activeCount} active commitments`}
        </Text>
      </View>

      <FlatList
        data={ordered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing committed yet</Text>
            <Text style={styles.emptyBody}>
              Tap + to start a 72-hour clock.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => onPressTask(item)}>
            <TaskCard task={item} now={now} />
          </Pressable>
        )}
      />

      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <CommitModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onCommit={commit}
      />
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      paddingHorizontal: 20,
    },
    header: {
      marginBottom: 18,
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
    list: {
      gap: 12,
      paddingBottom: 120,
    },
    empty: {
      paddingTop: 120,
      alignItems: 'center',
    },
    emptyTitle: {
      color: colors.textDim,
      fontSize: 15,
      fontWeight: '700',
    },
    emptyBody: {
      color: colors.textFaint,
      fontSize: 13,
      marginTop: 6,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 32,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.urgent,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    fabText: {
      color: colors.bg,
      fontSize: 30,
      fontWeight: '700',
      marginTop: -2,
    },
  });
}
