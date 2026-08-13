import React, {useEffect, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

let nextHintId = 1;
let activeHintId = null;
const activeHintListeners = new Set();

function emitActiveHint(id) {
  activeHintId = id;
  activeHintListeners.forEach(listener => listener(activeHintId));
}

function clearActiveHint(id) {
  if (activeHintId === id) {
    emitActiveHint(null);
  }
}

function subscribeActiveHint(listener) {
  activeHintListeners.add(listener);
  return () => activeHintListeners.delete(listener);
}

function HintBubble({label = 'Help', text, align = 'right'}) {
  const idRef = useRef(null);
  if (idRef.current === null) {
    idRef.current = `hint-${nextHintId}`;
    nextHintId += 1;
  }

  const [activeId, setActiveId] = useState(activeHintId);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tappedOpen, setTappedOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => subscribeActiveHint(setActiveId), []);

  if (!text) return null;

  const isActive = activeId === idRef.current;
  const visible = isActive && !dismissed && (hovered || focused || tappedOpen);

  const openFromHover = () => {
    setHovered(true);
    setTappedOpen(false);
    setDismissed(false);
    emitActiveHint(idRef.current);
  };

  const closeFromHover = () => {
    setHovered(false);
    setTappedOpen(false);
    setDismissed(false);
    clearActiveHint(idRef.current);
  };

  const openFromFocus = () => {
    setFocused(true);
    emitActiveHint(idRef.current);
  };

  const closeFromFocus = () => {
    setFocused(false);
    setTappedOpen(false);
    setDismissed(false);
    clearActiveHint(idRef.current);
  };

  const toggleFromPress = () => {
    if (visible) {
      setTappedOpen(false);
      setDismissed(true);
      clearActiveHint(idRef.current);
      return;
    }

    setTappedOpen(true);
    setDismissed(false);
    emitActiveHint(idRef.current);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({pressed}) => [styles.bubble, pressed && styles.bubblePressed]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}`}
        accessibilityHint="Shows a short explanation."
        onHoverIn={openFromHover}
        onHoverOut={closeFromHover}
        onFocus={openFromFocus}
        onBlur={closeFromFocus}
        onPress={toggleFromPress}>
        <Text style={styles.bubbleText}>?</Text>
      </Pressable>
      {visible ? (
        <View
          pointerEvents="none"
          style={[styles.tooltip, align === 'left' ? styles.tooltipLeft : styles.tooltipRight]}>
          <Text style={styles.tooltipText}>{text}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    zIndex: 100,
  },
  bubble: {
    alignItems: 'center',
    backgroundColor: '#f6eddf',
    borderColor: '#bfae94',
    borderRadius: 999,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  bubblePressed: {
    backgroundColor: '#eadbc6',
    borderColor: '#2f6f9f',
  },
  bubbleText: {
    color: '#2f6f9f',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  tooltip: {
    backgroundColor: '#182532',
    borderColor: '#2f6f9f',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
    top: 22,
    width: 240,
    zIndex: 1000,
    shadowColor: '#182532',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  tooltipRight: {
    right: 0,
  },
  tooltipLeft: {
    left: 0,
  },
  tooltipText: {
    color: '#fbf4e8',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});

export default HintBubble;
