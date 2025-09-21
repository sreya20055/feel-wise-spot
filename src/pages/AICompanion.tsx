import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Heart, 
  MessageCircle,
  AlertTriangle,
  Phone,
  Video,
  VideoOff,
  Maximize,
  Minimize,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { aiCompanionService, ConversationMessage, ConversationSession } from '@/services/aiCompanionService';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import '@/utils/tavusDebugger'; // Load debugging utilities
import '@/utils/tavusCleanup'; // Load cleanup utilities
import '@/utils/geminiTest'; // Load Gemini testing utilities
import '@/utils/chatbotTest'; // Load chatbot testing utilities

export default function AICompanion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [tavusVideoUrl, setTavusVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isHttps, setIsHttps] = useState(false);
  
  // Video maximize/minimize state
  const [isVideoMaximized, setIsVideoMaximized] = useState(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check HTTPS and microphone support on mount
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsHttps(isSecure);
  }, []);

  // Handle keyboard shortcuts for video controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVideoMaximized) {
        setIsVideoMaximized(false);
      }
    };

    if (isVideoMaximized) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isVideoMaximized]);

  // Get user context for AI personalization
  const { data: userContext } = useQuery({
    queryKey: ['ai-companion-context', user?.id],
    queryFn: async () => {
      if (!user) return {};
      
      // Get recent mood
      const { data: recentMood } = await supabase
        .from('mood_entries')
        .select('mood_level')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get completed courses
      const { data: completedCourses } = await supabase
        .from('course_progress')
        .select('course_id, micro_courses(title)')
        .eq('user_id', user.id)
        .eq('completed', true)
        .limit(5);

      return {
        recentMood: recentMood?.mood_level,
        completedCourses: completedCourses?.map(c => c.micro_courses?.title) || [],
        userPreferences: {} // Could add accessibility preferences here
      };
    },
    enabled: !!user,
  });

  // Initialize conversation and video avatar
  useEffect(() => {
    const initializeConversation = async () => {
      if (!user || !userContext) return;

      try {
        const newSession = await aiCompanionService.startConversation(user.id, userContext);
        setSession(newSession);
        setMessages(newSession.messages.filter(m => m.role !== 'system'));
        
        // Initialize Tavus video avatar
        if (videoEnabled) {
          console.log('🎥 Video enabled - attempting to initialize Tavus video avatar...');
          
          // First test the connection comprehensively
          try {
            console.log('🧪 Starting comprehensive Tavus testing...');
            const tavusTest = await aiCompanionService.testTavusConnection();
            console.log('📊 Comprehensive Tavus test result:', tavusTest);
            
            if (!tavusTest.isWorking) {
              console.error('❌ Tavus test failed:', tavusTest.error);
              console.error('📊 Test details:', tavusTest.details);
              
              let errorDescription = "The video avatar service is currently unavailable. You can still have a great conversation through text and voice!";
              
              // Provide more specific error messages
              if (tavusTest.error?.includes('PAYMENT_REQUIRED')) {
                errorDescription = "Video avatar service requires account upgrade. The text and voice chat work perfectly and provide the full AI companion experience!";
              } else if (tavusTest.error?.includes('replica not found')) {
                errorDescription = "Video avatar configuration issue detected. Text conversation works perfectly while we resolve this!";
              } else if (tavusTest.error?.includes('UNAUTHORIZED')) {
                errorDescription = "Video service authentication issue. Text and voice chat work great!";
              } else if (tavusTest.error?.includes('API')) {
                errorDescription = "Video service connection issue. No worries - text and voice chat work great!";
              }
              
              toast({
                title: "Video Service Issue",
                description: errorDescription,
                variant: "default",
              });
            } else {
              // Connection test passed, try minimal conversation first
              console.log('✅ Tavus tests passed - trying minimal conversation...');
              try {
                const testUrl = await aiCompanionService.createTestTavusConversation();
                if (testUrl) {
                  console.log('✅ Minimal test conversation successful, using it:', testUrl);
                  setTavusVideoUrl(testUrl);
                  toast({
                    title: "Video Avatar Connected!",
                    description: "Sage is ready for video conversation!",
                  });
                } else {
                  console.log('⚠️ Minimal conversation failed, trying full initialization...');
                  
                  // Try the full initialization as fallback
                  const avatarUrl = await aiCompanionService.initializeTavusAvatar({
                    recentMood: userContext.recentMood,
                    completedCourses: userContext.completedCourses,
                    currentConcerns: []
                  });
                  
                  if (avatarUrl) {
                    console.log('✅ Full initialization successful:', avatarUrl);
                    setTavusVideoUrl(avatarUrl);
                    toast({
                      title: "Video Avatar Connected!",
                      description: "Sage is ready for video conversation!",
                    });
                  } else {
                    console.log('❌ Both minimal and full initialization failed');
                    toast({
                      title: "Video Setup Issue",
                      description: "The video avatar couldn't be set up right now. Text conversation works perfectly!",
                      variant: "default",
                    });
                  }
                }
              } catch (initError) {
                console.error('❌ Video initialization failed even after tests passed:', initError);
                toast({
                  title: "Video Initialization Failed",
                  description: "Video setup encountered an issue. You can still have a full conversation with Sage through text and voice!",
                  variant: "default",
                });
              }
            }
          } catch (testError) {
            console.error('❌ Tavus testing crashed:', testError);
            toast({
              title: "Video Service Error",
              description: "Couldn't connect to the video service. Text and voice chat work perfectly!",
              variant: "default",
            });
          }
        } else {
          console.log('📵 Video disabled by user');
        }
        setIsVideoLoading(false);
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing conversation:', error);
        toast({
          title: "Connection Error",
          description: "Unable to start conversation. Please try again.",
          variant: "destructive",
        });
        setIsInitializing(false);
      }
    };

    if (user && userContext && isInitializing) {
      initializeConversation();
    }
  }, [user, userContext, isInitializing, videoEnabled, toast]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup Tavus conversation on unmount
  useEffect(() => {
    return () => {
      if (session) {
        aiCompanionService.endTavusConversation();
        aiCompanionService.endSession();
      }
    };
  }, [session]);

  const sendMessage = async (content?: string) => {
    const messageText = content || inputMessage.trim();
    if (!messageText || !session || isLoading) return;

    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiCompanionService.sendMessage(messageText);
      const updatedSession = aiCompanionService.getCurrentSession();
      
      if (updatedSession) {
        setMessages(updatedSession.messages.filter(m => m.role !== 'system'));
      }

      // Play audio response if enabled
      if (audioEnabled && response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        audio.play().catch(console.error);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceRecording = () => {
    // Check HTTPS first
    if (!isHttps) {
      toast({
        title: "HTTPS Required",
        description: "Voice input requires HTTPS. Please access the app via https:// or use localhost for development.",
        variant: "destructive",
      });
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Voice input is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    // Check if mediaDevices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Microphone Not Supported",
        description: "Your browser doesn't support microphone access. Please use Chrome, Firefox, or Edge over HTTPS.",
        variant: "destructive",
      });
      return;
    }

    // Request microphone permission first
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        setIsListening(true);
        
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Show interim results in input
          setInputMessage(finalTranscript + interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          let errorMessage = "Unable to recognize speech. Please try again.";
          if (event.error === 'no-speech') {
            errorMessage = "No speech detected. Please try speaking again.";
          } else if (event.error === 'audio-capture') {
            errorMessage = "Microphone not found or permission denied.";
          } else if (event.error === 'not-allowed') {
            errorMessage = "Microphone access denied. Please allow microphone access.";
          }
          
          toast({
            title: "Voice Input Error",
            description: errorMessage,
            variant: "destructive",
          });
        };

        recognition.onend = () => {
          setIsListening(false);
          if (finalTranscript.trim()) {
            setInputMessage(finalTranscript.trim());
          }
        };

        recognition.start();
      })
      .catch((error) => {
        console.error('Microphone access denied:', error);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use voice input.",
          variant: "destructive",
        });
      });
  };

  const stopVoiceRecording = () => {
    setIsListening(false);
  };

  const playMessageAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(console.error);
  };

  const getMessageEmotionStyle = (emotion?: string) => {
    switch (emotion) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950';
      case 'calming':
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'warm':
        return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'celebratory':
        return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-950';
      case 'supportive':
      default:
        return 'border-l-4 border-wellbeing bg-wellbeing/5';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access AI Companion</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold mb-2">Connecting to Sage</h2>
          <p className="text-muted-foreground">Your AI companion is getting ready...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
        <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Sage - AI Companion</h1>
              <p className="text-sm text-muted-foreground">Your personal wellbeing support</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVideoEnabled(!videoEnabled)}
              title={videoEnabled ? 'Turn off video' : 'Turn on video'}
            >
              {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full p-4 gap-6">
        {/* Video Avatar */}
        {videoEnabled && (
          <div className={`
            ${isVideoMaximized 
              ? 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center' 
              : isVideoMinimized 
                ? 'w-full lg:w-80 flex-shrink-0' 
                : 'w-full lg:w-80 flex-shrink-0'
            }
          `}
          onClick={isVideoMaximized ? (e) => {
            // Close maximized video when clicking on backdrop
            if (e.target === e.currentTarget) {
              setIsVideoMaximized(false);
            }
          } : undefined}>
            <Card className={`
              ${isVideoMaximized 
                ? 'w-full max-w-6xl h-full max-h-[90vh] m-4' 
                : isVideoMinimized 
                  ? 'h-auto' 
                  : 'h-full'
              }
            `}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Sage Avatar
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsVideoMinimized(!isVideoMinimized);
                        if (isVideoMaximized) setIsVideoMaximized(false);
                      }}
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                      title={isVideoMinimized ? "Restore video" : "Minimize video"}
                    >
                      {isVideoMinimized ? <Maximize className="h-3 w-3" /> : <Minimize className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsVideoMaximized(!isVideoMaximized);
                        if (isVideoMinimized) setIsVideoMinimized(false);
                      }}
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                      title={isVideoMaximized ? "Restore video" : "Maximize video"}
                    >
                      {isVideoMaximized ? <X className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {!isVideoMinimized && (
                <CardContent className="p-0">
                  <div className={`
                    ${isVideoMaximized 
                      ? 'h-[calc(100vh-200px)] bg-gradient-to-br from-primary/10 to-wellbeing/10 rounded-lg overflow-hidden relative' 
                      : 'aspect-video bg-gradient-to-br from-primary/10 to-wellbeing/10 rounded-lg overflow-hidden relative'
                    }
                  `}>
                  {isVideoLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Heart className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                        <p className="text-sm text-muted-foreground">Connecting to Sage...</p>
                        <p className="text-xs text-muted-foreground mt-2">Setting up your video companion</p>
                      </div>
                    </div>
                  ) : tavusVideoUrl ? (
                    <div className="w-full h-full relative bg-black rounded-lg overflow-hidden">
                      <iframe
                        src={tavusVideoUrl}
                        className="w-full h-full border-0"
                        allow="camera; microphone; autoplay; display-capture; fullscreen"
                        allowFullScreen
                        title="Sage AI Avatar - Video Conversation"
                        onLoad={() => {
                          console.log('✅ Tavus iframe loaded successfully');
                          // Check for Daily.co errors after load
                          setTimeout(() => {
                            try {
                              const iframe = document.querySelector('iframe[title="Sage AI Avatar - Video Conversation"]') as HTMLIFrameElement;
                              if (iframe && iframe.contentDocument) {
                                const content = iframe.contentDocument.body.textContent;
                                if (content?.includes('Something went wrong') || content?.includes('meeting host')) {
                                  console.warn('🚨 Detected Daily.co meeting error in iframe');
                                  setTavusVideoUrl(null); // Clear the problematic URL
                                  toast({
                                    title: "Video Meeting Issue",
                                    description: "The video service had a connection issue. Click 'Retry Video' or continue with text chat!",
                                    variant: "default",
                                  });
                                }
                              }
                            } catch (error) {
                              // Cross-origin restrictions prevent access, which is normal
                              console.log('📋 Iframe content check blocked by CORS (normal behavior)');
                            }
                          }, 3000);
                        }}
                        onError={(e) => {
                          console.error('❌ Tavus iframe error:', e);
                          setTavusVideoUrl(null); // Clear the problematic URL
                          toast({
                            title: "Video Loading Error",
                            description: "The video avatar couldn't load. Try the retry button or continue with text chat!",
                            variant: "default",
                          });
                        }}
                      />
                      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        🎥 Live AI Avatar
                        {isVideoMaximized && (
                          <span className="ml-2 opacity-75">• Press ESC to exit fullscreen</span>
                        )}
                      </div>
                      
                      {/* Daily.co Error Recovery Button */}
                      <div className="absolute top-2 right-2">
                        <Button
                          onClick={async () => {
                            console.log('🔄 Manual video error recovery triggered');
                            setTavusVideoUrl(null);
                            setIsVideoLoading(true);
                            
                            try {
                              const testUrl = await aiCompanionService.createTestTavusConversation();
                              if (testUrl) {
                                setTavusVideoUrl(testUrl);
                                toast({
                                  title: "Video Reconnected!",
                                  description: "New video session created successfully.",
                                });
                              } else {
                                toast({
                                  title: "Video Service Issue",
                                  description: "Please try again in a moment or continue with text chat.",
                                });
                              }
                            } catch (error) {
                              console.error('❌ Manual retry failed:', error);
                              toast({
                                title: "Retry Failed",
                                description: "Video service is having issues. Text chat works great!",
                              });
                            } finally {
                              setIsVideoLoading(false);
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="bg-black/50 text-white hover:bg-black/70 border-white/20"
                          title="If you see 'Something went wrong', click to retry"
                        >
                          🔄 Retry
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3">
                          <Heart className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-sm font-medium">Sage</p>
                        <p className="text-xs text-muted-foreground">Your AI Companion</p>
                        <p className="text-xs text-muted-foreground mt-2">Video avatar currently unavailable</p>
                        <p className="text-xs text-muted-foreground opacity-70 mt-1">Text conversation works perfectly!</p>
                        <Button
                          onClick={async () => {
                            setIsVideoLoading(true);
                            console.log('🔄 Retrying video connection with comprehensive testing...');
                            
                            try {
                              // Test connection first
                              const tavusTest = await aiCompanionService.testTavusConnection();
                              console.log('📊 Retry test result:', tavusTest);
                              
                              if (!tavusTest.isWorking) {
                                let message = "Video service is still unavailable. Text chat works perfectly!";
                                if (tavusTest.error?.includes('replica not found')) {
                                  message = "Video avatar needs reconfiguration. Text chat is fully functional!";
                                }
                                toast({
                                  title: "Still Unavailable",
                                  description: message,
                                });
                              } else {
                                // Try minimal conversation
                                const testUrl = await aiCompanionService.createTestTavusConversation();
                                if (testUrl) {
                                  setTavusVideoUrl(testUrl);
                                  toast({
                                    title: "Video Connected!",
                                    description: "Sage is now ready for video conversation!",
                                  });
                                } else {
                                  toast({
                                    title: "Connection Issue",
                                    description: "Video setup still having issues. Text chat works great!",
                                  });
                                }
                              }
                            } catch (error) {
                              console.error('❌ Video retry failed:', error);
                              toast({
                                title: "Retry Failed",
                                description: "Video service is having issues. Text conversation works perfectly!",
                              });
                            } finally {
                              setIsVideoLoading(false);
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs h-6 px-2 mt-2"
                          disabled={isVideoLoading}
                        >
                          {isVideoLoading ? 'Connecting...' : '🔄 Retry Video'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
        
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Welcome Message */}
          {messages.length === 0 && !isLoading && (
            <Card className="mb-4 border-wellbeing/20 bg-wellbeing/5">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Heart className="h-8 w-8 text-wellbeing mx-auto mb-3" />
                  <h3 className="font-semibold text-wellbeing mb-2">Welcome to your conversation with Sage!</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Click the microphone button to enable voice input</p>
                    <p>• Toggle video to see Sage's avatar {tavusVideoUrl ? '(connected!)' : '(when available)'}</p>
                    <p>• Share what's on your mind - I'm here to listen and support you</p>
                    {videoEnabled && !tavusVideoUrl && !isVideoLoading && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
                        <p className="text-xs mb-2">
                          💡 The video avatar is currently unavailable, but you can still have a complete AI companion experience through text and voice chat!
                        </p>
                        <p className="text-xs mb-2 opacity-80">
                          🤖 Your AI conversations are powered by Google Gemini and work perfectly without video.
                        </p>
                        <Button
                          onClick={async () => {
                            setIsVideoLoading(true);
                            try {
                              const avatarUrl = await aiCompanionService.initializeTavusAvatar({
                                recentMood: userContext?.recentMood,
                                completedCourses: userContext?.completedCourses,
                                currentConcerns: []
                              });
                              if (avatarUrl) {
                                setTavusVideoUrl(avatarUrl);
                                toast({
                                  title: "Video Avatar Connected!",
                                  description: "Sage is now ready for video conversation.",
                                });
                              } else {
                                toast({
                                  title: "Still Unavailable",
                                  description: "The video service is temporarily unavailable. Text chat works perfectly!",
                                });
                              }
                            } catch (error) {
                              toast({
                                title: "Connection Failed",
                                description: "Don't worry - you can have a great conversation through text!",
                              });
                            } finally {
                              setIsVideoLoading(false);
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs h-6 px-2"
                          disabled={isVideoLoading}
                        >
                          {isVideoLoading ? 'Connecting...' : '🔄 Try Video Again'}
                        </Button>
                      </div>
                    )}
                    {!isHttps && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                        <p className="text-xs">
                          ⚠️ Voice features require HTTPS. Please use https:// or localhost to enable microphone access.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <ScrollArea className="flex-1 mb-4">
          <div className="space-y-4 pb-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-lg px-4 py-3' 
                      : `rounded-lg px-4 py-3 ${getMessageEmotionStyle(message.emotion)}`
                  }`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                          <Heart className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">Sage</span>
                        {message.audioUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playMessageAudio(message.audioUrl!)}
                            className="h-6 w-6 p-0"
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        )}
                        {message.emotion === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Crisis Support
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    {message.role === 'assistant' && message.emotion === 'urgent' && (
                      <div className="mt-4 pt-4 border-t border-red-200">
                        <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                          <Phone className="h-4 w-4" />
                          <span>Crisis Resources Available</span>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-wellbeing/5 border-l-4 border-wellbeing rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center animate-pulse">
                      <Heart className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Sage</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-wellbeing rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-wellbeing rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-wellbeing rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Share what's on your mind..."}
                  className="flex-1"
                  disabled={isLoading || isListening}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                  disabled={isLoading || !isHttps || (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)}
                  title={!isHttps ? "HTTPS required for microphone" : "Voice input"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-wellbeing hover:bg-wellbeing/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Press Enter to send • Click mic for voice input</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  {audioEnabled && <Volume2 className="h-3 w-3" />}
                  Audio {audioEnabled ? 'enabled' : 'disabled'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}