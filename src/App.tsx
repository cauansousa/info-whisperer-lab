import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SuperAdminRoute from "@/components/SuperAdminRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Invite from "./pages/Invite";
import Onboarding from "./pages/Onboarding";
import ChatView from "./pages/Chat";
import ChatConversation from "./pages/ChatConversation";
import Libraries from "./pages/Libraries";
import LibraryDetail from "./pages/LibraryDetail";
import Agents from "./pages/Agents";
import UserLibraries from "./pages/UserLibraries";
import UserLibraryDetail from "@/pages/UserLibraryDetail";
import UserAgents from "./pages/UserAgents";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Organization from "./pages/Organization";
import AIConfig from "./pages/AIConfig";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected dashboard routes */}
            <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<ChatView />} />
              <Route path="chat/:chatId" element={<ChatConversation />} />
              <Route path="libraries" element={<UserLibraries />} />
              <Route path="libraries/:libraryId" element={<UserLibraryDetail />} />
              <Route path="agents" element={<UserAgents />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="libraries" element={<Libraries />} />
              <Route path="libraries/:libraryId" element={<LibraryDetail />} />
              <Route path="agents" element={<Agents />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:groupId" element={<GroupDetail />} />
              <Route path="organization" element={<Organization />} />
              <Route path="ai-config" element={<AIConfig />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
