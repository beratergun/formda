import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.beratergun.berxfit',
  appName: 'berXfit',
  webDir: 'dist-native',
  backgroundColor: '#070b12',
  loggingBehavior: 'none',
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false, minWebViewVersion: 101 },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#070b12',
      showSpinner: false,
      androidScaleType: 'CENTER_INSIDE',
    },
  },
};
export default config;
