// Enhanced Tavus Service with better patterns from LiveKit example
// This provides a more robust iframe-based approach that can later be upgraded to full WebRTC

import { tavusCleanup } from '@/utils/tavusCleanup';

const TAVUS_API_KEY = '571bcfabda964c6ba5f776f147e95d35';
const TAVUS_BASE_URL = 'https://tavusapi.com';
const TAVUS_REPLICA_ID = 'rf4703150052'; // Charlie - confirmed working
const TAVUS_PERSONA_ID = 'p2c3a9b144e4';

interface TavusConversationRequest {
  replica_id: string;
  persona_id?: string;
  conversation_name: string;
  callback_url?: string;
  custom_greeting?: string;
  properties?: {
    max_call_duration?: number;
    participant_left_timeout?: number;
    participant_absent_timeout?: number;
  };
}

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
  created_at?: string;
  room_url?: string; // Daily.co room URL
}

interface ConversationSession {
  id: string;
  conversationId: string;
  conversationUrl: string;
  status: 'initializing' | 'active' | 'ended' | 'error';
  createdAt: Date;
  userContext?: any;
  errorMessage?: string;
}

export class EnhancedTavusService {
  private activeSession: ConversationSession | null = null;
  private connectionAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  constructor() {
    console.log('🚀 Enhanced Tavus Service initialized');
  }

  private getHeaders() {
    return {
      'x-api-key': TAVUS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'FeelWise-AI-Companion/1.0',
    };
  }

  async createWellbeingConversation(userContext?: {
    recentMood?: number;
    completedCourses?: string[];
    currentConcerns?: string[];
    userName?: string;
  }): Promise<ConversationSession> {
    
    console.log('🎭 Creating enhanced wellbeing conversation...');
    console.log('📊 User context:', userContext);

    // Generate personalized greeting based on user context
    const greeting = this.generatePersonalizedGreeting(userContext);

    const conversationRequest: TavusConversationRequest = {
      replica_id: TAVUS_REPLICA_ID,
      persona_id: TAVUS_PERSONA_ID,
      conversation_name: `FeelWise-Wellbeing-${Date.now()}`,
      custom_greeting: greeting,
      properties: {
        max_call_duration: 3600, // 1 hour
        participant_left_timeout: 60, // 1 minute
        participant_absent_timeout: 120, // 2 minutes
      }
    };

    try {
      const response = await this.createConversationWithRetry(conversationRequest);
      
      // Create session object
      const session: ConversationSession = {
        id: `session-${Date.now()}`,
        conversationId: response.conversation_id,
        conversationUrl: response.conversation_url,
        status: 'active',
        createdAt: new Date(),
        userContext
      };

      this.activeSession = session;
      console.log('✅ Enhanced conversation session created:', session.id);

      return session;
    } catch (error: any) {
      console.error('❌ Failed to create wellbeing conversation:', error);
      
      // Create error session
      const errorSession: ConversationSession = {
        id: `error-session-${Date.now()}`,
        conversationId: '',
        conversationUrl: '',
        status: 'error',
        createdAt: new Date(),
        userContext,
        errorMessage: error.message || 'Unknown error occurred'
      };

      this.activeSession = errorSession;
      throw error;
    }
  }

  private generatePersonalizedGreeting(userContext?: any): string {
    const baseGreeting = "Hello! I'm Sage, your AI wellbeing companion. I'm here to support you on your mental health journey.";
    
    if (!userContext) {
      return baseGreeting + " How are you feeling today?";
    }

    let personalizedPart = "";

    // Add mood-based greeting
    if (userContext.recentMood !== undefined) {
      if (userContext.recentMood >= 7) {
        personalizedPart += " I see you've been feeling quite positive lately - that's wonderful! ";
      } else if (userContext.recentMood <= 3) {
        personalizedPart += " I noticed you might be going through a challenging time. I'm here to listen and support you. ";
      } else {
        personalizedPart += " I see you've been tracking your mood - that's a great step in self-awareness. ";
      }
    }

    // Add course completion acknowledgment
    if (userContext.completedCourses && userContext.completedCourses.length > 0) {
      personalizedPart += `I'm impressed that you've completed ${userContext.completedCourses.length} wellbeing course${userContext.completedCourses.length > 1 ? 's' : ''}! `;
    }

    return baseGreeting + personalizedPart + "What would you like to talk about today?";
  }

  private async createConversationWithRetry(request: TavusConversationRequest): Promise<TavusConversationResponse> {
    this.connectionAttempts = 0;

    while (this.connectionAttempts < this.maxRetries) {
      try {
        this.connectionAttempts++;
        console.log(`🔄 Conversation attempt ${this.connectionAttempts}/${this.maxRetries}`);

        const response = await this.makeApiCall('/v2/conversations', 'POST', request);
        console.log('✅ Conversation created successfully on attempt', this.connectionAttempts);
        
        return response;
      } catch (error: any) {
        console.error(`❌ Attempt ${this.connectionAttempts} failed:`, error.message);

        // Check for concurrent conversation limit
        if (error.message.includes('maximum concurrent')) {
          console.log('🧹 Detected concurrent conversation limit. Attempting cleanup...');
          try {
            const cleanupSuccess = await tavusCleanup.smartCleanup();
            if (cleanupSuccess) {
              console.log('✅ Cleanup successful, retrying conversation creation...');
              // Continue to retry after cleanup
            } else {
              console.warn('⚠️ Cleanup did not resolve the concurrent limit issue');
            }
          } catch (cleanupError) {
            console.error('❌ Cleanup failed:', cleanupError);
          }
        }

        // Don't retry for certain error types
        if (this.isNonRetryableError(error)) {
          // Exception: retry concurrent limit errors after cleanup
          if (!error.message.includes('maximum concurrent')) {
            throw error;
          }
        }

        // If this was our last attempt, throw the error
        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(`Failed after ${this.maxRetries} attempts: ${error.message}`);
        }

        // Wait before retrying
        console.log(`⏳ Waiting ${this.retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Increase delay for next retry (exponential backoff)
        this.retryDelay *= 1.5;
      }
    }

    throw new Error('Maximum retry attempts exceeded');
  }

  private isNonRetryableError(error: any): boolean {
    // Don't retry for authentication errors, payment issues, or bad requests
    const status = error.response?.status;
    return status === 401 || status === 402 || status === 400 || status === 403;
  }

  private async makeApiCall(endpoint: string, method: string, data?: any): Promise<any> {
    const url = `${TAVUS_BASE_URL}${endpoint}`;
    
    console.log(`🌐 API Call: ${method} ${url}`);
    if (data) {
      console.log('📦 Request data:', JSON.stringify(data, null, 2));
    }

    const response = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 API Error response:', errorText);
      
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // Use the raw error text if it's not JSON
        errorMessage = errorText || errorMessage;
      }

      // Provide user-friendly error messages
      if (response.status === 402) {
        errorMessage = 'Account limits reached. Please upgrade your Tavus subscription.';
      } else if (response.status === 401) {
        errorMessage = 'Authentication failed. Please check API key configuration.';
      } else if (response.status === 404) {
        errorMessage = 'Replica not found. Please verify the replica ID configuration.';
      }

      const error = new Error(errorMessage);
      (error as any).response = { status: response.status, statusText: response.statusText };
      throw error;
    }

    const responseData = await response.json();
    console.log('✅ API Response:', JSON.stringify(responseData, null, 2));

    return responseData;
  }

  // Test connection and validate configuration
  async testConnectionAndValidateSetup(): Promise<{
    success: boolean;
    error?: string;
    details: {
      apiKeyValid: boolean;
      replicaExists: boolean;
      personaValid: boolean;
      canCreateConversation: boolean;
    };
  }> {
    const testResult = {
      success: false,
      details: {
        apiKeyValid: false,
        replicaExists: false,
        personaValid: false,
        canCreateConversation: false,
      }
    };

    try {
      // Test 1: Check API key by fetching replicas
      console.log('🧪 Test 1: Validating API key...');
      const replicas = await this.makeApiCall('/v2/replicas', 'GET');
      testResult.details.apiKeyValid = true;
      console.log('✅ API key is valid');

      // Test 2: Check if our replica exists
      console.log('🧪 Test 2: Checking replica existence...');
      const replicaExists = replicas.data?.some((r: any) => r.replica_id === TAVUS_REPLICA_ID);
      testResult.details.replicaExists = replicaExists;
      
      if (replicaExists) {
        console.log('✅ Replica exists');
      } else {
        console.warn('⚠️ Configured replica not found in available replicas');
        console.log('Available replicas:', replicas.data?.map((r: any) => ({ id: r.replica_id, name: r.replica_name })));
      }

      // Test 3: Try to create a minimal test conversation (but don't use it)
      console.log('🧪 Test 3: Testing conversation creation...');
      const testConversation = await this.makeApiCall('/v2/conversations', 'POST', {
        replica_id: TAVUS_REPLICA_ID,
        conversation_name: `Test-${Date.now()}`,
        properties: {
          max_call_duration: 60, // Just 1 minute for testing
        }
      });
      
      testResult.details.canCreateConversation = true;
      console.log('✅ Can create conversations');
      
      // Clean up test conversation
      if (testConversation.conversation_id) {
        try {
          await this.endConversation(testConversation.conversation_id);
          console.log('🧹 Test conversation cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up test conversation:', cleanupError);
        }
      }

      testResult.success = testResult.details.apiKeyValid && testResult.details.canCreateConversation;
      
      return testResult;
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      return {
        ...testResult,
        success: false,
        error: error.message || 'Unknown error during connection test'
      };
    }
  }

  async endConversation(conversationId?: string): Promise<void> {
    const idToEnd = conversationId || this.activeSession?.conversationId;
    
    if (!idToEnd) {
      console.log('📝 No conversation to end');
      return;
    }

    try {
      console.log('🔚 Ending conversation:', idToEnd);
      await this.makeApiCall(`/v2/conversations/${idToEnd}/end`, 'POST');
      
      if (this.activeSession && this.activeSession.conversationId === idToEnd) {
        this.activeSession.status = 'ended';
        console.log('✅ Active session ended');
      }
    } catch (error: any) {
      console.error('❌ Error ending conversation:', error);
      // Don't throw - ending conversation is best effort
    }
  }

  getCurrentSession(): ConversationSession | null {
    return this.activeSession;
  }

  async getConversationStatus(conversationId: string): Promise<any> {
    try {
      return await this.makeApiCall(`/v2/conversations/${conversationId}`, 'GET');
    } catch (error) {
      console.error('❌ Error getting conversation status:', error);
      return null;
    }
  }

  // Create a simple conversation for testing
  async createSimpleTestConversation(): Promise<string | null> {
    console.log('🧪 Creating simple test conversation...');
    
    try {
      const response = await this.makeApiCall('/v2/conversations', 'POST', {
        replica_id: TAVUS_REPLICA_ID,
        conversation_name: `SimpleTest-${Date.now()}`,
        properties: {
          max_call_duration: 1800, // 30 minutes
        }
      });

      console.log('✅ Simple test conversation created');
      return response.conversation_url;
    } catch (error: any) {
      console.error('❌ Simple test conversation failed:', error);
      return null;
    }
  }

  // Check if service is properly configured
  isConfigured(): boolean {
    return !!(TAVUS_API_KEY && TAVUS_REPLICA_ID);
  }

  // Get service status
  getStatus(): {
    configured: boolean;
    hasActiveSession: boolean;
    sessionStatus?: string;
    sessionId?: string;
  } {
    return {
      configured: this.isConfigured(),
      hasActiveSession: !!this.activeSession,
      sessionStatus: this.activeSession?.status,
      sessionId: this.activeSession?.id,
    };
  }

  // Reset service state
  reset(): void {
    if (this.activeSession) {
      this.endConversation();
    }
    this.activeSession = null;
    this.connectionAttempts = 0;
    this.retryDelay = 2000;
    console.log('🔄 Service reset');
  }
}

export const enhancedTavusService = new EnhancedTavusService();