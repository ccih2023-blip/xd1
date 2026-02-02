
import { createClient } from '@supabase/supabase-js';

// محاولة جلب القيم من البيئة (Vercel) أو استخدام القيم الافتراضية
const supabaseUrl = 'https://adoeguytakweqgqtmarv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkb2VndXl0YWt3ZXFncXRtYXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzE1MTYsImV4cCI6MjA4NTU0NzUxNn0.2YN8SOaMU6EXwMti26EWrnGDKUmN_r-qyJ-sxugXies';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true
  });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
};

export const incrementViewCount = async (locationId: string) => {
  try {
    const { error } = await supabase.rpc('increment_location_views', { loc_id: locationId });
    if (error) {
        const { data: current } = await supabase.from('locations').select('views').eq('id', locationId).single();
        await supabase.from('locations').update({ views: (current?.views || 0) + 1 }).eq('id', locationId);
    }
  } catch (err) {
    console.warn("View increment failed", err);
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{ id: userId, balance: 200, role: 'reader' }])
        .select()
        .single();
      
      if (createError) return { id: userId, balance: 200, role: 'reader' };
      return newProfile;
    }
    
    if (error) throw error;
    return data;
  } catch (err) {
    return { id: userId, balance: 200, role: 'reader' };
  }
};

export const updateProfile = async (userId: string, updates: { name?: string, bio?: string }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteLocation = async (id: string) => {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
