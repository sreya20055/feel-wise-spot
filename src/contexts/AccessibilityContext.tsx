import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large';
  contrast: 'normal' | 'high';
  font: 'default' | 'dyslexic';
  voiceNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  isLoading: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  contrast: 'normal',
  font: 'default',
  voiceNavigation: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    applySettings();
  }, [settings]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('accessibility_preferences')
        .eq('user_id', user.id)
        .single();

      if (profile?.accessibility_preferences && typeof profile.accessibility_preferences === 'object') {
        setSettings({ ...defaultSettings, ...profile.accessibility_preferences });
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  const applySettings = () => {
    const root = document.documentElement;
    
    // Apply font size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (settings.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
    }

    // Apply contrast
    if (settings.contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply font
    if (settings.font === 'dyslexic') {
      root.classList.add('font-dyslexic');
    } else {
      root.classList.remove('font-dyslexic');
    }
  };

  const updateSettings = async (newSettings: Partial<AccessibilitySettings>) => {
    setIsLoading(true);
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ accessibility_preferences: updatedSettings })
          .eq('user_id', user.id);
      }
      
      toast({
        title: "Settings updated",
        description: "Your accessibility preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
      toast({
        title: "Error",
        description: "Failed to save accessibility settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </AccessibilityContext.Provider>
  );
};