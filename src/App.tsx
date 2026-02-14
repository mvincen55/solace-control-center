import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import ChatPage from "@/pages/ChatPage";
import AgentsPage from "@/pages/AgentsPage";
import UsagePage from "@/pages/UsagePage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<ChatPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/usage" element={<UsagePage />} />
            <Route path="/activity" element={<PlaceholderPage title="Activity Feed" description="Real-time scrolling feed of Sol's actions — tool calls, file operations, sub-agent spawns. Coming soon." />} />
            <Route path="/projects" element={<PlaceholderPage title="Projects & Research" description="Browse Sol's active research projects, track claims, and view timelines. Coming soon." />} />
            <Route path="/memory" element={<PlaceholderPage title="Memory & Identity" description="Browse Sol's memory files, daily logs, and identity documents. Coming soon." />} />
            <Route path="/files" element={<PlaceholderPage title="File Browser" description="Tree view of Sol's workspace directory with file previews. Coming soon." />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" description="Connection config, budget limits, and display preferences. Coming soon." />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
