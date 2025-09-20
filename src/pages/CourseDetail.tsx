import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Clock, CheckCircle, Play, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [isReadingAloud, setIsReadingAloud] = useState(false);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('No course ID');
      const { data, error } = await supabase
        .from('micro_courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: progress } = useQuery({
    queryKey: ['course-progress', courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return null;
      const { data, error } = await supabase
        .from('course_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!courseId && !!user,
  });

  const completionMutation = useMutation({
    mutationFn: async ({ completed, userNotes }: { completed: boolean; userNotes?: string }) => {
      if (!courseId || !user) throw new Error('Missing required data');
      
      const progressData = {
        user_id: user.id,
        course_id: courseId,
        completed,
        completion_date: completed ? new Date().toISOString() : null,
        notes: userNotes || notes,
      };

      if (progress) {
        const { error } = await supabase
          .from('course_progress')
          .update(progressData)
          .eq('id', progress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('course_progress')
          .insert(progressData);
        if (error) throw error;
      }
    },
    onSuccess: (_, { completed }) => {
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
      toast({
        title: completed ? "Course completed!" : "Progress saved",
        description: completed 
          ? "Great job! You've completed this micro-course." 
          : "Your progress has been saved.",
      });
      if (completed) {
        setTimeout(() => navigate('/courses'), 2000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    completionMutation.mutate({ completed: true, userNotes: notes });
  };

  const handleSaveProgress = () => {
    completionMutation.mutate({ completed: false, userNotes: notes });
  };

  const readAloud = () => {
    if (!course) return;
    
    if (isReadingAloud) {
      speechSynthesis.cancel();
      setIsReadingAloud(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(course.content);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setIsReadingAloud(true);
    utterance.onend = () => setIsReadingAloud(false);
    utterance.onerror = () => setIsReadingAloud(false);
    
    speechSynthesis.speak(utterance);
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading course...</h2>
          <p className="text-muted-foreground">Please wait while we load your content.</p>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/courses">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
          <h1 className="font-semibold truncate">{course.title}</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge className={getDifficultyColor(course.difficulty_level)}>
                      {course.difficulty_level}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration_minutes} minutes</span>
                    </div>
                  </div>
                  {progress?.completed && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
                <CardTitle className="text-2xl">{course.title}</CardTitle>
                <CardDescription className="text-base">
                  {course.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    onClick={readAloud}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Volume2 className="h-4 w-4" />
                    {isReadingAloud ? 'Stop Reading' : 'Read Aloud'}
                  </Button>
                  
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-auto">
                      {course.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div 
                  className="prose prose-lg max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: course.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') 
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progress?.completed ? (
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Course Completed!</p>
                    <p className="text-sm text-green-600">
                      Completed on {new Date(progress.completion_date!).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Play className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-blue-800 font-medium">In Progress</p>
                    <p className="text-sm text-blue-600">Complete when you're ready</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">
                    Your Notes
                  </label>
                  <Textarea
                    id="notes"
                    placeholder="What did you learn? How will you apply this?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  {!progress?.completed && (
                    <>
                      <Button 
                        onClick={handleComplete}
                        disabled={completionMutation.isPending}
                        className="w-full bg-mindfulness hover:bg-mindfulness/90"
                      >
                        {completionMutation.isPending ? 'Saving...' : 'Mark as Complete'}
                      </Button>
                      <Button 
                        onClick={handleSaveProgress}
                        disabled={completionMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        Save Progress
                      </Button>
                    </>
                  )}
                  
                  {progress?.completed && notes !== (progress.notes || '') && (
                    <Button 
                      onClick={handleSaveProgress}
                      disabled={completionMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      Update Notes
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}