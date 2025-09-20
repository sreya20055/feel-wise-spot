import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Eye,
  Monitor,
  Globe,
  Download,
  TestTube,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  accessibilityService,
  AccessibilitySettings,
  AccessibilityTransformation,
  WebsiteProfile
} from '@/services/accessibilityService';

export default function Accessibility() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overlay' | 'test' | 'profiles'>('overlay');
  const [testUrl, setTestUrl] = useState('');
  const [overlayScript, setOverlayScript] = useState('');
  const [websiteName, setWebsiteName] = useState('');
  const [settings, setSettings] = useState<Partial<AccessibilitySettings>>({
    high_contrast: false,
    large_text: false,
    reduced_motion: false,
    screen_reader_optimized: false,
    color_blind_support: false,
    keyboard_navigation: false,
    focus_indicators: false,
    alt_text_enabled: false,
    captions_enabled: false,
    voice_control: false
  });

  // Get user's accessibility settings
  const { data: userSettings } = useQuery({
    queryKey: ['accessibility-settings', user?.id],
    queryFn: () => accessibilityService.getUserSettings(user!.id),
    enabled: !!user,
  });

  // Get website profiles
  const { data: websiteProfiles } = useQuery({
    queryKey: ['website-profiles', user?.id],
    queryFn: () => accessibilityService.getWebsiteProfiles(user!.id),
    enabled: !!user,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<AccessibilitySettings>) =>
      accessibilityService.updateUserSettings(user!.id, newSettings),
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your accessibility settings have been saved.",
      });
    },
  });

  // Test website accessibility
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingWebsite, setIsTestingWebsite] = useState(false);

  const testWebsite = async () => {
    if (!testUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to test.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebsite(true);
    try {
      const results = await accessibilityService.testWebsiteAccessibility(testUrl);
      setTestResults(results);
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to test website accessibility.",
        variant: "destructive",
      });
    } finally {
      setIsTestingWebsite(false);
    }
  };

  // Generate overlay script
  const generateOverlay = () => {
    if (!user) return;

    const fullSettings: AccessibilitySettings = {
      user_id: user.id,
      ...settings,
    } as AccessibilitySettings;

    const script = accessibilityService.generateOverlayScript(fullSettings);
    setOverlayScript(script);

    toast({
      title: "Overlay Generated",
      description: "Your accessibility overlay script is ready to copy.",
    });
  };

  // Copy overlay script
  const copyOverlayScript = async () => {
    try {
      await navigator.clipboard.writeText(overlayScript);
      toast({
        title: "Copied!",
        description: "Overlay script copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy script to clipboard.",
        variant: "destructive",
      });
    }
  };

  // Save website profile
  const saveProfileMutation = useMutation({
    mutationFn: (profile: Omit<WebsiteProfile, 'id' | 'created_at' | 'updated_at'>) =>
      accessibilityService.saveWebsiteProfile(profile),
    onSuccess: () => {
      toast({
        title: "Profile Saved",
        description: "Website accessibility profile has been saved.",
      });
    },
  });

  const saveWebsiteProfile = () => {
    if (!testUrl || !websiteName || !testResults) {
      toast({
        title: "Missing Information",
        description: "Please test a website first and provide a name.",
        variant: "destructive",
      });
      return;
    }

    const profile: Omit<WebsiteProfile, 'id' | 'created_at' | 'updated_at'> = {
      url: testUrl,
      name: websiteName,
      transformations: testResults.recommendations,
      user_settings: {
        user_id: user!.id,
        ...settings,
      } as AccessibilitySettings,
    };

    saveProfileMutation.mutate(profile);
  };

  // Get transformations
  const transformations = accessibilityService.getTransformations();
  const transformationsByCategory = {
    visual: accessibilityService.getTransformationsByCategory('visual'),
    motor: accessibilityService.getTransformationsByCategory('motor'),
    cognitive: accessibilityService.getTransformationsByCategory('cognitive'),
    hearing: accessibilityService.getTransformationsByCategory('hearing'),
  };

  const handleSettingChange = (key: keyof AccessibilitySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (user) {
      updateSettingsMutation.mutate(newSettings);
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
    }
  };

  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access accessibility tools</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
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
            <div className="w-10 h-10 bg-gradient-accessibility rounded-full flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Accessibility Tools</h1>
              <p className="text-sm text-muted-foreground">Transform any website for better accessibility</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="mb-8">
            <TabsTrigger value="overlay" className="gap-2">
              <Monitor className="h-4 w-4" />
              Web Overlay
            </TabsTrigger>
            <TabsTrigger value="test" className="gap-2">
              <TestTube className="h-4 w-4" />
              Website Tester
            </TabsTrigger>
            <TabsTrigger value="profiles" className="gap-2">
              <Globe className="h-4 w-4" />
              Saved Profiles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overlay" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Accessibility Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Visual Accessibility */}
                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visual Accessibility
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transformationsByCategory.visual.map((transformation) => (
                      <div key={transformation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">{transformation.name}</Label>
                          <p className="text-sm text-muted-foreground">{transformation.description}</p>
                        </div>
                        <Switch
                          checked={Object.keys(transformation.settings).some(key => 
                            settings[key as keyof AccessibilitySettings] === true
                          )}
                          onCheckedChange={(checked) => {
                            Object.keys(transformation.settings).forEach(key => {
                              handleSettingChange(key as keyof AccessibilitySettings, checked);
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Motor Accessibility */}
                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Motor Accessibility
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transformationsByCategory.motor.map((transformation) => (
                      <div key={transformation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">{transformation.name}</Label>
                          <p className="text-sm text-muted-foreground">{transformation.description}</p>
                        </div>
                        <Switch
                          checked={Object.keys(transformation.settings).some(key => 
                            settings[key as keyof AccessibilitySettings] === true
                          )}
                          onCheckedChange={(checked) => {
                            Object.keys(transformation.settings).forEach(key => {
                              handleSettingChange(key as keyof AccessibilitySettings, checked);
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cognitive Accessibility */}
                <div>
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    Cognitive Accessibility
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transformationsByCategory.cognitive.map((transformation) => (
                      <div key={transformation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Label className="font-medium">{transformation.name}</Label>
                          <p className="text-sm text-muted-foreground">{transformation.description}</p>
                        </div>
                        <Switch
                          checked={Object.keys(transformation.settings).some(key => 
                            settings[key as keyof AccessibilitySettings] === true
                          )}
                          onCheckedChange={(checked) => {
                            Object.keys(transformation.settings).forEach(key => {
                              handleSettingChange(key as keyof AccessibilitySettings, checked);
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={generateOverlay} className="gap-2">
                    <Download className="h-4 w-4" />
                    Generate Overlay Script
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Overlay Script Output */}
            {overlayScript && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Accessibility Overlay Script
                    </span>
                    <Button variant="outline" size="sm" onClick={copyOverlayScript} className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy Script
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-100 rounded-lg">
                      <p className="text-sm font-medium mb-2">How to use this script:</p>
                      <ol className="text-sm text-muted-foreground space-y-1">
                        <li>1. Copy the script below</li>
                        <li>2. Paste it into your website's HTML before the closing &lt;/body&gt; tag</li>
                        <li>3. The accessibility overlay will automatically activate based on your settings</li>
                      </ol>
                    </div>
                    <Textarea
                      value={overlayScript}
                      readOnly
                      className="font-mono text-xs min-h-[200px]"
                      placeholder="Generate script to see the code here..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="test" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Website Accessibility Tester
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="test-url">Website URL</Label>
                    <Input
                      id="test-url"
                      type="url"
                      placeholder="https://example.com"
                      value={testUrl}
                      onChange={(e) => setTestUrl(e.target.value)}
                    />
                  </div>
                  <div className="pt-6">
                    <Button onClick={testWebsite} disabled={isTestingWebsite} className="gap-2">
                      {isTestingWebsite ? (
                        <>Testing...</>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4" />
                          Test Website
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {testResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Accessibility Score */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold mb-2">
                            {testResults.score}/100
                          </div>
                          <p className="text-muted-foreground">Accessibility Score</p>
                          <Progress value={testResults.score} className="mt-2" />
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-2 rounded-lg bg-red-50">
                            <div className="text-lg font-semibold text-red-600">
                              {testResults.issues.filter((i: any) => i.severity === 'high').length}
                            </div>
                            <div className="text-xs text-red-600">Critical Issues</div>
                          </div>
                          <div className="p-2 rounded-lg bg-yellow-50">
                            <div className="text-lg font-semibold text-yellow-600">
                              {testResults.issues.filter((i: any) => i.severity === 'medium').length}
                            </div>
                            <div className="text-xs text-yellow-600">Moderate Issues</div>
                          </div>
                          <div className="p-2 rounded-lg bg-blue-50">
                            <div className="text-lg font-semibold text-blue-600">
                              {testResults.issues.filter((i: any) => i.severity === 'low').length}
                            </div>
                            <div className="text-xs text-blue-600">Minor Issues</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Issues Found */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Issues Found</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {testResults.issues.map((issue: any, index: number) => (
                            <div key={index} className={`p-4 rounded-lg ${getSeverityColor(issue.severity)}`}>
                              <div className="flex items-center gap-2 mb-2">
                                {getSeverityIcon(issue.severity)}
                                <span className="font-semibold">{issue.type}</span>
                                <Badge variant="secondary" className="ml-auto">
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-sm mb-3">{issue.description}</p>
                              <div className="text-sm">
                                <p className="font-medium mb-1">Suggestions:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {issue.suggestions.map((suggestion: string, idx: number) => (
                                    <li key={idx}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Transformations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {testResults.recommendations.map((transformation: AccessibilityTransformation) => (
                            <div key={transformation.id} className="p-4 border rounded-lg">
                              <div className="font-medium mb-2">{transformation.name}</div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {transformation.description}
                              </p>
                              <Badge>{transformation.category}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Save Profile */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Save Website Profile</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Label htmlFor="website-name">Profile Name</Label>
                            <Input
                              id="website-name"
                              placeholder="My Website Profile"
                              value={websiteName}
                              onChange={(e) => setWebsiteName(e.target.value)}
                            />
                          </div>
                          <div className="pt-6">
                            <Button onClick={saveWebsiteProfile} className="gap-2">
                              <Download className="h-4 w-4" />
                              Save Profile
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Saved Website Profiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {websiteProfiles?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {websiteProfiles.map((profile) => (
                      <Card key={profile.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{profile.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {profile.url}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={profile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                              Transformations: {profile.transformations.length}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {profile.transformations.slice(0, 3).map((t) => (
                                <Badge key={t.id} variant="secondary" className="text-xs">
                                  {t.category}
                                </Badge>
                              ))}
                              {profile.transformations.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{profile.transformations.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                            Saved {new Date(profile.created_at!).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No profiles saved yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Test websites to create accessibility profiles
                    </p>
                    <Button onClick={() => setActiveTab('test')}>
                      Test a Website
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}