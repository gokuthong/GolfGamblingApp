import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedColors } from '../../contexts/ThemeContext';
import { fontFamilies } from '../../theme';

interface UserAvatarButtonProps {
  user: any;
  onPress: () => void;
  style?: ViewStyle;
}

export const UserAvatarButton: React.FC<UserAvatarButtonProps> = ({ user, onPress, style }) => {
  const insets = useSafeAreaInsets();
  const colors = useThemedColors();

  // Get initials from display name
  const getInitials = (name: string): string => {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isGuest = user?.role === 'guest' || user?.isOffline;
  const isSuperAdmin = user?.role === 'super_admin';
  const initials = isGuest ? 'G' : getInitials(user?.displayName || 'U');

  return (
    <View style={[styles.container, { top: insets.top + 16 }, style]}>
      <TouchableOpacity
        style={[
          styles.avatar,
          {
            backgroundColor: colors.surfaces.level2,
            borderColor: isGuest ? colors.border.medium : colors.accent.gold,
          },
          isGuest && { backgroundColor: colors.surfaces.level1 },
          isSuperAdmin && { borderWidth: 3 },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.initials,
          { color: isGuest ? colors.text.secondary : colors.accent.gold },
        ]}>
          {initials}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  initials: {
    fontSize: 16,
    fontFamily: fontFamilies.heading,
    fontWeight: 'bold',
  },
});
