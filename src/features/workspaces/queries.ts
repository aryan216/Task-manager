import "server-only";

import { getCurrent } from "@/features/auth/queries";
import { listWorkspaces } from "@/services/workspace-service";

export const getWorkspaces = async () => {
  const user = await getCurrent();
  if (!user) {
    return { documents: [], total: 0 };
  }

  return listWorkspaces(user.$id);
};
