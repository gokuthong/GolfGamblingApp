import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '../services/storage';

/**
 * Database Setup Utility
 * This script sets up the super admin user and cleans up the database
 */

export async function setupSuperAdmin() {
  try {
    console.log('🔧 Starting database setup...');

    // Step 1: Get all user keys
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter(key =>
      key.startsWith('@user:') &&
      !key.includes(':approval:') &&
      !key.includes(':role:')
    );

    console.log(`📋 Found ${userKeys.length} users in database`);

    // Step 2: Delete all existing users and their related data
    for (const key of userKeys) {
      const userId = key.replace('@user:', '');

      // Delete user profile
      await AsyncStorage.removeItem(key);

      // Delete user's approval data
      await AsyncStorage.removeItem(StorageKeys.userApprovalData(userId));

      // Delete user's role data
      await AsyncStorage.removeItem(StorageKeys.userRole(userId));

      // Delete user's games
      await AsyncStorage.removeItem(StorageKeys.gamesIndex(userId));

      // Delete user's players
      await AsyncStorage.removeItem(StorageKeys.players(userId));

      // Delete user's courses
      await AsyncStorage.removeItem(StorageKeys.courses(userId));

      console.log(`🗑️  Deleted user: ${userId}`);
    }

    // Step 3: Clear pending users
    await AsyncStorage.removeItem(StorageKeys.pendingUsers());
    console.log('🗑️  Cleared pending users list');

    // Step 4: Reset user counter to 0 (so next user will be 001)
    await AsyncStorage.setItem('@userCounter', '0');
    console.log('🔄 Reset user counter');

    // Step 5: Create the super admin user (KP)
    const superAdminId = 'kp_super_admin_001'; // Use a consistent ID
    const superAdminData = {
      email: 'kp.tey@outlook.com',
      displayName: 'KP',
      userNumber: '001',
      role: 'super_admin',
      approvalStatus: 'approved',
      isOffline: false,
      createdAt: new Date().toISOString(),
      settings: {
        darkMode: false,
        hapticFeedback: true,
        defaultHandicap: 0,
      },
    };

    // Save super admin profile
    await AsyncStorage.setItem(`@user:${superAdminId}`, JSON.stringify(superAdminData));

    // Set role
    await AsyncStorage.setItem(StorageKeys.userRole(superAdminId), 'super_admin');

    // Set approval status
    await AsyncStorage.setItem(
      StorageKeys.userApprovalData(superAdminId),
      JSON.stringify({ status: 'approved', updatedAt: new Date().toISOString() })
    );

    // Set user counter to 1 (since we used 001)
    await AsyncStorage.setItem('@userCounter', '1');

    console.log('✅ Created super admin user:');
    console.log('   Email: kp.tey@outlook.com');
    console.log('   Display Name: KP');
    console.log('   User Number: 001');
    console.log('   Role: super_admin');
    console.log('   Status: approved');

    // Step 6: Initialize empty player profile for KP
    await AsyncStorage.setItem(StorageKeys.players(superAdminId), JSON.stringify([]));

    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('ℹ️  Next steps:');
    console.log('   1. Restart the app');
    console.log('   2. Sign in with: kp.tey@outlook.com');
    console.log('   3. You should have super admin privileges');

    return {
      success: true,
      message: 'Super admin setup complete',
      userId: superAdminId,
    };
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Quick diagnostic to check database state
 */
export async function checkDatabaseState() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter(key => key.startsWith('@user:') && !key.includes(':'));

    console.log('📊 Database State:');
    console.log(`   Total keys: ${allKeys.length}`);
    console.log(`   User profiles: ${userKeys.length}`);

    for (const key of userKeys) {
      const userData = await AsyncStorage.getItem(key);
      if (userData) {
        const user = JSON.parse(userData);
        console.log(`   - ${user.displayName || 'Unknown'} (${user.email}) - User #${user.userNumber} - Role: ${user.role}`);
      }
    }

    const pendingUsers = await AsyncStorage.getItem(StorageKeys.pendingUsers());
    if (pendingUsers) {
      const pending = JSON.parse(pendingUsers);
      console.log(`   Pending approvals: ${pending.length}`);
    }

    return { success: true, userCount: userKeys.length };
  } catch (error) {
    console.error('Error checking database:', error);
    return { success: false, error };
  }
}
