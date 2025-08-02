import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pyoejhhkjlrjijiviryq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5b2VqaGhramxyamlqaXZpcnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNTI1MDQsImV4cCI6MjA2OTcyODUwNH0.2P5wKq7b6viMa9kutLOZADsqAvSZx6X8fbLZMlooG1U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)