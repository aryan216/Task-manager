import { useParams } from "next/navigation";

import { cleanRouteId } from "@/lib/utils";

export const useWorkspaceId = () => {
  const params = useParams();
  return cleanRouteId(params.workspaceId);
};
