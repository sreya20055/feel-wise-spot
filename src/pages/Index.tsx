import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Brain, Eye, ArrowRight, CheckCircle, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">BlindSpot</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-primary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Heart className="h-12 w-12 text-wellbeing" />
            <Brain className="h-12 w-12 text-mindfulness" />
            <Eye className="h-12 w-12 text-accessibility" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your accessible wellbeing & learning companion
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Track your mood. Learn daily. Feel supported. 
            <br />
            Built with accessibility at its heart.
          </p>
          
          <Link to="/auth">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
              Start Your Journey <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for wellbeing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              BlindSpot combines mood tracking, AI-powered suggestions, and micro-learning 
              in an accessible platform designed for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-wellbeing/10 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-wellbeing" />
                </div>
                <CardTitle>Mood Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your emotional wellbeing with simple, daily mood logging and get personalized AI coping suggestions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-mindfulness/10 rounded-full flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-mindfulness" />
                </div>
                <CardTitle>Adaptive Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Short, focused micro-courses designed to build your mental health toolkit in just 2-3 minutes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-accessibility/10 rounded-full flex items-center justify-center mb-4">
                  <Eye className="h-8 w-8 text-accessibility" />
                </div>
                <CardTitle>Accessibility First</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Dyslexia-friendly fonts, high contrast mode, text size adjustment, and voice navigation built-in.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>AI Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get personalized coping strategies and course recommendations based on your mood and progress.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built for everyone, designed for accessibility
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                BlindSpot recognizes that mental health support should be accessible to all. 
                Our platform adapts to your needs, whether you have dyslexia, visual impairments, 
                or other accessibility requirements.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Dyslexia-friendly OpenDyslexic font option</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>High contrast mode for better visibility</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Adjustable text size for comfortable reading</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Voice navigation and text-to-speech support</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-gradient-wellbeing text-wellbeing-foreground">
                <CardHeader>
                  <CardTitle className="text-white">Daily Check-ins</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90">Track your mood and receive personalized coping strategies.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-accessibility text-accessibility-foreground">
                <CardHeader>
                  <CardTitle className="text-white">Micro-Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90">Learn new wellbeing skills in bite-sized sessions.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to start your wellbeing journey?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join BlindSpot today and discover a more accessible, supportive approach to mental health and learning.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">BlindSpot</span>
          </div>
          <p className="text-muted-foreground">
            Your accessible wellbeing & learning companion
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
