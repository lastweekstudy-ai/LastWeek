import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser, loginAsGuest } from '../appwrite/auth';
import { createUserProfile, getUserProfile } from '../appwrite/database';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsGuest(currentUser.labels?.includes('guest') || false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      await loginUser(email, password);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsGuest(false);
      return currentUser;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, name, profileData = {}) => {
    try {
      const newUser = await registerUser(email, password, name, profileData);
      setUser(newUser);
      setIsGuest(false);
      
      // Create user profile
      try {
        await createUserProfile(newUser.$id, name);
      } catch (profileError) {
        console.error('Failed to create user profile:', profileError);
      }
      
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      throw error;
    }
  };

  const loginGuest = async () => {
    try {
      await loginAsGuest();
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsGuest(true);
      return currentUser;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isGuest,
    login,
    register,
    logout,
    loginGuest,
    refreshUser: checkAuth, // expose so components can re-fetch user after webhook
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};