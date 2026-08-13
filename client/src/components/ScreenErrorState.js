import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

function ScreenErrorState({
  title = 'Unable to load',
  message,
  actionLabel = 'Retry',
  onRetry,
  compact = false,
}) {
  return (
    <View style={[styles.panel, compact && styles.compactPanel]}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    backgroundColor: '#f8ddd6',
    borderColor: '#d9a39b',
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 12,
    padding: 16,
  },
  compactPanel: {
    marginVertical: 10,
    padding: 12,
  },
  title: {
    color: '#7f2f25',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    color: '#8f3a30',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: '#2f6f9f',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: '#f7f3ea',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ScreenErrorState;
