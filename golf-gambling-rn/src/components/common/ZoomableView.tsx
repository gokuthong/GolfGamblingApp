import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface ZoomableViewProps {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  doubleTapScale?: number;
  onScaleChange?: (scale: number) => void;
}

export const ZoomableView: React.FC<ZoomableViewProps> = ({
  children,
  style,
  contentStyle,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
  doubleTapScale = 2,
  onScaleChange,
}) => {
  // Shared values for gestures
  const scale = useSharedValue(initialScale);
  const savedScale = useSharedValue(initialScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Helper to clamp scale within bounds
  const clampScale = (value: number) => {
    'worklet';
    return Math.min(Math.max(value, minScale), maxScale);
  };

  // Reset to initial state
  const resetTransform = () => {
    'worklet';
    scale.value = withSpring(initialScale, { damping: 15, stiffness: 150 });
    savedScale.value = initialScale;
    translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onStart((event) => {
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onUpdate((event) => {
      const newScale = clampScale(savedScale.value * event.scale);
      scale.value = newScale;

      // Adjust translation to zoom around focal point
      if (savedScale.value !== 0) {
        const scaleDiff = newScale / savedScale.value;
        const adjustX = (focalX.value - savedTranslateX.value) * (1 - scaleDiff);
        const adjustY = (focalY.value - savedTranslateY.value) * (1 - scaleDiff);
        translateX.value = savedTranslateX.value + adjustX;
        translateY.value = savedTranslateY.value + adjustY;
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;

      // Snap to bounds if needed
      if (scale.value < minScale) {
        scale.value = withSpring(minScale, { damping: 15, stiffness: 150 });
        savedScale.value = minScale;
      } else if (scale.value > maxScale) {
        scale.value = withSpring(maxScale, { damping: 15, stiffness: 150 });
        savedScale.value = maxScale;
      }

      if (onScaleChange) {
        runOnJS(onScaleChange)(scale.value);
      }
    });

  // Pan gesture for moving
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double tap to zoom in/out
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > initialScale) {
        // Reset to initial
        resetTransform();
      } else {
        // Zoom to doubleTapScale centered on tap location
        const newScale = doubleTapScale;
        scale.value = withSpring(newScale, { damping: 15, stiffness: 150 });
        savedScale.value = newScale;

        // Center zoom on tap point
        const centerX = event.x;
        const centerY = event.y;
        translateX.value = withSpring(-centerX * (newScale - 1) / newScale, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(-centerY * (newScale - 1) / newScale, { damping: 15, stiffness: 150 });
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }

      if (onScaleChange) {
        runOnJS(onScaleChange)(scale.value);
      }
    });

  // Combine gestures - pinch and pan work simultaneously, double tap is separate
  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  // Animated style for the content
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={[styles.container, style]}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.content, contentStyle, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});

export default ZoomableView;
