// Real Supabase client for the Electron app
const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual Supabase project details
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";

// Create a single supabase client for interacting with your database
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = { supabase };
