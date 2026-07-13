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
import { Palette, useTheme } from './theme';

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
  const { colors, themeId, statusColor, badgeBg, mono } = useTheme();
  const isBrutalist = themeId === 'brutalist';
  const styles = useMemo(
    () => makeStyles(colors, mono, isBrutalist),
    [colors, mono, isBrutalist]
  );
  const status = deriveStatus(task, now);
  const color = statusColor[status];
  const pct = `${Math.round(progressFraction(task, now) * 100)}%` as const;

  const isFailed = status === 'failed';
  const isDone = status === 'done';
  const isHot = status === 'urgent' || isFailed;

  // The brutalist theme uses solid-color chips with ink text (mockup "1e"),
  // rather than the default theme's tinted-background + colored-text badge,
  // and only tints the countdown for hot statuses — everything else reads
  // in plain ink.
  const badgeBackground = isBrutalist ? color : badgeBg[status];
  const badgeTextColor = isBrutalist ? colors.text : isFailed ? colors.badgeFailedText : color;
  const countdownColor = isBrutalist ? (isHot ? color : colors.text) : color;

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
          <Text style={[styles.badgeText, { color: badgeTextColor }]}>
            {statusLabel(status)}
          </Text>
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

function makeStyles(colors: Palette, mono: string | undefined, isBrutalist: boolean) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: isBrutalist ? 2 : 1,
      borderRadius: isBrutalist ? 8 : 16,
      padding: 16,
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
    cardUrgent: {
      borderColor: isBrutalist ? colors.border : colors.urgentBorderAlpha,
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
      borderRadius: isBrutalist ? 0 : 6,
    },
    badgeText: {
      fontFamily: mono,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    track: {
      height: isBrutalist ? 8 : 6,
      backgroundColor: colors.trackBg,
      borderRadius: isBrutalist ? 2 : 99,
      borderWidth: isBrutalist ? 2 : 0,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 8,
    },
    fill: {
      height: '100%',
      borderRadius: isBrutalist ? 2 : 99,
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
