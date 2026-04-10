import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>App Error</Text>
          <Text style={styles.subtitle}>The app encountered an error. Copy this info for debugging:</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.label}>Error:</Text>
            <Text style={styles.errorText} selectable>
              {this.state.error?.toString()}
            </Text>
            <Text style={styles.label}>Stack:</Text>
            <Text style={styles.stackText} selectable>
              {this.state.error?.stack || 'No stack trace'}
            </Text>
            {this.state.errorInfo?.componentStack && (
              <>
                <Text style={styles.label}>Component Stack:</Text>
                <Text style={styles.stackText} selectable>
                  {this.state.errorInfo.componentStack}
                </Text>
              </>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0000',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ff8888',
    fontSize: 14,
    marginBottom: 16,
  },
  scroll: {
    flex: 1,
  },
  label: {
    color: '#ffcc00',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: {
    color: '#ff8888',
    fontSize: 14,
  },
  stackText: {
    color: '#ffaaaa',
    fontSize: 11,
  },
  button: {
    backgroundColor: '#cc0000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
