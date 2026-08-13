import React, {useEffect, useRef, useState} from 'react';
import {Platform, Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';

const ReactDOM = Platform.OS === 'web' ? require('react-dom') : null;

const TOOLTIP_WIDTH = 220;
const EDGE_GAP = 12;
const VERTICAL_GAP = 10;
const ESTIMATED_TOOLTIP_HEIGHT = 96;

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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildTooltipPosition(anchor, align, windowWidth, windowHeight) {
  if (!anchor) return null;

  const maxLeft = Math.max(EDGE_GAP, windowWidth - TOOLTIP_WIDTH - EDGE_GAP);
  const preferredLeft =
    align === 'left' ? anchor.x : anchor.x + anchor.width - TOOLTIP_WIDTH;
  const left = clamp(preferredLeft, EDGE_GAP, maxLeft);

  const belowTop = anchor.y + anchor.height + VERTICAL_GAP;
  const top =
    belowTop + ESTIMATED_TOOLTIP_HEIGHT > windowHeight - EDGE_GAP
      ? Math.max(EDGE_GAP, anchor.y - ESTIMATED_TOOLTIP_HEIGHT - VERTICAL_GAP)
      : belowTop;

  return {left, top};
}

function Tooltip({children, positionStyle}) {
  return (
    <View pointerEvents="none" style={[styles.tooltip, positionStyle]}>
      <Text style={styles.tooltipText}>{children}</Text>
    </View>
  );
}

function HintBubble({label = 'Help', text, align = 'right'}) {
  const idRef = useRef(null);
  const anchorRef = useRef(null);
  const {width: windowWidth, height: windowHeight} = useWindowDimensions();
  if (idRef.current === null) {
    idRef.current = `hint-${nextHintId}`;
    nextHintId += 1;
  }

  const [anchor, setAnchor] = useState(null);
  const [activeId, setActiveId] = useState(activeHintId);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tappedOpen, setTappedOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => subscribeActiveHint(setActiveId), []);

  if (!text) return null;

  const isActive = activeId === idRef.current;
  const visible = isActive && !dismissed && (hovered || focused || tappedOpen);
  const floatingPosition =
    Platform.OS === 'web' ? buildTooltipPosition(anchor, align, windowWidth, windowHeight) : null;

  const measureAnchor = () => {
    anchorRef.current?.measureInWindow?.((x, y, width, height) => {
      setAnchor({x, y, width, height});
    });
  };

  const openFromHover = () => {
    setHovered(true);
    setTappedOpen(false);
    setDismissed(false);
    measureAnchor();
    emitActiveHint(idRef.current);
  };

  const closeFromHover = () => {
    setHovered(false);
    setTappedOpen(false);
    setDismissed(false);
    setAnchor(null);
    clearActiveHint(idRef.current);
  };

  const openFromFocus = () => {
    setFocused(true);
    measureAnchor();
    emitActiveHint(idRef.current);
  };

  const closeFromFocus = () => {
    setFocused(false);
    setTappedOpen(false);
    setDismissed(false);
    setAnchor(null);
    clearActiveHint(idRef.current);
  };

  const toggleFromPress = () => {
    if (visible) {
      setTappedOpen(false);
      setDismissed(true);
      setAnchor(null);
      clearActiveHint(idRef.current);
      return;
    }

    setTappedOpen(true);
    setDismissed(false);
    measureAnchor();
    emitActiveHint(idRef.current);
  };

  useEffect(() => {
    if (visible) {
      measureAnchor();
    }
  }, [visible, windowWidth, windowHeight]);

  const tooltipPositionStyle =
    Platform.OS === 'web' && floatingPosition
      ? [styles.tooltipFloating, floatingPosition]
      : [styles.tooltipInline, align === 'left' ? styles.tooltipLeft : styles.tooltipRight];
  const tooltip =
    visible && (Platform.OS !== 'web' || floatingPosition) ? (
      <Tooltip positionStyle={tooltipPositionStyle}>{text}</Tooltip>
    ) : null;
  const portaledTooltip =
    Platform.OS === 'web' && ReactDOM && typeof document !== 'undefined' && tooltip
      ? ReactDOM.createPortal(tooltip, document.body)
      : tooltip;

  return (
    <View style={styles.wrap}>
      <View ref={anchorRef} collapsable={false}>
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
      </View>
      {portaledTooltip}
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
    maxWidth: TOOLTIP_WIDTH,
    width: TOOLTIP_WIDTH,
    zIndex: 10000,
    shadowColor: '#182532',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  tooltipInline: {
    position: 'absolute',
    top: 22,
  },
  tooltipFloating: {
    position: 'fixed',
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
