import axios from 'axios';

// Updated API key and credentials
const TAVUS_API_KEY = '571bcfabda964c6ba5f776f147e95d35';
const TAVUS_BASE_URL = 'https://tavusapi.com';
// CORS proxy for browser requests (fallback)
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

// Configured Tavus IDs for FeelWise Spot
const TAVUS_PERSONA_ID = 'p2c3a9b144e4';
const TAVUS_REPLICA_ID = 'rf4703150052'; // Charlie - confirmed working

interface TavusConversationRequest {
  persona_id?: string;
  replica_id?: string;
  conversation_name?: string;
  callback_url?: string;
}

interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

interface TavusReplicaCreationRequest {
  train_speech: boolean;
  callback_url?: string;
  replica_name?: string;
  script?: string;
}

export class TavusService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = TAVUS_API_KEY;
    this.baseUrl = TAVUS_BASE_URL;
  }

  private getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'FeelWise-Browser-Client/1.0',
      // Add CORS-friendly headers
    };
  }

  async createConversation(request: TavusConversationRequest): Promise<TavusConversationResponse> {
    try {
      console.log('🚀 Creating Tavus conversation with request:', JSON.stringify(request, null, 2));
      console.log('🔑 Using API key:', this.apiKey ? 'Present (' + this.apiKey.substring(0, 8) + '...)' : 'Missing');
      
      // Try native fetch first (better CORS handling than axios)
      const fetchResponse = await fetch(`${this.baseUrl}/v2/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
        mode: 'cors', // Explicitly enable CORS
        credentials: 'omit', // Don't send credentials
      });
      
      console.log('📦 Fetch response status:', fetchResponse.status);
      console.log('📦 Fetch response headers:', Object.fromEntries(fetchResponse.headers.entries()));
      
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error('🚨 Fetch error response:', errorText);
        throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`);
      }
      
      const responseData = await fetchResponse.json();
      console.log('✅ Tavus conversation created via fetch:', JSON.stringify(responseData, null, 2));
      return responseData;
    } catch (error: any) {
      console.error('❌ Error creating Tavus conversation:');
      console.error('  📝 Error message:', error.message);
      console.error('  🚨 HTTP status:', error.response?.status);
      console.error('  📋 Status text:', error.response?.statusText);
      console.error('  📊 Response headers:', error.response?.headers);
      console.error('  💥 Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('  📮 Original request:', JSON.stringify(request, null, 2));
      console.error('  🔍 Full error object:', error);
      
      // Extract more specific error information
      let errorMessage = error.message;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      }
      
      // Handle specific error codes with detailed debugging
      if (error.response?.status === 402) {
        throw new Error('PAYMENT_REQUIRED: Tavus account billing limit reached or subscription needed');
      } else if (error.response?.status === 400) {
        console.error('🚨 400 Bad Request Details:');
        console.error('Request URL:', error.config?.url);
        console.error('Request method:', error.config?.method);
        console.error('Request headers:', error.config?.headers);
        console.error('Request payload that failed:', JSON.stringify(error.config?.data, null, 2));
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
        console.error('Response error details:', JSON.stringify(error.response?.data, null, 2));
        console.error('Full error object:', error);
        throw new Error('INVALID_REQUEST: ' + (error.response?.data?.message || error.response?.data?.error || error.response?.data?.detail || errorMessage));
      } else if (error.response?.status === 401) {
        throw new Error('UNAUTHORIZED: Invalid API key');
      }
      
      throw new Error(`Failed to create AI avatar conversation: ${errorMessage}`);
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/v2/conversations/${conversationId}/end`,
        {},
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error ending Tavus conversation:', error);
      throw new Error('Failed to end conversation');
    }
  }

  async getReplicas(): Promise<any[]> {
    try {
      console.log('🔍 Fetching replicas from Tavus...');
      console.log('🌐 URL:', `${this.baseUrl}/v2/replicas`);
      console.log('🔑 Headers:', this.getHeaders());
      
      const response = await axios.get(
        `${this.baseUrl}/v2/replicas`,
        { headers: this.getHeaders() }
      );
      
      console.log('✅ Replicas response status:', response.status);
      console.log('📦 Replicas response data:', JSON.stringify(response.data, null, 2));
      
      const replicas = response.data.data || response.data || [];
      console.log('📊 Found', replicas.length, 'replicas');
      
      if (replicas.length > 0) {
        console.log('📋 Available replica IDs:');
        replicas.forEach((replica: any, index: number) => {
          console.log(`  ${index + 1}. ID: ${replica.replica_id}, Name: ${replica.replica_name || 'Unnamed'}`);
        });
      }
      
      return replicas;
    } catch (error: any) {
      console.error('❌ Error fetching replicas:');
      console.error('  📝 Error message:', error.message);
      console.error('  🚨 HTTP status:', error.response?.status);
      console.error('  📋 Status text:', error.response?.statusText);
      console.error('  💥 Response data:', JSON.stringify(error.response?.data, null, 2));
      return [];
    }
  }

  async createReplica(request: TavusReplicaCreationRequest): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/replicas`,
        request,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating replica:', error);
      throw new Error('Failed to create AI replica');
    }
  }

  // Create a wellbeing-focused conversation with user context
  async createWellbeingConversation(userContext?: {
    recentMood?: number;
    completedCourses?: string[];
    currentConcerns?: string[];
  }, retryCount: number = 0): Promise<TavusConversationResponse> {
    
    console.log('Creating wellbeing conversation with context:', userContext);
    console.log('Using Replica ID:', TAVUS_REPLICA_ID);
    console.log('Retry attempt:', retryCount + 1);
    
  // TEMPORARY FIX: Use exact format that worked in PowerShell
    const conversationRequest = {
      replica_id: TAVUS_REPLICA_ID,
      conversation_name: `Test-${Math.floor(Math.random() * 1000000)}`,
    };
    
    // Exactly match successful PowerShell: {replica_id, conversation_name}
    
    console.log('🔧 FORCING replica-only to match working PowerShell test');
    console.log('🗨️ PowerShell equivalent would be:');
    console.log(`  replica_id: "${TAVUS_REPLICA_ID}"`);
    console.log(`  conversation_name: "${conversationRequest.conversation_name}"`);
      console.log('🗜️ This should match the working PowerShell format exactly');
    
    console.log('✅ Updated conversation request (with new IDs):', conversationRequest);
    console.log('🌎 Current origin:', window.location.origin);
    console.log('🌎 Browser user agent:', navigator.userAgent);
    
    try {
      const conversation = await this.createConversation(conversationRequest);
      console.log('Successfully created Tavus conversation:', conversation);
      
      // Validate the conversation URL
      if (!conversation.conversation_url || !conversation.conversation_url.includes('daily.co')) {
        throw new Error('Invalid conversation URL received from Tavus');
      }
      
      return conversation;
    } catch (error: any) {
      console.error(`Failed to create wellbeing conversation (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for transient errors
      if (retryCount < 2 && (
        error.response?.status === 500 || 
        error.response?.status === 503 ||
        error.message.includes('timeout') ||
        error.message.includes('network')
      )) {
        console.log(`Retrying conversation creation in ${(retryCount + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return this.createWellbeingConversation(userContext, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Test if Tavus is properly configured and working
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Tavus connection...');
      console.log('API Key configured:', this.apiKey ? 'Yes' : 'No');
      console.log('Base URL:', this.baseUrl);
      
      const replicas = await this.getReplicas();
      console.log('Connection test successful. Found', replicas.length, 'replicas');
      return true;
    } catch (error: any) {
      console.error('Tavus connection test failed:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return false;
    }
  }

  // Get conversation status
  async getConversationStatus(conversationId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/conversations/${conversationId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting conversation status:', error);
      return null;
    }
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  // Create a simpler conversation without complex meeting room setup
  async createSimpleConversation(userContext?: any): Promise<TavusConversationResponse> {
    console.log('🔄 Attempting simple conversation creation...');
    
    // TEMPORARY FIX: Use only replica_id to match working PowerShell test
    const basicRequest = {
      replica_id: TAVUS_REPLICA_ID,
      conversation_name: `FeelWise-${Math.random().toString(36).substr(2, 9)}`,
    };
    
    console.log('🔧 FORCING simple replica-only to match working PowerShell test');
    
    console.log('✅ Updated simple request (with new IDs):', basicRequest);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/conversations`,
        basicRequest,
        { headers: this.getHeaders() }
      );
      
      console.log('✅ Simple conversation created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Simple conversation failed:', error);
      throw new Error(`Simple conversation creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Validate that persona and replica IDs exist
  async validateConfiguration(): Promise<{valid: boolean, errors: string[]}> {
    const errors: string[] = [];
    
    try {
      // Check API key
      if (!this.isConfigured()) {
        errors.push('Tavus API key is not configured');
        return { valid: false, errors };
      }
      
      // Test basic connection
      const replicas = await this.getReplicas();
      
      // Check if our replica ID exists
      const replicaExists = replicas.some(replica => replica.replica_id === TAVUS_REPLICA_ID);
      if (!replicaExists) {
        errors.push(`Replica ID '${TAVUS_REPLICA_ID}' not found in available replicas`);
        console.log('Available replicas:', replicas.map(r => ({ id: r.replica_id, name: r.replica_name })));
      }
      
      // For persona, we'll try to create a test conversation (but not execute it)
      console.log(`Using Persona ID: ${TAVUS_PERSONA_ID}`);
      
      return { valid: errors.length === 0, errors };
    } catch (error: any) {
      errors.push(`Connection test failed: ${error.message}`);
      return { valid: false, errors };
    }
  }

  // Test method to check basic API access
  async testBasicApiAccess(): Promise<{success: boolean, error?: string, details?: any}> {
    try {
      console.log('🧪 Testing basic Tavus API access...');
      console.log('🔑 API Key:', this.apiKey ? 'Present (' + this.apiKey.substring(0, 8) + '...)' : 'Missing');
      console.log('🌐 Base URL:', this.baseUrl);
      
      // Test 1: Basic API access with replicas endpoint
      const replicasResult = await this.getReplicas();
      console.log('✅ Basic API access successful, found', replicasResult.length, 'replicas');
      
      // Test 2: Check if our specific replica exists
      const replicaExists = replicasResult.some(r => r.replica_id === TAVUS_REPLICA_ID);
      console.log('🔍 Checking for replica ID', TAVUS_REPLICA_ID, ':', replicaExists ? 'Found' : 'Not found');
      
      if (!replicaExists && replicasResult.length > 0) {
        console.log('⚠️ Available replica IDs:');
        replicasResult.forEach(r => console.log('  -', r.replica_id, '(', r.replica_name || 'Unnamed', ')'));
      }
      
      return {
        success: true,
        details: {
          replicasFound: replicasResult.length,
          targetReplicaExists: replicaExists,
          availableReplicas: replicasResult.map(r => ({ id: r.replica_id, name: r.replica_name }))
        }
      };
    } catch (error: any) {
      console.error('❌ Basic API access failed:', error.message);
      return {
        success: false,
        error: error.message,
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data
        }
      };
    }
  }

  // Create minimal conversation for testing
  async createMinimalConversation(): Promise<TavusConversationResponse> {
    console.log('🧪 Creating minimal test conversation...');
    
    const minimalRequest = {
      replica_id: TAVUS_REPLICA_ID,
      conversation_name: `Test-${Math.random().toString(36).substr(2, 9)}`
    };
    
    console.log('📎 Minimal request (replica only):', JSON.stringify(minimalRequest, null, 2));
    
    return await this.createConversation(minimalRequest);
  }

  // Test with just replica_id (no persona) to isolate the issue
  async createReplicaOnlyConversation(): Promise<TavusConversationResponse> {
    console.log('🤖 Creating replica-only conversation to test new replica ID...');
    
    const replicaOnlyRequest = {
      replica_id: TAVUS_REPLICA_ID,
      conversation_name: `ReplicaTest-${Date.now()}`
    };
    
    console.log('🔄 Testing new replica ID:', TAVUS_REPLICA_ID);
    console.log('📎 Replica-only request:', JSON.stringify(replicaOnlyRequest, null, 2));
    
    return await this.createConversation(replicaOnlyRequest);
  }

  // Default replica for mental health companion
  getDefaultCompanionPersona() {
    return {
      name: "Sage",
      description: "A compassionate AI mental health companion",
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
        style: "supportive",
        use_speaker_boost: true
      }
    };
  }
}

export const tavusService = new TavusService();
