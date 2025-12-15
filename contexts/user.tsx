import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { User, UserType } from '@/types';

const USER_STORAGE_KEY = '@medapp_user';

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        const defaultUser: User = {
          id: 'patient-1',
          name: 'Usuário',
          email: 'usuario@email.com',
          type: 'patient',
          location: 'São Paulo, SP',
        };
        setUser(defaultUser);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUser));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const switchUserType = async (type: UserType) => {
    await updateUser({ type });
  };

  return {
    user,
    isLoading,
    updateUser,
    switchUserType,
  };
});
