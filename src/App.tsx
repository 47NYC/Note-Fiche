import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import JoinClass from "./pages/JoinClass";
import BrevetBlanc from "./pages/BrevetBlanc";
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-class" element={<JoinClass />} />
            <Route path="/brevet-blanc" element={<BrevetBlanc />} />
            <Route path="/teacher-class" element={<Dashboard />} />
            <Route path="/teacher-docs" element={<Dashboard />} />
            <Route path="/teacher-students" element={<Dashboard />} />
            <Route path="/learn" element={<Dashboard />} />
            <Route path="/flashcards" element={<Dashboard />} />
            <Route path="/badges" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
