// Tavus API Debugger - Systematic debugging utility
// This helps identify the exact cause of 400 Bad Request errors

const TAVUS_API_KEY = 'ef76f07cb19f49a1b31f7d93fd91147b';
const TAVUS_BASE_URL = 'https://tavusapi.com';
const TAVUS_REPLICA_ID = 'r6ca16dbe104';
const TAVUS_PERSONA_ID = 'p001ef02050e';

interface DebugResult {
  success: boolean;
  step: string;
  error?: string;
  data?: any;
  requestDetails?: {
    url: string;
    method: string;
    headers: any;
    body?: string;
  };
  responseDetails?: {
    status: number;
    statusText: string;
    headers: any;
    body: string;
  };
}

export class TavusDebugger {
  private results: DebugResult[] = [];

  private log(message: string, data?: any) {
    console.log(`🔍 ${message}`, data || '');
  }

  private async makeDebugRequest(
    url: string, 
    method: string = 'GET', 
    body?: any,
    customHeaders?: any
  ): Promise<DebugResult> {
    const headers = {
      'x-api-key': TAVUS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'BlindSpot-Debug/1.0',
      ...customHeaders
    };

    const requestDetails = {
      url,
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };

    this.log(`Making ${method} request to ${url}`);
    if (body) {
      this.log('Request body:', JSON.stringify(body, null, 2));
    }
    this.log('Request headers:', headers);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }

      const responseDetails = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      };

      this.log(`Response: ${response.status} ${response.statusText}`);
      this.log('Response body:', responseText);

      if (!response.ok) {
        return {
          success: false,
          step: `${method} ${url}`,
          error: `HTTP ${response.status}: ${responseText}`,
          requestDetails,
          responseDetails,
          data: responseData
        };
      }

      return {
        success: true,
        step: `${method} ${url}`,
        requestDetails,
        responseDetails,
        data: responseData
      };

    } catch (error: any) {
      this.log('Network error:', error);
      return {
        success: false,
        step: `${method} ${url}`,
        error: `Network error: ${error.message}`,
        requestDetails
      };
    }
  }

  async runFullDiagnostic(): Promise<DebugResult[]> {
    this.results = [];
    this.log('🚀 Starting Tavus API Full Diagnostic');
    this.log('==========================================');

    // Step 1: Test API connectivity and authentication
    this.log('📡 Step 1: Testing API connectivity and authentication...');
    const connectivityTest = await this.makeDebugRequest(`${TAVUS_BASE_URL}/v2/replicas`);
    this.results.push(connectivityTest);

    if (!connectivityTest.success) {
      this.log('❌ Basic connectivity failed. Stopping diagnostic.');
      return this.results;
    }

    // Step 2: Validate replica exists
    this.log('🤖 Step 2: Validating replica existence...');
    const replicas = connectivityTest.data?.data || connectivityTest.data || [];
    const replicaExists = replicas.some((r: any) => r.replica_id === TAVUS_REPLICA_ID);
    
    this.log(`Found ${replicas.length} replicas`);
    this.log('Available replicas:', replicas.map((r: any) => ({ 
      id: r.replica_id, 
      name: r.replica_name,
      status: r.status 
    })));
    this.log(`Target replica ${TAVUS_REPLICA_ID} exists:`, replicaExists);

    if (!replicaExists) {
      this.results.push({
        success: false,
        step: 'Replica Validation',
        error: `Replica ${TAVUS_REPLICA_ID} not found in account`,
        data: { availableReplicas: replicas }
      });
    }

    // Step 3: Test minimal conversation creation (replica only)
    this.log('💬 Step 3: Testing minimal conversation creation (replica only)...');
    const minimalPayload = {
      replica_id: TAVUS_REPLICA_ID,
      conversation_name: `Debug-Minimal-${Date.now()}`
    };

    const minimalTest = await this.makeDebugRequest(
      `${TAVUS_BASE_URL}/v2/conversations`,
      'POST',
      minimalPayload
    );
    this.results.push(minimalTest);

    // Step 4: Test with persona (if minimal worked)
    if (minimalTest.success) {
      this.log('✅ Minimal conversation worked. Testing with persona...');
      
      const personaPayload = {
        replica_id: TAVUS_REPLICA_ID,
        persona_id: TAVUS_PERSONA_ID,
        conversation_name: `Debug-Persona-${Date.now()}`
      };

      const personaTest = await this.makeDebugRequest(
        `${TAVUS_BASE_URL}/v2/conversations`,
        'POST',
        personaPayload
      );
      this.results.push(personaTest);
    } else {
      this.log('❌ Minimal conversation failed. Let\'s analyze the error...');
      await this.analyzeConversationError(minimalTest);
    }

    // Step 5: Test with different payload combinations
    if (!minimalTest.success) {
      this.log('🔬 Step 5: Testing different payload combinations...');
      await this.testPayloadVariations();
    }

    this.log('==========================================');
    this.log('🏁 Diagnostic Complete');
    this.printSummary();

    return this.results;
  }

  private async analyzeConversationError(result: DebugResult) {
    this.log('🔬 Analyzing conversation creation error...');
    
    if (result.responseDetails?.status === 400) {
      this.log('📋 400 Bad Request Analysis:');
      
      try {
        const errorData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
        this.log('Parsed error data:', errorData);

        // Check for common error patterns
        if (errorData.message) {
          this.log('Error message:', errorData.message);
        }
        if (errorData.error) {
          this.log('Error type:', errorData.error);
        }
        if (errorData.details) {
          this.log('Error details:', errorData.details);
        }
        if (errorData.validation_errors) {
          this.log('Validation errors:', errorData.validation_errors);
        }

      } catch (parseError) {
        this.log('Could not parse error response:', result.data);
      }
    }
  }

  private async testPayloadVariations() {
    this.log('🧪 Testing different payload combinations...');

    // Test 1: Absolute minimal payload
    const absoluteMinimal = {
      replica_id: TAVUS_REPLICA_ID
    };

    this.log('Testing absolute minimal payload...');
    const test1 = await this.makeDebugRequest(
      `${TAVUS_BASE_URL}/v2/conversations`,
      'POST',
      absoluteMinimal
    );
    this.results.push({ ...test1, step: 'Absolute Minimal Payload' });

    // Test 2: With conversation name only
    const withName = {
      replica_id: TAVUS_REPLICA_ID,
      conversation_name: `Test-${Date.now()}`
    };

    this.log('Testing with conversation name...');
    const test2 = await this.makeDebugRequest(
      `${TAVUS_BASE_URL}/v2/conversations`,
      'POST',
      withName
    );
    this.results.push({ ...test2, step: 'With Conversation Name' });

    // Test 3: Check if replica status matters
    this.log('🤖 Checking replica status and details...');
    const replicaDetailsTest = await this.makeDebugRequest(`${TAVUS_BASE_URL}/v2/replicas/${TAVUS_REPLICA_ID}`);
    this.results.push({ ...replicaDetailsTest, step: 'Replica Details Check' });
  }

  private printSummary() {
    this.log('📊 DIAGNOSTIC SUMMARY');
    this.log('=====================');

    let successCount = 0;
    let failureCount = 0;

    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const step = result.step || `Step ${index + 1}`;
      
      this.log(`${status} ${step}`);
      
      if (!result.success && result.error) {
        this.log(`    Error: ${result.error}`);
      }

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    });

    this.log(`\n📈 Results: ${successCount} passed, ${failureCount} failed`);

    // Provide recommendations based on results
    this.log('\n💡 RECOMMENDATIONS:');
    
    if (this.results.some(r => r.step.includes('connectivity') && !r.success)) {
      this.log('- API key or network connectivity issue');
    }
    
    if (this.results.some(r => r.step.includes('Replica') && !r.success)) {
      this.log('- Replica ID configuration issue');
    }
    
    const conversationErrors = this.results.filter(r => 
      r.step.includes('conversation') && !r.success
    );
    
    if (conversationErrors.length > 0) {
      this.log('- Conversation creation payload or permissions issue');
      conversationErrors.forEach(err => {
        if (err.responseDetails?.status === 400) {
          this.log(`  • 400 error suggests invalid request payload`);
        } else if (err.responseDetails?.status === 402) {
          this.log(`  • 402 error suggests billing/subscription issue`);
        } else if (err.responseDetails?.status === 403) {
          this.log(`  • 403 error suggests permissions issue`);
        }
      });
    }
  }

  // Quick test method for immediate debugging
  async quickTest(): Promise<void> {
    this.log('⚡ Running Quick Test...');
    
    const testPayload = {
      replica_id: TAVUS_REPLICA_ID,
      conversation_name: `QuickTest-${Date.now()}`
    };

    this.log('Test payload:', testPayload);
    
    const result = await this.makeDebugRequest(
      `${TAVUS_BASE_URL}/v2/conversations`,
      'POST',
      testPayload
    );

    if (result.success) {
      this.log('✅ Quick test PASSED');
      this.log('Conversation URL:', result.data?.conversation_url);
    } else {
      this.log('❌ Quick test FAILED');
      this.log('Error details:', {
        status: result.responseDetails?.status,
        statusText: result.responseDetails?.statusText,
        body: result.responseDetails?.body
      });
    }
  }
}

// Create global instance for easy access
export const tavusDebugger = new TavusDebugger();

// Make it available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).tavusDebugger = tavusDebugger;
  (window as any).debugTavusQuick = () => tavusDebugger.quickTest();
  (window as any).debugTavusFull = () => tavusDebugger.runFullDiagnostic();
  
  console.log('🔧 Tavus Debugger loaded!');
  console.log('💡 Type "debugTavusQuick()" for a quick test');
  console.log('💡 Type "debugTavusFull()" for comprehensive debugging');
}