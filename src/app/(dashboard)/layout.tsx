import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { EditTaskModal } from "@/features/tasks/components/edit-task-modal";
import { CreateTaskModal } from "@/features/tasks/components/create-task-modal";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { CreateWorkspaceModal } from "@/features/workspaces/components/create-workspace-modal";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className=" min-h-screen">
      <CreateWorkspaceModal />
      <CreateProjectModal />
      <CreateTaskModal />
      <EditTaskModal />
      <div className=" flex w-full h-full">
        <div className="fixed left-0 top-0 hidden h-full w-[248px] overflow-y-auto lg:block">
          <Sidebar />
        </div>
        <div className="w-full lg:pl-[248px]">
          <div className="mx-auto h-full max-w-6xl">
            <Navbar />
            <main className="flex h-full flex-col px-6 py-8">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
