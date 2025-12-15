import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface MockUser {
  id: string;
  phone: string;
}

interface AuthState {
  session: { user: MockUser } | null;
  user: MockUser | null;
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
    console.log('🔐 Auth: Initializing (MOCK MODE)...');
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('mock_user');
      const savedProfile = await AsyncStorage.getItem('mock_profile');
      
      if (savedUser && savedProfile) {
        const user = JSON.parse(savedUser);
        const profile = JSON.parse(savedProfile);
        
        console.log('✅ Auth: Session restored', profile.full_name);
        setAuthState({
          session: { user },
          user,
          profile,
          isLoading: false,
          isOnboarding: false,
        });
      } else if (savedUser) {
        const user = JSON.parse(savedUser);
        console.log('⚠️ Auth: User found, needs profile');
        setAuthState({
          session: { user },
          user,
          profile: null,
          isLoading: false,
          isOnboarding: true,
        });
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
  };



  const signInWithPhone = async (phone: string) => {
    console.log('📱 Auth (MOCK): Simulating OTP send to', phone);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Auth (MOCK): OTP "sent" successfully');
    return { phone };
  };

  const verifyOTP = async (phone: string, token: string) => {
    console.log('🔑 Auth (MOCK): Verifying OTP for', phone, 'with code', token);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (token !== '123456' && token.length === 6) {
      console.log('✅ Auth (MOCK): Any 6-digit code accepted');
    } else if (token !== '123456') {
      throw new Error('Código inválido');
    }

    try {
      const { supabase } = await import('@/lib/supabase');
      
      console.log('🔍 Auth: Checking if profile exists for phone', phone);
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .single();

      if (existingProfile && !profileError) {
        console.log('✅ Auth: Found existing profile', existingProfile.role, existingProfile.full_name);
        
        const mockUser: MockUser = {
          id: existingProfile.id,
          phone: existingProfile.phone,
        };

        await AsyncStorage.setItem('mock_user', JSON.stringify(mockUser));
        await AsyncStorage.setItem('mock_profile', JSON.stringify(existingProfile));
        
        setAuthState({
          session: { user: mockUser },
          user: mockUser,
          profile: existingProfile,
          isLoading: false,
          isOnboarding: false,
        });

        console.log('✅ Auth: Logged in as existing user');
        return { session: { user: mockUser }, user: mockUser };
      }
    } catch (error) {
      console.log('⚠️ Auth: Could not check existing profile, continuing with new user flow', error);
    }

    const mockUser: MockUser = {
      id: `user_${Date.now()}`,
      phone,
    };

    await AsyncStorage.setItem('mock_user', JSON.stringify(mockUser));
    
    setAuthState(prev => ({
      ...prev,
      session: { user: mockUser },
      user: mockUser,
      isOnboarding: true,
    }));

    console.log('✅ Auth (MOCK): OTP verified, new user created');
    return { session: { user: mockUser }, user: mockUser };
  };

  const completeProfile = async (profileData: {
    full_name: string;
    cpf: string;
  }) => {
    if (!authState.user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('👤 Auth (MOCK): Completing profile for', authState.user.id);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const profile: Profile = {
      id: authState.user.id,
      full_name: profileData.full_name,
      cpf: profileData.cpf,
      phone: authState.user.phone,
      role: 'patient',
      created_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem('mock_profile', JSON.stringify(profile));

    console.log('✅ Auth (MOCK): Profile completed');
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

    console.log('📝 Auth (MOCK): Updating profile');
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedProfile = {
      ...authState.profile,
      ...updates,
    };

    await AsyncStorage.setItem('mock_profile', JSON.stringify(updatedProfile));

    console.log('✅ Auth (MOCK): Profile updated');
    setAuthState(prev => ({
      ...prev,
      profile: updatedProfile,
    }));

    return updatedProfile;
  };

  const signOut = async () => {
    console.log('🚪 Auth (MOCK): Signing out');
    await AsyncStorage.removeItem('mock_user');
    await AsyncStorage.removeItem('mock_profile');
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
