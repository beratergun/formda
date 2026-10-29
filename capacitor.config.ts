import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.beratergun.formda',
  appName: 'Formda',
  webDir: 'dist-native',
  backgroundColor: '#f3f6f4',
  loggingBehavior: 'none',
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false, minWebViewVersion: 101 },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#126c6a',
      showSpinner: false,
      androidScaleType: 'CENTER_INSIDE',
    },
  },
};
export default config;
