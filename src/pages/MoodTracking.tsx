import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Heart, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const moodDescriptions = {
  1: "Extremely Low",
  2: "Very Low", 
  3: "Low",
  4: "Below Average",
  5: "Neutral",
  6: "Above Average",
  7: "Good",
  8: "Very Good",
  9: "Excellent",
  10: "Amazing"
};

const aiSuggestions = {
  1: "I understand you're going through a really tough time. Please consider reaching out to a mental health professional. For now, try the 'Self-Compassion Break' course and remember - this feeling is temporary.",
  2: "Things feel heavy right now. Try some gentle breathing exercises from our 'Deep Breathing for Anxiety' course. Small steps matter, and you're not alone in this.",
  3: "I hear that you're struggling. Sometimes just acknowledging how we feel is the first step. Consider the 'Mindful Moment Practice' to ground yourself in the present.",
  4: "You're having a challenging day. That's completely normal. Try our 'Progressive Muscle Relaxation' course to release some tension, and be kind to yourself.",
  5: "You're feeling neutral today - that's perfectly okay. Maybe explore our 'Positive Affirmations Practice' to add a gentle boost to your day.",
  6: "You're doing well today! Keep building on this positive momentum with our 'Mindful Moment Practice' to stay present and appreciative.",
  7: "Great to hear you're feeling good! This is a perfect time to learn something new. Try any of our micro-courses to continue growing your wellbeing toolkit.",
  8: "You're feeling really positive today! Use this energy to practice gratitude and maybe help someone else. Consider exploring our advanced mindfulness practices.",
  9: "Excellent mood today! You're radiating positive energy. This is a great time to set intentions for maintaining this wellbeing and sharing your joy with others.",
  10: "Amazing! You're feeling fantastic today. Celebrate this moment! Consider journaling about what's contributing to this wonderful feeling so you can recreate it."
};

export default function MoodTracking() {
  const [moodLevel, setMoodLevel] = useState([5]);
  const [notes, setNotes] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const saveMoodMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const suggestion = aiSuggestions[moodLevel[0] as keyof typeof aiSuggestions];
      
      const { error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood_level: moodLevel[0],
          mood_description: moodDescriptions[moodLevel[0] as keyof typeof moodDescriptions],
          notes,
          ai_suggestion: suggestion,
        });
      
      if (error) throw error;
      return suggestion;
    },
    onSuccess: (suggestion) => {
      setAiSuggestion(suggestion);
      setShowSuggestion(true);
      toast({
        title: "Mood logged successfully!",
        description: "Your AI-powered coping suggestion is ready.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    saveMoodMutation.mutate();
  };

  const getMoodColor = (level: number) => {
    if (level <= 3) return 'text-destructive';
    if (level <= 5) return 'text-yellow-600';
    if (level <= 7) return 'text-wellbeing';
    return 'text-green-600';
  };

  if (showSuggestion) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="font-semibold">Mood Tracking</h1>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-mindfulness/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Your Personalized Suggestion</CardTitle>
              <CardDescription>
                Based on your mood level of {moodLevel[0]}/10 - {moodDescriptions[moodLevel[0] as keyof typeof moodDescriptions]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-white/50 rounded-lg border">
                <p className="text-foreground leading-relaxed">{aiSuggestion}</p>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/courses')}
                  className="flex-1 bg-mindfulness hover:bg-mindfulness/90"
                >
                  Explore Courses
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="font-semibold">Mood Tracking</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-wellbeing/10 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-wellbeing" />
            </div>
            <CardTitle className="text-2xl">How are you feeling today?</CardTitle>
            <CardDescription>
              Take a moment to check in with yourself. Your feelings are valid and important.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getMoodColor(moodLevel[0])}`}>
                  {moodLevel[0]}
                </div>
                <p className={`text-lg font-medium ${getMoodColor(moodLevel[0])}`}>
                  {moodDescriptions[moodLevel[0] as keyof typeof moodDescriptions]}
                </p>
              </div>
              
              <div className="px-4">
                <Slider
                  value={moodLevel}
                  onValueChange={setMoodLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Additional Notes (Optional)
              </label>
              <Textarea
                id="notes"
                placeholder="What's on your mind? Share any thoughts about your mood today..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={saveMoodMutation.isPending}
              className="w-full bg-wellbeing hover:bg-wellbeing/90 text-wellbeing-foreground"
            >
              {saveMoodMutation.isPending ? 'Saving...' : 'Log Mood & Get AI Suggestion'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}