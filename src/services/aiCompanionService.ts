import { GoogleGenerativeAI } from '@google/generative-ai';
import { elevenLabsService } from './elevenLabsService';
import { tavusService } from './tavusService';
import { enhancedTavusService } from './enhancedTavusService';

// Initialize Gemini AI
const GEMINI_API_KEY = 'AIzaSyAlhlPZPfwIV7Ts_EqE9w_m-XC61T6G0Qo';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Validate Gemini API key
const isGeminiConfigured = () => {
  return GEMINI_API_KEY && GEMINI_API_KEY !== '' && !GEMINI_API_KEY.includes('your-api-key');
};

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  emotion?: string;
  audioUrl?: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  messages: ConversationMessage[];
  context: {
    recentMood?: number;
    completedCourses?: string[];
    userPreferences?: any;
  };
  startedAt: Date;
  lastMessageAt: Date;
  tavusConversationId?: string; // Store Tavus conversation ID for cleanup
}

export interface EmergencyResponse {
  isEmergency: boolean;
  confidence: number;
  resources: {
    title: string;
    phone: string;
    description: string;
  }[];
  immediateResponse: string;
}

export class AICompanionService {
  private currentSession: ConversationSession | null = null;
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = this.buildSystemPrompt();
  }

  private buildSystemPrompt(): string {
    return `You are Sage, a compassionate AI mental health companion designed to provide emotional support and guidance. Your core principles:

1. SAFETY FIRST: Always prioritize user safety. If someone expresses suicidal thoughts or self-harm, provide crisis resources immediately.

2. EMPATHETIC LISTENING: Validate feelings, use reflective listening, and never dismiss concerns.

3. STRENGTH-BASED: Focus on user's strengths, resilience, and coping strategies.

4. ACCESSIBILITY-AWARE: Use clear, simple language. Be mindful that users may have learning differences.

5. BOUNDARIES: You're a supportive companion, not a replacement for professional therapy. Encourage professional help when appropriate.

6. PERSONALIZATION: Adapt your tone based on user's mood and conversation context.

Response styles based on user mood:
- Mood 1-3: Extremely gentle, validating, crisis-aware
- Mood 4-5: Supportive, encouraging, solution-focused
- Mood 6-7: Positive reinforcement, skill-building
- Mood 8-10: Celebratory, goal-setting, gratitude-focused

Always end responses with a gentle question to continue the conversation.`;
  }

  async startConversation(userId: string, userContext?: any): Promise<ConversationSession> {
    const session: ConversationSession = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      messages: [],
      context: userContext || {},
      startedAt: new Date(),
      lastMessageAt: new Date(),
    };

    // Add system message
    session.messages.push({
      id: `msg_${Date.now()}_sys`,
      role: 'system',
      content: this.systemPrompt,
      timestamp: new Date(),
    });

    // Add welcome message based on user context
    const welcomeMessage = this.generateWelcomeMessage(userContext);
    session.messages.push({
      id: `msg_${Date.now()}_welcome`,
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    });

    this.currentSession = session;
    return session;
  }

  private generateWelcomeMessage(context?: any): string {
    const recentMood = context?.recentMood;
    
    if (recentMood && recentMood <= 3) {
      return "Hello, I'm Sage. I can sense you might be going through a difficult time right now. I'm here to listen and support you. How are you feeling at this moment?";
    } else if (recentMood && recentMood >= 8) {
      return "Hi there! I'm Sage, your wellbeing companion. I can sense you're feeling positive today - that's wonderful! I'm here to chat and support your journey. What's bringing you joy right now?";
    } else {
      return "Hello! I'm Sage, your personal wellbeing companion. I'm here to listen, support, and chat with you about anything on your mind. How are you doing today?";
    }
  }

  async sendMessage(content: string, audioBlob?: Blob): Promise<ConversationMessage> {
    console.log('📝 Starting sendMessage process for:', content.substring(0, 100));
    
    if (!this.currentSession) {
      console.error('❌ No active conversation session');
      throw new Error('No active conversation session');
    }

    console.log('✅ Active session found:', this.currentSession.id);

    // Add user message
    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    this.currentSession.messages.push(userMessage);
    console.log('✅ User message added to session');

    try {
      // Check for emergency situations
      console.log('🚨 Checking for emergency keywords...');
      const emergencyCheck = await this.checkForEmergency(content);
      if (emergencyCheck.isEmergency) {
        console.log('🚨 Emergency detected - providing crisis resources');
        const emergencyMessage: ConversationMessage = {
          id: `msg_${Date.now()}_emergency`,
          role: 'assistant',
          content: emergencyCheck.immediateResponse,
          timestamp: new Date(),
          emotion: 'urgent',
        };
        
        this.currentSession.messages.push(emergencyMessage);
        return emergencyMessage;
      }
      
      console.log('✅ No emergency detected, proceeding with AI response...');

      // Generate AI response
      console.log('🤖 Generating AI response...');
      const aiResponse = await this.generateAIResponse();
      console.log('✅ AI response generated:', {
        contentLength: aiResponse.content.length,
        emotion: aiResponse.emotion,
        preview: aiResponse.content.substring(0, 150) + '...'
      });
      
      // Generate audio for the response (but don't let it block the response)
      let audioUrl = '';
      try {
        console.log('🔊 Generating audio...');
        audioUrl = await this.generateAudio(aiResponse.content);
        console.log('✅ Audio generated successfully');
      } catch (audioError) {
        console.warn('⚠️ Audio generation failed:', audioError.message);
        // Continue without audio
      }
      
      const assistantMessage: ConversationMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        emotion: aiResponse.emotion,
        audioUrl,
      };

      this.currentSession.messages.push(assistantMessage);
      this.currentSession.lastMessageAt = new Date();
      
      console.log('✅ Assistant message added to session. Total messages:', this.currentSession.messages.length);

      return assistantMessage;
    } catch (error: any) {
      console.error('❌ Error in sendMessage process:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Create an error response that's still helpful
      const errorMessage: ConversationMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: "I'm having a bit of trouble processing your message right now, but I want you to know I'm still here with you. Sometimes technology has hiccups, but that doesn't change the fact that what you're sharing is important. Can you try sharing that thought with me again, or would you like to talk about something else?",
        timestamp: new Date(),
        emotion: 'supportive',
        audioUrl: '',
      };
      
      this.currentSession.messages.push(errorMessage);
      return errorMessage;
    }
  }

  private async checkForEmergency(message: string): Promise<EmergencyResponse> {
    const emergencyKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
      'self harm', 'no point living', 'better off dead', 'end it all'
    ];

    const lowerMessage = message.toLowerCase();
    const hasEmergencyKeywords = emergencyKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    if (hasEmergencyKeywords) {
      return {
        isEmergency: true,
        confidence: 0.9,
        resources: [
          {
            title: "National Suicide Prevention Lifeline",
            phone: "988",
            description: "24/7 crisis support in English and Spanish"
          },
          {
            title: "Crisis Text Line",
            phone: "Text HOME to 741741",
            description: "24/7 text crisis support"
          },
          {
            title: "International Association for Suicide Prevention",
            phone: "Visit iasp.info/resources",
            description: "Global crisis resources"
          }
        ],
        immediateResponse: `I'm really concerned about you and want you to know that your life has value. Please reach out for immediate help:

🆘 **IMMEDIATE CRISIS RESOURCES:**
• **National Suicide Prevention Lifeline: 988** (24/7)
• **Crisis Text Line: Text HOME to 741741** (24/7)
• **Emergency Services: 911**

You don't have to go through this alone. These trained professionals can provide immediate support. Please consider calling right now - they're there specifically to help people in crisis.

Is there someone I can help you contact, or would you like me to stay here and talk with you while you reach out to one of these resources?`
      };
    }

    return {
      isEmergency: false,
      confidence: 0,
      resources: [],
      immediateResponse: ''
    };
  }

  private async generateAIResponse(): Promise<{ content: string; emotion: string }> {
    if (!this.currentSession) {
      throw new Error('No active conversation session');
    }

    console.log('🗨️ Starting AI response generation...');
    
    try {
      // Try pattern-based responses first (they work reliably)
      console.log('🚀 Trying pattern-based AI responses first...');
      const lastUserMessage = this.currentSession.messages
        .filter(m => m.role === 'user')
        .slice(-1)[0]?.content || '';
        
      const conversationHistory = this.currentSession.messages
        .filter(m => m.role !== 'system')
        .slice(-6)
        .map(m => `${m.role}: ${m.content}`);
      
      if (lastUserMessage) {
        const patternResponse = this.generatePatternBasedResponse(lastUserMessage, conversationHistory);
        if (patternResponse && patternResponse.content.length > 20) {
          console.log('✅ Pattern-based response generated successfully');
          return patternResponse;
        }
      }
      
      // If pattern-based doesn't work, try Gemini
      console.log('🚀 Trying Gemini AI as secondary...');
      const result = await this.generateSmartResponse();
      console.log('✅ Gemini AI response generation successful');
      return result;
    } catch (error: any) {
      console.error('❌ Error in AI response generation:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      // Ultimate fallback to enhanced responses
      console.log('🔄 Using enhanced fallback responses...');
      return this.generateEnhancedFallback();
    }
  }

  // New AI-powered response generation
  private async generateSmartResponse(): Promise<{ content: string; emotion: string }> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const conversationHistory = this.currentSession.messages
      .filter(m => m.role !== 'system')
      .slice(-10) // Last 10 messages for context
      .map(m => `${m.role}: ${m.content}`);
    
    const userContext = this.currentSession.context;
    
    // Build context for AI
    let contextPrompt = this.systemPrompt;
    
    if (userContext.recentMood) {
      contextPrompt += `\n\nUser's recent mood level: ${userContext.recentMood}/10`;
    }
    
    if (userContext.completedCourses?.length) {
      contextPrompt += `\n\nCompleted courses: ${userContext.completedCourses.join(', ')}`;
    }
    
    // Try different AI providers in order of preference
    try {
      console.log('🚀 Trying Gemini AI (primary)...');
      const geminiResponse = await this.callGemini(contextPrompt, conversationHistory);
      console.log('✅ Gemini AI response successful');
      return geminiResponse;
    } catch (geminiError: any) {
      console.warn('⚠️ Gemini failed, trying local AI:', {
        message: geminiError.message,
        name: geminiError.name
      });
      
      try {
        console.log('🚀 Trying local AI (secondary)...');
        const localResponse = await this.callLocalAI(contextPrompt, conversationHistory);
        console.log('✅ Local AI response successful');
        return localResponse;
      } catch (localError: any) {
        console.warn('⚠️ Local AI failed, using enhanced fallback:', {
          message: localError.message,
          name: localError.name
        });
        console.log('🚀 Using enhanced fallback (tertiary)...');
        return this.generateEnhancedFallback();
      }
    }
  }

  // Gemini Integration (production ready)
  private async callGemini(systemPrompt: string, conversationHistory: string[]): Promise<{ content: string; emotion: string }> {
    try {
      console.log('🤖 Calling Gemini AI for response generation...');
      
      // Check if Gemini is properly configured
      if (!isGeminiConfigured()) {
        console.error('❌ Gemini API key not configured properly');
        throw new Error('Gemini API key not configured');
      }
      
      console.log('✅ Gemini API key validated');
      
      // Build the conversation context for Gemini
      const conversationContext = conversationHistory.slice(-8).join('\n');
      const userInput = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : '';
      
      // Create a more focused prompt for better responses
      const fullPrompt = `${systemPrompt}

Current conversation context:
${conversationContext}

Latest user message: ${userInput}

As Sage, provide a compassionate, therapeutic response that:
- Acknowledges the user's feelings and experiences
- Uses empathetic language and validation
- Offers gentle support or coping strategies when appropriate
- Asks a thoughtful follow-up question to continue the conversation
- Keeps the response under 250 words
- Sounds natural and conversational

Response:`;
      
      console.log('Gemini prompt prepared, making API call...');
      console.log('Prompt preview:', fullPrompt.substring(0, 200) + '...');
      
      // Call Gemini API with retry logic
      const result = await this.callGeminiWithRetry(fullPrompt);
      
      if (!result) {
        throw new Error('No result from Gemini API');
      }
      
      if (!result.response) {
        throw new Error('Invalid response structure from Gemini - no response object');
      }
      
      console.log('📦 Gemini result received, extracting text...');
      const response = await result.response;
      let content;
      
      try {
        content = response.text();
      } catch (textError: any) {
        console.error('❌ Error extracting text from Gemini response:', textError);
        throw new Error(`Failed to extract text from response: ${textError.message}`);
      }
      
      if (!content || content.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }
      
      // Clean up the response
      content = content.trim();
      if (content.toLowerCase().startsWith('response:')) {
        content = content.substring(9).trim();
      }
      
      // Determine emotion based on content analysis
      const emotion = this.analyzeEmotionFromContent(content);
      
      console.log('✅ Gemini response generated successfully:', {
        length: content.length,
        emotion: emotion,
        preview: content.substring(0, 100) + '...'
      });
      
      return { content, emotion };
    } catch (apiError: any) {
      console.error('❌ Gemini API error:', {
        message: apiError.message,
        name: apiError.name,
        status: apiError.status || 'unknown',
        details: apiError.details || 'no details available'
      });
      
      // Don't fallback immediately - let the parent handle it
      throw new Error(`Gemini API failed: ${apiError.message}`);
    }
  }
  
  // Helper method to call Gemini with retry logic
  private async callGeminiWithRetry(prompt: string, retries: number = 2): Promise<any> {
    for (let i = 0; i <= retries; i++) {
      try {
        console.log(`Attempt ${i + 1} to call Gemini...`);
        const result = await geminiModel.generateContent(prompt);
        return result;
      } catch (error: any) {
        console.warn(`Gemini attempt ${i + 1} failed:`, error.message);
        if (i === retries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  // Analyze emotion from AI-generated content
  private analyzeEmotionFromContent(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('celebrate') || lowerContent.includes('wonderful') || lowerContent.includes('congratulations')) {
      return 'celebratory';
    } else if (lowerContent.includes('calm') || lowerContent.includes('breathe') || lowerContent.includes('peaceful')) {
      return 'calming';
    } else if (lowerContent.includes('understand') || lowerContent.includes('hear you') || lowerContent.includes('support')) {
      return 'supportive';
    } else if (lowerContent.includes('warmth') || lowerContent.includes('care') || lowerContent.includes('love')) {
      return 'warm';
    } else {
      return 'supportive'; // Default
    }
  }

  // Local AI fallback (for offline or API issues)
  private async callLocalAI(systemPrompt: string, conversationHistory: string[]): Promise<{ content: string; emotion: string }> {
    // This could integrate with local models like Ollama, Hugging Face Transformers, etc.
    // For now, we'll use an enhanced pattern-matching system
    
    const lastUserMessage = this.currentSession?.messages
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content || '';
    
    return this.generatePatternBasedResponse(lastUserMessage, conversationHistory);
  }

  // Smart response generation with variety
  private getSmartResponses(userMessage: string, conversationHistory: string[]): Array<{ content: string; emotion: string }> {
    const lowerMessage = userMessage.toLowerCase();
    const recentMood = this.currentSession?.context.recentMood;
    const hasSpokenBefore = conversationHistory.length > 2;
    
    // Anxiety responses with variety
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
      return [
        {
          content: hasSpokenBefore 
            ? "I notice anxiety is coming up for you again. That's completely understandable - anxiety has a way of visiting us when we least expect it. What feels different about this anxious feeling compared to what we talked about before?"
            : "I can hear the anxiety in what you're sharing. Thank you for trusting me with this feeling. Anxiety can feel so overwhelming, but you're already taking a brave step by talking about it. What does this anxiety feel like in your body right now?",
          emotion: 'calming'
        },
        {
          content: "Anxiety can feel like such a heavy visitor, can't it? I want you to know that what you're feeling is valid and you're not alone in this. Let's take this moment by moment. Can you tell me what's happening in your world that might be contributing to these anxious feelings?",
          emotion: 'supportive'
        },
        {
          content: "I hear you, and I want you to know that sharing your anxiety with me takes real courage. Sometimes anxiety tries to convince us we're in danger when we're actually safe. Right now, in this moment, you're here with me and you're okay. What would feel most supportive for you right now?",
          emotion: 'warm'
        }
      ];
    }
    
    // Depression/sadness responses
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down') || lowerMessage.includes('hopeless')) {
      return [
        {
          content: hasSpokenBefore
            ? "I can feel the weight in your words, and I'm honored that you continue to share these difficult feelings with me. Depression can make everything feel so much harder. How has your energy been since we last talked?"
            : "I can sense the heaviness you're carrying right now. Depression can make even the smallest things feel impossible, and I want you to know that what you're experiencing is real and valid. You've shown incredible strength just by reaching out. What's one small thing that felt manageable for you today?",
          emotion: 'supportive'
        },
        {
          content: "Thank you for letting me into this difficult space with you. When we're feeling this low, it can be hard to remember that these feelings, as intense as they are, will shift. You don't have to carry this alone. Is there anything specific that's been weighing on your heart lately?",
          emotion: 'warm'
        }
      ];
    }
    
    // Stress responses
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('busy') || lowerMessage.includes('pressure')) {
      return [
        {
          content: hasSpokenBefore
            ? "It sounds like stress is really piling up for you. I remember you mentioning feeling overwhelmed before - has anything shifted since then, or are you feeling similar pressures?"
            : "I can hear how much you're juggling right now. Stress has this way of making everything feel urgent and overwhelming. You're managing more than you should have to. What's taking up the most mental space for you today?",
          emotion: 'supportive'
        },
        {
          content: "The weight of stress can be so exhausting, can't it? It's like carrying invisible bags that get heavier throughout the day. I want you to know that it's okay to feel overwhelmed - it shows how much you care about things. What's one thing you could set down, even just for today?",
          emotion: 'calming'
        }
      ];
    }
    
    // Hello/greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.startsWith('good morning') || lowerMessage.startsWith('good afternoon') || lowerMessage.startsWith('good evening')) {
      return [
        {
          content: hasSpokenBefore 
            ? "Hello again! It's wonderful to see you back. I've been thinking about our previous conversations. How are you feeling today?"
            : "Hello! It's so nice to meet you. I'm Sage, and I'm here to listen and support you in whatever way feels helpful. What's on your mind today?",
          emotion: 'warm'
        },
        {
          content: "Hi there! I'm really glad you reached out today. There's something powerful about taking that first step to connect. What would you like to talk about?",
          emotion: 'supportive'
        }
      ];
    }
    
    // How are you responses
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how do you feel')) {
      return [
        {
          content: "Thank you for asking! I'm here and ready to focus entirely on you and whatever you're experiencing. I find meaning in being able to support people through their journeys. But I'm much more curious about how you're doing. What's been on your mind lately?",
          emotion: 'warm'
        }
      ];
    }
    
    // Work/job stress responses
    if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('boss') || lowerMessage.includes('colleague') || lowerMessage.includes('meeting')) {
      return [
        {
          content: "Work can be such a significant part of our lives, and when it's stressful, it really impacts everything else. I can hear that something about your work situation is weighing on you. What's been the most challenging part lately?",
          emotion: 'supportive'
        },
        {
          content: "Workplace stress can feel so consuming sometimes. It sounds like you're dealing with some difficult dynamics there. What would feel most helpful to talk through - is it the workload, relationships, or something else?",
          emotion: 'calming'
        }
      ];
    }
    
    // Relationship responses
    if (lowerMessage.includes('relationship') || lowerMessage.includes('partner') || lowerMessage.includes('boyfriend') || lowerMessage.includes('girlfriend') || lowerMessage.includes('husband') || lowerMessage.includes('wife') || lowerMessage.includes('friend') || lowerMessage.includes('family')) {
      return [
        {
          content: "Relationships can bring us such joy and such pain, sometimes even at the same time. I can sense this relationship is important to you and something about it is on your heart. What's been happening that you'd like to share?",
          emotion: 'supportive'
        },
        {
          content: "Human connections are so complex and meaningful. It sounds like you're navigating something challenging with someone who matters to you. I'm here to listen without judgment. What's been weighing on you?",
          emotion: 'warm'
        }
      ];
    }
    
    // Sleep/tired responses
    if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('can\'t sleep')) {
      return [
        {
          content: "Exhaustion can make everything feel so much harder, can't it? When we're not getting the rest we need, it impacts our mood, our thinking, our ability to cope with stress. What's been affecting your sleep or energy lately?",
          emotion: 'calming'
        },
        {
          content: "Being tired all the time is such a heavy burden to carry. It can make even simple things feel overwhelming. I want you to know that what you're experiencing is valid. What do you think might be contributing to your exhaustion?",
          emotion: 'supportive'
        }
      ];
    }
    
    // Thank you responses
    if (lowerMessage.includes('thank you') || lowerMessage.includes('thanks')) {
      return [
        {
          content: "You're so welcome. It means a lot to me that our conversation has been helpful. That's exactly why I'm here - to support you through whatever you're experiencing. What else would be helpful to talk about?",
          emotion: 'warm'
        }
      ];
    }
    
    // Positive responses
    if (lowerMessage.includes('good') || lowerMessage.includes('better') || lowerMessage.includes('happy') || lowerMessage.includes('great')) {
      return [
        {
          content: hasSpokenBefore
            ? "I'm so glad to hear there's some lightness in your voice today! It's beautiful to witness these brighter moments, especially knowing some of the challenges you've been facing. What's contributing to this shift for you?"
            : "There's something lovely in your energy today, and I want to celebrate that with you! These good moments are so precious and important to notice. What's been bringing you joy or peace lately?",
          emotion: 'celebratory'
        },
        {
          content: "Your positive energy is contagious! I love hearing this brightness from you. Sometimes when we're feeling good, it can help to really soak it in and notice what's different. What do you think has helped create this good feeling?",
          emotion: 'warm'
        }
      ];
    }
    
    // Default varied responses
    return [
      {
        content: hasSpokenBefore
          ? "I've been thinking about our conversation, and I'm grateful you keep sharing with me. There's something different in what you're telling me today. Help me understand what's on your mind right now."
          : "Thank you for sharing that with me. I can sense there's a lot beneath the surface of what you're saying. Your feelings and experiences matter deeply. What feels most important for you to talk about right now?",
        emotion: 'supportive'
      },
      {
        content: hasSpokenBefore
          ? "I notice each time we talk, you bring such thoughtfulness to what you share. What you're telling me now - how does it connect to how you've been feeling lately?"
          : "I'm really listening to what you're saying, and I can hear the trust you're placing in me by sharing this. Your inner world seems rich and complex. What would feel most helpful to explore together?",
        emotion: 'warm'
      },
      {
        content: "There's wisdom in what you're sharing, even if it doesn't feel that way right now. I'm curious - as you reflect on what you just told me, what feels most true or important about it for you?",
        emotion: 'supportive'
      }
    ];
  }

  // Pattern-based response with conversation memory
  private generatePatternBasedResponse(userMessage: string, conversationHistory: string[]): { content: string; emotion: string } {
    const responses = this.getSmartResponses(userMessage, conversationHistory);
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Enhanced fallback for when AI systems fail
  private generateEnhancedFallback(): { content: string; emotion: string } {
    const fallbacks = [
      {
        content: "I want to give you the thoughtful response you deserve, but I'm having some technical difficulties right now. What I can tell you is that I'm here, I'm listening, and what you're sharing matters to me. Can you tell me more about what's on your heart?",
        emotion: 'supportive'
      },
      {
        content: "I'm experiencing some challenges with my processing right now, but I don't want that to stop our conversation. Your feelings and thoughts are important, and I want to make sure you feel heard. What's the most important thing you'd like me to know about how you're doing?",
        emotion: 'warm'
      },
      {
        content: "Even though I'm having some technical hiccups, I want you to know that reaching out and sharing with me shows real courage. I may not have the perfect response right now, but I'm genuinely interested in understanding your experience. What feels most pressing for you today?",
        emotion: 'supportive'
      }
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Keep the old method as ultimate fallback
  private generateContextualFallback(): { content: string; emotion: string } {
    console.log('🔄 Using contextual fallback with smart responses...');
    
    // Try to use pattern-based responses even in fallback
    const lastUserMessage = this.currentSession?.messages
      .filter(m => m.role === 'user')
      .slice(-1)[0]?.content || '';
      
    const conversationHistory = this.currentSession?.messages
      .filter(m => m.role !== 'system')
      .slice(-6)
      .map(m => `${m.role}: ${m.content}`) || [];
    
    if (lastUserMessage) {
      console.log('💡 Attempting pattern-based response for fallback...');
      try {
        return this.generatePatternBasedResponse(lastUserMessage, conversationHistory);
      } catch (error) {
        console.warn('⚠️ Pattern-based fallback failed, using enhanced fallback');
      }
    }
    
    // If pattern-based fails, use enhanced fallback
    return this.generateEnhancedFallback();
  }

  private async generateAudio(text: string): Promise<string> {
    try {
      const voice = elevenLabsService.getTherapeuticVoice();
      const audioBlob = await elevenLabsService.textToSpeech({
        text,
        voice_id: voice.voice_id,
        voice_settings: {
          stability: 0.8,
          similarity_boost: 0.75,
          style: 0.3, // More conversational
          use_speaker_boost: true,
        },
      });

      // Create object URL for the audio blob
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Error generating audio:', error);
      return '';
    }
  }

  async processVoiceInput(audioBlob: Blob): Promise<string> {
    try {
      // For now, we'll use the browser's speech recognition
      // In production, you'd use a proper speech-to-text service
      return new Promise((resolve, reject) => {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          resolve(transcript);
        };

        recognition.onerror = (event: any) => {
          reject(new Error('Speech recognition failed: ' + event.error));
        };

        recognition.start();
      });
    } catch (error) {
      console.error('Error processing voice input:', error);
      throw new Error('Failed to process voice input');
    }
  }

  getCurrentSession(): ConversationSession | null {
    return this.currentSession;
  }

  endSession(): void {
    this.currentSession = null;
  }

  updateContext(newContext: any): void {
    if (this.currentSession) {
      this.currentSession.context = { ...this.currentSession.context, ...newContext };
    }
  }

  // Initialize Enhanced Tavus AI Avatar (new improved version)
  async initializeEnhancedTavusAvatar(userContext?: any): Promise<string | null> {
    console.log('🎥 Initializing Enhanced Tavus AI Avatar...');
    
    try {
      // Test connection first
      const connectionTest = await enhancedTavusService.testConnectionAndValidateSetup();
      if (!connectionTest.success) {
        console.error('❌ Enhanced Tavus connection test failed:', connectionTest.error);
        return null;
      }
      
      console.log('✅ Enhanced Tavus connection validated');
      
      // Create personalized conversation
      const session = await enhancedTavusService.createWellbeingConversation({
        recentMood: userContext?.recentMood,
        completedCourses: userContext?.completedCourses,
        currentConcerns: userContext?.currentConcerns || [],
        userName: userContext?.userName
      });
      
      if (session.status === 'active') {
        console.log('✅ Enhanced Tavus session created:', session.id);
        
        // Store session reference for cleanup
        if (this.currentSession) {
          this.currentSession.tavusConversationId = session.conversationId;
        }
        
        return session.conversationUrl;
      } else {
        console.error('❌ Enhanced session creation failed:', session.errorMessage);
        return null;
      }
      
    } catch (error: any) {
      console.error('❌ Enhanced Tavus initialization failed:', error);
      return null;
    }
  }
  
  // Create simple test conversation with enhanced service
  async createEnhancedTestTavusConversation(): Promise<string | null> {
    try {
      console.log('🧪 Creating enhanced test conversation...');
      return await enhancedTavusService.createSimpleTestConversation();
    } catch (error: any) {
      console.error('❌ Enhanced test conversation failed:', error);
      return null;
    }
  }
  
  // Initialize Tavus AI Avatar with multiple fallback strategies (original method)
  async initializeTavusAvatar(userContext?: any): Promise<string | null> {
    console.log('🎥 Initializing Tavus AI Avatar with fallback strategies...');
    
    // Try enhanced service first
    try {
      console.log('🚀 Trying enhanced Tavus service first...');
      const enhancedResult = await this.initializeEnhancedTavusAvatar(userContext);
      if (enhancedResult) {
        console.log('✅ Enhanced Tavus service succeeded');
        return enhancedResult;
      }
    } catch (enhancedError: any) {
      console.warn('⚠️ Enhanced service failed, falling back to legacy:', enhancedError.message);
    }
    
    // Fall back to original service
    try {
      console.log('🔄 Falling back to legacy Tavus service...');
      // Import Tavus service dynamically to avoid circular dependencies
      const { tavusService } = await import('./tavusService');
      
      // Validate configuration thoroughly
      const validation = await tavusService.validateConfiguration();
      if (!validation.valid) {
        console.error('❌ Tavus configuration invalid:', validation.errors);
        validation.errors.forEach(error => console.error('  -', error));
        return null;
      }
      
      console.log('✅ Tavus configuration validated successfully');
      
      // Strategy 1: Try the full wellbeing conversation
      try {
        console.log('🚀 Strategy 1: Creating wellbeing conversation...');
        const conversation = await tavusService.createWellbeingConversation(userContext);
        
        console.log('✅ Wellbeing conversation created successfully:', {
          conversation_id: conversation.conversation_id,
          conversation_url: conversation.conversation_url,
          status: conversation.status
        });
        
        // Store conversation ID for later reference
        if (this.currentSession) {
          this.currentSession.tavusConversationId = conversation.conversation_id;
        }
        
        return conversation.conversation_url;
      } catch (wellbeingError) {
        console.warn('⚠️ Strategy 1 failed:', wellbeingError.message);
      }
      
      // Strategy 2: Try simple conversation
      try {
        console.log('🚀 Strategy 2: Creating simple conversation...');
        const simpleConversation = await tavusService.createSimpleConversation(userContext);
        
        console.log('✅ Simple conversation created successfully:', {
          conversation_id: simpleConversation.conversation_id,
          conversation_url: simpleConversation.conversation_url,
          status: simpleConversation.status
        });
        
        // Store conversation ID for later reference
        if (this.currentSession) {
          this.currentSession.tavusConversationId = simpleConversation.conversation_id;
        }
        
        return simpleConversation.conversation_url;
      } catch (simpleError) {
        console.warn('⚠️ Strategy 2 failed:', simpleError.message);
      }
      
      // Strategy 3: Wait and retry with delay
      try {
        console.log('🚀 Strategy 3: Delayed retry...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const retryConversation = await tavusService.createSimpleConversation(userContext);
        
        console.log('✅ Delayed retry successful:', {
          conversation_id: retryConversation.conversation_id,
          conversation_url: retryConversation.conversation_url,
          status: retryConversation.status
        });
        
        if (this.currentSession) {
          this.currentSession.tavusConversationId = retryConversation.conversation_id;
        }
        
        return retryConversation.conversation_url;
      } catch (retryError) {
        console.error('❌ All strategies failed:', retryError.message);
      }
      
      return null;
      
    } catch (error: any) {
      console.error('❌ Fatal error initializing Tavus avatar:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      return null;
    }
  }
  
  // Test Tavus configuration and connection
  async testTavusConnection(): Promise<{isWorking: boolean, error?: string, details?: any}> {
    try {
      const { tavusService } = await import('./tavusService');
      
      console.log('🗺️ Testing Tavus connection...');
      const isConfigured = tavusService.isConfigured();
      console.log('🔑 Tavus configured:', isConfigured);
      
      if (!isConfigured) {
        return { isWorking: false, error: 'Tavus API key not configured' };
      }
      
      // Run comprehensive API test
      console.log('🧪 Running comprehensive Tavus API test...');
      const basicTest = await tavusService.testBasicApiAccess();
      console.log('📊 Basic API test result:', basicTest);
      
      if (!basicTest.success) {
        return { 
          isWorking: false, 
          error: `API access failed: ${basicTest.error}`,
          details: basicTest.details
        };
      }
      
      // Check if replica exists
      const replicaExists = basicTest.details?.targetReplicaExists;
      if (!replicaExists) {
        console.log('⚠️ Target replica not found. Available replicas:');
        basicTest.details?.availableReplicas?.forEach((replica: any) => {
          console.log(`  - ${replica.id} (${replica.name})`);
        });
        
        return {
          isWorking: false,
          error: 'Target replica not found in account',
          details: {
            ...basicTest.details,
            issue: 'replica_not_found'
          }
        };
      }
      
      console.log('✅ All Tavus tests passed!');
      return { 
        isWorking: true, 
        details: basicTest.details
      };
    } catch (error: any) {
      console.error('❌ Tavus connection test failed:', error);
      return { isWorking: false, error: error.message };
    }
  }

  // Create minimal test conversation
  async createTestTavusConversation(): Promise<string | null> {
    // Try enhanced service first
    try {
      console.log('🚀 Trying enhanced test conversation first...');
      const enhancedResult = await this.createEnhancedTestTavusConversation();
      if (enhancedResult) {
        console.log('✅ Enhanced test conversation succeeded');
        return enhancedResult;
      }
    } catch (enhancedError: any) {
      console.warn('⚠️ Enhanced test failed, falling back to legacy:', enhancedError.message);
    }
    
    // Fall back to original service
    try {
      console.log('🧪 Creating legacy test Tavus conversation...');
      const { tavusService } = await import('./tavusService');
      
      // Try replica-only first (most likely to work)
      try {
        console.log('🔄 Trying replica-only conversation first...');
        const replicaOnlyConversation = await tavusService.createReplicaOnlyConversation();
        console.log('✅ Replica-only conversation created:', replicaOnlyConversation);
        return replicaOnlyConversation.conversation_url;
      } catch (replicaError) {
        console.warn('⚠️ Replica-only failed, trying with persona...', replicaError.message);
      }
      
      // Fallback to minimal conversation
      const conversation = await tavusService.createMinimalConversation();
      console.log('✅ Test conversation created:', conversation);
      
      return conversation.conversation_url;
    } catch (error: any) {
      console.error('❌ Test conversation failed:', error.message);
      return null;
    }
  }

  // Debug helper function to test Tavus from browser console
  async debugTavus(): Promise<void> {
    console.log('🔍 TAVUS DEBUG MODE STARTED 🔍');
    console.log('==========================================');
    
    try {
      const { tavusService } = await import('./tavusService');
      
      // Test 1: Configuration
      console.log('🔑 Step 1: Testing Configuration...');
      console.log('API Key configured:', tavusService.isConfigured());
      
      // Test 2: Basic API Access
      console.log('\n🌐 Step 2: Testing Basic API Access...');
      const basicTest = await tavusService.testBasicApiAccess();
      console.log('Basic API test result:', basicTest);
      
      if (basicTest.success) {
        console.log('✅ API Access: SUCCESS');
        console.log('Available replicas:', basicTest.details.availableReplicas);
        console.log('Target replica exists:', basicTest.details.targetReplicaExists);
      } else {
        console.log('❌ API Access: FAILED');
        console.log('Error:', basicTest.error);
        return;
      }
      
      // Test 3: Create Minimal Conversation
      console.log('\n🗨️ Step 3: Testing Conversation Creation...');
      const conversationUrl = await this.createTestTavusConversation();
      
      if (conversationUrl) {
        console.log('✅ Conversation Creation: SUCCESS');
        console.log('Video URL:', conversationUrl);
      } else {
        console.log('❌ Conversation Creation: FAILED');
      }
      
    } catch (error: any) {
      console.error('❌ DEBUG CRASHED:', error);
    }
    
    console.log('==========================================');
    console.log('🔍 TAVUS DEBUG MODE COMPLETED 🔍');
  }

  // End Tavus conversation when session ends
  async endTavusConversation(): Promise<void> {
    if (this.currentSession?.tavusConversationId) {
      try {
        const { tavusService } = await import('./tavusService');
        await tavusService.endConversation(this.currentSession.tavusConversationId);
        console.log('Tavus conversation ended');
      } catch (error) {
        console.error('Error ending Tavus conversation:', error);
      }
    }
  }
}

export const aiCompanionService = new AICompanionService();

// Make debug function available in browser console for development
if (typeof window !== 'undefined') {
  (window as any).debugTavus = () => aiCompanionService.debugTavus();
  console.log('🔧 Debug helper loaded! Type "debugTavus()" in console to run Tavus diagnostics');
}
