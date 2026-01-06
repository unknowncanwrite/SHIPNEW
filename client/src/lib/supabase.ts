import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

async function fetchConfig(): Promise<{ url: string; anonKey: string }> {
  const res = await fetch('/api/supabase-config');
  if (!res.ok) {
    throw new Error('Failed to fetch Supabase config');
  }
  return res.json();
}

export async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = fetchConfig().then(({ url, anonKey }) => {
    if (!url || !anonKey) {
      console.warn('Supabase credentials not configured. Some features may not work.');
    }
    supabaseInstance = createClient(url || '', anonKey || '');
    return supabaseInstance;
  });

  return initPromise;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string; path: string } | null> {
  const supabase = await getSupabase();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) {
    console.error('Delete error:', error);
    return false;
  }
  return true;
}

export async function getFileUrl(bucket: string, path: string): Promise<string> {
  const supabase = await getSupabase();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function listFiles(bucket: string, folder?: string): Promise<any[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder || '', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('List error:', error);
    return [];
  }

  return data || [];
}
