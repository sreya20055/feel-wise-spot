import { DyslexicFontDemo } from '@/components/DyslexicFontDemo';
import { ContrastDemo } from '@/components/ContrastDemo';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Type, Contrast } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FontTest() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">Accessibility Features Test</h1>
            <p className="text-sm text-muted-foreground">Test dyslexic fonts and high contrast mode</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="fonts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="fonts" className="gap-2">
              <Type className="h-4 w-4" />
              Dyslexic Fonts
            </TabsTrigger>
            <TabsTrigger value="contrast" className="gap-2">
              <Contrast className="h-4 w-4" />
              High Contrast
            </TabsTrigger>
          </TabsList>
          <TabsContent value="fonts">
            <DyslexicFontDemo />
          </TabsContent>
          <TabsContent value="contrast">
            <ContrastDemo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
