import React, {useEffect, useRef, useState} from 'react';
import {Platform, Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';

const ReactDOM = Platform.OS === 'web' ? require('react-dom') : null;

const TOOLTIP_WIDTH = 252;
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

export const splitTooltipSections = text => {
  const source = String(text || '').trim();
  const labelPattern = /([A-Z][A-Za-z -]{2,28}:)/g;
  const pieces = [];
  let lastIndex = 0;
  let match;

  while ((match = labelPattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      pieces.push({
        type: 'body',
        text: source.slice(lastIndex, match.index).trim(),
      });
    }

    const nextMatch = labelPattern.exec(source);
    labelPattern.lastIndex = nextMatch ? nextMatch.index : source.length;
    pieces.push({
      type: 'callout',
      label: match[1],
      text: source
        .slice(match.index + match[1].length, nextMatch ? nextMatch.index : source.length)
        .trim(),
    });
    lastIndex = nextMatch ? nextMatch.index : source.length;
    if (nextMatch) {
      labelPattern.lastIndex = nextMatch.index;
    }
  }

  if (lastIndex < source.length) {
    pieces.push({type: 'body', text: source.slice(lastIndex).trim()});
  }

  return pieces.filter(piece => piece.text || piece.label);
};

export const splitTooltipItems = text =>
  String(text || '')
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const separatorIndex = item.indexOf('=');
      if (separatorIndex === -1) {
        return {label: null, text: item};
      }

      return {
        label: item.slice(0, separatorIndex).trim(),
        text: item.slice(separatorIndex + 1).trim(),
      };
    });

function Tooltip({label, text, positionStyle}) {
  const sections = splitTooltipSections(text);

  return (
    <View pointerEvents="none" style={[styles.tooltip, positionStyle]}>
      <Text style={styles.tooltipTitle}>{label}</Text>
      {sections.map((section, index) => {
        if (section.type === 'callout') {
          const items = splitTooltipItems(section.text);
          if (items.length > 1) {
            return (
              <View key={`${section.label}-${index}`} style={styles.tooltipSection}>
                <Text style={styles.tooltipSectionTitle}>{section.label}</Text>
                {items.map((item, itemIndex) => (
                  <View key={`${item.label || item.text}-${itemIndex}`} style={styles.tooltipItem}>
                    {item.label ? (
                      <Text style={styles.tooltipItemLabel}>{item.label}</Text>
                    ) : null}
                    <Text style={styles.tooltipItemText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            );
          }

          return (
            <Text key={`${section.label}-${index}`} style={styles.tooltipLine}>
              <Text style={styles.tooltipTerm}>{section.label} </Text>
              <Text style={styles.tooltipKeyInfo}>{section.text}</Text>
            </Text>
          );
        }

        return (
          <Text key={`body-${index}`} style={styles.tooltipText}>
            {section.text}
          </Text>
        );
      })}
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
      <Tooltip label={label} text={text} positionStyle={tooltipPositionStyle} />
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
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 5,
  },
  tooltipTitle: {
    color: '#fbf4e8',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  tooltipLine: {
    color: '#fbf4e8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  tooltipSection: {
    borderTopColor: '#2f6f9f',
    borderTopWidth: 1,
    marginTop: 9,
    paddingTop: 8,
  },
  tooltipSectionTitle: {
    color: '#fbf4e8',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    marginBottom: 4,
  },
  tooltipItem: {
    backgroundColor: '#223142',
    borderColor: '#3a5268',
    borderLeftColor: '#6fa5ca',
    borderLeftWidth: 2,
    borderRadius: 5,
    borderWidth: 1,
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tooltipItemLabel: {
    color: '#fbf4e8',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 15,
  },
  tooltipItemText: {
    color: '#f6eddf',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    marginTop: 2,
  },
  tooltipTerm: {
    fontWeight: '900',
  },
  tooltipKeyInfo: {
    color: '#f6eddf',
    fontStyle: 'italic',
    fontWeight: '400',
  },
});

export default HintBubble;
