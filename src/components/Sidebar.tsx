import { Navigation } from "./Navigation";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Projects } from "./projects";
import { BrandMark } from "./brand-mark";

export const Sidebar = () => {
  return (
    <aside className="flex h-full w-full flex-col gap-6 border-r border-border bg-background px-3 py-4">
      <BrandMark className="px-2" />
      <WorkspaceSwitcher />
      <Navigation />
      <Projects />
    </aside>
  );
};
