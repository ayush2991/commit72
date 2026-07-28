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

  it('defaults modePreference to system', () => {
    const { useThemeStore } = require('./themeStore');
    expect(useThemeStore.getState().modePreference).toBe('system');
  });

  it('setModePreference sets an explicit light/dark mode directly', () => {
    const { useThemeStore } = require('./themeStore');
    useThemeStore.getState().setModePreference('dark');
    expect(useThemeStore.getState().modePreference).toBe('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().setModePreference('light');
    expect(useThemeStore.getState().modePreference).toBe('light');
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('setModePreference("system") resolves mode from the current OS scheme', () => {
    let modePreference: string;
    let mode: string;
    jest.isolateModules(() => {
      const { Appearance } = require('react-native');
      const spy = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
      const { useThemeStore } = require('./themeStore');
      useThemeStore.getState().setModePreference('light');
      spy.mockReturnValue('light');
      useThemeStore.getState().setModePreference('system');
      modePreference = useThemeStore.getState().modePreference;
      mode = useThemeStore.getState().mode;
    });
    expect(modePreference!).toBe('system');
    expect(mode!).toBe('light');
  });

  it('tracks live OS appearance changes while modePreference is system', () => {
    let mode: string;
    jest.isolateModules(() => {
      const { Appearance } = require('react-native');
      jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
      let listener: (event: { colorScheme: string | null }) => void = () => {};
      jest.spyOn(Appearance, 'addChangeListener').mockImplementation(((cb: typeof listener) => {
        listener = cb;
        return { remove: () => {} };
      }) as typeof Appearance.addChangeListener);
      const { useThemeStore } = require('./themeStore');
      listener({ colorScheme: 'light' });
      mode = useThemeStore.getState().mode;
    });
    expect(mode!).toBe('light');
  });

  it('ignores OS appearance changes once an explicit light/dark mode is chosen', () => {
    let mode: string;
    jest.isolateModules(() => {
      const { Appearance } = require('react-native');
      jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');
      let listener: (event: { colorScheme: string | null }) => void = () => {};
      jest.spyOn(Appearance, 'addChangeListener').mockImplementation(((cb: typeof listener) => {
        listener = cb;
        return { remove: () => {} };
      }) as typeof Appearance.addChangeListener);
      const { useThemeStore } = require('./themeStore');
      useThemeStore.getState().setModePreference('dark');
      listener({ colorScheme: 'light' });
      mode = useThemeStore.getState().mode;
    });
    expect(mode!).toBe('dark');
  });
});
