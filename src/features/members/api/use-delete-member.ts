import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { client } from "@/lib/rpc";

type RequestType = InferRequestType<
	(typeof client.api.members)[":memberId"]["$delete"]
>;
type ResponseType = InferResponseType<
	(typeof client.api.members)[":memberId"]["$delete"],
	200
>;

export const useDeleteMember = () => {
	const queryClient = useQueryClient();

	const mutation = useMutation<ResponseType, Error, RequestType>({
		mutationFn: async ({ param }) => {
			const response = await client.api.members[":memberId"]["$delete"]({
				param,
			});

			if (!response.ok) {
				throw new Error("Failed to remove member");
			}

			return await response.json();
		},
		onSuccess: () => {
			toast.success("Member deleted");
			queryClient.invalidateQueries({ queryKey: ["members"] });
		},
		onError: () => {
			toast.error("Failed to remove member");
		},
	});
	return mutation;
};
