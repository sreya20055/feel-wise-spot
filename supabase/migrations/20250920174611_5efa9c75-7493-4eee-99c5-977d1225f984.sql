-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  accessibility_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create mood entries table
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_level INTEGER NOT NULL CHECK (mood_level >= 1 AND mood_level <= 10),
  mood_description TEXT,
  notes TEXT,
  ai_suggestion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for mood entries
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for mood entries
CREATE POLICY "Users can view their own mood entries"
  ON public.mood_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood entries"
  ON public.mood_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create micro courses table
CREATE TABLE public.micro_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  audio_url TEXT,
  duration_minutes INTEGER DEFAULT 3,
  difficulty_level TEXT DEFAULT 'beginner',
  tags TEXT[],
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for micro courses (public read)
ALTER TABLE public.micro_courses ENABLE ROW LEVEL SECURITY;

-- Create policy for public course access
CREATE POLICY "Anyone can view published courses"
  ON public.micro_courses
  FOR SELECT
  USING (is_published = true);

-- Create course progress table
CREATE TABLE public.course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.micro_courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS for course progress
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for course progress
CREATE POLICY "Users can view their own progress"
  ON public.course_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
  ON public.course_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.course_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_micro_courses_updated_at
  BEFORE UPDATE ON public.micro_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample micro courses
INSERT INTO public.micro_courses (title, description, content, duration_minutes, difficulty_level, tags) VALUES
(
  'Deep Breathing for Anxiety',
  'Learn a simple 3-minute breathing technique to help manage anxiety and stress.',
  'Welcome to your breathing exercise. Find a comfortable position and follow along.

**Step 1: Get Comfortable**
Sit or lie down in a quiet space. Close your eyes or soften your gaze.

**Step 2: The 4-7-8 Technique**
- Breathe in through your nose for 4 counts
- Hold your breath for 7 counts  
- Exhale through your mouth for 8 counts

**Step 3: Repeat**
Continue this pattern for 4-5 cycles. Notice how your body begins to relax.

**Remember:** This technique activates your parasympathetic nervous system, naturally reducing anxiety and promoting calm.',
  3,
  'beginner',
  ARRAY['anxiety', 'breathing', 'relaxation']
),
(
  'Mindful Moment Practice',
  'A quick mindfulness exercise to center yourself in the present moment.',
  'This practice helps you reconnect with the present moment and find inner peace.

**Step 1: Awareness**
Notice where you are right now. What do you see, hear, and feel around you?

**Step 2: Body Scan**
Starting from your toes, slowly move your attention up through your body. Notice any areas of tension or comfort.

**Step 3: Five Senses**
- **See:** Notice 5 things you can see
- **Hear:** Listen for 4 different sounds
- **Touch:** Feel 3 different textures
- **Smell:** Identify 2 scents
- **Taste:** Notice 1 taste in your mouth

**Step 4: Gratitude**
Think of one thing you''re grateful for in this moment.

You''ve successfully created a mindful pause in your day.',
  3,
  'beginner',
  ARRAY['mindfulness', 'grounding', 'awareness']
),
(
  'Self-Compassion Break',
  'Practice speaking to yourself with kindness and understanding.',
  'Learn to treat yourself with the same kindness you''d show a good friend.

**Step 1: Acknowledge Your Struggle**
Place your hand on your heart and say: "This is a moment of difficulty."

**Step 2: Remember You''re Not Alone**
Remind yourself: "Difficulty is part of life. Everyone experiences challenging moments."

**Step 3: Offer Yourself Kindness**
Say to yourself: "May I be kind to myself. May I give myself the compassion I need."

**Step 4: Self-Compassionate Action**
Ask yourself: "What do I need right now?" Maybe it''s rest, a gentle walk, or calling a friend.

**Remember:** Self-compassion isn''t self-pity or self-indulgence. It''s treating yourself with the same care you''d offer someone you love.',
  3,
  'beginner',
  ARRAY['self-compassion', 'emotional-wellness', 'kindness']
),
(
  'Progressive Muscle Relaxation',
  'Release physical tension through systematic muscle relaxation.',
  'This technique helps you release physical tension and promote deep relaxation.

**Step 1: Preparation**
Lie down comfortably. Take three deep breaths to settle in.

**Step 2: Tension and Release**
We''ll work through each muscle group:

**Feet:** Curl your toes tightly for 5 seconds, then release and notice the relaxation.

**Legs:** Tense your calf and thigh muscles, hold for 5 seconds, then let go.

**Abdomen:** Tighten your stomach muscles, hold, then release.

**Hands:** Make fists, squeeze for 5 seconds, then open and relax.

**Arms:** Tense your entire arms, hold, then let them fall naturally.

**Shoulders:** Lift shoulders to your ears, hold, then drop them down.

**Face:** Scrunch all facial muscles, hold, then soften completely.

**Step 3: Full Body**
Notice the contrast between tension and relaxation. Enjoy this peaceful state.',
  4,
  'intermediate',
  ARRAY['relaxation', 'tension-relief', 'body-awareness']
),
(
  'Positive Affirmations Practice',
  'Build self-confidence and positive thinking through affirming statements.',
  'Affirmations help rewire your brain for positivity and self-acceptance.

**Step 1: Understanding Affirmations**
Affirmations are positive statements that help challenge negative thoughts and build self-esteem.

**Step 2: Core Affirmations**
Repeat each statement slowly and with intention:

- "I am worthy of love and respect"
- "I have the strength to overcome challenges"
- "I choose to focus on what I can control"
- "I am growing and learning every day"
- "I deserve happiness and peace"

**Step 3: Personal Affirmations**
Create 2-3 affirmations specific to your current situation or goals.

**Step 4: Daily Practice**
- Say affirmations in the mirror each morning
- Write them in a journal
- Repeat them during difficult moments

**Remember:** Consistency is key. Even if affirmations feel uncomfortable at first, keep practicing. Your brain will gradually accept these positive messages.',
  3,
  'beginner',
  ARRAY['positivity', 'self-esteem', 'mental-health']
);