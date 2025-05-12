import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// These values will be set in the .env file after Supabase connection is established
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);