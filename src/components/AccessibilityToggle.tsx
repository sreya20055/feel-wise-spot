import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Type, Eye, Volume2, Settings } from 'lucide-react';
import { useState } from 'react';

export const AccessibilityToggle = () => {
  const { settings, updateSettings } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-accessibility text-accessibility-foreground hover:bg-accessibility/90"
      >
        <Settings className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Accessibility Settings</h3>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            <span className="text-sm">Font Size</span>
          </div>
          <div className="flex gap-1">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <Button
                key={size}
                onClick={() => updateSettings({ fontSize: size })}
                variant={settings.fontSize === size ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-xs"
              >
                {size[0].toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Contrast</span>
          </div>
          <Button
            onClick={() => updateSettings({ 
              contrast: settings.contrast === 'normal' ? 'high' : 'normal' 
            })}
            variant={settings.contrast === 'high' ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs"
          >
            High
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            <span className="text-sm">Dyslexic Font</span>
          </div>
          <Button
            onClick={() => updateSettings({ 
              font: settings.font === 'default' ? 'dyslexic' : 'default' 
            })}
            variant={settings.font === 'dyslexic' ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs"
          >
            {settings.font === 'dyslexic' ? 'On' : 'Off'}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            <span className="text-sm">Voice Navigation</span>
          </div>
          <Button
            onClick={() => updateSettings({ 
              voiceNavigation: !settings.voiceNavigation 
            })}
            variant={settings.voiceNavigation ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs"
          >
            {settings.voiceNavigation ? 'On' : 'Off'}
          </Button>
        </div>
      </div>
    </Card>
  );
};