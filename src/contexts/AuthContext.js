import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef(null);

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

  const fetchNotifications = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('nc_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch {
      // Table may not exist yet
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (user) {
      await fetchNotifications(user.id);
    }
  }, [user, fetchNotifications]);

  const fetchUnreadCount = useCallback(async (userId) => {
    try {
      const { count } = await supabase
        .from('nc_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      setUnreadCount(count || 0);
    } catch {
      // Table may not exist yet
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await supabase
        .from('nc_notifications')
        .update({ read: true })
        .eq('id', notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      await supabase
        .from('nc_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchWallet(session.user.id);
        fetchNotifications(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchWallet(session.user.id);
        fetchNotifications(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setWallet(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchWallet, fetchNotifications]);

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    if (!user) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      fetchUnreadCount(user.id);
    }, 60000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchUnreadCount]);

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
    setNotifications([]);
    setUnreadCount(0);
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
    notifications,
    unreadCount,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateProfile,
    fetchProfile,
    refreshWallet,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
