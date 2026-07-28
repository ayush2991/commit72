import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { computeHealth, moodForHealth, PetMood } from '../pet/petHealth';
import { usePetSelectionStore } from '../store/petSelectionStore';
import { PET_DEFS } from './pets';
import { Palette, ThemeShape, ThemeType, useTheme } from './theme';

interface Props {
  live: number;
  kept: number;
  broken: number;
}

function moodColor(mood: PetMood, colors: Palette): string {
  switch (mood) {
    case 'fading':
    case 'worried':
      return colors.urgent;
    case 'steady':
      return colors.mid;
    case 'happy':
    case 'thriving':
      return colors.fresh;
  }
}

// Text needs its own ink, tuned against the panel background — the vivid
// moodColor() above stays reserved for the health-bar fill, which has no
// contrast requirement.
function moodInkColor(mood: PetMood, colors: Palette): string {
  switch (mood) {
    case 'fading':
    case 'worried':
      return colors.statusInk.urgent;
    case 'steady':
      return colors.statusInk.mid;
    case 'happy':
    case 'thriving':
      return colors.statusInk.fresh;
  }
}

/**
 * Pip's health (see src/pet/petHealth.ts) is derived from tasks currently in
 * the list: kept/broken are the counts of done/failed tasks in view right
 * now, so a task cleaned up (auto-deleted or manually removed) stops
 * affecting the score immediately.
 */
export function PipCard({ live, kept, broken }: Props) {
  const { colors, mono, shape, type } = useTheme();
  const petId = usePetSelectionStore((s) => s.petId);
  const pet = PET_DEFS[petId];
  const health = computeHealth(kept, broken);
  const mood = moodForHealth(health);
  const copy = pet.moodCopy[mood];
  const accent = moodColor(mood, colors);
  const labelInk = moodInkColor(mood, colors);
  const styles = useMemo(
    () => makeStyles(colors, mono, shape, type),
    [colors, mono, shape, type]
  );

  return (
    <View style={styles.card}>
      <View style={styles.faceWrap}>
        <pet.Face mood={mood} />
      </View>
      <Text style={[styles.moodLabel, { color: labelInk }]}>{copy.label.toUpperCase()}</Text>
      <Text style={styles.flavor}>{copy.flavor}</Text>

      <View style={styles.healthRow}>
        <Text style={styles.healthLabel}>{pet.name.toUpperCase()}&apos;S HEALTH</Text>
        <Text style={styles.healthValue}>{health} / 100</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${health}%`, backgroundColor: accent }]} />
      </View>

      <Text style={styles.stats}>
        {live} LIVE · {kept} KEPT · {broken} BROKEN
      </Text>
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
      borderRadius: hardEdges ? 8 : 20,
      padding: 20,
      alignItems: 'center',
      marginBottom: 18,
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
    faceWrap: {
      marginBottom: 12,
    },
    moodLabel: {
      fontFamily: mono,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    flavor: {
      color: colors.text,
      fontFamily: type.body,
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 6,
    },
    healthRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      marginTop: 18,
    },
    healthLabel: {
      fontFamily: mono,
      fontSize: 11,
      letterSpacing: 0.6,
      color: colors.textFaint,
    },
    healthValue: {
      fontFamily: mono,
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    track: {
      alignSelf: 'stretch',
      height: 6,
      backgroundColor: colors.trackBg,
      borderRadius: 99,
      overflow: 'hidden',
      marginTop: 6,
    },
    fill: {
      height: '100%',
      borderRadius: 99,
    },
    stats: {
      fontFamily: mono,
      fontSize: 11,
      color: colors.textFaint,
      marginTop: 14,
    },
  });
}
