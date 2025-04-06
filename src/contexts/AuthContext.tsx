// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  getAuth,
} from "firebase/auth";
import { initializeFirebase, auth as firebaseAuth } from "../lib/firebase/firebase";
import { AuthContextType } from "../types";

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase
  useEffect(() => {
    // Initialize Firebase with default consent settings
    const { auth } = initializeFirebase(true, false);
    console.log("Firebase initialized in AuthContext");
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    // Use the auth instance from the initialized Firebase
    // Fall back to getAuth() if firebaseAuth is not available
    const auth = firebaseAuth || getAuth();
    
    if (!auth) {
      console.error("Firebase auth is not initialized");
      return;
    }
    
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `User: ${user.uid}` : "No user");
      setUser(user);
      setUserUid(user ? user.uid : null);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign in anonymously
  const signInAnonymously = async () => {
    try {
      // Use the auth instance from the initialized Firebase or get auth directly
      const auth = firebaseAuth || getAuth();
      if (!auth) {
        console.error("Firebase auth is not initialized");
        return;
      }
      
      console.log("Attempting anonymous sign in");
      await firebaseSignInAnonymously(auth);
    } catch (error) {
      console.error("Error signing in anonymously:", error);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      // Use the auth instance from the initialized Firebase or get auth directly
      const auth = firebaseAuth || getAuth();
      if (!auth) {
        console.error("Firebase auth is not initialized");
        return;
      }
      
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Auto sign in anonymously if not signed in
  useEffect(() => {
    if (!loading && !user) {
      signInAnonymously();
    }
  }, [loading, user]);

  // Context value
  const value: AuthContextType = {
    user,
    userUid,
    loading,
    signInAnonymously,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
