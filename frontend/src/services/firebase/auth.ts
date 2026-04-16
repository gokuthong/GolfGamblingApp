import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  sendPasswordResetEmail,
  deleteUser,
} from "firebase/auth";
import { auth } from "./config";

class AuthService {
  async signUp(
    email: string,
    password: string,
    displayName: string,
  ): Promise<FirebaseUser> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Update display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }

    return userCredential.user;
  }

  async signIn(email: string, password: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  }

  async signOut(): Promise<void> {
    await signOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  async updateUserProfile(
    displayName?: string,
    photoURL?: string,
  ): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error("No user logged in");
    }

    await updateProfile(user, { displayName, photoURL });
  }

  async deleteAccount(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error("No user logged in");
    }

    await deleteUser(user);
  }
}

export const authService = new AuthService();
