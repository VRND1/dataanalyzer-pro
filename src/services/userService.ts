import { supabase } from '@/utils/supabase/client';

export interface UserProfile {
  name: string;
  bio: string;
  avatarUrl: string;
}

export const updateUserProfile = async (profile: UserProfile) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}; 