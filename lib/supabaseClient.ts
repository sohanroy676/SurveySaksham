
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Direct values from provided .env to ensure functionality in the current preview environment
const supabaseUrl = "https://zsbmsioblvesloznxxdz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYm1zaW9ibHZlc2xvem54eGR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NjA0NDYsImV4cCI6MjA4NjAzNjQ0Nn0.3rGuOiuJ123WlhvnWF6xo8XBbvJOom5b8lcZCXDsYdM";

// Exporting as null if keys are missing to prevent top-level crash
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
