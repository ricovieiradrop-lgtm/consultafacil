import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { User, UserType } from '@/types';
import { supabase } from '@/lib/supabase';

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
        const storedUser = JSON.parse(stored);
        setUser(storedUser);
      } else {
        const { data: existingUsers } = await supabase
          .from('users')
          .select('*')
          .eq('user_type', 'patient')
          .limit(1);

        if (existingUsers && existingUsers.length > 0) {
          const dbUser: User = {
            id: existingUsers[0].id,
            name: existingUsers[0].name,
            email: existingUsers[0].email,
            type: existingUsers[0].user_type as UserType,
            avatar: existingUsers[0].avatar,
            phone: existingUsers[0].phone,
            location: existingUsers[0].location,
          };
          setUser(dbUser);
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(dbUser));
        } else {
          const { data: newUser, error } = await supabase
            .from('users')
            .insert({
              name: 'Usuário Teste',
              email: 'usuario@teste.com',
              user_type: 'patient',
              location: 'São Paulo, SP',
              city: 'São Paulo',
              state: 'SP',
            })
            .select()
            .single();

          if (error) throw error;

          const defaultUser: User = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            type: newUser.user_type as UserType,
            location: newUser.location,
          };
          setUser(defaultUser);
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUser));
        }
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
      
      await supabase
        .from('users')
        .update({
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          avatar: updates.avatar,
          location: updates.location,
        })
        .eq('id', user.id);
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
