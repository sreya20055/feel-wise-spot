import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Trophy,
  Target,
  TrendingUp,
  Star,
  Zap,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  gamificationService, 
  UserAchievement, 
  UserProgress, 
  DailyChallenge,
  UserChallenge,
  ProgressVisualization
} from '@/services/gamificationService';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export default function Progress() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'challenges'>('overview');

  // Get user progress
  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: () => gamificationService.getUserProgress(user!.id),
    enabled: !!user,
  });

  // Get user achievements
  const { data: achievements } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: () => gamificationService.getUserAchievements(user!.id),
    enabled: !!user,
  });

  // Get daily challenges
  const { data: dailyChallenges } = useQuery({
    queryKey: ['daily-challenges', user?.id],
    queryFn: () => gamificationService.generateDailyChallenges(user!.id),
    enabled: !!user,
  });

  // Get user challenge progress
  const { data: userChallenges } = useQuery({
    queryKey: ['user-challenges', user?.id],
    queryFn: () => gamificationService.getUserChallenges(user!.id),
    enabled: !!user,
  });

  // Get progress visualization
  const { data: progressVisualization } = useQuery({
    queryKey: ['progress-visualization', user?.id],
    queryFn: () => gamificationService.getProgressVisualization(user!.id),
    enabled: !!user,
  });

  const getAchievementsByCategory = () => {
    if (!achievements) return {};
    
    const categories: Record<string, UserAchievement[]> = {};
    achievements.forEach(achievement => {
      const category = achievement.achievement?.category || 'other';
      if (!categories[category]) categories[category] = [];
      categories[category].push(achievement);
    });
    
    return categories;
  };

  const getChallengeProgress = (challengeId: string) => {
    return userChallenges?.find(uc => uc.challenge_id === challengeId);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mood': return '❤️';
      case 'journal': return '✍️';
      case 'courses': return '📚';
      case 'community': return '👥';
      case 'streaks': return '🔥';
      case 'special': return '✨';
      default: return '🏆';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'mood': return 'Mood Tracking';
      case 'journal': return 'Journaling';
      case 'courses': return 'Learning';
      case 'community': return 'Community';
      case 'streaks': return 'Consistency';
      case 'special': return 'Special';
      default: return 'Other';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to view your progress</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Your Progress</h1>
              <p className="text-sm text-muted-foreground">Track achievements and growth</p>
            </div>
          </div>
          {userProgress && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Level {Math.floor(userProgress.total_points / 100) + 1}</div>
              <div className="font-semibold text-primary">{userProgress.total_points} pts</div>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="challenges" className="gap-2">
              <Target className="h-4 w-4" />
              Daily Challenges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Progress Visualization */}
            {progressVisualization && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Your Wellbeing Journey
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress to next milestone</span>
                      <span className="text-sm text-muted-foreground">
                        {progressVisualization.nextMilestone.pointsNeeded > 0
                          ? `${progressVisualization.nextMilestone.pointsNeeded} points needed`
                          : 'Max level reached!'
                        }
                      </span>
                    </div>
                    <ProgressBar 
                      value={progressVisualization.stages[progressVisualization.currentStage]?.progress || 0} 
                      className="mb-2" 
                    />
                    <p className="text-sm text-muted-foreground">
                      Next: {progressVisualization.nextMilestone.name} - {progressVisualization.nextMilestone.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {progressVisualization.stages.map((stage, index) => (
                      <motion.div
                        key={stage.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`text-center p-4 rounded-lg border-2 transition-colors ${
                          stage.unlocked 
                            ? 'border-green-300 bg-green-50' 
                            : index === progressVisualization.currentStage 
                              ? 'border-blue-300 bg-blue-50 animate-pulse'
                              : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="text-2xl mb-2">{stage.icon}</div>
                        <div className="font-medium text-sm">{stage.name}</div>
                        <div className="text-xs text-muted-foreground mb-2">{stage.description}</div>
                        {index === progressVisualization.currentStage && (
                          <ProgressBar value={stage.progress} className="h-1" />
                        )}
                        {stage.unlocked && index !== progressVisualization.currentStage && (
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Overview */}
            {userProgress && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium">Total Points</span>
                    </div>
                    <div className="text-2xl font-bold">{userProgress.total_points}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">Achievements</span>
                    </div>
                    <div className="text-2xl font-bold">{userProgress.achievements_count}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium">Current Streak</span>
                    </div>
                    <div className="text-2xl font-bold">{userProgress.current_streak}</div>
                    <div className="text-xs text-muted-foreground">
                      Best: {userProgress.longest_streak}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Challenges</span>
                    </div>
                    <div className="text-2xl font-bold">{userProgress.challenges_completed}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements?.slice(0, 5).map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="text-2xl">{achievement.achievement?.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{achievement.achievement?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {achievement.achievement?.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={gamificationService.getRarityColor(achievement.achievement?.rarity || 'common')}>
                          {achievement.achievement?.rarity}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(achievement.earned_at)}
                        </div>
                      </div>
                    </motion.div>
                  )) ?? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Complete activities to earn your first achievements!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Achievement Gallery</h2>
              <p className="text-muted-foreground">
                Your accomplishments on the wellbeing journey
              </p>
            </div>

            {Object.entries(getAchievementsByCategory()).map(([category, categoryAchievements]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(category)}</span>
                    {getCategoryName(category)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryAchievements.map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        whileHover={{ scale: 1.05 }}
                        className="border rounded-lg p-4 text-center hover:shadow-lg transition-shadow"
                      >
                        <div className="text-3xl mb-2">{achievement.achievement?.icon}</div>
                        <div className="font-semibold mb-1">{achievement.achievement?.name}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {achievement.achievement?.description}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={gamificationService.getRarityColor(achievement.achievement?.rarity || 'common')}>
                            {achievement.achievement?.rarity}
                          </Badge>
                          <span className="text-sm font-medium text-primary">
                            +{achievement.achievement?.points}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(achievement.earned_at)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {achievements?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No achievements yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your wellbeing journey to unlock achievements!
                  </p>
                  <div className="flex justify-center gap-2">
                    <Link to="/mood">
                      <Button variant="outline" size="sm">Track Mood</Button>
                    </Link>
                    <Link to="/journal">
                      <Button variant="outline" size="sm">Write Journal</Button>
                    </Link>
                    <Link to="/courses">
                      <Button variant="outline" size="sm">Take Course</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Daily Challenges</h2>
              <p className="text-muted-foreground">
                Complete today&apos;s challenges to earn extra points!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dailyChallenges?.map((challenge) => {
                const progress = getChallengeProgress(challenge.id);
                const isCompleted = progress?.completed || false;
                const currentProgress = progress?.current_progress || 0;
                const progressPercentage = Math.min((currentProgress / challenge.target_value) * 100, 100);

                return (
                  <Card key={challenge.id} className={`transition-colors ${isCompleted ? 'border-green-300 bg-green-50' : ''}`}>
                    <CardContent className="pt-6">
                      <div className="text-center mb-4">
                        <div className="text-3xl mb-2">{challenge.icon}</div>
                        <div className="font-semibold">{challenge.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {challenge.description}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Progress</span>
                          <span className="text-sm font-medium">
                            {currentProgress} / {challenge.target_value}
                          </span>
                        </div>
                        <ProgressBar value={progressPercentage} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {isCompleted ? 'Completed!' : 'In Progress'}
                          </span>
                        </div>
                        <Badge variant="secondary">+{challenge.points_reward}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {dailyChallenges?.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No challenges today</h3>
                  <p className="text-muted-foreground">
                    Check back tomorrow for fresh challenges!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}