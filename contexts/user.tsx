import createContextHook from '@nkzw/create-context-hook';
import { useAuth, Profile } from '@/contexts/auth';
import { UserType } from '@/types';
import { useState } from 'react';

export interface User {
  id: string;
  name: string;
  email?: string;
  type: UserType;
  avatar?: string;
  phone?: string;
  location?: string;
}

export const [UserProvider, useUser] = createContextHook(() => {
  const authContext = useAuth();
  const [viewMode, setViewMode] = useState<UserType | null>(null);
  
  if (!authContext) {
    return {
      user: null,
      isLoading: true,
      updateUser: async () => {},
      realRole: null,
      viewMode: null,
      setViewMode: () => {},
      resetViewMode: () => {},
    };
  }

  const { profile, updateProfile, isLoading } = authContext;

  const realRole = profile?.role as UserType | null;
  const effectiveRole = viewMode || realRole;

  const user: User | null = profile ? {
    id: profile.id,
    name: profile.full_name,
    type: effectiveRole as UserType,
    avatar: profile.avatar_url,
    phone: profile.phone,
    location: profile.location,
  } : null;

  const updateUser = async (updates: Partial<User>) => {
    const profileUpdates: Partial<Profile> = {};
    
    if (updates.name !== undefined) profileUpdates.full_name = updates.name;
    if (updates.avatar !== undefined) profileUpdates.avatar_url = updates.avatar;
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
    if (updates.location !== undefined) profileUpdates.location = updates.location;

    await updateProfile(profileUpdates);
  };

  const resetViewMode = () => {
    setViewMode(null);
  };

  return {
    user,
    isLoading,
    updateUser,
    realRole,
    viewMode,
    setViewMode,
    resetViewMode,
  };
});
