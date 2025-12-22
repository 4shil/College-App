-- Create college_info table
CREATE TABLE IF NOT EXISTS public.college_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  established_year INTEGER NOT NULL,
  affiliation TEXT,
  principal_name TEXT NOT NULL,
  principal_email TEXT NOT NULL,
  motto TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_college_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_college_info_updated_at ON public.college_info;

CREATE TRIGGER update_college_info_updated_at
  BEFORE UPDATE ON public.college_info
  FOR EACH ROW
  EXECUTE FUNCTION update_college_info_updated_at();

-- Enable RLS
ALTER TABLE public.college_info ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read college info
DROP POLICY IF EXISTS "Anyone can read college info" ON public.college_info;
CREATE POLICY "Anyone can read college info"
  ON public.college_info
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only super_admin can insert college info
DROP POLICY IF EXISTS "Only super_admin can insert college info" ON public.college_info;
CREATE POLICY "Only super_admin can insert college info"
  ON public.college_info
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND primary_role = 'super_admin'
    )
  );

-- Policy: Only super_admin and admin can update college info
DROP POLICY IF EXISTS "Only admins can update college info" ON public.college_info;
CREATE POLICY "Only admins can update college info"
  ON public.college_info
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND primary_role IN ('super_admin', 'admin', 'principal')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND primary_role IN ('super_admin', 'admin', 'principal')
    )
  );

-- Policy: Only super_admin can delete college info
DROP POLICY IF EXISTS "Only super_admin can delete college info" ON public.college_info;
CREATE POLICY "Only super_admin can delete college info"
  ON public.college_info
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND primary_role = 'super_admin'
    )
  );

-- Insert default JPM College data
INSERT INTO public.college_info (
  name,
  short_name,
  address,
  city,
  state,
  pincode,
  phone,
  email,
  website,
  established_year,
  affiliation,
  principal_name,
  principal_email,
  motto
)
SELECT
  'JPM College of Arts and Science',
  'JPM College',
  'Alakode, Kasaragod',
  'Kasaragod',
  'Kerala',
  '671531',
  '+91 4994 250330',
  'info@jpmcollege.edu',
  'https://jpmcollege.edu',
  1995,
  'Kannur University',
  'Dr. Principal Name',
  'principal@jpmcollege.edu',
  'Excellence in Education'
WHERE NOT EXISTS (SELECT 1 FROM public.college_info);
