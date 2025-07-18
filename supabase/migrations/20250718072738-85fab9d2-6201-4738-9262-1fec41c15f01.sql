-- Enhanced Installation Workflow with Permit Tracking and Detailed Milestones

-- Add permit tracking table
CREATE TABLE public.permits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installation_id UUID NOT NULL REFERENCES public.installations(id) ON DELETE CASCADE,
  permit_type VARCHAR(50) NOT NULL, -- 'building', 'electrical', 'utility_interconnection'
  permit_number VARCHAR(100),
  application_date DATE,
  approval_date DATE,
  expiration_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'approved', 'rejected', 'expired'
  issuing_authority VARCHAR(200),
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add installation milestones table
CREATE TABLE public.installation_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installation_id UUID NOT NULL REFERENCES public.installations(id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL, -- 'site_survey', 'permits_submitted', 'permits_approved', 'equipment_delivered', 'installation_started', 'installation_completed', 'inspection_passed', 'utility_interconnection', 'system_commissioned'
  milestone_name VARCHAR(200) NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'delayed', 'blocked'
  assigned_to VARCHAR(200), -- crew member or team
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on permits table
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;

-- Create policies for permits
CREATE POLICY "Users can view their own permits" 
ON public.permits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own permits" 
ON public.permits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own permits" 
ON public.permits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own permits" 
ON public.permits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on installation_milestones table
ALTER TABLE public.installation_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for installation_milestones
CREATE POLICY "Users can view their own installation milestones" 
ON public.installation_milestones 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own installation milestones" 
ON public.installation_milestones 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own installation milestones" 
ON public.installation_milestones 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own installation milestones" 
ON public.installation_milestones 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add updated_at trigger for permits
CREATE TRIGGER update_permits_updated_at
BEFORE UPDATE ON public.permits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for installation_milestones
CREATE TRIGGER update_installation_milestones_updated_at
BEFORE UPDATE ON public.installation_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize default milestones for new installations
CREATE OR REPLACE FUNCTION public.initialize_installation_milestones()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default milestones for new installation
  INSERT INTO public.installation_milestones (installation_id, milestone_type, milestone_name, user_id) VALUES
    (NEW.id, 'site_survey', 'Site Survey Completed', NEW.user_id),
    (NEW.id, 'permits_submitted', 'Permits Submitted', NEW.user_id),
    (NEW.id, 'permits_approved', 'Permits Approved', NEW.user_id),
    (NEW.id, 'equipment_delivered', 'Equipment Delivered', NEW.user_id),
    (NEW.id, 'installation_started', 'Installation Started', NEW.user_id),
    (NEW.id, 'installation_completed', 'Installation Completed', NEW.user_id),
    (NEW.id, 'inspection_passed', 'Electrical Inspection Passed', NEW.user_id),
    (NEW.id, 'utility_interconnection', 'Utility Interconnection Complete', NEW.user_id),
    (NEW.id, 'system_commissioned', 'System Commissioned', NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize milestones for new installations
CREATE TRIGGER initialize_milestones_on_installation_insert
  AFTER INSERT ON public.installations
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_installation_milestones();