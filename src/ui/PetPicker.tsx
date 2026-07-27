import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePetSelectionStore } from '../store/petSelectionStore';
import { ALL_MOODS, PET_LIST, PetId } from './pets';
import { Palette, ThemeShape, ThemeType, useTheme } from './theme';

const MOOD_LABELS: Record<(typeof ALL_MOODS)[number], string> = {
  thriving: 'THRIVING',
  happy: 'HAPPY',
  steady: 'ON TRACK',
  worried: 'WORRIED',
  fading: 'FADING',
};

export function PetPicker() {
  const { colors, mono, shape, type } = useTheme();
  const petId = usePetSelectionStore((s) => s.petId);
  const setPetId = usePetSelectionStore((s) => s.setPetId);
  // The pet you're currently looking at need not be the committed one yet —
  // tapping a row both selects it and switches this preview to it.
  const [exploringId, setExploringId] = useState<PetId>(petId);
  const styles = useMemo(() => makeStyles(colors, mono, shape, type), [colors, mono, shape, type]);

  const exploring = PET_LIST.find((p) => p.id === exploringId) ?? PET_LIST[0];

  return (
    <View>
      <View style={styles.section}>
        {PET_LIST.map((pet, i) => {
          const selected = petId === pet.id;
          return (
            <Pressable
              key={pet.id}
              style={[styles.row, i > 0 && styles.rowBorder]}
              onPress={() => {
                setPetId(pet.id);
                setExploringId(pet.id);
              }}
            >
              <View style={[styles.dot, { backgroundColor: pet.dot }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{pet.name}</Text>
                <Text style={styles.rowDescription}>{pet.concept}</Text>
              </View>
              <Text style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? '●' : '○'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.previewWrap}>
        <Text style={styles.previewTitle}>{exploring.name.toUpperCase()} · ALL MOODS</Text>
        <View style={styles.previewRow}>
          {ALL_MOODS.map((mood) => (
            <View key={mood} style={styles.previewCell}>
              <View style={styles.previewFaceWrap}>
                <exploring.Face mood={mood} size={56} />
              </View>
              <Text style={styles.previewLabel}>{MOOD_LABELS[mood]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: Palette, mono: string | undefined, shape: ThemeShape, type: ThemeType) {
  const hardEdges = shape.hardEdges;
  return StyleSheet.create({
    section: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: hardEdges ? 2 : 1,
      borderRadius: hardEdges ? 8 : 16,
      overflow: 'hidden',
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 3,
    },
    rowText: {
      flex: 1,
    },
    rowLabel: {
      color: colors.text,
      fontFamily: type.body,
      fontSize: 15.5,
      fontWeight: '600',
    },
    rowDescription: {
      color: colors.textFaint,
      fontSize: 12,
      marginTop: 2,
    },
    radio: {
      color: colors.textFaint,
      fontSize: 18,
    },
    radioSelected: {
      color: colors.accent,
    },
    previewWrap: {
      marginTop: 14,
    },
    previewTitle: {
      fontFamily: mono,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: colors.textFaint,
      marginBottom: 8,
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    previewCell: {
      alignItems: 'center',
      flex: 1,
    },
    previewFaceWrap: {
      backgroundColor: colors.panel,
      borderColor: colors.border,
      borderWidth: hardEdges ? 2 : 1,
      borderRadius: hardEdges ? 6 : 14,
      padding: 4,
    },
    previewLabel: {
      fontFamily: mono,
      fontSize: 8,
      fontWeight: '700',
      letterSpacing: 0.4,
      color: colors.textFaint,
      marginTop: 6,
    },
  });
}
