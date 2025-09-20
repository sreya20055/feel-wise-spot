import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'content_creator';
  permissions: string[];
  created_at: string;
  last_login: string;
}

export interface UserManagement {
  id: string;
  email: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
  courses_completed: number;
  mood_entries_count: number;
  journal_entries_count: number;
  achievements_count: number;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'article' | 'video' | 'resource' | 'quiz';
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  content: any;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface SystemStats {
  total_users: number;
  active_users_30d: number;
  total_courses: number;
  total_mood_entries: number;
  total_journal_entries: number;
  total_achievements_earned: number;
  accessibility_transformations_used: number;
  average_user_satisfaction: number;
}

class AdminService {
  // Check if user has admin privileges
  async isAdmin(userId: string): Promise<boolean> {
    try {
      // In a real app, this would check user roles from database
      // For demo purposes, you could hardcode some admin emails
      const { data: user } = await supabase.auth.getUser();
      const adminEmails = ['admin@blindspot.com', 'demo@admin.com'];
      return adminEmails.includes(user.user?.email || '');
    } catch (error) {
      return false;
    }
  }

  // Get system statistics
  async getSystemStats(): Promise<SystemStats> {
    try {
      // In a real implementation, these would be actual database queries
      return {
        total_users: 1247,
        active_users_30d: 892,
        total_courses: 45,
        total_mood_entries: 15463,
        total_journal_entries: 8721,
        total_achievements_earned: 3584,
        accessibility_transformations_used: 2157,
        average_user_satisfaction: 4.7
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        total_users: 0,
        active_users_30d: 0,
        total_courses: 0,
        total_mood_entries: 0,
        total_journal_entries: 0,
        total_achievements_earned: 0,
        accessibility_transformations_used: 0,
        average_user_satisfaction: 0
      };
    }
  }

  // Get all users for management
  async getUsers(limit: number = 50, offset: number = 0): Promise<UserManagement[]> {
    try {
      // Mock data for demo
      const mockUsers: UserManagement[] = [
        {
          id: '1',
          email: 'user1@example.com',
          created_at: '2024-01-15T10:30:00Z',
          last_login: '2024-01-20T14:22:00Z',
          is_active: true,
          courses_completed: 3,
          mood_entries_count: 45,
          journal_entries_count: 12,
          achievements_count: 8
        },
        {
          id: '2',
          email: 'user2@example.com',
          created_at: '2024-01-10T09:15:00Z',
          last_login: '2024-01-19T16:45:00Z',
          is_active: true,
          courses_completed: 1,
          mood_entries_count: 23,
          journal_entries_count: 7,
          achievements_count: 4
        }
      ];
      
      return mockUsers.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Create or update course content
  async createCourse(courseData: {
    title: string;
    description: string;
    content: any;
    difficulty: string;
    duration_minutes: number;
    category: string;
    tags: string[];
  }): Promise<ContentItem> {
    try {
      const course: ContentItem = {
        id: `course_${Date.now()}`,
        title: courseData.title,
        description: courseData.description,
        type: 'course',
        status: 'draft',
        author_id: 'current_user_id',
        content: courseData.content,
        tags: courseData.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In real app: await supabase.from('content_items').insert(course);
      return course;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  // Get content for management
  async getContent(type?: string, status?: string): Promise<ContentItem[]> {
    try {
      // Mock content data
      const mockContent: ContentItem[] = [
        {
          id: '1',
          title: 'Introduction to Wellbeing',
          description: 'Basic concepts of mental health and wellbeing',
          type: 'course',
          status: 'published',
          author_id: 'admin1',
          content: { modules: ['basics', 'practices'] },
          tags: ['wellbeing', 'basics'],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          published_at: '2024-01-01T00:00:00Z'
        }
      ];

      let filtered = mockContent;

      if (type) {
        filtered = filtered.filter(item => item.type === type);
      }

      if (status) {
        filtered = filtered.filter(item => item.status === status);
      }

      return filtered;
    } catch (error) {
      console.error('Error fetching content:', error);
      return [];
    }
  }

  // Update content status
  async updateContentStatus(contentId: string, status: ContentItem['status']): Promise<boolean> {
    try {
      // In real app: await supabase.from('content_items').update({ status }).eq('id', contentId);
      return true;
    } catch (error) {
      console.error('Error updating content status:', error);
      return false;
    }
  }

  // Delete content
  async deleteContent(contentId: string): Promise<boolean> {
    try {
      // In real app: await supabase.from('content_items').delete().eq('id', contentId);
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  }

  // Get user activity analytics
  async getUserAnalytics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<{
    user_registrations: Array<{ date: string; count: number }>;
    user_activity: Array<{ date: string; active_users: number }>;
    content_engagement: Array<{ content_type: string; engagement_count: number }>;
  }> {
    try {
      // Mock analytics data
      return {
        user_registrations: [
          { date: '2024-01-15', count: 23 },
          { date: '2024-01-16', count: 31 },
          { date: '2024-01-17', count: 18 },
        ],
        user_activity: [
          { date: '2024-01-15', active_users: 245 },
          { date: '2024-01-16', active_users: 298 },
          { date: '2024-01-17', active_users: 267 },
        ],
        content_engagement: [
          { content_type: 'courses', engagement_count: 1234 },
          { content_type: 'journal', engagement_count: 892 },
          { content_type: 'mood_tracking', engagement_count: 2156 },
        ]
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return {
        user_registrations: [],
        user_activity: [],
        content_engagement: []
      };
    }
  }

  // Moderate community content
  async moderateContent(contentId: string, action: 'approve' | 'reject' | 'flag', reason?: string): Promise<boolean> {
    try {
      // In real app, this would update moderation status and potentially notify users
      console.log(`Content ${contentId} ${action}ed`, reason ? `Reason: ${reason}` : '');
      return true;
    } catch (error) {
      console.error('Error moderating content:', error);
      return false;
    }
  }

  // Export user data (GDPR compliance)
  async exportUserData(userId: string): Promise<string> {
    try {
      // In real app, this would gather all user data for export
      const userData = {
        user_info: { id: userId, email: 'user@example.com' },
        mood_entries: [],
        journal_entries: [],
        course_progress: [],
        achievements: [],
        accessibility_settings: {}
      };

      return JSON.stringify(userData, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  // Backup system data
  async createBackup(): Promise<string> {
    try {
      // In real app, this would create a comprehensive system backup
      const backupId = `backup_${Date.now()}`;
      console.log(`Created backup with ID: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
export default adminService;