import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { deriveStatus } from '../task/deriveStatus';
import { Task } from '../task/types';
import {
  committedAgoText,
  countdownText,
  progressFraction,
  statusLabel,
} from './format';
import { Palette, ThemeShape, ThemeType, useTheme } from './theme';

interface Props {
  task: Task;
  now: number;
}

/**
 * Renders one task. Status/countdown/progress are all derived from `now` at
 * render time (TECH_DESIGN.md §2) — the card holds no state of its own, so a
 * ticking `now` from the store animates it fresh → mid → urgent → failed.
 */
export function TaskCard({ task, now }: Props) {
  const { colors, statusColor, badgeBg, mono, shape, type } = useTheme();
  const styles = useMemo(
    () => makeStyles(colors, mono, shape, type),
    [colors, mono, shape, type]
  );
  const status = deriveStatus(task, now);
  const color = statusColor[status];
  const pct = `${Math.round(progressFraction(task, now) * 100)}%` as const;

  const isFailed = status === 'failed';
  const isDone = status === 'done';
  const isHot = status === 'urgent' || isFailed;

  // Hard-edged themes (Brutalist, Terminal) use solid-color chips with ink
  // text, rather than the default theme's tinted-background + colored-text
  // badge, and only tint the countdown for hot statuses — everything else
  // reads in plain ink. Failed badges always use the dedicated
  // failedCardBorder/badgeFailedText pair (matching the failed card's own
  // border color) regardless of hardEdges, since colors.failed is tuned for
  // legibility as countdown text and can't also serve as a badge background
  // in dark hard-edged themes without falling below contrast requirements.
  const badgeBackground = isFailed
    ? colors.failedCardBorder
    : shape.hardEdges
      ? color
      : badgeBg[status];
  const badgeTextColor = isFailed
    ? colors.badgeFailedText
    : shape.hardEdges
      ? colors.text
      : color;
  const countdownColor = shape.hardEdges ? (isHot ? color : colors.text) : color;
  const badgeLabel = `${type.badgeDecoration?.prefix ?? ''}${statusLabel(status)}${
    type.badgeDecoration?.suffix ?? ''
  }`;

  return (
    <View
      style={[
        styles.card,
        status === 'urgent' && styles.cardUrgent,
        isFailed && styles.cardFailed,
      ]}
    >
      <View style={styles.top}>
        <Text
          style={[styles.title, (isFailed || isDone) && styles.titleStruck]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: badgeBackground }]}>
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>{badgeLabel}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: pct, backgroundColor: color }]} />
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>{committedAgoText(task, now)}</Text>
        <Text style={[styles.metaText, styles.countdown, { color: countdownColor }]}>
          {countdownText(task, now)}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(colors: Palette, mono: string | undefined, shape: ThemeShape, type: ThemeType) {
  const hardEdges = shape.hardEdges;
  return StyleSheet.create({
    card: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: hardEdges ? 2 : 1,
      borderRadius: hardEdges ? 8 : 16,
      padding: 16,
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
    cardUrgent: {
      borderColor: hardEdges ? colors.border : colors.urgentBorderAlpha,
    },
    cardFailed: {
      backgroundColor: colors.failedCardBg,
      borderColor: colors.failedCardBorder,
    },
    top: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 12,
    },
    title: {
      flex: 1,
      color: colors.text,
      fontFamily: type.body,
      fontSize: 15.5,
      fontWeight: '600',
      lineHeight: 20,
    },
    titleStruck: {
      color: colors.textDim,
      textDecorationLine: 'line-through',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: hardEdges ? 0 : 6,
    },
    badgeText: {
      fontFamily: mono,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    track: {
      height: hardEdges ? 8 : 6,
      backgroundColor: colors.trackBg,
      borderRadius: hardEdges ? 2 : 99,
      borderWidth: hardEdges ? 2 : 0,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 8,
    },
    fill: {
      height: '100%',
      borderRadius: hardEdges ? 2 : 99,
    },
    meta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    metaText: {
      fontFamily: mono,
      fontSize: 11,
      color: colors.textFaint,
    },
    countdown: {
      fontWeight: '700',
    },
  });
}
