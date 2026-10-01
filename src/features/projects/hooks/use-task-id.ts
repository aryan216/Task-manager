import { useParams } from "next/navigation";

import { cleanRouteId } from "@/lib/utils";

export const useProjectId = () => {
  const params = useParams();
  return cleanRouteId(params.projectId);
};
