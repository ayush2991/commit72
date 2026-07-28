import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { countTaskStatuses, deriveStatus } from '../task/deriveStatus';
import { DEFAULT_TASK_CAP, Task } from '../task/types';
import { useTaskStore } from '../store/taskStore';
import { CommitModal } from './CommitModal';
import { ConfirmAction, ConfirmModal } from './ConfirmModal';
import { sortForTimeline } from './format';
import { PipCard } from './PipCard';
import { TaskCard } from './TaskCard';
import { Palette, ThemeType, useTheme } from './theme';

interface TaskActionSheet {
  task: Task;
  title: string;
  message: string;
  actions: ConfirmAction[];
}

export function TimelineScreen() {
  const { colors, shape, type } = useTheme();
  const styles = useMemo(() => makeStyles(colors, shape.hardEdges, type), [colors, shape, type]);
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
  const remaining = Math.max(0, DEFAULT_TASK_CAP - counts.active);

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
        <Text style={styles.title}>PactPal</Text>
        <Text style={styles.sub}>
          {counts.active === 1
            ? '1 active commitment'
            : `${counts.active} active commitments`}
        </Text>
        <Text style={[styles.remaining, remaining <= 1 && styles.remainingLow]}>
          {remaining === 1 ? '1 task remaining' : `${remaining} tasks remaining`}
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
        remaining={remaining}
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

function makeStyles(colors: Palette, hardEdges: boolean, type: ThemeType) {
  return StyleSheet.create({
    root: {
      flex: 1,
      paddingHorizontal: 20,
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
    sub: {
      color: colors.textDim,
      fontSize: 13,
      marginTop: 2,
    },
    remaining: {
      color: colors.textDim,
      fontSize: 13,
      marginTop: 2,
    },
    remainingLow: {
      color: colors.urgent,
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
      borderRadius: hardEdges ? 8 : 28,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...(hardEdges
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
