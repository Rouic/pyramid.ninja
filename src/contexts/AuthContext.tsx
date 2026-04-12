// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInAnonymously as paasSignIn,
  signOut as paasSignOut,
  AuthUser,
} from "../lib/api/auth";
import { AuthContextType } from "../types";

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign in anonymously via PaaS managed auth
  const signInAnonymously = async () => {
    try {
      console.log("Attempting anonymous sign in via PaaS");
      const result = await paasSignIn();
      if (result.user) {
        setUser(result.user);
        setUserUid(result.user.uid);
      } else {
        console.error("Auth failed:", result.error);
      }
    } catch (error) {
      console.error("Error signing in anonymously:", error);
    }
  };

  // Sign out
  const signOut = async () => {
    paasSignOut();
    setUser(null);
    setUserUid(null);
  };

  // Auto sign in on mount
  useEffect(() => {
    signInAnonymously().finally(() => setLoading(false));
  }, []);

  // Context value
  const value: AuthContextType = {
    user: user as any, // AuthUser is compatible with usage patterns (has .uid)
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
