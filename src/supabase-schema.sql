-- Execute this entire script in the Supabase SQL Editor

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "coverImage" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  content_text TEXT,
  materials_url TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, lesson_id)
);


-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;


-- 3. Drop existing policies to prevent conflicts (optional, but safe)
DROP POLICY IF EXISTS "Allow public read access to courses" ON public.courses;
DROP POLICY IF EXISTS "Allow authenticated insert to courses" ON public.courses;
DROP POLICY IF EXISTS "Allow public read access to modules" ON public.modules;
DROP POLICY IF EXISTS "Allow public read access to lessons" ON public.lessons;
DROP POLICY IF EXISTS "Users can read their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.user_progress;


-- 4. Create RLS Policies

-- Courses: Anyone authenticated can read. Authenticated users can insert/update/delete (for the Admin page to work).
CREATE POLICY "Allow public read access to courses" 
ON public.courses FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated insert to courses" 
ON public.courses FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "Allow authenticated update to courses" 
ON public.courses FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')))
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "Allow authenticated delete to courses" 
ON public.courses FOR DELETE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- Modules:
CREATE POLICY "Allow public read access to modules" 
ON public.modules FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated insert to modules" 
ON public.modules FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "Allow authenticated update to modules" 
ON public.modules FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')))
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "Allow authenticated delete to modules" 
ON public.modules FOR DELETE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- Lessons:
CREATE POLICY "Allow public read access to lessons" 
ON public.lessons FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated insert to lessons" 
ON public.lessons FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "Allow authenticated update to lessons" 
ON public.lessons FOR UPDATE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')))
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "Allow authenticated delete to lessons" 
ON public.lessons FOR DELETE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

-- User Progress: Users can only see, insert, and delete their OWN progress.
CREATE POLICY "Users can read their own progress" 
ON public.user_progress FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "Users can insert their own progress" 
ON public.user_progress FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" 
ON public.user_progress FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- User Profiles: Anyone can read their own. Admin can read all (not implemented fully here).
CREATE POLICY "Users can read their own profile" 
ON public.user_profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "Admins can update profiles" 
ON public.user_profiles FOR UPDATE
TO authenticated 
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create a trigger to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, CASE WHEN new.email = 'grecahenrique@gmail.com' THEN 'admin' ELSE 'student' END);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create View for Admins to fetch users list
CREATE OR REPLACE VIEW public.users_view AS
SELECT p.id, p.role, p.created_at, u.email, u.raw_user_meta_data->>'name' as name
FROM public.user_profiles p
JOIN auth.users u ON p.id = u.id;

-- Grant select to authenticated
GRANT SELECT ON public.users_view TO authenticated;

-- Ensure grecahenrique@gmail.com is an admin if they already exist
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'grecahenrique@gmail.com'
);

-- 5. Storage Bucket For Materials
-- This bucket is used for uploading PDFs, docs, photos, etc.
INSERT INTO storage.buckets (id, name, public) VALUES ('lms-files', 'lms-files', true) ON CONFLICT DO NOTHING;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'lms-files' );
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'lms-files' AND auth.role() = 'authenticated' );
