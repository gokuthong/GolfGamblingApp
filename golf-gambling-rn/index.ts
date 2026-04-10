import React from 'react';
import { View, Text, ScrollView, AppRegistry } from 'react-native';

// Capture any startup errors BEFORE loading the app
let startupError: { message: string; stack: string } | null = null;

// Set global error handler as early as possible
const g = global as any;
if (g.ErrorUtils) {
  const originalHandler = g.ErrorUtils.getGlobalHandler();
  g.ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
    if (!startupError) {
      startupError = {
        message: `[${isFatal ? 'FATAL' : 'ERROR'}] ${error?.message || String(error)}`,
        stack: error?.stack || 'No stack trace',
      };
    }
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Try loading the app - if any import throws, we catch it
let App: any = null;
try {
  App = require('./App').default;
} catch (error: any) {
  startupError = {
    message: error?.message || String(error),
    stack: error?.stack || 'No stack trace',
  };
}

// Fallback error screen shown if App fails to load
const StartupErrorScreen = () => {
  const err = startupError;
  return React.createElement(
    View,
    { style: { flex: 1, backgroundColor: '#1a0000', padding: 20, paddingTop: 80 } },
    React.createElement(
      Text,
      { style: { color: '#ff4444', fontSize: 22, fontWeight: 'bold', marginBottom: 12 } },
      'Startup Error'
    ),
    React.createElement(
      Text,
      { style: { color: '#ffaa00', fontSize: 13, marginBottom: 16 } },
      'The app failed to start. Long-press text to copy for debugging.'
    ),
    React.createElement(
      ScrollView,
      { style: { flex: 1 } },
      React.createElement(
        Text,
        { style: { color: '#ff8888', fontSize: 14, marginBottom: 12 }, selectable: true },
        err?.message || 'Unknown error'
      ),
      React.createElement(
        Text,
        { style: { color: '#ffaaaa', fontSize: 10 }, selectable: true },
        err?.stack || ''
      )
    )
  );
};

// Register the app - use registerRootComponent if available, fallback to AppRegistry
try {
  const { registerRootComponent } = require('expo');
  if (startupError || !App) {
    registerRootComponent(StartupErrorScreen);
  } else {
    registerRootComponent(App);
  }
} catch (regError: any) {
  // If even expo fails to load, use raw AppRegistry
  if (startupError) {
    startupError.message += '\n\nAlso failed to load expo: ' + (regError?.message || '');
  } else {
    startupError = {
      message: 'Failed to load expo: ' + (regError?.message || String(regError)),
      stack: regError?.stack || '',
    };
  }
  AppRegistry.registerComponent('main', () => StartupErrorScreen);
}
