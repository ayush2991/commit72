import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { countTaskStatuses, deriveStatus } from '../task/deriveStatus';
import { Task } from '../task/types';
import { useTaskStore } from '../store/taskStore';
import { CommitModal } from './CommitModal';
import { ConfirmAction, ConfirmModal } from './ConfirmModal';
import { sortForTimeline } from './format';
import { PipCard } from './PipCard';
import { TaskCard } from './TaskCard';
import { Palette, useTheme } from './theme';

interface TaskActionSheet {
  task: Task;
  title: string;
  message: string;
  actions: ConfirmAction[];
}

export function TimelineScreen() {
  const { colors, isBrutalist } = useTheme();
  const styles = useMemo(() => makeStyles(colors, isBrutalist), [colors, isBrutalist]);
  const tasks = useTaskStore((s) => s.tasks);
  const now = useTaskStore((s) => s.now);
  const commit = useTaskStore((s) => s.commit);
  const complete = useTaskStore((s) => s.complete);
  const recommit = useTaskStore((s) => s.recommit);
  const remove = useTaskStore((s) => s.remove);

  const [modalOpen, setModalOpen] = useState(false);
  const [actionSheet, setActionSheet] = useState<TaskActionSheet | null>(null);
  const [recommitCapSheet, setRecommitCapSheet] = useState(false);

  const ordered = useMemo(() => sortForTimeline(tasks, now), [tasks, now]);
  const counts = useMemo(() => countTaskStatuses(tasks, now), [tasks, now]);

  // Tap a card to act on it. The available actions depend on the derived
  // status, keeping the lifecycle rules from TaskService reachable from the UI.
  const onPressTask = (task: Task) => {
    const status = deriveStatus(task, now);
    if (status === 'failed') {
      setActionSheet({
        task,
        title: task.title,
        message: 'This clock ran out.',
        actions: [
          { label: 'Re-commit, 72h', onPress: () => tryRecommit(task) },
          { label: 'Let it go', variant: 'destructive', onPress: () => remove(task.id) },
          { label: 'Cancel', variant: 'cancel', onPress: () => {} },
        ],
      });
      return;
    }
    if (status === 'done') {
      setActionSheet({
        task,
        title: task.title,
        message: 'Completed.',
        actions: [
          { label: 'Delete', variant: 'destructive', onPress: () => remove(task.id) },
          { label: 'Cancel', variant: 'cancel', onPress: () => {} },
        ],
      });
      return;
    }
    setActionSheet({
      task,
      title: task.title,
      message: 'Mark this commitment done?',
      actions: [
        { label: 'Mark done', onPress: () => complete(task.id) },
        { label: 'Delete', variant: 'destructive', onPress: () => remove(task.id) },
        { label: 'Cancel', variant: 'cancel', onPress: () => {} },
      ],
    });
  };

  const tryRecommit = (task: Task) => {
    try {
      recommit(task.id);
    } catch {
      setRecommitCapSheet(true);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Next 72</Text>
        <Text style={styles.sub}>
          {counts.active === 1
            ? '1 active commitment'
            : `${counts.active} active commitments`}
        </Text>
      </View>

      <FlatList
        data={ordered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <PipCard live={counts.active} kept={counts.kept} broken={counts.broken} />
        }
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

      <ConfirmModal
        visible={actionSheet !== null}
        title={actionSheet?.title ?? ''}
        message={actionSheet?.message ?? ''}
        actions={actionSheet?.actions ?? []}
        onClose={() => setActionSheet(null)}
      />

      <ConfirmModal
        visible={recommitCapSheet}
        title="Can't re-commit"
        message="You are at the active-task cap."
        actions={[{ label: 'OK', variant: 'cancel', onPress: () => {} }]}
        onClose={() => setRecommitCapSheet(false)}
      />
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
      borderRadius: isBrutalist ? 8 : 28,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...(isBrutalist
        ? {
            borderWidth: 2,
            borderColor: colors.border,
            shadowColor: colors.border,
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
          }
        : {
            shadowColor: colors.urgent,
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }),
    },
    fabText: {
      color: colors.bg,
      fontSize: 30,
      fontWeight: '700',
      marginTop: -2,
    },
  });
}
