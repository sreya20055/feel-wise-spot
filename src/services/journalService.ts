import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

export interface JournalEntry {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  prompt?: string;
  mood_rating?: number;
  tags?: string[];
  is_voice_entry: boolean;
  audio_url?: string;
  ai_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalPrompt {
  id: string;
  category: string;
  prompt_text: string;
  mood_context?: string; // For mood-based prompts
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface AIFeedback {
  positive_highlights: string[];
  gentle_suggestions: string[];
  overall_tone: 'supportive' | 'encouraging' | 'celebratory' | 'gentle';
  mood_correlation?: string;
}

export class JournalService {
  // Daily prompts categorized by theme
  private readonly dailyPrompts: JournalPrompt[] = [
    {
      id: '1',
      category: 'Gratitude',
      prompt_text: 'What are three things you are grateful for today, no matter how small they might seem?',
      difficulty_level: 'beginner',
      tags: ['gratitude', 'positivity', 'daily']
    },
    {
      id: '2',
      category: 'Self-Reflection',
      prompt_text: 'How did you show kindness to yourself today? If you did not, what is one way you could be kinder to yourself tomorrow?',
      difficulty_level: 'beginner',
      tags: ['self-compassion', 'kindness', 'reflection']
    },
    {
      id: '3',
      category: 'Growth',
      prompt_text: 'What is one thing you learned about yourself this week? How might this insight help you going forward?',
      difficulty_level: 'intermediate',
      tags: ['growth', 'self-awareness', 'learning']
    },
    {
      id: '4',
      category: 'Emotions',
      prompt_text: 'What emotions did you experience today? Write about one of them - where did you feel it in your body, what triggered it?',
      difficulty_level: 'intermediate',
      tags: ['emotions', 'mindfulness', 'body-awareness']
    },
    {
      id: '5',
      category: 'Challenges',
      prompt_text: 'What is one challenge you are facing right now? What strengths do you already have that could help you navigate this?',
      difficulty_level: 'intermediate',
      tags: ['challenges', 'strengths', 'problem-solving']
    },
    {
      id: '6',
      category: 'Dreams & Goals',
      prompt_text: 'If you could change one thing about your life in the next month, what would it be? What is the smallest step you could take toward that change?',
      difficulty_level: 'advanced',
      tags: ['goals', 'change', 'action-planning']
    },
    {
      id: '7',
      category: 'Relationships',
      prompt_text: 'Think about a relationship that brings you joy. What qualities does this person have? How do they make you feel valued?',
      difficulty_level: 'beginner',
      tags: ['relationships', 'connection', 'appreciation']
    },
    {
      id: '8',
      category: 'Mindfulness',
      prompt_text: 'Describe this moment right now - what do you see, hear, feel, smell? How does it feel to be fully present?',
      difficulty_level: 'beginner',
      tags: ['mindfulness', 'present-moment', 'senses']
    },
    {
      id: '9',
      category: 'Creativity',
      prompt_text: 'What is something creative you would love to try or explore? What draws you to it, and what might be holding you back?',
      difficulty_level: 'intermediate',
      tags: ['creativity', 'exploration', 'barriers']
    },
    {
      id: '10',
      category: 'Values',
      prompt_text: 'What values are most important to you? How did you live according to these values today?',
      difficulty_level: 'advanced',
      tags: ['values', 'authenticity', 'alignment']
    }
  ];

  async getTodayPrompt(userId: string, moodLevel?: number): Promise<JournalPrompt> {
    // Get prompts the user has used recently to avoid repetition
    const { data: recentEntries } = await supabase
      .from('journal_entries')
      .select('prompt')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('prompt', 'is', null);

    const usedPrompts = recentEntries?.map(entry => entry.prompt) || [];
    
    // Filter out recently used prompts
    let availablePrompts = this.dailyPrompts.filter(prompt => 
      !usedPrompts.includes(prompt.prompt_text)
    );

    // If all prompts have been used recently, use all prompts
    if (availablePrompts.length === 0) {
      availablePrompts = this.dailyPrompts;
    }

    // Select based on mood if provided
    if (moodLevel) {
      if (moodLevel <= 3) {
        // Low mood - gentle, supportive prompts
        const gentlePrompts = availablePrompts.filter(p => 
          p.tags.includes('self-compassion') || 
          p.tags.includes('gratitude') || 
          p.tags.includes('mindfulness')
        );
        if (gentlePrompts.length > 0) {
          return gentlePrompts[Math.floor(Math.random() * gentlePrompts.length)];
        }
      } else if (moodLevel >= 8) {
        // High mood - growth and goal-oriented prompts
        const growthPrompts = availablePrompts.filter(p => 
          p.tags.includes('growth') || 
          p.tags.includes('goals') || 
          p.tags.includes('creativity')
        );
        if (growthPrompts.length > 0) {
          return growthPrompts[Math.floor(Math.random() * growthPrompts.length)];
        }
      }
    }

    // Default: random prompt
    return availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
  }

  async saveJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entry)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save journal entry: ${error.message}`);
    }

    return data;
  }

  async getJournalEntries(userId: string, limit = 20): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch journal entries: ${error.message}`);
    }

    return data || [];
  }

  async generateAIFeedback(entryContent: string, moodRating?: number): Promise<AIFeedback> {
    // Simple AI feedback generator - in production, use proper AI service
    const content = entryContent.toLowerCase();
    
    const positiveWords = ['happy', 'grateful', 'good', 'better', 'accomplished', 'proud', 'love', 'joy', 'success'];
    const challengingWords = ['difficult', 'hard', 'struggling', 'sad', 'worried', 'anxious', 'stressed', 'overwhelmed'];
    
    const hasPositiveContent = positiveWords.some(word => content.includes(word));
    const hasChallenges = challengingWords.some(word => content.includes(word));

    let feedback: AIFeedback;

    if (hasPositiveContent && !hasChallenges) {
      feedback = {
        positive_highlights: [
          "I can sense the positivity and gratitude in your writing - that is wonderful to see!",
          "Your awareness of good moments shows great mindfulness."
        ],
        gentle_suggestions: [
          "Consider what specific actions or thoughts contributed to these positive feelings.",
          "You might explore how to cultivate more of these moments in your daily life."
        ],
        overall_tone: 'celebratory'
      };
    } else if (hasChallenges && !hasPositiveContent) {
      feedback = {
        positive_highlights: [
          "Thank you for being brave and honest in sharing these difficult feelings.",
          "Writing about challenges is a powerful step toward processing them."
        ],
        gentle_suggestions: [
          "Remember that difficult emotions are temporary and valid.",
          "Consider what small act of self-care might help you today.",
          "If these feelings persist, reaching out to a professional can be very helpful."
        ],
        overall_tone: 'gentle'
      };
    } else if (hasPositiveContent && hasChallenges) {
      feedback = {
        positive_highlights: [
          "I appreciate how you are acknowledging both the challenges and positive aspects of your experience.",
          "This balanced perspective shows emotional maturity and self-awareness."
        ],
        gentle_suggestions: [
          "Notice how you can hold both difficult and positive feelings at the same time.",
          "This kind of honest reflection is exactly what helps us grow and heal."
        ],
        overall_tone: 'supportive'
      };
    } else {
      feedback = {
        positive_highlights: [
          "Thank you for taking time to write and reflect - that's an act of self-care.",
          "Every moment of self-reflection is valuable, regardless of what you write about."
        ],
        gentle_suggestions: [
          "Sometimes our most important insights come from the simplest observations.",
          "Consider exploring what you are feeling right now, even if it seems ordinary."
        ],
        overall_tone: 'encouraging'
      };
    }

    // Add mood correlation if provided
    if (moodRating) {
      if (moodRating <= 3 && hasPositiveContent) {
        feedback.mood_correlation = "Even during tough times, you are finding things to appreciate. That resilience is remarkable.";
      } else if (moodRating >= 8 && hasChallenges) {
        feedback.mood_correlation = "It is wonderful that even when feeling good, you are still processing life complexities with honesty.";
      }
    }

    return feedback;
  }

  async transcribeVoiceEntry(audioBlob: Blob): Promise<string> {
    // In production, use a proper speech-to-text service
    // For now, return a placeholder
    return new Promise((resolve, reject) => {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error('Speech recognition failed: ' + event.error));
      };

      recognition.start();
    });
  }

  async exportJournalEntries(userId: string, format: 'pdf' | 'txt' = 'pdf'): Promise<Blob> {
    const entries = await this.getJournalEntries(userId, 100); // Get more entries for export

    if (format === 'pdf') {
      const pdf = new jsPDF();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text('BlindSpot Journal Export', 20, yPosition);
      yPosition += 20;

      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 20;

      // Entries
      entries.forEach((entry, index) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text(`Entry ${index + 1} - ${new Date(entry.created_at).toLocaleDateString()}`, 20, yPosition);
        yPosition += 10;

        if (entry.title) {
          pdf.setFontSize(12);
          pdf.text(`Title: ${entry.title}`, 20, yPosition);
          yPosition += 8;
        }

        if (entry.prompt) {
          pdf.setFontSize(10);
          pdf.text(`Prompt: ${entry.prompt}`, 20, yPosition);
          yPosition += 8;
        }

        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(entry.content, 170);
        pdf.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 10;
      });

      return pdf.output('blob');
    } else {
      // Text format
      let content = `BlindSpot Journal Export
Generated on: ${new Date().toLocaleDateString()}

`;
      
      entries.forEach((entry, index) => {
        content += `Entry ${index + 1} - ${new Date(entry.created_at).toLocaleDateString()}
`;
        if (entry.title) content += `Title: ${entry.title}
`;
        if (entry.prompt) content += `Prompt: ${entry.prompt}
`;
        content += `${entry.content}

---

`;
      });

      return new Blob([content], { type: 'text/plain' });
    }
  }

  async correlateWithMoods(userId: string): Promise<any> {
    // Get journal entries and mood entries for correlation
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('created_at, content, mood_rating')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    const { data: moodEntries } = await supabase
      .from('mood_entries')
      .select('created_at, mood_level')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    // Simple correlation analysis
    const correlations = [];
    
    journalEntries?.forEach(journal => {
      const journalDate = new Date(journal.created_at).toDateString();
      const matchingMood = moodEntries?.find(mood => 
        new Date(mood.created_at).toDateString() === journalDate
      );

      if (matchingMood) {
        correlations.push({
          date: journalDate,
          journalContent: journal.content,
          journalMoodRating: journal.mood_rating,
          actualMoodLevel: matchingMood.mood_level,
          correlation: journal.mood_rating ? 
            Math.abs(journal.mood_rating - matchingMood.mood_level) : null
        });
      }
    });

    return correlations;
  }
}

export const journalService = new JournalService();