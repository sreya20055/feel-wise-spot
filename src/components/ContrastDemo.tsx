import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Eye, Contrast, Palette, TestTube, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Demo component to showcase the high contrast mode functionality
 * This helps users understand the difference and test the contrast enhancement
 */
export const ContrastDemo = () => {
  const { settings, updateSettings } = useAccessibility();
  const [testInput, setTestInput] = useState('Test input for contrast visibility');

  const toggleContrast = () => {
    const newContrast = settings.contrast === 'normal' ? 'high' : 'normal';
    updateSettings({ contrast: newContrast });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Contrast className="h-5 w-5" />
          High Contrast Mode Demo
        </CardTitle>
        <CardDescription>
          Compare normal and high contrast modes designed for users with visual impairments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contrast Toggle */}
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
          <Button
            onClick={toggleContrast}
            variant={settings.contrast === 'high' ? "default" : "outline"}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {settings.contrast === 'high' ? "High Contrast ON" : "Switch to High Contrast"}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current mode:</span>
            <Badge variant={settings.contrast === 'high' ? "default" : "secondary"}>
              {settings.contrast === 'high' ? "High Contrast" : "Normal"}
            </Badge>
          </div>
        </div>

        {/* Sample UI Elements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Examples */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Text & Colors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-base mb-2">
                  <strong>Primary text:</strong> This is how regular content appears.
                </p>
                <p className="text-muted-foreground text-sm">
                  Secondary text: This is muted text used for descriptions.
                </p>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-primary text-primary-foreground">Primary Badge</Badge>
                <Badge className="bg-wellbeing text-wellbeing-foreground">Wellbeing</Badge>
                <Badge className="bg-accessibility text-accessibility-foreground">Accessibility</Badge>
                <Badge className="bg-mindfulness text-mindfulness-foreground">Mindfulness</Badge>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button size="sm">Primary Button</Button>
                <Button size="sm" variant="secondary">Secondary</Button>
                <Button size="sm" variant="outline">Outline</Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Form Elements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-input">Test Input Field</Label>
                <Input 
                  id="test-input"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Type here to test visibility"
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="test-checkbox" className="rounded" />
                <Label htmlFor="test-checkbox">Checkbox with label</Label>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Error
                </Button>
                <Button size="sm" variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-3 w-3" />
                  Success
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status and Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* High Contrast Benefits */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
                High Contrast Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Improved visibility for low vision users</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Better readability in bright environments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Enhanced focus indicators for navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>WCAG AAA contrast compliance</span>
              </div>
            </CardContent>
          </Card>

          {/* Current Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Accessibility Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Contrast Mode:</span>
                <Badge variant={settings.contrast === 'high' ? "default" : "secondary"}>
                  {settings.contrast === 'high' ? "High" : "Normal"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Font Type:</span>
                <Badge variant={settings.font === 'dyslexic' ? "default" : "secondary"}>
                  {settings.font === 'dyslexic' ? "OpenDyslexic" : "Standard"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Font Size:</span>
                <Badge variant="secondary">
                  {settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Voice Navigation:</span>
                <Badge variant={settings.voiceNavigation ? "default" : "secondary"}>
                  {settings.voiceNavigation ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-900 dark:text-green-100">
              💡 How to Use High Contrast Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-800 dark:text-green-200 space-y-2">
            <div>
              <strong>Toggle Methods:</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the button above to toggle contrast mode</li>
              <li>Use the accessibility panel (floating button in bottom-right)</li>
              <li>Access via the main accessibility settings page</li>
            </ul>
            <div className="mt-3">
              <strong>What Changes:</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Background becomes pure black (#000000)</li>
              <li>Text becomes pure white (#FFFFFF)</li>
              <li>Buttons get bright colors (yellow, cyan, lime)</li>
              <li>Focus indicators become more prominent</li>
              <li>All borders become high-contrast white</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};