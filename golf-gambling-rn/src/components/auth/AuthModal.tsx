import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Button } from '../common';
import { darkColors } from '../../theme/colors';
import { fontFamilies } from '../../theme';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSignUp: () => void;
  onSignIn: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSignUp,
  onSignIn,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalContent}>
              <View style={styles.handle} />

              <Text style={styles.title}>Welcome to Golf Gambling</Text>
              <Text style={styles.subtitle}>
                Sign up to sync your data and access online features
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  title="Sign Up"
                  onPress={() => {
                    onClose();
                    onSignUp();
                  }}
                  style={styles.signUpButton}
                />

                <Button
                  title="Sign In"
                  onPress={() => {
                    onClose();
                    onSignIn();
                  }}
                  variant="outline"
                  style={styles.signInButton}
                />

                <TouchableOpacity onPress={onClose} style={styles.guestButton}>
                  <Text style={styles.guestButtonText}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: darkColors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: height * 0.4,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: darkColors.border.light,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: darkColors.border.medium,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamilies.heading,
    color: darkColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fontFamilies.body,
    color: darkColors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: 16,
  },
  signUpButton: {
    marginBottom: 0,
  },
  signInButton: {
    marginBottom: 0,
  },
  guestButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 16,
    fontFamily: fontFamilies.body,
    color: darkColors.text.secondary,
    textDecorationLine: 'underline',
  },
});
