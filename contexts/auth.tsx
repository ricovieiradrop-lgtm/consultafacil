import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  cpf: string;
  role: 'patient' | 'doctor' | 'admin';
  avatar_url?: string;
  location?: string;
  city?: string;
  state?: string;
  created_at: string;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarding: boolean;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    isOnboarding: false,
  });

  const loadProfile = useCallback(async (userId: string) => {
    try {
      console.log('🔍 Auth: Loading profile for user', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        console.log('✅ Auth: Profile loaded', profile.full_name, profile.role);
        const { data: { session } } = await supabase.auth.getSession();
        
        setAuthState({
          session,
          user: session?.user || null,
          profile,
          isLoading: false,
          isOnboarding: false,
        });
      } else {
        console.log('⚠️ Auth: User authenticated but no profile found');
        const { data: { session } } = await supabase.auth.getSession();
        
        setAuthState({
          session,
          user: session?.user || null,
          profile: null,
          isLoading: false,
          isOnboarding: true,
        });
      }
    } catch (error) {
      console.error('❌ Auth: Error loading profile', error);
      const { data: { session } } = await supabase.auth.getSession();
      
      setAuthState({
        session,
        user: session?.user || null,
        profile: null,
        isLoading: false,
        isOnboarding: true,
      });
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        console.log('✅ Auth: Session found');
        await loadProfile(session.user.id);
      } else {
        console.log('❌ Auth: No session');
        setAuthState({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
          isOnboarding: false,
        });
      }
    } catch (error) {
      console.error('❌ Auth: Error loading session', error);
      setAuthState({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        isOnboarding: false,
      });
    }
  }, [loadProfile]);

  useEffect(() => {
    console.log('🔐 Auth: Initializing with Supabase...');
    
    const initAuth = async () => {
      await loadSession();
    };
    
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth: State changed:', event);
      
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setAuthState({
          session: null,
          user: null,
          profile: null,
          isLoading: false,
          isOnboarding: false,
        });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [loadSession, loadProfile]);

  const signInWithPhone = async (phone: string) => {
    console.log('📱 Auth: Sending OTP to', phone);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      console.error('❌ Auth: Error sending OTP', error);
      throw error;
    }

    console.log('✅ Auth: OTP sent successfully');
    return { phone };
  };

  const verifyOTP = async (phone: string, token: string) => {
    console.log('🔑 Auth: Verifying OTP for', phone);
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      console.error('❌ Auth: Error verifying OTP', error);
      throw error;
    }

    if (!data.session || !data.user) {
      throw new Error('Falha ao criar sessão');
    }

    console.log('✅ Auth: OTP verified, user authenticated');

    try {
      console.log('🔍 Auth: Checking if profile exists');
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (existingProfile && !profileError) {
        console.log('✅ Auth: Found existing profile', existingProfile.role, existingProfile.full_name);
        
        setAuthState({
          session: data.session,
          user: data.user,
          profile: existingProfile,
          isLoading: false,
          isOnboarding: false,
        });

        return { session: data.session, user: data.user };
      }
    } catch (error) {
      console.log('⚠️ Auth: No profile found, needs onboarding', error);
    }

    setAuthState({
      session: data.session,
      user: data.user,
      profile: null,
      isLoading: false,
      isOnboarding: true,
    });

    console.log('⚠️ Auth: User needs to complete profile');
    return { session: data.session, user: data.user };
  };

  const completeProfile = async (profileData: {
    full_name: string;
    cpf: string;
  }) => {
    if (!authState.user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('👤 Auth: Completing profile for', authState.user.id);

    const profileToInsert = {
      id: authState.user.id,
      full_name: profileData.full_name,
      cpf: profileData.cpf,
      phone: authState.user.phone || '',
      role: 'patient' as const,
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert(profileToInsert)
      .select()
      .single();

    if (error) {
      console.error('❌ Auth: Error creating profile', error);
      throw error;
    }

    console.log('✅ Auth: Profile created successfully');
    setAuthState(prev => ({
      ...prev,
      profile,
      isOnboarding: false,
    }));

    return profile;
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!authState.user || !authState.profile) {
      throw new Error('Usuário não autenticado');
    }

    console.log('📝 Auth: Updating profile');

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authState.user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Auth: Error updating profile', error);
      throw error;
    }

    console.log('✅ Auth: Profile updated');
    setAuthState(prev => ({
      ...prev,
      profile: updatedProfile,
    }));

    return updatedProfile;
  };

  const signOut = async () => {
    console.log('🚪 Auth: Signing out');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Auth: Error signing out', error);
      throw error;
    }

    setAuthState({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      isOnboarding: false,
    });
    
    router.replace('/welcome');
  };

  return {
    ...authState,
    signInWithPhone,
    verifyOTP,
    completeProfile,
    updateProfile,
    signOut,
  };
});
