import { supabase } from '@/integrations/supabase/client';

export interface MoodTrend {
  date: string;
  average_mood: number;
  entry_count: number;
}

export interface CourseImpact {
  course_id: string;
  course_title: string;
  mood_before: number;
  mood_after: number;
  improvement: number;
  completion_rate: number;
}

export interface AccessibilityUsage {
  feature: string;
  usage_count: number;
  effectiveness_rating: number;
  user_feedback: string[];
}

export interface UserInsight {
  type: 'mood_pattern' | 'course_recommendation' | 'accessibility_suggestion' | 'achievement_milestone';
  title: string;
  description: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  created_at: string;
}

export interface WeeklyReport {
  period: string;
  mood_average: number;
  mood_trend: 'improving' | 'stable' | 'declining';
  courses_completed: number;
  journal_entries: number;
  achievements_earned: number;
  key_insights: UserInsight[];
  recommendations: string[];
}

class AnalyticsService {
  // Get mood trends over time
  async getMoodTrends(userId: string, days: number = 30): Promise<MoodTrend[]> {
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('created_at, mood_level')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and calculate averages
      const trendMap = new Map<string, { total: number; count: number }>();
      
      data.forEach(entry => {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        const existing = trendMap.get(date) || { total: 0, count: 0 };
        trendMap.set(date, {
          total: existing.total + entry.mood_level,
          count: existing.count + 1
        });
      });

      return Array.from(trendMap.entries()).map(([date, stats]) => ({
        date,
        average_mood: Number((stats.total / stats.count).toFixed(1)),
        entry_count: stats.count
      }));
    } catch (error) {
      console.error('Error fetching mood trends:', error);
      return [];
    }
  }

  // Analyze course impact on mood
  async getCourseImpact(userId: string): Promise<CourseImpact[]> {
    try {
      // Get course completions with before/after mood data
      const { data: courseProgress, error: courseError } = await supabase
        .from('course_progress')
        .select(`
          *,
          micro_courses (id, title)
        `)
        .eq('user_id', userId)
        .eq('completed', true);

      if (courseError) throw courseError;

      const impacts: CourseImpact[] = [];

      for (const progress of courseProgress) {
        // Get mood entries before and after course completion
        const completionDate = new Date(progress.updated_at);
        const beforeDate = new Date(completionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        const afterDate = new Date(completionDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        const { data: moodsBefore } = await supabase
          .from('mood_entries')
          .select('mood_level')
          .eq('user_id', userId)
          .gte('created_at', beforeDate.toISOString())
          .lt('created_at', completionDate.toISOString());

        const { data: moodsAfter } = await supabase
          .from('mood_entries')
          .select('mood_level')
          .eq('user_id', userId)
          .gt('created_at', completionDate.toISOString())
          .lte('created_at', afterDate.toISOString());

        if (moodsBefore?.length && moodsAfter?.length) {
          const avgBefore = moodsBefore.reduce((sum, m) => sum + m.mood_level, 0) / moodsBefore.length;
          const avgAfter = moodsAfter.reduce((sum, m) => sum + m.mood_level, 0) / moodsAfter.length;

          impacts.push({
            course_id: progress.course_id,
            course_title: progress.micro_courses?.title || 'Unknown Course',
            mood_before: Number(avgBefore.toFixed(1)),
            mood_after: Number(avgAfter.toFixed(1)),
            improvement: Number((avgAfter - avgBefore).toFixed(1)),
            completion_rate: 100 // Already completed
          });
        }
      }

      return impacts.sort((a, b) => b.improvement - a.improvement);
    } catch (error) {
      console.error('Error analyzing course impact:', error);
      return [];
    }
  }

  // Get accessibility feature usage
  async getAccessibilityUsage(userId: string): Promise<AccessibilityUsage[]> {
    try {
      const { data, error } = await supabase
        .from('accessibility_analytics')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Group by transformation type
      const usageMap = new Map<string, {
        count: number;
        ratings: number[];
        feedback: string[];
      }>();

      data.forEach(entry => {
        const existing = usageMap.get(entry.transformation_used) || {
          count: 0,
          ratings: [],
          feedback: []
        };

        existing.count += 1;
        if (entry.effectiveness_rating) {
          existing.ratings.push(entry.effectiveness_rating);
        }
        if (entry.feedback) {
          existing.feedback.push(entry.feedback);
        }

        usageMap.set(entry.transformation_used, existing);
      });

      return Array.from(usageMap.entries()).map(([feature, stats]) => ({
        feature,
        usage_count: stats.count,
        effectiveness_rating: stats.ratings.length > 0 
          ? Number((stats.ratings.reduce((sum, r) => sum + r, 0) / stats.ratings.length).toFixed(1))
          : 0,
        user_feedback: stats.feedback
      }));
    } catch (error) {
      console.error('Error fetching accessibility usage:', error);
      return [];
    }
  }

  // Generate personalized insights
  async generateInsights(userId: string): Promise<UserInsight[]> {
    const insights: UserInsight[] = [];

    try {
      // Mood pattern insights
      const moodTrends = await this.getMoodTrends(userId, 14);
      if (moodTrends.length >= 5) {
        const recent = moodTrends.slice(-5);
        const trend = recent[recent.length - 1].average_mood - recent[0].average_mood;
        
        if (trend > 1) {
          insights.push({
            type: 'mood_pattern',
            title: 'Mood Improving',
            description: `Your mood has improved by ${trend.toFixed(1)} points over the last 5 days. Keep up the great work!`,
            data: { trend, recent_average: recent[recent.length - 1].average_mood },
            priority: 'medium',
            actionable: false,
            created_at: new Date().toISOString()
          });
        } else if (trend < -1) {
          insights.push({
            type: 'mood_pattern',
            title: 'Mood Declining',
            description: `Your mood has declined by ${Math.abs(trend).toFixed(1)} points. Consider using more coping strategies.`,
            data: { trend, recent_average: recent[recent.length - 1].average_mood },
            priority: 'high',
            actionable: true,
            created_at: new Date().toISOString()
          });
        }
      }

      // Course recommendation insights
      const courseImpacts = await this.getCourseImpact(userId);
      if (courseImpacts.length > 0) {
        const bestCourse = courseImpacts[0];
        if (bestCourse.improvement > 0.5) {
          insights.push({
            type: 'course_recommendation',
            title: 'Effective Learning Pattern',
            description: `The "${bestCourse.course_title}" course improved your mood by ${bestCourse.improvement} points. Look for similar courses!`,
            data: bestCourse,
            priority: 'medium',
            actionable: true,
            created_at: new Date().toISOString()
          });
        }
      }

      // Achievement milestone insights
      const { data: achievements, error: achievementError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .gte('earned_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!achievementError && achievements && achievements.length >= 3) {
        insights.push({
          type: 'achievement_milestone',
          title: 'Achievement Streak',
          description: `You've earned ${achievements.length} achievements this week! You're on a roll!`,
          data: { count: achievements.length, period: 'week' },
          priority: 'low',
          actionable: false,
          created_at: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Error generating insights:', error);
    }

    return insights;
  }

  // Generate weekly report
  async generateWeeklyReport(userId: string): Promise<WeeklyReport> {
    try {
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get mood data for the week
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('mood_level')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString());

      // Get course completions
      const { data: courseCompletions } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('updated_at', weekStart.toISOString());

      // Get journal entries
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString());

      // Get achievements
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .gte('earned_at', weekStart.toISOString());

      const moodAverage = moodEntries && moodEntries.length > 0
        ? moodEntries.reduce((sum, entry) => sum + entry.mood_level, 0) / moodEntries.length
        : 0;

      // Determine trend by comparing to previous week
      const previousWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const { data: previousMoodEntries } = await supabase
        .from('mood_entries')
        .select('mood_level')
        .eq('user_id', userId)
        .gte('created_at', previousWeekStart.toISOString())
        .lt('created_at', weekStart.toISOString());

      const previousMoodAverage = previousMoodEntries && previousMoodEntries.length > 0
        ? previousMoodEntries.reduce((sum, entry) => sum + entry.mood_level, 0) / previousMoodEntries.length
        : moodAverage;

      let moodTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (moodAverage > previousMoodAverage + 0.5) {
        moodTrend = 'improving';
      } else if (moodAverage < previousMoodAverage - 0.5) {
        moodTrend = 'declining';
      }

      const insights = await this.generateInsights(userId);
      
      const recommendations = [];
      if (moodTrend === 'declining') {
        recommendations.push('Consider increasing self-care activities');
        recommendations.push('Try journaling about your feelings');
      }
      if ((courseCompletions?.length || 0) === 0) {
        recommendations.push('Explore our micro-courses for quick wellbeing boosts');
      }
      if ((journalEntries?.length || 0) < 3) {
        recommendations.push('Regular journaling can help track patterns and improve mood');
      }

      return {
        period: `${weekStart.toLocaleDateString()} - ${now.toLocaleDateString()}`,
        mood_average: Number(moodAverage.toFixed(1)),
        mood_trend: moodTrend,
        courses_completed: courseCompletions?.length || 0,
        journal_entries: journalEntries?.length || 0,
        achievements_earned: achievements?.length || 0,
        key_insights: insights.slice(0, 3),
        recommendations
      };
    } catch (error) {
      console.error('Error generating weekly report:', error);
      return {
        period: 'Error',
        mood_average: 0,
        mood_trend: 'stable',
        courses_completed: 0,
        journal_entries: 0,
        achievements_earned: 0,
        key_insights: [],
        recommendations: ['Unable to generate recommendations at this time']
      };
    }
  }

  // Get dashboard stats
  async getDashboardStats(userId: string): Promise<{
    totalMoodEntries: number;
    averageMood: number;
    coursesCompleted: number;
    journalEntries: number;
    achievementsEarned: number;
    currentStreak: number;
  }> {
    try {
      const [
        { data: moodEntries },
        { data: courses },
        { data: journals },
        { data: achievements }
      ] = await Promise.all([
        supabase.from('mood_entries').select('mood_level').eq('user_id', userId),
        supabase.from('course_progress').select('id').eq('user_id', userId).eq('completed', true),
        supabase.from('journal_entries').select('id').eq('user_id', userId),
        supabase.from('user_achievements').select('id').eq('user_id', userId)
      ]);

      const averageMood = moodEntries && moodEntries.length > 0
        ? moodEntries.reduce((sum, entry) => sum + entry.mood_level, 0) / moodEntries.length
        : 0;

      // Calculate streak (simplified - consecutive days with mood entries)
      let currentStreak = 0;
      if (moodEntries && moodEntries.length > 0) {
        const today = new Date();
        const { data: recentEntries } = await supabase
          .from('mood_entries')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (recentEntries) {
          const entryDates = new Set(
            recentEntries.map(entry => 
              new Date(entry.created_at).toISOString().split('T')[0]
            )
          );

          for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
              .toISOString().split('T')[0];
            
            if (entryDates.has(checkDate)) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }

      return {
        totalMoodEntries: moodEntries?.length || 0,
        averageMood: Number(averageMood.toFixed(1)),
        coursesCompleted: courses?.length || 0,
        journalEntries: journals?.length || 0,
        achievementsEarned: achievements?.length || 0,
        currentStreak
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalMoodEntries: 0,
        averageMood: 0,
        coursesCompleted: 0,
        journalEntries: 0,
        achievementsEarned: 0,
        currentStreak: 0
      };
    }
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;