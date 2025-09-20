import { useEffect, useRef, useState } from 'react';
import { Room, RemoteTrack, RemoteVideoTrack, RemoteAudioTrack } from 'livekit-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff,
  RefreshCw,
  Loader2,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { liveKitTavusService } from '@/services/livekitTavusService';

interface LiveKitAvatarProps {
  enabled: boolean;
  onVideoStatusChange?: (hasVideo: boolean) => void;
  onAvatarSpeaking?: (speaking: boolean) => void;
  userContext?: any;
}

export default function LiveKitAvatar({ 
  enabled, 
  onVideoStatusChange, 
  onAvatarSpeaking,
  userContext 
}: LiveKitAvatarProps) {
  const { toast } = useToast();
  
  // Refs for video and audio elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // State management
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Initialize avatar connection when enabled
  useEffect(() => {
    if (enabled && !isConnected && !isConnecting) {
      initializeAvatar();
    } else if (!enabled && isConnected) {
      disconnectAvatar();
    }

    return () => {
      if (isConnected) {
        disconnectAvatar();
      }
    };
  }, [enabled]);

  const initializeAvatar = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log('🚀 Initializing LiveKit Avatar...');

      // First, try to create a conversation with LiveKit integration
      try {
        const conversationData = await liveKitTavusService.createConversationWithLiveKit(userContext);
        
        if (conversationData.livekit_token && conversationData.room_name) {
          // Connect to LiveKit room with the token
          const liveKitRoom = await liveKitTavusService.connectToLiveKitRoom(
            conversationData.livekit_token, 
            conversationData.room_name
          );
          
          setRoom(liveKitRoom);
          setIsConnected(true);
          setupVideoAudioTracks();
          
          toast({
            title: "Avatar Connected!",
            description: "Sage is ready for live video conversation using WebRTC.",
          });

        } else {
          throw new Error('No LiveKit token received from Tavus');
        }

      } catch (liveKitError) {
        console.warn('⚠️ LiveKit integration not available, trying fallback...', liveKitError);
        
        // Fall back to iframe if LiveKit is not supported
        const fallbackConversationUrl = await liveKitTavusService.createFallbackConversation();
        setFallbackUrl(fallbackConversationUrl);
        setUseFallback(true);
        
        toast({
          title: "Avatar Connected (Fallback)",
          description: "Using iframe mode. For better performance, LiveKit integration is recommended.",
          variant: "default",
        });
      }

    } catch (error: any) {
      console.error('❌ Avatar initialization failed:', error);
      setError(error.message || 'Failed to initialize avatar');
      
      toast({
        title: "Avatar Connection Failed",
        description: "Unable to connect to Sage's video avatar. Text chat is still fully functional!",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const setupVideoAudioTracks = () => {
    if (!liveKitTavusService.isConnected()) return;

    // Set up video track
    const videoTrack = liveKitTavusService.getAvatarVideoTrack() as RemoteVideoTrack | null;
    if (videoTrack && videoRef.current) {
      videoTrack.attach(videoRef.current);
      setHasVideo(true);
      onVideoStatusChange?.(true);
      console.log('🎥 Avatar video track attached');
    }

    // Set up audio track
    const audioTrack = liveKitTavusService.getAvatarAudioTrack() as RemoteAudioTrack | null;
    if (audioTrack && audioRef.current) {
      audioTrack.attach(audioRef.current);
      setHasAudio(true);
      console.log('🔊 Avatar audio track attached');
    }

    // Monitor speaking status
    if (liveKitTavusService.hasAvatarParticipant()) {
      // This would be set up through the service's event listeners
      // The service would call our callback when speaking status changes
    }
  };

  const disconnectAvatar = async () => {
    try {
      await liveKitTavusService.disconnect();
      setRoom(null);
      setIsConnected(false);
      setHasVideo(false);
      setHasAudio(false);
      setUseFallback(false);
      setFallbackUrl(null);
      onVideoStatusChange?.(false);
      console.log('👋 Avatar disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting avatar:', error);
    }
  };

  const retryConnection = () => {
    if (isConnected) {
      disconnectAvatar();
    }
    setTimeout(() => {
      initializeAvatar();
    }, 1000);
  };

  const sendMessage = async (message: string) => {
    if (isConnected && !useFallback) {
      try {
        await liveKitTavusService.sendMessageToAvatar(message);
      } catch (error) {
        console.error('❌ Failed to send message to avatar:', error);
      }
    }
  };

  // Expose sendMessage function to parent components
  useEffect(() => {
    // You could use a ref or context to make this available to parent components
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Sage Avatar
            {isConnected && (
              <Badge variant="secondary" className="text-xs">
                {useFallback ? 'Iframe' : 'WebRTC'} Connected
              </Badge>
            )}
          </div>
          {isSpeaking && (
            <Badge variant="outline" className="text-xs animate-pulse">
              <Mic className="h-3 w-3 mr-1" />
              Speaking
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-wellbeing/10 rounded-lg overflow-hidden relative">
          {isConnecting ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Connecting to Sage...</p>
                <p className="text-xs text-muted-foreground mt-2">Initializing video avatar</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <VideoOff className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-sm font-medium text-red-600">Connection Failed</p>
                <p className="text-xs text-muted-foreground mt-1">{error}</p>
                <Button
                  onClick={retryConnection}
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 px-2 mt-2"
                  disabled={isConnecting}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          ) : isConnected && useFallback && fallbackUrl ? (
            // Fallback iframe mode
            <div className="w-full h-full relative">
              <iframe
                src={fallbackUrl}
                className="w-full h-full border-0"
                allow="camera; microphone; autoplay; display-capture; fullscreen"
                allowFullScreen
                title="Sage AI Avatar - Fallback Mode"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                🎥 Avatar (Iframe Mode)
              </div>
            </div>
          ) : isConnected && hasVideo ? (
            // LiveKit WebRTC mode
            <div className="w-full h-full relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover"
              />
              <audio
                ref={audioRef}
                autoPlay
                playsInline
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                🎥 Live WebRTC Avatar
              </div>
              
              {/* Connection controls */}
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  {hasVideo && <Video className="h-3 w-3 mr-1" />}
                  {hasAudio && <Volume2 className="h-3 w-3 mr-1" />}
                  Connected
                </Badge>
              </div>
            </div>
          ) : isConnected ? (
            // Connected but no video yet
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Heart className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-muted-foreground">Connected to Sage</p>
                <p className="text-xs text-muted-foreground mt-2">Waiting for video stream...</p>
              </div>
            </div>
          ) : (
            // Not connected - show placeholder
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <p className="text-sm font-medium">Sage</p>
                <p className="text-xs text-muted-foreground">Your AI Companion</p>
                <p className="text-xs text-muted-foreground mt-2">Video avatar unavailable</p>
                <Button
                  onClick={retryConnection}
                  size="sm"
                  variant="outline"
                  className="text-xs h-6 px-2 mt-2"
                  disabled={isConnecting}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Export the sendMessage function for parent components to use
export const useAvatarMessaging = () => {
  const sendMessageToAvatar = async (message: string) => {
    if (liveKitTavusService.isConnected()) {
      try {
        await liveKitTavusService.sendMessageToAvatar(message);
        return true;
      } catch (error) {
        console.error('❌ Failed to send message to avatar:', error);
        return false;
      }
    }
    return false;
  };

  return { sendMessageToAvatar };
};