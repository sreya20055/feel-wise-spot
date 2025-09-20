import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, BookOpen, TrendingUp, User, LogOut, MessageCircle, Users, Trophy, Eye, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  const { data: recentMoods } = useQuery({
    queryKey: ['recent-moods', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: courseProgress } = useQuery({
    queryKey: ['course-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('course_progress')
        .select(`
          *,
          micro_courses (title, duration_minutes)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const averageMood = recentMoods?.length 
    ? (recentMoods.reduce((sum, entry) => sum + entry.mood_level, 0) / recentMoods.length).toFixed(1)
    : 'N/A';

  const completedCourses = courseProgress?.filter(p => p.completed).length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">BlindSpot</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </span>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Wellbeing Dashboard</h1>
          <p className="text-muted-foreground">
            Track your progress and continue your wellbeing journey
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Mood</CardTitle>
              <TrendingUp className="h-4 w-4 text-wellbeing" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-wellbeing">{averageMood}</div>
              <p className="text-xs text-muted-foreground">
                Based on recent entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-mindfulness" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-mindfulness">{completedCourses}</div>
              <p className="text-xs text-muted-foreground">
                Micro-learning sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <Heart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {recentMoods?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total mood entries
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-wellbeing text-wellbeing-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Track Your Mood
              </CardTitle>
              <CardDescription className="text-wellbeing-foreground/80">
                Check in with yourself and get personalized coping suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/mood">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  Log Mood
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Continue Learning
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Access your personalized micro-courses for wellbeing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/courses">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  Browse Courses
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>

        {/* Secondary Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gradient-accessibility text-accessibility-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                AI Companion
              </CardTitle>
              <CardDescription className="text-accessibility-foreground/80">
                Chat with Sage, your personal wellbeing AI companion with voice support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/ai-companion">
                <Button 
                  variant="secondary" 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                  onClick={() => {
                    console.log('🔍 "Chat with Sage" button clicked - navigating to /ai-companion');
                  }}
                >
                  Chat with Sage
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-wellbeing text-wellbeing-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Personal Journal
              </CardTitle>
              <CardDescription className="text-wellbeing-foreground/80">
                Write reflective entries with AI feedback and voice-to-text support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/journal">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  Write Entry
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-mindfulness text-mindfulness-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community
              </CardTitle>
              <CardDescription className="text-mindfulness-foreground/80">
                Connect with peers in a safe, moderated forum with AI-powered support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/community">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  Join Community
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Progress
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Track achievements and view your wellbeing journey progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/progress">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  View Progress
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-accessibility text-accessibility-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Accessibility
              </CardTitle>
              <CardDescription className="text-accessibility-foreground/80">
                Web overlay tools and accessibility transformation features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/accessibility">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  Accessibility Tools
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-mindfulness text-mindfulness-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription className="text-mindfulness-foreground/80">
                View insights, trends, and personalized wellbeing reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/analytics">
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Mood Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {recentMoods?.length ? (
                <div className="space-y-3">
                  {recentMoods.slice(0, 3).map((mood) => (
                    <div key={mood.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{mood.mood_description || 'Mood Entry'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(mood.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-lg font-bold text-wellbeing">
                        {mood.mood_level}/10
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No mood entries yet. Start tracking your mood today!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {courseProgress?.length ? (
                <div className="space-y-3">
                  {courseProgress.slice(0, 3).map((progress) => (
                    <div key={progress.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{progress.micro_courses?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {progress.micro_courses?.duration_minutes} min
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        progress.completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {progress.completed ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No courses started yet. Explore our micro-courses!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}