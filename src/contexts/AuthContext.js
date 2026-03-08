import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async (userId) => {
    try {
      let { data } = await supabase
        .from('nc_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!data) {
        // Auto-create wallet with $0 balance
        const { data: newWallet } = await supabase
          .from('nc_wallets')
          .insert({ user_id: userId, balance: 0 })
          .select()
          .single();
        data = newWallet;
      }

      if (data) setWallet(data);
    } catch {
      // Table may not exist yet
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    if (user) {
      await fetchWallet(user.id);
    }
  }, [user, fetchWallet]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchWallet(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchWallet(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setWallet(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchWallet]);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('nc_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  }

  async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signUpWithEmail(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setWallet(null);
  }

  async function updateProfile(updates) {
    if (!user) return;
    const { data, error } = await supabase
      .from('nc_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }

  const value = {
    user,
    profile,
    wallet,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateProfile,
    fetchProfile,
    refreshWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
