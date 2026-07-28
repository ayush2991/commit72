describe('themeStore', () => {
  it('seeds mode from the OS color scheme at creation time (light)', () => {
    let mode: string;
    jest.isolateModules(() => {
      jest.spyOn(require('react-native').Appearance, 'getColorScheme').mockReturnValue('light');
      mode = require('./themeStore').useThemeStore.getState().mode;
    });
    expect(mode!).toBe('light');
  });

  it('falls back to dark when the OS reports no preference', () => {
    let mode: string;
    jest.isolateModules(() => {
      jest.spyOn(require('react-native').Appearance, 'getColorScheme').mockReturnValue(null);
      mode = require('./themeStore').useThemeStore.getState().mode;
    });
    expect(mode!).toBe('dark');
  });

  it('setMode sets the mode directly', () => {
    const { useThemeStore } = require('./themeStore');
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('toggleMode flips between light and dark', () => {
    const { useThemeStore } = require('./themeStore');
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('light');
  });
});
