export const animations = {
  // Duration in milliseconds
  timing: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
  },

  // Spring configuration for react-native-reanimated
  spring: {
    // Gentle spring for smooth, natural motion
    gentle: {
      damping: 20,
      stiffness: 90,
      mass: 1,
    },
    // Bouncy spring for playful interactions
    bouncy: {
      damping: 10,
      stiffness: 100,
      mass: 1,
    },
    // Stiff spring for quick, responsive feel
    stiff: {
      damping: 15,
      stiffness: 120,
      mass: 1,
    },
    // Snappy spring for instant feedback
    snappy: {
      damping: 18,
      stiffness: 150,
      mass: 0.8,
    },
  },

  // Easing curves (for React Native Animated)
  easing: {
    default: 'ease-in-out',
    linear: 'linear',
    enter: 'ease-out',
    exit: 'ease-in',
    emphasize: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Common scale transforms
  scale: {
    pressIn: 0.95,
    pressOut: 1.0,
    hover: 1.02,
  },

  // Common opacity values
  opacity: {
    visible: 1,
    semiVisible: 0.7,
    dimmed: 0.5,
    subtle: 0.3,
    invisible: 0,
  },
};

export type Animations = typeof animations;
