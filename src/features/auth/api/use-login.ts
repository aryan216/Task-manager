import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";

import { client } from "@/lib/rpc";

import { toast } from "sonner";

type RequestType = InferRequestType<(typeof client.api.auth.login)["$post"]>;
type ResponseType = InferResponseType<(typeof client.api.auth.login)["$post"]>;

export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.auth.login["$post"]({ json });

      if (!response.ok) {
        throw new Error(await errorMessage(response, "Failed to Login"));
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Logged in");
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["current"] });
    },
    onError: (error) => {
      toast.error(toastMessage(error, "Failed to Log In"));
    },
  });
  return mutation;
};

const RATE_LIMIT_MESSAGE = "Too many attempts. Try again later.";

async function errorMessage(response: Response, fallback: string) {
  if (response.status !== 429) {
    return fallback;
  }

  const body = (await response.text()).trim();
  return body || RATE_LIMIT_MESSAGE;
}

function toastMessage(error: Error, fallback: string) {
  return error.message === RATE_LIMIT_MESSAGE ? error.message : fallback;
}
