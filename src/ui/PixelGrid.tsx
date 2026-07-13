import { View } from 'react-native';

export const PIXEL_GRID_COLS = 16;

interface Props {
  grid: (string | null)[][];
  size?: number;
}

/** Renders a fixed square grid of colored cells — the shared substrate every pet Face is built on. */
export function PixelGrid({ grid, size = 152 }: Props) {
  const cell = size / PIXEL_GRID_COLS;

  return (
    <View style={{ width: size, height: size }}>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((color, c) => (
            <View
              key={c}
              style={{
                width: cell,
                height: cell,
                backgroundColor: color ?? 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
