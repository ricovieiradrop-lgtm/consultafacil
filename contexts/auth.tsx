import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { router } from 'expo-router';

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
  user: SupabaseUser | null;
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

  useEffect(() => {
    console.log('🔐 Auth: Initializing...');
    
    const session = supabase.auth.session();
    console.log('🔐 Auth: Session loaded', session ? '✅' : '❌');
    if (session) {
      handleSession(session);
    } else {
      setAuthState({
        session: null,
        user: null,
        profile: null,
        isLoading: false,
        isOnboarding: false,
      });
    }

    const authListener = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth: State changed -', event);
        if (session) {
          await handleSession(session);
        } else {
          setAuthState({
            session: null,
            user: null,
            profile: null,
            isLoading: false,
            isOnboarding: false,
          });
        }
      }
    );

    return () => {
      authListener?.data?.unsubscribe();
    };
  }, []);

  const handleSession = async (session: Session) => {
    if (!session.user) {
      console.log('⚠️ Auth: No user in session');
      return;
    }
    console.log('🔐 Auth: Handling session for user', session.user.id);
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.log('⚠️ Auth: Profile not found, user needs onboarding');
        setAuthState({
          session,
          user: session.user,
          profile: null,
          isLoading: false,
          isOnboarding: true,
        });
        return;
      }

      console.log('✅ Auth: Profile loaded', profile.full_name);
      setAuthState({
        session,
        user: session.user,
        profile: profile as Profile,
        isLoading: false,
        isOnboarding: false,
      });
    } catch (error) {
      console.error('❌ Auth: Error loading profile', error);
      setAuthState({
        session,
        user: session.user,
        profile: null,
        isLoading: false,
        isOnboarding: true,
      });
    }
  };

  const signInWithPhone = async (phone: string) => {
    console.log('📱 Auth: Sending OTP to', phone);
    const { error } = await supabase.auth.signIn({
      phone: phone,
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
    const { session, error, user } = await supabase.auth.verifyOTP({
      phone,
      token,
      type: 'sms'
    });

    if (error) {
      console.error('❌ Auth: Error verifying OTP', error);
      throw error;
    }

    console.log('✅ Auth: OTP verified successfully');
    return { session, user };
  };

  const completeProfile = async (profileData: {
    full_name: string;
    cpf: string;
  }) => {
    if (!authState.user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('👤 Auth: Completing profile for', authState.user.id);

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: authState.user.id,
        full_name: profileData.full_name,
        cpf: profileData.cpf,
        phone: authState.user.phone || '',
        role: 'patient',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Auth: Error completing profile', error);
      throw error;
    }

    console.log('✅ Auth: Profile completed');
    setAuthState(prev => ({
      ...prev,
      profile: data as Profile,
      isOnboarding: false,
    }));

    return data;
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!authState.user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('📝 Auth: Updating profile');

    const { data, error } = await supabase
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
      profile: data as Profile,
    }));

    return data;
  };

  const signOut = async () => {
    console.log('🚪 Auth: Signing out');
    await supabase.auth.signOut();
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
