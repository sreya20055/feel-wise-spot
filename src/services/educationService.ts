import { supabase } from '@/integrations/supabase/client';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'wellbeing' | 'mindfulness' | 'accessibility' | 'self-care';
  courses: string[]; // Course IDs in order
  estimated_duration: number; // in minutes
  prerequisites?: string[];
  certification_available: boolean;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  course_id?: string;
  learning_path_id?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passing_score: number;
  time_limit?: number; // in minutes
  attempts_allowed: number;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'matching';
  options?: string[];
  correct_answer: string | string[];
  explanation?: string;
  points: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: Record<string, string>;
  score: number;
  passed: boolean;
  completed_at: string;
  time_taken: number; // in seconds
}

export interface Certification {
  id: string;
  user_id: string;
  learning_path_id: string;
  title: string;
  issued_at: string;
  certificate_url: string;
  badge_url: string;
  verification_code: string;
}

export interface AITutorSession {
  id: string;
  user_id: string;
  course_id: string;
  session_data: {
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
    learning_objectives: string[];
    user_progress: number;
    difficulty_adjustments: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface ResourceLibraryItem {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'podcast' | 'infographic' | 'worksheet' | 'guide';
  category: string;
  content_url?: string;
  content?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // in minutes
  author: string;
  created_at: string;
  updated_at: string;
}

class EducationService {
  // Predefined learning paths
  private learningPaths: LearningPath[] = [
    {
      id: 'wellbeing-fundamentals',
      title: 'Wellbeing Fundamentals',
      description: 'Master the basics of mental health and wellbeing',
      difficulty: 'beginner',
      category: 'wellbeing',
      courses: ['intro-to-wellbeing', 'stress-management', 'emotional-intelligence'],
      estimated_duration: 120,
      certification_available: true,
      icon: '🌱',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mindfulness-mastery',
      title: 'Mindfulness Mastery',
      description: 'Deep dive into mindfulness practices and meditation',
      difficulty: 'intermediate',
      category: 'mindfulness',
      courses: ['mindfulness-basics', 'meditation-techniques', 'mindful-living'],
      estimated_duration: 180,
      prerequisites: ['wellbeing-fundamentals'],
      certification_available: true,
      icon: '🧘‍♀️',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'accessibility-advocate',
      title: 'Accessibility Advocate',
      description: 'Learn to create and advocate for accessible experiences',
      difficulty: 'intermediate',
      category: 'accessibility',
      courses: ['accessibility-basics', 'inclusive-design', 'advocacy-skills'],
      estimated_duration: 150,
      certification_available: true,
      icon: '♿',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'self-care-specialist',
      title: 'Self-Care Specialist',
      description: 'Comprehensive approach to self-care and personal wellness',
      difficulty: 'advanced',
      category: 'self-care',
      courses: ['self-care-fundamentals', 'work-life-balance', 'resilience-building', 'wellness-planning'],
      estimated_duration: 240,
      prerequisites: ['wellbeing-fundamentals'],
      certification_available: true,
      icon: '💆‍♀️',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Sample quizzes
  private sampleQuizzes: Quiz[] = [
    {
      id: 'wellbeing-basics-quiz',
      course_id: 'intro-to-wellbeing',
      title: 'Wellbeing Basics Assessment',
      description: 'Test your understanding of fundamental wellbeing concepts',
      questions: [
        {
          id: 'q1',
          question: 'What are the main components of mental wellbeing?',
          type: 'multiple_choice',
          options: [
            'Physical health only',
            'Emotional, psychological, and social wellbeing',
            'Just feeling happy',
            'Having no stress'
          ],
          correct_answer: 'Emotional, psychological, and social wellbeing',
          explanation: 'Mental wellbeing encompasses emotional, psychological, and social aspects of health.',
          points: 10
        },
        {
          id: 'q2',
          question: 'Regular self-care practices improve overall wellbeing.',
          type: 'true_false',
          correct_answer: 'true',
          explanation: 'Research shows that consistent self-care practices significantly improve mental health outcomes.',
          points: 5
        },
        {
          id: 'q3',
          question: 'Name two effective stress management techniques.',
          type: 'short_answer',
          correct_answer: ['deep breathing', 'meditation', 'exercise', 'journaling', 'mindfulness'],
          points: 15
        }
      ],
      passing_score: 70,
      time_limit: 15,
      attempts_allowed: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Resource library items
  private resourceLibrary: ResourceLibraryItem[] = [
    {
      id: 'stress-relief-guide',
      title: 'Complete Guide to Stress Relief',
      description: 'Comprehensive guide covering various stress management techniques',
      type: 'guide',
      category: 'stress-management',
      content: `# Complete Guide to Stress Relief

## Understanding Stress
Stress is your body's natural response to challenges and demands...

## Quick Stress Relief Techniques
1. Deep breathing exercises
2. Progressive muscle relaxation
3. Mindful meditation
4. Physical activity

## Long-term Stress Management
- Regular exercise routine
- Healthy sleep habits
- Social connections
- Professional support when needed`,
      tags: ['stress', 'relief', 'techniques', 'wellbeing'],
      difficulty: 'beginner',
      duration: 20,
      author: 'BlindSpot Wellness Team',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mindfulness-exercises',
      title: '10 Daily Mindfulness Exercises',
      description: 'Simple exercises you can do anywhere to practice mindfulness',
      type: 'worksheet',
      category: 'mindfulness',
      content: `# 10 Daily Mindfulness Exercises

## Exercise 1: Mindful Breathing
Take 5 deep breaths, focusing only on the sensation of breathing...

## Exercise 2: Body Scan
Starting from your toes, mentally scan your entire body...

## Exercise 3: Mindful Observation
Choose an object and observe it for 2 minutes without judgment...

[Continue with remaining exercises...]`,
      tags: ['mindfulness', 'exercises', 'daily-practice', 'meditation'],
      difficulty: 'beginner',
      duration: 15,
      author: 'Dr. Sarah Johnson',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Get learning paths
  getLearningPaths(): LearningPath[] {
    return this.learningPaths;
  }

  // Get learning path by ID
  getLearningPath(id: string): LearningPath | null {
    return this.learningPaths.find(path => path.id === id) || null;
  }

  // Get learning paths by category
  getLearningPathsByCategory(category: LearningPath['category']): LearningPath[] {
    return this.learningPaths.filter(path => path.category === category);
  }

  // Get user's learning path progress
  async getUserLearningPathProgress(userId: string, pathId: string): Promise<{
    completedCourses: string[];
    currentCourse: string | null;
    progressPercentage: number;
    canGetCertification: boolean;
  }> {
    try {
      const path = this.getLearningPath(pathId);
      if (!path) {
        throw new Error('Learning path not found');
      }

      const { data: completedCourses } = await supabase
        .from('course_progress')
        .select('course_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .in('course_id', path.courses);

      const completed = completedCourses?.map(c => c.course_id) || [];
      const progressPercentage = (completed.length / path.courses.length) * 100;
      const currentCourse = path.courses.find(courseId => !completed.includes(courseId)) || null;
      const canGetCertification = completed.length === path.courses.length && path.certification_available;

      return {
        completedCourses: completed,
        currentCourse,
        progressPercentage,
        canGetCertification
      };
    } catch (error) {
      console.error('Error fetching learning path progress:', error);
      return {
        completedCourses: [],
        currentCourse: null,
        progressPercentage: 0,
        canGetCertification: false
      };
    }
  }

  // Get quiz by ID
  getQuiz(id: string): Quiz | null {
    return this.sampleQuizzes.find(quiz => quiz.id === id) || null;
  }

  // Get quizzes for course
  getQuizzesForCourse(courseId: string): Quiz[] {
    return this.sampleQuizzes.filter(quiz => quiz.course_id === courseId);
  }

  // Submit quiz attempt
  async submitQuizAttempt(userId: string, quizId: string, answers: Record<string, string>): Promise<QuizAttempt> {
    try {
      const quiz = this.getQuiz(quizId);
      if (!quiz) {
        throw new Error('Quiz not found');
      }

      // Calculate score
      let totalPoints = 0;
      let earnedPoints = 0;

      quiz.questions.forEach(question => {
        totalPoints += question.points;
        const userAnswer = answers[question.id];
        
        if (question.type === 'multiple_choice' || question.type === 'true_false') {
          if (userAnswer === question.correct_answer) {
            earnedPoints += question.points;
          }
        } else if (question.type === 'short_answer') {
          const correctAnswers = Array.isArray(question.correct_answer) 
            ? question.correct_answer 
            : [question.correct_answer];
          
          if (correctAnswers.some(answer => 
            userAnswer.toLowerCase().includes(answer.toLowerCase())
          )) {
            earnedPoints += question.points;
          }
        }
      });

      const score = Math.round((earnedPoints / totalPoints) * 100);
      const passed = score >= quiz.passing_score;

      const attempt: QuizAttempt = {
        id: `attempt_${Date.now()}`,
        user_id: userId,
        quiz_id: quizId,
        answers,
        score,
        passed,
        completed_at: new Date().toISOString(),
        time_taken: 0 // This would be calculated based on start time in a real implementation
      };

      // In a real app, this would be saved to the database
      // await supabase.from('quiz_attempts').insert(attempt);

      return attempt;
    } catch (error) {
      console.error('Error submitting quiz attempt:', error);
      throw error;
    }
  }

  // Generate certificate
  async generateCertificate(userId: string, learningPathId: string): Promise<Certification> {
    try {
      const progress = await this.getUserLearningPathProgress(userId, learningPathId);
      if (!progress.canGetCertification) {
        throw new Error('User has not completed all requirements for certification');
      }

      const path = this.getLearningPath(learningPathId);
      if (!path) {
        throw new Error('Learning path not found');
      }

      const certification: Certification = {
        id: `cert_${Date.now()}`,
        user_id: userId,
        learning_path_id: learningPathId,
        title: `${path.title} Certificate`,
        issued_at: new Date().toISOString(),
        certificate_url: `/certificates/${userId}/${learningPathId}`,
        badge_url: `/badges/${learningPathId}.png`,
        verification_code: Math.random().toString(36).substring(2, 15)
      };

      // In a real app, this would be saved to the database
      // await supabase.from('certifications').insert(certification);

      return certification;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  // AI Tutor interaction
  async chatWithTutor(userId: string, courseId: string, message: string): Promise<string> {
    try {
      // This would integrate with an AI service like OpenAI
      // For now, return a mock response
      const responses = [
        "That's a great question! Let me help you understand this concept better...",
        "I see you're working on this topic. Here's a different way to think about it...",
        "Excellent progress! Let's dive deeper into this area...",
        "I notice you might be struggling with this concept. Let's break it down step by step...",
        "That's correct! You're really getting the hang of this. What else would you like to explore?"
      ];

      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return responses[Math.floor(Math.random() * responses.length)];
    } catch (error) {
      console.error('Error chatting with tutor:', error);
      return "I'm sorry, I'm having trouble responding right now. Please try again later.";
    }
  }

  // Get resource library items
  getResourceLibraryItems(filters?: {
    type?: ResourceLibraryItem['type'];
    category?: string;
    difficulty?: ResourceLibraryItem['difficulty'];
    tags?: string[];
  }): ResourceLibraryItem[] {
    let items = [...this.resourceLibrary];

    if (filters) {
      if (filters.type) {
        items = items.filter(item => item.type === filters.type);
      }
      if (filters.category) {
        items = items.filter(item => item.category === filters.category);
      }
      if (filters.difficulty) {
        items = items.filter(item => item.difficulty === filters.difficulty);
      }
      if (filters.tags && filters.tags.length > 0) {
        items = items.filter(item => 
          filters.tags!.some(tag => item.tags.includes(tag))
        );
      }
    }

    return items;
  }

  // Get resource by ID
  getResource(id: string): ResourceLibraryItem | null {
    return this.resourceLibrary.find(item => item.id === id) || null;
  }

  // Get user's certificates
  async getUserCertificates(userId: string): Promise<Certification[]> {
    try {
      // In a real app, this would query the database
      // const { data, error } = await supabase
      //   .from('certifications')
      //   .select('*')
      //   .eq('user_id', userId);

      // For now, return mock data
      return [];
    } catch (error) {
      console.error('Error fetching user certificates:', error);
      return [];
    }
  }

  // Search resources
  searchResources(query: string): ResourceLibraryItem[] {
    const lowercaseQuery = query.toLowerCase();
    return this.resourceLibrary.filter(item =>
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      item.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get recommended resources based on user progress
  async getRecommendedResources(userId: string): Promise<ResourceLibraryItem[]> {
    try {
      // This would analyze user's course progress and recommend relevant resources
      // For now, return a curated selection
      return this.resourceLibrary.slice(0, 3);
    } catch (error) {
      console.error('Error getting recommended resources:', error);
      return [];
    }
  }
}

export const educationService = new EducationService();
export default educationService;