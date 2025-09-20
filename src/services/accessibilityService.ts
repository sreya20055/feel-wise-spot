import { supabase } from '@/integrations/supabase/client';

export interface AccessibilitySettings {
  id?: string;
  user_id: string;
  high_contrast: boolean;
  large_text: boolean;
  reduced_motion: boolean;
  screen_reader_optimized: boolean;
  color_blind_support: boolean;
  keyboard_navigation: boolean;
  focus_indicators: boolean;
  alt_text_enabled: boolean;
  captions_enabled: boolean;
  voice_control: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AccessibilityTransformation {
  id: string;
  name: string;
  description: string;
  category: 'visual' | 'motor' | 'cognitive' | 'hearing' | 'comprehensive';
  settings: Partial<AccessibilitySettings>;
  cssRules: string;
  jsTransformations: string;
  enabled: boolean;
}

export interface WebsiteProfile {
  id?: string;
  url: string;
  name: string;
  transformations: AccessibilityTransformation[];
  user_settings: AccessibilitySettings;
  created_at?: string;
  updated_at?: string;
}

export interface AccessibilityAnalytics {
  id?: string;
  user_id: string;
  website_url: string;
  transformation_used: string;
  usage_duration: number;
  effectiveness_rating?: number;
  feedback?: string;
  timestamp: string;
}

class AccessibilityService {
  // Predefined accessibility transformations
  private transformations: AccessibilityTransformation[] = [
    {
      id: 'high-contrast',
      name: 'High Contrast Mode',
      description: 'Increases contrast between text and background for better readability',
      category: 'visual',
      settings: { high_contrast: true },
      cssRules: `
        * {
          filter: contrast(200%) !important;
        }
        body, div, span, p, h1, h2, h3, h4, h5, h6 {
          background-color: black !important;
          color: white !important;
        }
        a, button {
          color: yellow !important;
          text-decoration: underline !important;
        }
        input, textarea, select {
          background-color: white !important;
          color: black !important;
          border: 2px solid yellow !important;
        }
      `,
      jsTransformations: `
        document.body.classList.add('high-contrast-mode');
        const links = document.querySelectorAll('a');
        links.forEach(link => {
          link.style.outline = '2px solid yellow';
        });
      `,
      enabled: true
    },
    {
      id: 'large-text',
      name: 'Large Text',
      description: 'Increases font size across the website for better readability',
      category: 'visual',
      settings: { large_text: true },
      cssRules: `
        * {
          font-size: 150% !important;
          line-height: 1.6 !important;
        }
        h1, h2, h3, h4, h5, h6 {
          font-size: 200% !important;
        }
      `,
      jsTransformations: `
        document.body.style.zoom = '1.25';
      `,
      enabled: true
    },
    {
      id: 'reduced-motion',
      name: 'Reduced Motion',
      description: 'Minimizes animations and transitions for users sensitive to motion',
      category: 'visual',
      settings: { reduced_motion: true },
      cssRules: `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `,
      jsTransformations: `
        const style = document.createElement('style');
        style.textContent = 'video { animation-play-state: paused !important; }';
        document.head.appendChild(style);
      `,
      enabled: true
    },
    {
      id: 'keyboard-navigation',
      name: 'Enhanced Keyboard Navigation',
      description: 'Improves keyboard navigation with visible focus indicators',
      category: 'motor',
      settings: { keyboard_navigation: true, focus_indicators: true },
      cssRules: `
        *:focus {
          outline: 3px solid #007cba !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 5px rgba(0, 124, 186, 0.3) !important;
        }
        button:focus, a:focus, input:focus, textarea:focus, select:focus {
          background-color: #007cba !important;
          color: white !important;
        }
      `,
      jsTransformations: `
        // Add keyboard navigation helpers
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
          }
        });
        
        // Skip links for screen readers
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = 'position: absolute; top: -40px; left: 6px; z-index: 999999; color: white; background: black; padding: 8px; text-decoration: none;';
        skipLink.addEventListener('focus', () => {
          skipLink.style.top = '6px';
        });
        document.body.insertBefore(skipLink, document.body.firstChild);
      `,
      enabled: true
    },
    {
      id: 'screen-reader',
      name: 'Screen Reader Optimization',
      description: 'Adds ARIA labels and improves semantic structure for screen readers',
      category: 'visual',
      settings: { screen_reader_optimized: true, alt_text_enabled: true },
      cssRules: `
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
      `,
      jsTransformations: `
        // Add missing alt text
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach((img, index) => {
          img.alt = 'Image ' + (index + 1);
        });
        
        // Add ARIA labels to buttons without text
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach((button, index) => {
          if (!button.textContent.trim()) {
            button.setAttribute('aria-label', 'Button ' + (index + 1));
          }
        });
        
        // Add landmark roles
        const main = document.querySelector('main') || document.querySelector('#main') || document.querySelector('.main');
        if (main && !main.getAttribute('role')) {
          main.setAttribute('role', 'main');
        }
        
        // Add heading structure helpers
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, index) => {
          if (index === 0 && !heading.getAttribute('id')) {
            heading.id = 'main-heading';
          }
        });
      `,
      enabled: true
    },
    {
      id: 'color-blind-support',
      name: 'Color Blind Support',
      description: 'Adjusts colors and adds patterns for color blind users',
      category: 'visual',
      settings: { color_blind_support: true },
      cssRules: `
        /* Deuteranopia filter */
        .color-blind-filter {
          filter: url('#deuteranopia') !important;
        }
        
        /* Add patterns to color-coded elements */
        .error, .danger, [style*="color: red"], [class*="red"] {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px) !important;
        }
        
        .success, [style*="color: green"], [class*="green"] {
          background-image: repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px) !important;
        }
        
        .warning, [style*="color: yellow"], [class*="yellow"] {
          background-image: repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px) !important;
        }
      `,
      jsTransformations: `
        // Add SVG filter for color blindness simulation
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.cssText = 'position: absolute; width: 0; height: 0;';
        svg.innerHTML = \`
          <defs>
            <filter id="deuteranopia">
              <feColorMatrix values="0.43 0.72 -.15 0 0
                                     0.34 0.57 0.09 0 0
                                     -.02 0.03 1.00 0 0
                                     0 0 0 1 0"/>
            </filter>
          </defs>
        \`;
        document.body.appendChild(svg);
      `,
      enabled: true
    },
    {
      id: 'cognitive-support',
      name: 'Cognitive Support',
      description: 'Simplifies layouts and adds reading aids for cognitive accessibility',
      category: 'cognitive',
      settings: { reduced_motion: true },
      cssRules: `
        /* Simplify layouts */
        * {
          max-width: 65ch !important;
          margin: 0 auto !important;
        }
        
        /* Add reading guide */
        .reading-guide {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 3px !important;
          background: linear-gradient(to right, #007cba, #00a8cc) !important;
          z-index: 999999 !important;
          pointer-events: none !important;
        }
        
        /* Highlight paragraphs on hover */
        p:hover {
          background-color: rgba(0, 124, 186, 0.1) !important;
          padding: 8px !important;
          border-radius: 4px !important;
        }
      `,
      jsTransformations: `
        // Add reading guide
        const guide = document.createElement('div');
        guide.className = 'reading-guide';
        document.body.appendChild(guide);
        
        // Add definition tooltips for complex words
        const complexWords = ['accessibility', 'implementation', 'transformation', 'optimization'];
        const definitions = {
          'accessibility': 'Making content usable by people with disabilities',
          'implementation': 'The process of putting a plan into effect',
          'transformation': 'A marked change in form or appearance',
          'optimization': 'Making something as effective as possible'
        };
        
        complexWords.forEach(word => {
          const regex = new RegExp(\`\\b\${word}\\b\`, 'gi');
          document.body.innerHTML = document.body.innerHTML.replace(regex, 
            \`<span class="complex-word" title="\${definitions[word.toLowerCase()]}">\${word}</span>\`);
        });
      `,
      enabled: true
    }
  ];

  // Get user's accessibility settings
  async getUserSettings(userId: string): Promise<AccessibilitySettings | null> {
    try {
      const { data, error } = await supabase
        .from('accessibility_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching accessibility settings:', error);
      return null;
    }
  }

  // Update user's accessibility settings
  async updateUserSettings(userId: string, settings: Partial<AccessibilitySettings>): Promise<AccessibilitySettings> {
    try {
      const { data, error } = await supabase
        .from('accessibility_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
      throw error;
    }
  }

  // Get available transformations
  getTransformations(): AccessibilityTransformation[] {
    return this.transformations.filter(t => t.enabled);
  }

  // Get transformations by category
  getTransformationsByCategory(category: AccessibilityTransformation['category']): AccessibilityTransformation[] {
    return this.transformations.filter(t => t.category === category && t.enabled);
  }

  // Apply transformations to a webpage
  applyTransformations(transformations: AccessibilityTransformation[]): { css: string; js: string } {
    const css = transformations.map(t => t.cssRules).join('\n\n');
    const js = transformations.map(t => t.jsTransformations).join('\n\n');

    return { css, js };
  }

  // Generate accessibility overlay script
  generateOverlayScript(settings: AccessibilitySettings): string {
    const activeTransformations = this.transformations.filter(transformation => {
      return Object.keys(transformation.settings).some(key => 
        settings[key as keyof AccessibilitySettings] === true
      );
    });

    const { css, js } = this.applyTransformations(activeTransformations);

    return `
      (function() {
        // BlindSpot Accessibility Overlay
        console.log('BlindSpot Accessibility Overlay Loading...');
        
        // Apply CSS transformations
        const styleElement = document.createElement('style');
        styleElement.id = 'blindspot-accessibility-styles';
        styleElement.textContent = \`${css.replace(/`/g, '\\`')}\`;
        document.head.appendChild(styleElement);
        
        // Apply JavaScript transformations
        ${js}
        
        // Add BlindSpot indicator
        const indicator = document.createElement('div');
        indicator.id = 'blindspot-indicator';
        indicator.innerHTML = '♿ BlindSpot Active';
        indicator.style.cssText = \`
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #007cba;
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          z-index: 999999;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        \`;
        document.body.appendChild(indicator);
        
        console.log('BlindSpot Accessibility Overlay Active');
      })();
    `;
  }

  // Save website profile
  async saveWebsiteProfile(profile: Omit<WebsiteProfile, 'id' | 'created_at' | 'updated_at'>): Promise<WebsiteProfile> {
    try {
      const { data, error } = await supabase
        .from('website_profiles')
        .insert({
          url: profile.url,
          name: profile.name,
          transformations: profile.transformations,
          user_settings: profile.user_settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving website profile:', error);
      throw error;
    }
  }

  // Get website profiles
  async getWebsiteProfiles(userId: string): Promise<WebsiteProfile[]> {
    try {
      const { data, error } = await supabase
        .from('website_profiles')
        .select('*')
        .eq('user_settings->>user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching website profiles:', error);
      return [];
    }
  }

  // Track accessibility analytics
  async trackUsage(analytics: Omit<AccessibilityAnalytics, 'id'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('accessibility_analytics')
        .insert({
          user_id: analytics.user_id,
          website_url: analytics.website_url,
          transformation_used: analytics.transformation_used,
          usage_duration: analytics.usage_duration,
          effectiveness_rating: analytics.effectiveness_rating,
          feedback: analytics.feedback,
          timestamp: analytics.timestamp
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking accessibility usage:', error);
    }
  }

  // Get usage analytics
  async getUsageAnalytics(userId: string): Promise<AccessibilityAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('accessibility_analytics')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      return [];
    }
  }

  // Test accessibility on a webpage
  async testWebsiteAccessibility(url: string): Promise<{
    score: number;
    issues: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      suggestions: string[];
    }>;
    recommendations: AccessibilityTransformation[];
  }> {
    // Simulated accessibility testing (in production, this would use axe-core or similar)
    const mockIssues = [
      {
        type: 'Missing Alt Text',
        severity: 'high' as const,
        description: 'Images found without alternative text',
        suggestions: ['Add descriptive alt text to all images', 'Use empty alt="" for decorative images']
      },
      {
        type: 'Low Contrast',
        severity: 'medium' as const,
        description: 'Text contrast ratio below WCAG standards',
        suggestions: ['Increase color contrast', 'Use high contrast mode']
      },
      {
        type: 'Missing Form Labels',
        severity: 'high' as const,
        description: 'Form inputs without associated labels',
        suggestions: ['Add labels to all form inputs', 'Use aria-label for icon buttons']
      }
    ];

    const score = Math.max(20, 100 - (mockIssues.length * 15));
    const recommendations = this.transformations.filter(t => 
      mockIssues.some(issue => 
        (issue.type.includes('Alt Text') && t.id === 'screen-reader') ||
        (issue.type.includes('Contrast') && t.id === 'high-contrast') ||
        (issue.type.includes('Form') && t.id === 'keyboard-navigation')
      )
    );

    return {
      score,
      issues: mockIssues,
      recommendations
    };
  }
}

export const accessibilityService = new AccessibilityService();
export default accessibilityService;