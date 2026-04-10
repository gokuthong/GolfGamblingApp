import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { crossPlatformAlert } from '../../utils/crossPlatformAlert';
import { Button, Card, EmptyState } from '../../components/common';
import { dataService } from '../../services/DataService';
import { typography, spacing, fontFamilies } from '../../theme';
import { useThemedColors } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export const AdminPanelScreen = () => {
  const colors = useThemedColors();
  const navigation = useNavigation();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const users = await dataService.getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error('Failed to load pending users:', error);
      crossPlatformAlert('Error', 'Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPendingUsers();
    setRefreshing(false);
  }, []);

  const handleApprove = async (userId: string, displayName: string) => {
    crossPlatformAlert(
      'Approve User',
      `Approve ${displayName}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await dataService.approvePendingUser(userId);
              crossPlatformAlert('Success', `${displayName}'s account has been approved`);
              await loadPendingUsers();
            } catch (error) {
              console.error('Failed to approve user:', error);
              crossPlatformAlert('Error', 'Failed to approve user');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (userId: string, displayName: string) => {
    crossPlatformAlert(
      'Reject User',
      `Are you sure you want to reject ${displayName}'s account? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.rejectPendingUser(userId);
              crossPlatformAlert('Success', `${displayName}'s account has been rejected`);
              await loadPendingUsers();
            } catch (error) {
              console.error('Failed to reject user:', error);
              crossPlatformAlert('Error', 'Failed to reject user');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right']}>
        <Text style={styles.loadingText}>Loading pending approvals...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
      refreshControl={
        Platform.OS !== 'web' ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.gold}
          />
        ) : undefined
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Pending User Approvals</Text>
        <Text style={styles.subtitle}>
          {pendingUsers.length === 0
            ? 'No pending requests'
            : `${pendingUsers.length} user${pendingUsers.length === 1 ? '' : 's'} waiting for approval`}
        </Text>
      </View>

      {pendingUsers.length === 0 ? (
        <EmptyState
          icon="checkmark-circle"
          title="All Caught Up"
          message="There are no pending user approvals at this time."
        />
      ) : (
        <View style={styles.userList}>
          {pendingUsers.map((user, index) => (
            <Animated.View
              key={user.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
            >
              <Card style={styles.userCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userHeader}>
                    <Text style={styles.displayName}>{user.displayName}</Text>
                    <View style={styles.userNumberBadge}>
                      <Text style={styles.userNumberText}>#{user.userNumber}</Text>
                    </View>
                  </View>

                  <Text style={styles.email}>{user.email}</Text>

                  <Text style={styles.signupDate}>
                    Signed up {formatDate(user.createdAt)}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <Button
                    title="Approve"
                    onPress={() => handleApprove(user.id, user.displayName)}
                    style={styles.approveButton}
                  />
                  <Button
                    title="Reject"
                    onPress={() => handleReject(user.id, user.displayName)}
                    variant="outline"
                    style={styles.rejectButton}
                  />
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl * 2,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.primary,
    },
    loadingText: {
      ...typography.bodyLarge,
      color: colors.text.secondary,
    },
    header: {
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.h1,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.bodyLarge,
      color: colors.text.secondary,
    },
    userList: {
      gap: spacing.md,
    },
    userCard: {
      padding: spacing.lg,
      backgroundColor: colors.background.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    userInfo: {
      marginBottom: spacing.md,
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    displayName: {
      ...typography.h3,
      color: colors.text.primary,
      flex: 1,
    },
    userNumberBadge: {
      backgroundColor: colors.accent.gold,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
    },
    userNumberText: {
      ...typography.bodySmall,
      color: colors.text.inverse,
      fontFamily: fontFamilies.mono,
      fontWeight: 'bold',
    },
    email: {
      ...typography.bodyMedium,
      color: colors.text.secondary,
      marginBottom: spacing.xs,
    },
    signupDate: {
      ...typography.bodySmall,
      color: colors.text.tertiary,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    approveButton: {
      flex: 1,
      marginBottom: 0,
    },
    rejectButton: {
      flex: 1,
      marginBottom: 0,
    },
  });
