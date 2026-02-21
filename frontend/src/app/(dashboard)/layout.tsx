import { EditTaskModal } from "@/features/tasks/components/edit-task-modal";
import { CreateTaskModal } from "@/features/tasks/components/create-task-modal";
import { CreateEpicModal } from "@/features/epics/components/create-epic-modal";
import { CreateSpaceModal } from "@/features/spaces/components/create-space-modal";
import { CreateWorkspaceModal } from "@/features/workspaces/components/create-workspace-modal";
import { OnboardingGuard } from "@/features/auth/components/OnboardingGuard";
import { RealtimeWrapper } from "@/components/realtime-wrapper";

import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { AIChat } from "@/features/ai/components/ai-chat";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingGuard />
      <CreateWorkspaceModal />
      <CreateSpaceModal />
      <CreateTaskModal />
      <CreateEpicModal />
      <EditTaskModal />
      <RealtimeWrapper>
        <div className="flex w-full h-screen">
          {/* Sidebar — fixed, 224 px wide */}
          <div className="fixed left-0 top-0 hidden lg:flex lg:w-56 h-full z-30">
            <Sidebar />
          </div>

          {/* Main content area */}
          <div className="lg:pl-56 w-full flex flex-col h-screen overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </RealtimeWrapper>
      <AIChat />
    </div>
  );
};

export default DashboardLayout;
