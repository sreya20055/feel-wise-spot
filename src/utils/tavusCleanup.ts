// Tavus Conversation Cleanup Utility
// Helps manage the concurrent conversation limit by cleaning up old/ended conversations

const TAVUS_API_KEY = '571bcfabda964c6ba5f776f147e95d35';
const TAVUS_BASE_URL = 'https://tavusapi.com';

interface TavusConversation {
  conversation_id: string;
  conversation_name: string;
  status: 'active' | 'ended' | 'error';
  created_at: string;
  conversation_url: string;
}

export class TavusCleanupService {
  private getHeaders() {
    return {
      'x-api-key': TAVUS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private log(message: string, data?: any) {
    console.log(`🧹 ${message}`, data || '');
  }

  async getAllConversations(): Promise<TavusConversation[]> {
    try {
      this.log('Fetching all conversations...');
      
      const response = await fetch(`${TAVUS_BASE_URL}/v2/conversations`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const conversations = data.data || [];
      
      this.log(`Found ${conversations.length} conversations`);
      return conversations;
    } catch (error: any) {
      console.error('❌ Failed to fetch conversations:', error);
      throw error;
    }
  }

  async endConversation(conversationId: string): Promise<boolean> {
    try {
      this.log(`Ending conversation: ${conversationId}`);
      
      const response = await fetch(`${TAVUS_BASE_URL}/v2/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log(`Failed to end conversation ${conversationId}: ${errorText}`);
        return false;
      }

      this.log(`✅ Successfully ended conversation: ${conversationId}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error ending conversation ${conversationId}:`, error);
      return false;
    }
  }

  async cleanupOldConversations(olderThanMinutes: number = 30): Promise<number> {
    try {
      this.log(`Starting cleanup of conversations older than ${olderThanMinutes} minutes...`);
      
      const conversations = await this.getAllConversations();
      const cutoffTime = new Date(Date.now() - (olderThanMinutes * 60 * 1000));
      
      let cleanedUp = 0;
      
      for (const conversation of conversations) {
        const createdAt = new Date(conversation.created_at);
        const isOld = createdAt < cutoffTime;
        const isActive = conversation.status === 'active';
        
        this.log(`Conversation ${conversation.conversation_id}:`, {
          name: conversation.conversation_name,
          status: conversation.status,
          createdAt: createdAt.toISOString(),
          isOld,
          isActive
        });

        // End active conversations that are old, or any conversation that seems stuck
        if (isActive && isOld) {
          this.log(`🗑️ Cleaning up old active conversation: ${conversation.conversation_name}`);
          const success = await this.endConversation(conversation.conversation_id);
          if (success) {
            cleanedUp++;
          }
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      this.log(`✅ Cleanup completed. Ended ${cleanedUp} conversations.`);
      return cleanedUp;
    } catch (error: any) {
      console.error('❌ Cleanup failed:', error);
      return 0;
    }
  }

  async forceCleanupAll(): Promise<number> {
    try {
      this.log('🚨 FORCE CLEANUP: Ending ALL conversations...');
      console.warn('⚠️ This will end all conversations, including any that might be legitimately active!');
      
      const conversations = await this.getAllConversations();
      let cleanedUp = 0;
      
      for (const conversation of conversations) {
        this.log(`🗑️ Force ending: ${conversation.conversation_name} (${conversation.status})`);
        
        const success = await this.endConversation(conversation.conversation_id);
        if (success) {
          cleanedUp++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.log(`✅ Force cleanup completed. Ended ${cleanedUp} conversations.`);
      
      // Wait a bit for the changes to propagate
      this.log('⏳ Waiting for changes to propagate...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return cleanedUp;
    } catch (error: any) {
      console.error('❌ Force cleanup failed:', error);
      return 0;
    }
  }

  async checkConcurrentLimit(): Promise<{
    canCreateNew: boolean;
    activeCount: number;
    totalCount: number;
    oldActiveConversations: TavusConversation[];
    recommendCleanup: boolean;
  }> {
    try {
      this.log('🔍 Checking concurrent conversation limit...');
      
      const conversations = await this.getAllConversations();
      const activeConversations = conversations.filter(c => c.status === 'active');
      const cutoffTime = new Date(Date.now() - (30 * 60 * 1000)); // 30 minutes ago
      const oldActiveConversations = activeConversations.filter(c => 
        new Date(c.created_at) < cutoffTime
      );
      
      // Try a test conversation creation to see if we can create new ones
      let canCreateNew = false;
      try {
        const testResponse = await fetch(`${TAVUS_BASE_URL}/v2/conversations`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            replica_id: 'rf4703150052',
            conversation_name: `LimitTest-${Date.now()}`
          })
        });
        
        if (testResponse.ok) {
          canCreateNew = true;
          // Clean up the test conversation immediately
          const testData = await testResponse.json();
          setTimeout(() => {
            this.endConversation(testData.conversation_id);
          }, 1000);
        } else {
          const errorText = await testResponse.text();
          canCreateNew = !errorText.includes('maximum concurrent');
        }
      } catch (testError) {
        this.log('Test conversation creation failed:', testError);
      }

      const result = {
        canCreateNew,
        activeCount: activeConversations.length,
        totalCount: conversations.length,
        oldActiveConversations,
        recommendCleanup: oldActiveConversations.length > 0 || !canCreateNew
      };

      this.log('Concurrent limit check results:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Concurrent limit check failed:', error);
      return {
        canCreateNew: false,
        activeCount: 0,
        totalCount: 0,
        oldActiveConversations: [],
        recommendCleanup: true
      };
    }
  }

  // Smart cleanup - only clean what's necessary
  async smartCleanup(): Promise<boolean> {
    try {
      this.log('🧠 Running smart cleanup...');
      
      const status = await this.checkConcurrentLimit();
      
      if (status.canCreateNew) {
        this.log('✅ No cleanup needed - can create new conversations');
        return true;
      }

      this.log('🔄 Cleanup needed. Starting targeted cleanup...');
      
      // First, try cleaning up old active conversations
      if (status.oldActiveConversations.length > 0) {
        this.log(`🎯 Cleaning up ${status.oldActiveConversations.length} old active conversations...`);
        
        for (const conversation of status.oldActiveConversations) {
          await this.endConversation(conversation.conversation_id);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Wait for changes to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if this fixed the issue
        const newStatus = await this.checkConcurrentLimit();
        if (newStatus.canCreateNew) {
          this.log('✅ Smart cleanup successful - can now create conversations');
          return true;
        }
      }

      // If still can't create, try cleaning up more aggressively
      this.log('🔄 Targeted cleanup not sufficient. Trying more aggressive cleanup...');
      const cleanedUp = await this.cleanupOldConversations(5); // 5 minutes
      
      if (cleanedUp > 0) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const finalStatus = await this.checkConcurrentLimit();
        return finalStatus.canCreateNew;
      }

      this.log('⚠️ Smart cleanup completed but may not have resolved the issue');
      return false;
    } catch (error: any) {
      console.error('❌ Smart cleanup failed:', error);
      return false;
    }
  }
}

export const tavusCleanup = new TavusCleanupService();

// Make it available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).tavusCleanup = tavusCleanup;
  (window as any).cleanupTavus = () => tavusCleanup.smartCleanup();
  (window as any).forceClearTavus = () => tavusCleanup.forceCleanupAll();
  
  console.log('🧹 Tavus Cleanup loaded!');
  console.log('💡 Type "cleanupTavus()" for smart cleanup');
  console.log('💡 Type "forceClearTavus()" to end ALL conversations (use carefully)');
}