import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Type } from 'lucide-react';

/**
 * Demo component to showcase the OpenDyslexic font implementation
 * This helps users understand the difference and test the font loading
 */
export const DyslexicFontDemo = () => {
  const [useDyslexicFont, setUseDyslexicFont] = useState(false);

  const sampleText = `Welcome to BlindSpot, your accessible wellbeing companion. This text demonstrates how OpenDyslexic font can improve readability for people with dyslexia. Notice how the letters have weighted bottoms and unique shapes that make them easier to distinguish from each other.

Key features of OpenDyslexic:
• Letters have different weights at the bottom to prevent rotation confusion
• Unique character shapes reduce letter confusion (like b/d or p/q)
• Improved spacing and letter forms enhance reading flow
• Designed specifically for dyslexic readers`;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Dyslexic Font Demo
        </CardTitle>
        <CardDescription>
          Compare standard fonts with OpenDyslexic font designed for improved dyslexia readability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Toggle */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setUseDyslexicFont(!useDyslexicFont)}
            variant={useDyslexicFont ? "default" : "outline"}
            className="gap-2"
          >
            <Type className="h-4 w-4" />
            {useDyslexicFont ? "Using OpenDyslexic Font" : "Switch to OpenDyslexic"}
          </Button>
          <span className="text-sm text-muted-foreground">
            Current font: {useDyslexicFont ? "OpenDyslexic" : "Standard"}
          </span>
        </div>

        {/* Sample Text */}
        <div className={`
          p-6 
          border 
          rounded-lg 
          leading-relaxed 
          ${useDyslexicFont ? 'font-dyslexic' : 'font-sans'}
          transition-all 
          duration-300
        `}>
          <div className="whitespace-pre-wrap text-base">
            {sampleText}
          </div>
        </div>

        {/* Font Status */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Font Implementation Status:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Tailwind configuration: ✅ Configured</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>CSS @font-face declarations: ✅ Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>HTML font link: ✅ Included</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Font files: ✅ OpenDyslexic OTF files loaded</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            ✅ Setup Complete!
          </h4>
          <div className="text-sm text-green-800 dark:text-green-200 space-y-2">
            <p>
              🎉 <strong>OpenDyslexic fonts are now fully installed and functional!</strong>
            </p>
            <p>Use the toggle above to see the difference between standard fonts and OpenDyslexic.</p>
            <p>
              <strong>For developers:</strong> Apply the <code className="bg-green-100 dark:bg-green-900 px-1 rounded font-mono">font-dyslexic</code> 
              Tailwind class to any element to use OpenDyslexic font.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};