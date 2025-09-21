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
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Font files: ⚠️ Placeholders (download real fonts)</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📥 To Complete Setup:
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>Visit <a href="https://opendyslexic.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">opendyslexic.org</a></li>
            <li>Download the OpenDyslexic font package</li>
            <li>Extract WOFF2/WOFF files to <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/public/fonts/dyslexic/</code></li>
            <li>Replace placeholder files with real font files</li>
            <li>Refresh this page to test the actual font</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};