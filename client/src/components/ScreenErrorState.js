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
    backgroundColor: '#1f1218',
    borderColor: '#7f1d1d',
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
    color: '#fecaca',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: '#050816',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ScreenErrorState;
