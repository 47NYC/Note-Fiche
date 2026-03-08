import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import JoinClass from "./pages/JoinClass";
import BrevetBlanc from "./pages/BrevetBlanc";
import AITutor from "./pages/AITutor";
import CalendrierPage from "./pages/Calendrier";
import ProfilePage from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import TeacherClass from "./pages/TeacherClass";
import TeacherDocs from "./pages/TeacherDocs";
import TeacherStudents from "./pages/TeacherStudents";
import Learn from "./pages/Learn";
import Flashcards from "./pages/Flashcards";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-class" element={<JoinClass />} />
            <Route path="/brevet-blanc" element={<BrevetBlanc />} />
            <Route path="/teacher-class" element={<TeacherClass />} />
            <Route path="/teacher-docs" element={<TeacherDocs />} />
            <Route path="/teacher-students" element={<TeacherStudents />} />
            <Route path="/ai-tutor" element={<AITutor />} />
            <Route path="/calendrier" element={<CalendrierPage />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/classement" element={<Leaderboard />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
