import { tavusService } from '@/services/tavusService';

/**
 * Test utility to verify Tavus integration
 * Run this in the browser console to test your setup
 */
export class TavusIntegrationTester {
  private results: Array<{ test: string; status: 'pass' | 'fail' | 'skip'; message: string }> = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Tavus Integration Tests...\n');
    
    await this.testApiKeyConfiguration();
    await this.testApiConnection();
    await this.testReplicaAccess();
    await this.testConversationCreation();
    
    this.printResults();
  }

  private async testApiKeyConfiguration(): Promise<void> {
    console.log('1️⃣ Testing API Key Configuration...');
    
    try {
      const isConfigured = tavusService.isConfigured();
      
      if (isConfigured) {
        this.results.push({
          test: 'API Key Configuration',
          status: 'pass',
          message: 'Tavus API key is configured'
        });
        console.log('✅ API key is configured');
      } else {
        this.results.push({
          test: 'API Key Configuration',
          status: 'fail',
          message: 'Tavus API key is missing or empty'
        });
        console.log('❌ API key is missing or empty');
      }
    } catch (error) {
      this.results.push({
        test: 'API Key Configuration',
        status: 'fail',
        message: `Error: ${error}`
      });
      console.log('❌ Error checking API key:', error);
    }
  }

  private async testApiConnection(): Promise<void> {
    console.log('\n2️⃣ Testing API Connection...');
    
    try {
      const isConnected = await tavusService.testConnection();
      
      if (isConnected) {
        this.results.push({
          test: 'API Connection',
          status: 'pass',
          message: 'Successfully connected to Tavus API'
        });
        console.log('✅ Connected to Tavus API');
      } else {
        this.results.push({
          test: 'API Connection',
          status: 'fail',
          message: 'Cannot connect to Tavus API - check your API key'
        });
        console.log('❌ Cannot connect to Tavus API');
      }
    } catch (error) {
      this.results.push({
        test: 'API Connection',
        status: 'fail',
        message: `Connection error: ${error}`
      });
      console.log('❌ Connection error:', error);
    }
  }

  private async testReplicaAccess(): Promise<void> {
    console.log('\n3️⃣ Testing Replica Access...');
    
    try {
      const replicas = await tavusService.getReplicas();
      
      if (replicas && replicas.length > 0) {
        this.results.push({
          test: 'Replica Access',
          status: 'pass',
          message: `Found ${replicas.length} replica(s): ${replicas.map(r => r.replica_id || r.name).join(', ')}`
        });
        console.log(`✅ Found ${replicas.length} replica(s):`);
        replicas.forEach((replica, index) => {
          console.log(`   ${index + 1}. ${replica.name || 'Unnamed'} (${replica.replica_id})`);
        });
      } else {
        this.results.push({
          test: 'Replica Access',
          status: 'fail',
          message: 'No replicas found - you need to create and train a replica first'
        });
        console.log('❌ No replicas found - you need to create and train a replica first');
      }
    } catch (error) {
      this.results.push({
        test: 'Replica Access',
        status: 'fail',
        message: `Error fetching replicas: ${error}`
      });
      console.log('❌ Error fetching replicas:', error);
    }
  }

  private async testConversationCreation(): Promise<void> {
    console.log('\n4️⃣ Testing Conversation Creation...');
    
    try {
      // Skip if no replicas available
      const replicas = await tavusService.getReplicas();
      if (!replicas || replicas.length === 0) {
        this.results.push({
          test: 'Conversation Creation',
          status: 'skip',
          message: 'Skipped - no replicas available'
        });
        console.log('⏭️ Skipped - no replicas available');
        return;
      }

      console.log('Creating test conversation...');
      const conversation = await tavusService.createWellbeingConversation({
        recentMood: 7,
        completedCourses: ['Test Course'],
        currentConcerns: ['Integration testing']
      });

      if (conversation && conversation.conversation_url) {
        this.results.push({
          test: 'Conversation Creation',
          status: 'pass',
          message: `Successfully created conversation: ${conversation.conversation_id}`
        });
        console.log('✅ Successfully created conversation');
        console.log(`   ID: ${conversation.conversation_id}`);
        console.log(`   URL: ${conversation.conversation_url}`);
        
        // Clean up the test conversation
        try {
          await tavusService.endConversation(conversation.conversation_id);
          console.log('🧹 Cleaned up test conversation');
        } catch (cleanupError) {
          console.log('⚠️ Could not clean up test conversation:', cleanupError);
        }
      } else {
        this.results.push({
          test: 'Conversation Creation',
          status: 'fail',
          message: 'Conversation created but missing URL'
        });
        console.log('❌ Conversation created but missing URL');
      }
    } catch (error) {
      this.results.push({
        test: 'Conversation Creation',
        status: 'fail',
        message: `Error creating conversation: ${error}`
      });
      console.log('❌ Error creating conversation:', error);
    }
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    
    this.results.forEach(result => {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
      console.log(`${icon} ${result.test}: ${result.message}`);
    });
    
    console.log('\n📈 Summary:');
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Skipped: ${skipped}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Your Tavus integration is ready!');
    } else {
      console.log('\n🔧 Some tests failed. Please check the errors above and:');
      console.log('   1. Verify your API key is correct');
      console.log('   2. Ensure you have trained replicas available');
      console.log('   3. Check your network connection');
      console.log('   4. Review the Tavus dashboard for any account issues');
    }
  }
}

// Export a simple function to run tests
export const testTavusIntegration = async (): Promise<void> => {
  const tester = new TavusIntegrationTester();
  await tester.runAllTests();
};

// Make it available globally for easy console testing
(window as any).testTavusIntegration = testTavusIntegration;