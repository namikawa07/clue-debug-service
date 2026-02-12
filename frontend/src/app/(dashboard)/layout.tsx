import { EditTaskModal } from "@/features/tasks/components/edit-task-modal";
import { CreateTaskModal } from "@/features/tasks/components/create-task-modal";
import { CreateProjectModel } from "@/features/projects/components/create-project-modal";
import { CreateWorkspaceModal } from "@/features/workspaces/components/create-workspace-modal";
import { NameCheckWrapper } from "@/features/auth/components/NameCheckWrapper";
import { OnboardingGuard } from "@/features/auth/components/OnboardingGuard";
import { RealtimeWrapper } from "@/components/realtime-wrapper";

import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <OnboardingGuard />
      <CreateWorkspaceModal />
      <CreateProjectModel />
      <CreateTaskModal />
      <EditTaskModal />
      <RealtimeWrapper>
        <div className="flex w-full h-screen">
          {/* Sidebar - w-56 (224px) to match snippet */}
          <div className="fixed left-0 top-0 hidden lg:block lg:w-56 h-full overflow-y-auto border-r border-gray-200 bg-white z-30">
            <Sidebar />
          </div>
          {/* Main content area - pl-56 */}
          <div className="lg:pl-56 w-full flex flex-col h-screen">
            <Navbar />
            <main className="flex-1 overflow-y-auto py-6 px-6">{children}</main>
          </div>
        </div>
      </RealtimeWrapper>
    </div>
  );
};

export default DashboardLayout;
