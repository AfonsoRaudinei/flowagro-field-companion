-- Add last_seen_at field to conversations table
ALTER TABLE conversations 
ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE;

-- Add message status field to messages table
ALTER TABLE messages 
ADD COLUMN status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read'));

-- Add user preferences table for chat density
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_density TEXT DEFAULT 'comfortable' CHECK (chat_density IN ('compact', 'comfortable', 'spacious')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can view their own preferences" 
ON user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update last_seen_at
CREATE OR REPLACE FUNCTION update_conversation_last_seen(conversation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE conversations 
  SET last_seen_at = now(), updated_at = now()
  WHERE id = conversation_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;