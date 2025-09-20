import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AccessibilityToggle } from "@/components/AccessibilityToggle";

// Import Tavus test utility in development
if (import.meta.env.DEV) {
  import('@/utils/tavusTest');
}
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MoodTracking from "./pages/MoodTracking";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import AICompanion from "./pages/AICompanion";
import Journal from "./pages/Journal";
import Community from "./pages/Community";
import Progress from "./pages/Progress";
import Accessibility from "./pages/Accessibility";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AccessibilityProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mood" element={<MoodTracking />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/course/:courseId" element={<CourseDetail />} />
              <Route path="/ai-companion" element={<AICompanion />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/community" element={<Community />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/accessibility" element={<Accessibility />} />
              <Route path="/analytics" element={<Analytics />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AccessibilityToggle />
          </BrowserRouter>
        </AccessibilityProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
