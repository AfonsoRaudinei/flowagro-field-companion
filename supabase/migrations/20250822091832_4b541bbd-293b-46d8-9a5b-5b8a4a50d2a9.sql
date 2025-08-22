-- Create webhook configurations table
CREATE TABLE public.webhook_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  secret_token TEXT,
  retry_count INTEGER NOT NULL DEFAULT 3,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook logs table
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook_configurations
CREATE POLICY "Users can view their own webhook configurations" 
ON public.webhook_configurations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook configurations" 
ON public.webhook_configurations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook configurations" 
ON public.webhook_configurations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook configurations" 
ON public.webhook_configurations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for webhook_logs
CREATE POLICY "Users can view logs for their webhook configurations" 
ON public.webhook_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.webhook_configurations wc 
  WHERE wc.id = webhook_logs.webhook_id AND wc.user_id = auth.uid()
));

CREATE POLICY "System can insert webhook logs" 
ON public.webhook_logs 
FOR INSERT 
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_webhook_configurations_user_id ON public.webhook_configurations(user_id);
CREATE INDEX idx_webhook_configurations_is_active ON public.webhook_configurations(is_active);
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_webhook_configurations_updated_at
BEFORE UPDATE ON public.webhook_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();