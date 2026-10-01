import { useParams } from "next/navigation";

import { cleanRouteId } from "@/lib/utils";

export const useTaskId = () => {
  const params = useParams();
  return cleanRouteId(params.taskId);
};
