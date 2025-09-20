// Simple chatbot test utility
import { aiCompanionService } from '@/services/aiCompanionService';

export async function testChatbot(): Promise<void> {
  console.log('🤖 Starting Chatbot Test...');
  console.log('========================================');
  
  try {
    // Test 1: Initialize session
    console.log('📡 Step 1: Starting conversation session...');
    const session = await aiCompanionService.startConversation('test-user-123', {
      recentMood: 5,
      completedCourses: ['Anxiety Management'],
      userPreferences: {}
    });
    console.log('✅ Session created:', session.id);
    console.log('📝 Welcome message:', session.messages[1]?.content.substring(0, 100) + '...');
    
    // Test messages to try
    const testMessages = [
      'Hello',
      'I feel anxious today',
      'I\'m stressed about work',
      'Thank you for listening',
      'How are you?',
      'I feel sad and depressed',
      'I\'m happy today',
      'I can\'t sleep well'
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
      const testMessage = testMessages[i];
      console.log(`\n💬 Test ${i + 1}: Testing message: "${testMessage}"`);
      
      try {
        const response = await aiCompanionService.sendMessage(testMessage);
        console.log('✅ Response received:');
        console.log(`   Emotion: ${response.emotion}`);
        console.log(`   Length: ${response.content.length} characters`);
        console.log(`   Preview: ${response.content.substring(0, 150)}...`);
        
        // Verify response is meaningful
        if (response.content.length < 20) {
          console.warn('⚠️  Response seems too short');
        }
        if (response.content === response.content.toUpperCase()) {
          console.warn('⚠️  Response is all uppercase (might be an error)');
        }
        if (response.content.toLowerCase().includes('i apologize') || response.content.toLowerCase().includes('i\'m sorry')) {
          console.warn('⚠️  Response contains apology (might indicate fallback mode)');
        }
        
      } catch (messageError: any) {
        console.error(`❌ Message ${i + 1} failed:`, messageError.message);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test session info
    const currentSession = aiCompanionService.getCurrentSession();
    if (currentSession) {
      console.log('\n📊 Final Session Stats:');
      console.log(`   Total messages: ${currentSession.messages.length}`);
      console.log(`   User messages: ${currentSession.messages.filter(m => m.role === 'user').length}`);
      console.log(`   Assistant messages: ${currentSession.messages.filter(m => m.role === 'assistant').length}`);
      console.log(`   Session duration: ${new Date().getTime() - currentSession.startedAt.getTime()}ms`);
    }
    
    console.log('\n🎉 Chatbot test completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Chatbot test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).testChatbot = testChatbot;
  console.log('🔧 Chatbot test loaded! Type "testChatbot()" in console to test the AI companion');
}