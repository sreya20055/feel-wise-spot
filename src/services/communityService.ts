import { supabase } from '@/integrations/supabase/client';

export interface ForumPost {
  id: string;
  user_id: string;
  anonymous_name: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  replies_count: number;
  is_moderated: boolean;
  moderation_flags?: string[];
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  anonymous_name: string;
  content: string;
  upvotes: number;
  is_moderated: boolean;
  is_helpful: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  anonymous_name: string;
  helper_badges: string[];
  reputation_score: number;
  posts_count: number;
  helpful_replies_count: number;
  created_at: string;
}

export interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  flags: string[];
  suggestedAction: 'approve' | 'review' | 'reject';
  cleanedContent?: string;
}

export interface PeerGroup {
  id: string;
  name: string;
  description: string;
  category: 'study' | 'relaxation' | 'support' | 'creative';
  max_participants: number;
  current_participants: number;
  scheduled_time?: string;
  is_ai_guided: boolean;
  created_by: string;
  created_at: string;
}

export class CommunityService {
  // Categories for forum posts
  private readonly categories = [
    { id: 'emotional-health', name: 'Emotional Wellbeing', description: 'Share experiences and support around mental health' },
    { id: 'neurodivergent-life', name: 'Neurodivergent Life Hacks', description: 'Tips and tricks for ADHD, autism, dyslexia, and more' },
    { id: 'study-productivity', name: 'Study & Productivity', description: 'Academic strategies and productivity tips' },
    { id: 'coping-strategies', name: 'Coping Strategies', description: 'Techniques for managing stress, anxiety, and difficult emotions' },
    { id: 'career-support', name: 'Career & Life Support', description: 'Professional development and life transitions' },
    { id: 'accessibility', name: 'Accessibility & Inclusion', description: 'Making the world more accessible for everyone' },
    { id: 'celebrations', name: 'Wins & Celebrations', description: 'Share your victories, big and small' }
  ];

  // Inappropriate content keywords for AI moderation
  private readonly moderationKeywords = {
    harmful: [
      'suicide', 'kill myself', 'self harm', 'cutting', 'overdose', 'end my life',
      'better off dead', 'no point living', 'want to die', 'hurt myself'
    ],
    harassment: [
      'stupid', 'idiot', 'loser', 'worthless', 'pathetic', 'freak', 'weird',
      'attention seeker', 'fake', 'liar', 'manipulative'
    ],
    spam: [
      'buy now', 'click here', 'make money', 'get rich', 'miracle cure',
      'guaranteed results', 'secret method', 'limited time'
    ],
    inappropriate: [
      'explicit sexual content', 'graphic violence', 'hate speech',
      'discrimination', 'bullying', 'trolling'
    ]
  };

  // Generate anonymous names
  private readonly anonymousNameParts = {
    adjectives: ['Brave', 'Kind', 'Gentle', 'Strong', 'Wise', 'Peaceful', 'Hopeful', 'Caring', 'Bright', 'Calm'],
    nouns: ['Heart', 'Spirit', 'Journey', 'Path', 'Light', 'Friend', 'Helper', 'Guide', 'Seeker', 'Warrior']
  };

  generateAnonymousName(): string {
    const adjective = this.anonymousNameParts.adjectives[
      Math.floor(Math.random() * this.anonymousNameParts.adjectives.length)
    ];
    const noun = this.anonymousNameParts.nouns[
      Math.floor(Math.random() * this.anonymousNameParts.nouns.length)
    ];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${adjective}${noun}${number}`;
  }

  async moderateContent(content: string): Promise<ModerationResult> {
    const lowerContent = content.toLowerCase();
    const flags: string[] = [];
    let confidence = 0;

    // Check for harmful content (highest priority)
    const harmfulMatches = this.moderationKeywords.harmful.filter(keyword => 
      lowerContent.includes(keyword)
    );
    if (harmfulMatches.length > 0) {
      flags.push('self-harm-risk');
      confidence = 0.95;
      return {
        isAppropriate: false,
        confidence,
        flags,
        suggestedAction: 'reject',
        cleanedContent: 'This content has been flagged for review by our safety team. If you are in crisis, please contact 988 (Suicide & Crisis Lifeline) immediately.'
      };
    }

    // Check for harassment
    const harassmentMatches = this.moderationKeywords.harassment.filter(keyword => 
      lowerContent.includes(keyword)
    );
    if (harassmentMatches.length > 0) {
      flags.push('potential-harassment');
      confidence = 0.8;
    }

    // Check for spam
    const spamMatches = this.moderationKeywords.spam.filter(keyword => 
      lowerContent.includes(keyword)
    );
    if (spamMatches.length > 0) {
      flags.push('potential-spam');
      confidence = Math.max(confidence, 0.7);
    }

    // Check for inappropriate content
    const inappropriateMatches = this.moderationKeywords.inappropriate.filter(keyword => 
      lowerContent.includes(keyword)
    );
    if (inappropriateMatches.length > 0) {
      flags.push('inappropriate-content');
      confidence = Math.max(confidence, 0.75);
    }

    // Determine action
    let suggestedAction: 'approve' | 'review' | 'reject' = 'approve';
    let isAppropriate = true;

    if (confidence >= 0.8) {
      suggestedAction = 'reject';
      isAppropriate = false;
    } else if (confidence >= 0.5) {
      suggestedAction = 'review';
    }

    return {
      isAppropriate,
      confidence,
      flags,
      suggestedAction
    };
  }

  async createPost(
    userId: string,
    title: string,
    content: string,
    category: string,
    tags: string[] = []
  ): Promise<ForumPost> {
    // Moderate content first
    const titleModeration = await this.moderateContent(title);
    const contentModeration = await this.moderateContent(content);

    if (!titleModeration.isAppropriate || !contentModeration.isAppropriate) {
      throw new Error('Content does not meet community guidelines. Please review our community standards.');
    }

    // Get or create user profile
    let userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      userProfile = await this.createUserProfile(userId);
    }

    const post: Omit<ForumPost, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      anonymous_name: userProfile.anonymous_name,
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      upvotes: 0,
      replies_count: 0,
      is_moderated: true,
      moderation_flags: [...titleModeration.flags, ...contentModeration.flags]
    };

    const { data, error } = await supabase
      .from('forum_posts')
      .insert(post)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }

    // Update user post count
    await this.updateUserStats(userId, { posts_count: userProfile.posts_count + 1 });

    return data;
  }

  async createReply(
    userId: string,
    postId: string,
    content: string
  ): Promise<ForumReply> {
    // Moderate content
    const moderation = await this.moderateContent(content);
    
    if (!moderation.isAppropriate) {
      throw new Error('Reply does not meet community guidelines.');
    }

    // Get user profile
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const reply: Omit<ForumReply, 'id' | 'created_at' | 'updated_at'> = {
      post_id: postId,
      user_id: userId,
      anonymous_name: userProfile.anonymous_name,
      content: content.trim(),
      upvotes: 0,
      is_moderated: true,
      is_helpful: false
    };

    const { data, error } = await supabase
      .from('forum_replies')
      .insert(reply)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create reply: ${error.message}`);
    }

    // Update post reply count
    await supabase
      .from('forum_posts')
      .update({ replies_count: supabase.sql`replies_count + 1` })
      .eq('id', postId);

    return data;
  }

  async getPosts(
    category?: string,
    limit = 20,
    offset = 0
  ): Promise<ForumPost[]> {
    let query = supabase
      .from('forum_posts')
      .select('*')
      .eq('is_moderated', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }

    return data || [];
  }

  async getReplies(postId: string): Promise<ForumReply[]> {
    const { data, error } = await supabase
      .from('forum_replies')
      .select('*')
      .eq('post_id', postId)
      .eq('is_moderated', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch replies: ${error.message}`);
    }

    return data || [];
  }

  async upvotePost(userId: string, postId: string): Promise<void> {
    // Check if user already upvoted
    const { data: existingVote } = await supabase
      .from('post_votes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (existingVote) {
      // Remove upvote
      await supabase
        .from('post_votes')
        .delete()
        .eq('id', existingVote.id);

      await supabase
        .from('forum_posts')
        .update({ upvotes: supabase.sql`upvotes - 1` })
        .eq('id', postId);
    } else {
      // Add upvote
      await supabase
        .from('post_votes')
        .insert({ user_id: userId, post_id: postId });

      await supabase
        .from('forum_posts')
        .update({ upvotes: supabase.sql`upvotes + 1` })
        .eq('id', postId);
    }
  }

  async markReplyAsHelpful(userId: string, replyId: string): Promise<void> {
    // Only allow original post author to mark replies as helpful
    const { data: reply } = await supabase
      .from('forum_replies')
      .select('post_id, forum_posts(user_id)')
      .eq('id', replyId)
      .single();

    if (!reply || reply.forum_posts.user_id !== userId) {
      throw new Error('Only the original poster can mark replies as helpful');
    }

    await supabase
      .from('forum_replies')
      .update({ is_helpful: true })
      .eq('id', replyId);

    // Update reply author's helpful count
    const { data: replyData } = await supabase
      .from('forum_replies')
      .select('user_id')
      .eq('id', replyId)
      .single();

    if (replyData) {
      const profile = await this.getUserProfile(replyData.user_id);
      if (profile) {
        await this.updateUserStats(replyData.user_id, {
          helpful_replies_count: profile.helpful_replies_count + 1,
          reputation_score: profile.reputation_score + 10
        });

        // Award helper badge if they have 5+ helpful replies
        if (profile.helpful_replies_count + 1 >= 5) {
          await this.awardBadge(replyData.user_id, 'helpful-helper');
        }
      }
    }
  }

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to get user profile: ${error.message}`);
    }

    return data;
  }

  private async createUserProfile(userId: string): Promise<UserProfile> {
    const profile: Omit<UserProfile, 'id' | 'created_at'> = {
      user_id: userId,
      anonymous_name: this.generateAnonymousName(),
      helper_badges: [],
      reputation_score: 0,
      posts_count: 0,
      helpful_replies_count: 0
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return data;
  }

  private async updateUserStats(
    userId: string, 
    updates: Partial<Pick<UserProfile, 'posts_count' | 'helpful_replies_count' | 'reputation_score'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update user stats: ${error.message}`);
    }
  }

  private async awardBadge(userId: string, badgeId: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (!profile || profile.helper_badges.includes(badgeId)) return;

    const updatedBadges = [...profile.helper_badges, badgeId];
    
    await supabase
      .from('user_profiles')
      .update({ helper_badges: updatedBadges })
      .eq('user_id', userId);
  }

  // Peer Group Management
  async createPeerGroup(
    userId: string,
    name: string,
    description: string,
    category: 'study' | 'relaxation' | 'support' | 'creative',
    maxParticipants: number,
    scheduledTime?: string
  ): Promise<PeerGroup> {
    const group: Omit<PeerGroup, 'id' | 'created_at'> = {
      name: name.trim(),
      description: description.trim(),
      category,
      max_participants: maxParticipants,
      current_participants: 1,
      scheduled_time: scheduledTime,
      is_ai_guided: false,
      created_by: userId
    };

    const { data, error } = await supabase
      .from('peer_groups')
      .insert(group)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create peer group: ${error.message}`);
    }

    // Add creator as participant
    await supabase
      .from('group_participants')
      .insert({ group_id: data.id, user_id: userId });

    return data;
  }

  async getCategories() {
    return this.categories;
  }

  async searchPosts(query: string, category?: string): Promise<ForumPost[]> {
    let searchQuery = supabase
      .from('forum_posts')
      .select('*')
      .eq('is_moderated', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (category) {
      searchQuery = searchQuery.eq('category', category);
    }

    const { data, error } = await searchQuery;

    if (error) {
      throw new Error(`Failed to search posts: ${error.message}`);
    }

    return data || [];
  }

  // Get AI-suggested peer groups based on user mood/activity
  async getRecommendedPeerGroups(userId: string): Promise<PeerGroup[]> {
    // Simple implementation - could be enhanced with AI recommendations
    const { data, error } = await supabase
      .from('peer_groups')
      .select('*')
      .lt('current_participants', supabase.sql`max_participants`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`Failed to get recommended groups: ${error.message}`);
    }

    return data || [];
  }
}

export const communityService = new CommunityService();