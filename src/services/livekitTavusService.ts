import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client';

// Configuration for Tavus with LiveKit
const TAVUS_API_KEY = '571bcfabda964c6ba5f776f147e95d35';
const TAVUS_BASE_URL = 'https://tavusapi.com';
const TAVUS_REPLICA_ID = 'rf4703150052'; // Charlie - confirmed working
const TAVUS_PERSONA_ID = 'p2c3a9b144e4';

// LiveKit server configuration (you'll need to set up a LiveKit server)
const LIVEKIT_URL = 'wss://feelwise-livekit.livekit.cloud'; // Replace with your LiveKit server
const LIVEKIT_API_KEY = process.env.REACT_APP_LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.REACT_APP_LIVEKIT_API_SECRET || '';

interface TavusLiveKitResponse {
  conversation_id: string;
  conversation_url: string;
  livekit_token?: string;
  room_name?: string;
  status: string;
}

interface TavusConversationRequest {
  replica_id: string;
  persona_id?: string;
  conversation_name: string;
  callback_url?: string;
  // LiveKit-specific parameters
  enable_livekit?: boolean;
  livekit_url?: string;
}

export class LiveKitTavusService {
  private room: Room | null = null;
  private connected = false;
  private avatarParticipant: RemoteParticipant | null = null;

  constructor() {
    console.log('🚀 Initializing LiveKit Tavus Service');
  }

  async createConversationWithLiveKit(userContext?: any): Promise<TavusLiveKitResponse> {
    console.log('🎬 Creating Tavus conversation with LiveKit integration...');

    const conversationRequest: TavusConversationRequest = {
      replica_id: TAVUS_REPLICA_ID,
      persona_id: TAVUS_PERSONA_ID,
      conversation_name: `FeelWise-${Date.now()}`,
      enable_livekit: true,
      livekit_url: LIVEKIT_URL,
    };

    try {
      const response = await fetch(`${TAVUS_BASE_URL}/v2/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': TAVUS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(conversationRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavus API error: ${response.status} ${errorText}`);
      }

      const conversationData: TavusLiveKitResponse = await response.json();
      console.log('✅ Tavus conversation with LiveKit created:', conversationData);

      return conversationData;
    } catch (error) {
      console.error('❌ Failed to create Tavus conversation with LiveKit:', error);
      throw error;
    }
  }

  async connectToLiveKitRoom(token: string, roomName: string): Promise<Room> {
    try {
      console.log('🔗 Connecting to LiveKit room:', roomName);

      if (this.room) {
        await this.room.disconnect();
      }

      this.room = new Room({
        // Audio and video settings
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          resolution: 'h720',
          frameRate: 30,
        },
        // Enable adaptive stream for better performance
        adaptiveStream: true,
        // Enable dynacast for better bandwidth usage
        dynacast: true,
      });

      // Set up event listeners
      this.setupRoomEventListeners();

      // Connect to the room
      await this.room.connect(LIVEKIT_URL, token);

      console.log('✅ Connected to LiveKit room successfully');
      this.connected = true;

      return this.room;
    } catch (error) {
      console.error('❌ Failed to connect to LiveKit room:', error);
      throw error;
    }
  }

  private setupRoomEventListeners() {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      console.log('🎉 Room connected successfully');
      this.connected = true;
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      console.log('👋 Room disconnected:', reason);
      this.connected = false;
      this.avatarParticipant = null;
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('👤 Participant connected:', participant.identity);
      
      // Check if this is the avatar participant
      if (participant.identity.includes('tavus') || participant.identity.includes('avatar')) {
        this.avatarParticipant = participant;
        console.log('🤖 Avatar participant identified:', participant.identity);
        
        // Set up avatar-specific event listeners
        this.setupAvatarEventListeners(participant);
      }
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('👤 Participant disconnected:', participant.identity);
      if (participant === this.avatarParticipant) {
        this.avatarParticipant = null;
      }
    });

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('📺 Track subscribed:', {
        kind: track.kind,
        participant: participant.identity,
        trackSid: track.sid,
      });

      // Handle avatar video/audio tracks
      if (participant === this.avatarParticipant) {
        if (track.kind === 'video') {
          console.log('🎥 Avatar video track received');
          // The track will be automatically attached to video elements
        } else if (track.kind === 'audio') {
          console.log('🔊 Avatar audio track received');
          // Audio will play automatically
        }
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('📺 Track unsubscribed:', track.kind, participant.identity);
    });

    // Handle room metadata updates (for avatar responses)
    this.room.on(RoomEvent.RoomMetadataChanged, (metadata) => {
      console.log('📋 Room metadata changed:', metadata);
      try {
        const data = JSON.parse(metadata || '{}');
        if (data.type === 'avatar_response') {
          console.log('🤖 Avatar response received:', data.content);
        }
      } catch (e) {
        // Ignore non-JSON metadata
      }
    });
  }

  private setupAvatarEventListeners(participant: RemoteParticipant) {
    participant.on('speakingChanged', (speaking: boolean) => {
      console.log(`🎤 Avatar speaking: ${speaking}`);
    });

    participant.on('trackSubscribed', (track) => {
      console.log(`🤖 Avatar track subscribed: ${track.kind}`);
    });
  }

  async sendMessageToAvatar(message: string): Promise<void> {
    if (!this.room || !this.connected) {
      throw new Error('Not connected to LiveKit room');
    }

    try {
      // Send message via room metadata or data channel
      const messageData = {
        type: 'user_message',
        content: message,
        timestamp: Date.now(),
      };

      await this.room.localParticipant.publishData(
        JSON.stringify(messageData),
        { reliable: true }
      );

      console.log('💬 Message sent to avatar:', message);
    } catch (error) {
      console.error('❌ Failed to send message to avatar:', error);
      throw error;
    }
  }

  getAvatarVideoTrack() {
    if (!this.avatarParticipant) return null;

    // Find the video track from the avatar participant
    for (const trackPub of this.avatarParticipant.videoTrackPublications.values()) {
      if (trackPub.track) {
        return trackPub.track;
      }
    }

    return null;
  }

  getAvatarAudioTrack() {
    if (!this.avatarParticipant) return null;

    // Find the audio track from the avatar participant
    for (const trackPub of this.avatarParticipant.audioTrackPublications.values()) {
      if (trackPub.track) {
        return trackPub.track;
      }
    }

    return null;
  }

  isConnected(): boolean {
    return this.connected && this.room?.state === 'connected';
  }

  hasAvatarParticipant(): boolean {
    return this.avatarParticipant !== null;
  }

  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
    this.connected = false;
    this.avatarParticipant = null;
    console.log('👋 Disconnected from LiveKit Tavus service');
  }

  // Fallback to iframe if LiveKit is not available
  async createFallbackConversation(): Promise<string> {
    console.log('🔄 Creating fallback iframe conversation...');
    
    const basicRequest = {
      replica_id: TAVUS_REPLICA_ID,
      persona_id: TAVUS_PERSONA_ID,
      conversation_name: `Fallback-${Date.now()}`,
    };

    try {
      const response = await fetch(`${TAVUS_BASE_URL}/v2/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': TAVUS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(basicRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.conversation_url;
    } catch (error) {
      console.error('❌ Fallback conversation creation failed:', error);
      throw error;
    }
  }

  // Generate LiveKit token (you'll need to implement this on your backend)
  async generateToken(roomName: string, participantName: string): Promise<string> {
    // This should be done on your backend for security
    // For now, we'll need to use the existing approach or set up a proper backend
    console.warn('⚠️ Token generation should be done on backend for security');
    
    // Temporary: return empty string to indicate we need backend implementation
    throw new Error('LiveKit token generation requires backend implementation');
  }
}

export const liveKitTavusService = new LiveKitTavusService();