import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'mood' | 'journal' | 'courses' | 'community' | 'streaks' | 'special';
  requirement_type: 'count' | 'streak' | 'milestone' | 'special';
  requirement_value: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlock_message: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress?: number;
  achievement?: Achievement;
}

export interface DailyChallenge {
  id: string;
  date: string;
  challenge_type: 'mood_track' | 'journal_write' | 'course_complete' | 'community_engage';
  title: string;
  description: string;
  target_value: number;
  points_reward: number;
  icon: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  completed_at?: string;
  daily_challenge?: DailyChallenge;
}

export interface UserProgress {
  user_id: string;
  total_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  achievements_count: number;
  challenges_completed: number;
  mood_entries_count: number;
  journal_entries_count: number;
  courses_completed: number;
  community_posts_count: number;
  last_activity: string;
}

export interface ProgressVisualization {
  type: 'tree' | 'journey' | 'spiral';
  stages: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    unlocked: boolean;
    progress: number; // 0-100
  }>;
  currentStage: number;
  nextMilestone: {
    name: string;
    pointsNeeded: number;
    description: string;
  };
}

export class GamificationService {
  // Predefined achievements
  private readonly achievements: Achievement[] = [
    // Mood tracking achievements
    {
      id: 'first-mood',
      name: 'First Step',
      description: 'Log your first mood entry',
      icon: '🌟',
      category: 'mood',
      requirement_type: 'count',
      requirement_value: 1,
      points: 10,
      rarity: 'common',
      unlock_message: 'You took the first step on your wellbeing journey!'
    },
    {
      id: 'mood-week',
      name: 'Weekly Tracker',
      description: 'Log mood entries for 7 consecutive days',
      icon: '📅',
      category: 'streaks',
      requirement_type: 'streak',
      requirement_value: 7,
      points: 50,
      rarity: 'rare',
      unlock_message: 'Consistency is key to understanding your patterns!'
    },
    {
      id: 'mood-mountain',
      name: 'Mood Mountain',
      description: 'Log 100 mood entries',
      icon: '⛰️',
      category: 'mood',
      requirement_type: 'count',
      requirement_value: 100,
      points: 200,
      rarity: 'epic',
      unlock_message: 'You have climbed the mountain of self-awareness!'
    },

    // Journal achievements  
    {
      id: 'first-journal',
      name: 'Pen to Paper',
      description: 'Write your first journal entry',
      icon: '✍️',
      category: 'journal',
      requirement_type: 'count',
      requirement_value: 1,
      points: 15,
      rarity: 'common',
      unlock_message: 'Every great journey begins with a single word!'
    },
    {
      id: 'voice-journalist',
      name: 'Voice of Wisdom',
      description: 'Create 5 voice journal entries',
      icon: '🎙️',
      category: 'journal',
      requirement_type: 'count',
      requirement_value: 5,
      points: 75,
      rarity: 'rare',
      unlock_message: 'Your voice carries the power of your experiences!'
    },
    {
      id: 'prolific-writer',
      name: 'Prolific Writer',
      description: 'Write 50 journal entries',
      icon: '📚',
      category: 'journal',
      requirement_type: 'count',
      requirement_value: 50,
      points: 150,
      rarity: 'epic',
      unlock_message: 'Your words paint the canvas of your growth!'
    },

    // Course achievements
    {
      id: 'first-course',
      name: 'Eager Learner',
      description: 'Complete your first micro-course',
      icon: '🎓',
      category: 'courses',
      requirement_type: 'count',
      requirement_value: 1,
      points: 20,
      rarity: 'common',
      unlock_message: 'Learning is the beginning of all transformation!'
    },
    {
      id: 'course-collector',
      name: 'Course Collector',
      description: 'Complete 10 micro-courses',
      icon: '📖',
      category: 'courses',
      requirement_type: 'count',
      requirement_value: 10,
      points: 100,
      rarity: 'rare',
      unlock_message: 'Knowledge is your superpower!'
    },
    {
      id: 'wisdom-seeker',
      name: 'Wisdom Seeker',
      description: 'Complete 25 micro-courses',
      icon: '🧠',
      category: 'courses',
      requirement_type: 'count',
      requirement_value: 25,
      points: 250,
      rarity: 'legendary',
      unlock_message: 'You have become a beacon of wisdom and growth!'
    },

    // Community achievements
    {
      id: 'first-post',
      name: 'Community Voice',
      description: 'Create your first community post',
      icon: '💬',
      category: 'community',
      requirement_type: 'count',
      requirement_value: 1,
      points: 15,
      rarity: 'common',
      unlock_message: 'Your voice matters in this community!'
    },
    {
      id: 'helpful-soul',
      name: 'Helpful Soul',
      description: 'Receive 5 helpful reply marks',
      icon: '🤝',
      category: 'community',
      requirement_type: 'count',
      requirement_value: 5,
      points: 100,
      rarity: 'rare',
      unlock_message: 'You are a pillar of support in our community!'
    },

    // Special achievements
    {
      id: 'perfect-day',
      name: 'Perfect Day',
      description: 'Log mood, write journal entry, and complete a course in one day',
      icon: '✨',
      category: 'special',
      requirement_type: 'special',
      requirement_value: 1,
      points: 75,
      rarity: 'epic',
      unlock_message: 'You made today truly perfect!'
    },
    {
      id: 'ai-companion',
      name: 'AI Confidant',
      description: 'Have your first conversation with Sage',
      icon: '🤖',
      category: 'special',
      requirement_type: 'count',
      requirement_value: 1,
      points: 25,
      rarity: 'common',
      unlock_message: 'Sage is honored to be your companion!'
    }
  ];

  // Daily challenges templates
  private readonly challengeTemplates = [
    {
      type: 'mood_track',
      title: 'Mood Check-In',
      description: 'Log your mood today',
      target_value: 1,
      points_reward: 10,
      icon: '❤️'
    },
    {
      type: 'journal_write',
      title: 'Reflection Time',
      description: 'Write a journal entry',
      target_value: 1,
      points_reward: 15,
      icon: '✍️'
    },
    {
      type: 'course_complete',
      title: 'Learning Moment',
      description: 'Complete a micro-course',
      target_value: 1,
      points_reward: 20,
      icon: '📚'
    },
    {
      type: 'community_engage',
      title: 'Community Connection',
      description: 'Engage with the community (post or reply)',
      target_value: 1,
      points_reward: 15,
      icon: '💬'
    }
  ];

  async getUserProgress(userId: string): Promise<UserProgress> {
    // Get or create user progress
    let { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create initial progress
      const newProgress = {
        user_id: userId,
        total_points: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        achievements_count: 0,
        challenges_completed: 0,
        mood_entries_count: 0,
        journal_entries_count: 0,
        courses_completed: 0,
        community_posts_count: 0,
        last_activity: new Date().toISOString()
      };

      const { data: created } = await supabase
        .from('user_progress')
        .insert(newProgress)
        .select()
        .single();

      return created || newProgress;
    }

    return progress;
  }

  async updateUserProgress(userId: string, updates: Partial<UserProgress>): Promise<void> {
    await supabase
      .from('user_progress')
      .upsert({ user_id: userId, ...updates })
      .eq('user_id', userId);
  }

  async checkAndAwardAchievements(userId: string, activityType: string): Promise<UserAchievement[]> {
    const newAchievements: UserAchievement[] = [];
    const progress = await this.getUserProgress(userId);

    // Get user's existing achievements
    const { data: existingAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const earnedIds = new Set(existingAchievements?.map(a => a.achievement_id) || []);

    for (const achievement of this.achievements) {
      // Skip if already earned
      if (earnedIds.has(achievement.id)) continue;

      let shouldAward = false;

      // Check achievement requirements
      switch (achievement.requirement_type) {
        case 'count':
          shouldAward = this.checkCountRequirement(achievement, progress, activityType);
          break;
        case 'streak':
          shouldAward = this.checkStreakRequirement(achievement, progress);
          break;
        case 'special':
          shouldAward = await this.checkSpecialRequirement(achievement, userId, activityType);
          break;
      }

      if (shouldAward) {
        const userAchievement = await this.awardAchievement(userId, achievement);
        if (userAchievement) {
          newAchievements.push(userAchievement);
        }
      }
    }

    return newAchievements;
  }

  private checkCountRequirement(achievement: Achievement, progress: UserProgress, activityType: string): boolean {
    switch (achievement.category) {
      case 'mood':
        return progress.mood_entries_count >= achievement.requirement_value;
      case 'journal':
        return progress.journal_entries_count >= achievement.requirement_value;
      case 'courses':
        return progress.courses_completed >= achievement.requirement_value;
      case 'community':
        return progress.community_posts_count >= achievement.requirement_value;
      default:
        return false;
    }
  }

  private checkStreakRequirement(achievement: Achievement, progress: UserProgress): boolean {
    return progress.current_streak >= achievement.requirement_value;
  }

  private async checkSpecialRequirement(achievement: Achievement, userId: string, activityType: string): Promise<boolean> {
    if (achievement.id === 'perfect-day') {
      // Check if user has done mood, journal, and course today
      const today = new Date().toDateString();
      
      const [moodToday, journalToday, courseToday] = await Promise.all([
        supabase.from('mood_entries').select('id').eq('user_id', userId).gte('created_at', today).single(),
        supabase.from('journal_entries').select('id').eq('user_id', userId).gte('created_at', today).single(),
        supabase.from('course_progress').select('id').eq('user_id', userId).eq('completed', true).gte('created_at', today).single()
      ]);

      return !!(moodToday.data && journalToday.data && courseToday.data);
    }

    if (achievement.id === 'ai-companion' && activityType === 'ai_conversation') {
      return true;
    }

    return false;
  }

  private async awardAchievement(userId: string, achievement: Achievement): Promise<UserAchievement | null> {
    try {
      const userAchievement = {
        user_id: userId,
        achievement_id: achievement.id,
        earned_at: new Date().toISOString()
      };

      const { data } = await supabase
        .from('user_achievements')
        .insert(userAchievement)
        .select('*, achievements(*)')
        .single();

      // Update user's total points and achievements count
      await supabase
        .from('user_progress')
        .update({
          total_points: supabase.sql`total_points + ${achievement.points}`,
          achievements_count: supabase.sql`achievements_count + 1`
        })
        .eq('user_id', userId);

      return data;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return null;
    }
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch achievements: ${error.message}`);
    }

    return data || [];
  }

  async generateDailyChallenges(userId: string): Promise<DailyChallenge[]> {
    const today = new Date().toISOString().split('T')[0];

    // Check if challenges already exist for today
    const { data: existingChallenges } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', today);

    if (existingChallenges && existingChallenges.length > 0) {
      return existingChallenges;
    }

    // Generate 3 random challenges for today
    const selectedTemplates = this.shuffleArray([...this.challengeTemplates]).slice(0, 3);
    const challenges = selectedTemplates.map((template, index) => ({
      id: `${today}-${template.type}-${index}`,
      date: today,
      challenge_type: template.type as any,
      title: template.title,
      description: template.description,
      target_value: template.target_value,
      points_reward: template.points_reward,
      icon: template.icon
    }));

    // Save challenges to database
    await supabase.from('daily_challenges').insert(challenges);

    return challenges;
  }

  async getUserChallenges(userId: string): Promise<UserChallenge[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_challenges')
      .select('*, daily_challenges(*)')
      .eq('user_id', userId)
      .eq('daily_challenges.date', today);

    if (error) {
      throw new Error(`Failed to fetch challenges: ${error.message}`);
    }

    return data || [];
  }

  async updateChallengeProgress(userId: string, challengeId: string, progress: number): Promise<void> {
    const { data: challenge } = await supabase
      .from('daily_challenges')
      .select('target_value, points_reward')
      .eq('id', challengeId)
      .single();

    if (!challenge) return;

    const completed = progress >= challenge.target_value;
    const updates: any = {
      current_progress: progress,
      completed
    };

    if (completed) {
      updates.completed_at = new Date().toISOString();
    }

    await supabase
      .from('user_challenges')
      .upsert({
        user_id: userId,
        challenge_id: challengeId,
        ...updates
      });

    // Award points if completed
    if (completed) {
      await supabase
        .from('user_progress')
        .update({
          total_points: supabase.sql`total_points + ${challenge.points_reward}`,
          challenges_completed: supabase.sql`challenges_completed + 1`
        })
        .eq('user_id', userId);
    }
  }

  async getProgressVisualization(userId: string): Promise<ProgressVisualization> {
    const progress = await this.getUserProgress(userId);
    const level = Math.floor(progress.total_points / 100) + 1;
    const pointsInCurrentLevel = progress.total_points % 100;

    const stages = [
      { id: 'seedling', name: 'Seedling', description: 'Just getting started', icon: '🌱', color: '#22c55e', points: 0 },
      { id: 'sprout', name: 'Sprout', description: 'Beginning to grow', icon: '🌿', color: '#16a34a', points: 100 },
      { id: 'sapling', name: 'Sapling', description: 'Growing stronger', icon: '🌳', color: '#15803d', points: 300 },
      { id: 'tree', name: 'Tree', description: 'Strong and resilient', icon: '🌲', color: '#166534', points: 600 },
      { id: 'forest', name: 'Forest', description: 'Flourishing ecosystem', icon: '🌲', color: '#14532d', points: 1000 },
    ];

    const currentStageIndex = Math.min(Math.floor(progress.total_points / 200), stages.length - 1);
    const nextStage = stages[currentStageIndex + 1];

    return {
      type: 'tree',
      stages: stages.map((stage, index) => ({
        ...stage,
        unlocked: progress.total_points >= stage.points,
        progress: index === currentStageIndex ? pointsInCurrentLevel : (index < currentStageIndex ? 100 : 0)
      })),
      currentStage: currentStageIndex,
      nextMilestone: nextStage ? {
        name: nextStage.name,
        pointsNeeded: nextStage.points - progress.total_points,
        description: nextStage.description
      } : {
        name: 'Master Gardener',
        pointsNeeded: 0,
        description: 'You have reached the highest level!'
      }
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Activity tracking methods
  async trackActivity(userId: string, activityType: 'mood' | 'journal' | 'course' | 'community' | 'ai_conversation'): Promise<UserAchievement[]> {
    // Update activity counts
    const updateField = `${activityType}_entries_count`;
    if (['mood', 'journal', 'community'].includes(activityType)) {
      await supabase
        .from('user_progress')
        .update({ [updateField]: supabase.sql`${updateField} + 1` })
        .eq('user_id', userId);
    } else if (activityType === 'course') {
      await supabase
        .from('user_progress')
        .update({ courses_completed: supabase.sql`courses_completed + 1` })
        .eq('user_id', userId);
    }

    // Check for new achievements
    return this.checkAndAwardAchievements(userId, activityType);
  }

  getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }
}

export const gamificationService = new GamificationService();