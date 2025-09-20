import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  BookOpen,
  Mic,
  MicOff,
  Save,
  Download,
  Sparkles,
  Heart,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { journalService, JournalEntry, JournalPrompt, AIFeedback } from '@/services/journalService';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

export default function Journal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodRating, setMoodRating] = useState([5]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<JournalPrompt | null>(null);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'history' | 'insights'>('write');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's recent mood for context
  const { data: recentMood } = useQuery({
    queryKey: ['recent-mood', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('mood_entries')
        .select('mood_level')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data?.mood_level;
    },
    enabled: !!user,
  });

  // Get today's prompt
  const { data: todaysPrompt } = useQuery({
    queryKey: ['todays-prompt', user?.id, recentMood],
    queryFn: async () => {
      if (!user) return null;
      return journalService.getTodayPrompt(user.id, recentMood);
    },
    enabled: !!user,
  });

  // Get journal entries
  const { data: journalEntries } = useQuery({
    queryKey: ['journal-entries', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return journalService.getJournalEntries(user.id);
    },
    enabled: !!user,
  });

  // Save journal entry mutation
  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      if (!user || !content.trim()) {
        throw new Error('Content is required');
      }

      const entry = await journalService.saveJournalEntry({
        user_id: user.id,
        title: title.trim() || undefined,
        content: content.trim(),
        prompt: currentPrompt?.prompt_text,
        mood_rating: moodRating[0],
        is_voice_entry: !!audioBlob,
        audio_url: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
      });

      // Generate AI feedback
      const feedback = await journalService.generateAIFeedback(content, moodRating[0]);
      setAiFeedback(feedback);
      setShowAIFeedback(true);

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({
        title: "Journal saved!",
        description: "Your reflection has been saved with AI feedback.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export journal mutation
  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'txt') => {
      if (!user) throw new Error('Not authenticated');
      return journalService.exportJournalEntries(user.id, format);
    },
    onSuccess: (blob, format) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journal_export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful!",
        description: `Your journal has been exported as ${format.toUpperCase()}.`,
      });
    },
  });

  useEffect(() => {
    if (todaysPrompt) {
      setCurrentPrompt(todaysPrompt);
    }
  }, [todaysPrompt]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        // Transcribe audio to text
        journalService.transcribeVoiceEntry(audioBlob)
          .then(transcript => {
            setContent(prev => prev + (prev ? '\n\n' : '') + transcript);
          })
          .catch(console.error);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Unable to access microphone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
  };

  const playAudio = () => {
    if (audioBlob && !isPlayingAudio) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
      setIsPlayingAudio(true);
    } else if (audioRef.current && isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const resetEntry = () => {
    setTitle('');
    setContent('');
    setMoodRating([5]);
    setAudioBlob(null);
    setShowAIFeedback(false);
    setAiFeedback(null);
  };

  const usePrompt = (prompt: JournalPrompt) => {
    setCurrentPrompt(prompt);
    setContent('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMoodColor = (level: number) => {
    if (level <= 3) return 'text-destructive';
    if (level <= 5) return 'text-yellow-600';
    if (level <= 7) return 'text-wellbeing';
    return 'text-green-600';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access your journal</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showAIFeedback && aiFeedback) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="font-semibold">Journal - AI Reflection</h1>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-mindfulness/5">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">AI Reflection on Your Journal</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    What I noticed that's positive:
                  </h3>
                  <ul className="space-y-1 text-green-700">
                    {aiFeedback.positive_highlights.map((highlight, index) => (
                      <li key={index} className="text-sm">• {highlight}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Gentle suggestions:</h3>
                  <ul className="space-y-1 text-blue-700">
                    {aiFeedback.gentle_suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm">• {suggestion}</li>
                    ))}
                  </ul>
                </div>

                {aiFeedback.mood_correlation && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-800 mb-2">Mood & Writing Connection:</h3>
                    <p className="text-purple-700 text-sm">{aiFeedback.mood_correlation}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={resetEntry}
                    className="flex-1"
                  >
                    Write Another Entry
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('history')}
                    variant="outline"
                    className="flex-1"
                  >
                    View All Entries
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-wellbeing rounded-full flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-semibold">Personal Journal</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate('pdf')}
              disabled={exportMutation.isPending}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg">
          <Button
            variant={activeTab === 'write' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('write')}
            className="flex-1"
          >
            Write
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className="flex-1"
          >
            History
          </Button>
          <Button
            variant={activeTab === 'insights' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('insights')}
            className="flex-1"
          >
            Insights
          </Button>
        </div>

        {activeTab === 'write' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Writing Area */}
            <div className="lg:col-span-2 space-y-6">
              {currentPrompt && (
                <Card className="bg-gradient-to-br from-mindfulness/5 to-wellbeing/5 border-mindfulness/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-mindfulness" />
                        Today's Reflection Prompt
                      </CardTitle>
                      <Badge variant="outline">{currentPrompt.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic">"{currentPrompt.prompt_text}"</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Your Journal Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Entry title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Your thoughts...</label>
                      <div className="flex items-center gap-2">
                        {audioBlob && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={playAudio}
                            className="gap-2"
                          >
                            {isPlayingAudio ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            Audio
                          </Button>
                        )}
                        <Button
                          variant={isRecording ? "destructive" : "outline"}
                          size="sm"
                          onClick={isRecording ? stopRecording : startRecording}
                          className="gap-2"
                        >
                          {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                          {isRecording ? formatTime(recordingTime) : 'Record'}
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea
                      placeholder={isRecording 
                        ? "Recording your voice... You can also type here while recording." 
                        : "Start writing your thoughts, or use the Record button to speak your entry..."
                      }
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">How are you feeling right now?</label>
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${getMoodColor(moodRating[0])}`}>
                        {moodRating[0]}
                      </div>
                    </div>
                    <Slider
                      value={moodRating}
                      onValueChange={setMoodRating}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Very Low</span>
                      <span>Neutral</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => saveEntryMutation.mutate()}
                      disabled={!content.trim() || saveEntryMutation.isPending}
                      className="flex-1 bg-wellbeing hover:bg-wellbeing/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveEntryMutation.isPending ? 'Saving...' : 'Save & Get AI Feedback'}
                    </Button>
                    <Button variant="outline" onClick={resetEntry}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-wellbeing">
                      {journalEntries?.length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                  </div>
                  {recentMood && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className={`text-2xl font-bold ${getMoodColor(recentMood)}`}>
                        {recentMood}/10
                      </div>
                      <p className="text-sm text-muted-foreground">Recent Mood</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {journalEntries && journalEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {journalEntries.slice(0, 3).map((entry) => (
                        <div key={entry.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                            {entry.mood_rating && (
                              <span className={`text-sm font-bold ${getMoodColor(entry.mood_rating)}`}>
                                {entry.mood_rating}/10
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {entry.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Journal History</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportMutation.mutate('txt')}
                  disabled={exportMutation.isPending}
                >
                  Export as TXT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportMutation.mutate('pdf')}
                  disabled={exportMutation.isPending}
                >
                  Export as PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {journalEntries?.map((entry) => (
                <Card key={entry.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        {entry.title && (
                          <CardTitle className="text-lg">{entry.title}</CardTitle>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                          {entry.mood_rating && (
                            <span className={`flex items-center gap-1 font-medium ${getMoodColor(entry.mood_rating)}`}>
                              <TrendingUp className="h-3 w-3" />
                              Mood: {entry.mood_rating}/10
                            </span>
                          )}
                          {entry.is_voice_entry && (
                            <Badge variant="outline">Voice Entry</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {entry.prompt && (
                      <div className="p-3 bg-muted/50 rounded-lg mt-2">
                        <p className="text-sm text-muted-foreground italic">
                          Prompt: "{entry.prompt}"
                        </p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {entry.content}
                    </p>
                    {entry.ai_feedback && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>AI Reflection:</strong> {entry.ai_feedback}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {!journalEntries?.length && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No journal entries yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your wellbeing journey by writing your first entry.
                  </p>
                  <Button onClick={() => setActiveTab('write')}>
                    Write Your First Entry
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Journal Insights</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced insights like mood patterns, keyword analysis, and journaling streaks will be available soon.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}