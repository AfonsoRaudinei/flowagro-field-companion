-- Create pins table for map pin persistence
CREATE TABLE public.pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  coordinates jsonb NOT NULL,
  title text,
  description text,
  color text DEFAULT '#3b82f6',
  pin_type text DEFAULT 'default',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own pins" 
ON public.pins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pins" 
ON public.pins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pins" 
ON public.pins 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pins" 
ON public.pins 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pins_updated_at
BEFORE UPDATE ON public.pins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();