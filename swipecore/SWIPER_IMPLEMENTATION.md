# Swiper Implementation with react-native-deck-swiper

## Overview

This document describes the implementation of swipe functionality in the SwipeCard component using the `react-native-deck-swiper` library.

## Changes Made

### 1. Import Changes

- **Removed**: `react-native-gesture-handler` imports (`PanGestureHandler`, `State`)
- **Added**: `react-native-deck-swiper` import

### 2. State Management

- **Removed**: Animation values (`translateX`, `translateY`, `scale`, `rotate`)
- **Added**: Swiper reference (`swiperRef`) for programmatic control

### 3. Event Handlers

- **Removed**: Complex gesture event handlers (`onGestureEvent`, `onHandlerStateChange`)
- **Added**: Simple swipe event handlers:
  - `onSwipedLeft`: Handles left swipes (PASS)
  - `onSwipedRight`: Handles right swipes (MENU)
  - `onSwipedTop`: Handles top swipes (PASS)
  - `onSwipedBottom`: Handles bottom swipes (PASS)

### 4. Component Replacement

- **Removed**: `PanGestureHandler` with complex animations
- **Added**: `Swiper` component with comprehensive configuration

## Swiper Configuration

The Swiper component is configured with the following key properties:

**Important**: The `key` prop is crucial for proper card positioning. It forces the Swiper to re-render when a card becomes the top card, ensuring correct sizing and positioning.

```tsx
<Swiper
  ref={swiperRef}
  cards={[card]}
  renderCard={(cardData) => renderCard()}
  onSwipedLeft={onSwipedLeft}
  onSwipedRight={onSwipedRight}
  onSwipedTop={onSwipedTop}
  onSwipedBottom={onSwipedBottom}
  cardIndex={0}
  backgroundColor="transparent"
  stackSize={1}
  infinite={false}
  showSecondCard={false}
  animateOverlayLabelsOpacity={true}
  overlayLabels={{
    left: {
      title: "PASS",
      style: {
        /* styling */
      },
    },
    right: {
      title: "MENU",
      style: {
        /* styling */
      },
    },
  }}
  swipeAnimationDuration={300}
  // ... additional configuration
/>
```

## Key Features

### 1. Overlay Labels

- **Left Swipe**: Shows "PASS" label in red
- **Right Swipe**: Shows "MENU" label in green
- Labels are positioned and styled for optimal visibility

### 2. Swipe Directions

- **Left**: Triggers "pass" action
- **Right**: Triggers "menu" action
- **Top/Bottom**: Triggers "pass" action (configurable)

### 3. Programmatic Control

- `swiperRef.current.swipeLeft()`: Programmatically trigger left swipe
- `swiperRef.current.swipeRight()`: Programmatically trigger right swipe
- Useful for testing and external control

### 4. Debug Features

- Debug button randomly triggers left or right swipes
- Comprehensive logging for development
- Visual indicators for card state

## Benefits of react-native-deck-swiper

1. **Performance**: Optimized animations and gesture handling
2. **Reliability**: Battle-tested library with consistent behavior
3. **Customization**: Extensive configuration options
4. **Accessibility**: Built-in accessibility features
5. **Cross-platform**: Works consistently on iOS and Android

## Migration Notes

- The old gesture handling system has been completely replaced
- All existing swipe callbacks (`onSwipe`, `onSwipeDirection`) remain functional
- The component maintains the same external API
- Performance should be improved due to optimized gesture handling

## Testing

A comprehensive test suite has been created in `SwipeCard.test.tsx` that:

- Mocks the Swiper component for testing
- Verifies all swipe directions work correctly
- Ensures proper callback execution
- Tests component rendering

## Future Enhancements

1. **Custom Animations**: Leverage Swiper's animation system for custom effects
2. **Haptic Feedback**: Add haptic feedback for swipe actions
3. **Swipe Thresholds**: Fine-tune swipe sensitivity
4. **Card Stacking**: Implement multi-card stacking if needed
5. **Gesture Customization**: Add custom gesture recognition patterns

## Troubleshooting

### Common Issues

1. **Swiper not responding**: Check if `isTop` prop is true
2. **Overlay labels not showing**: Verify `overlayLabels` configuration
3. **Animation glitches**: Ensure `swipeAnimationDuration` is appropriate
4. **Performance issues**: Check `stackSize` and `showSecondCard` settings
5. **Card sizing issues**: The `key` prop forces re-render when `isTop` changes, ensuring proper positioning

### Debug Mode

Enable debug mode by setting `__DEV__` to true to see:

- Swipe event logging
- Card state changes
- Gesture recognition details
- Performance metrics
