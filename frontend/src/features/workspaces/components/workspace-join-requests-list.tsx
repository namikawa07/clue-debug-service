"use client";

import { Check, X, Shield, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetJoinRequests } from "../api/use-get-join-requests";
import { useResolveJoinRequest } from "../api/use-resolve-join-request";

export const WorkspaceJoinRequestsList = () => {
  const workspaceId = useWorkspaceId();
  const { data: requests, isLoading } = useGetJoinRequests({ workspaceId });
  const { mutate: resolveRequest, isPending } = useResolveJoinRequest();

  const handleResolve = (requestId: string, approved: boolean) => {
    resolveRequest(
      { workspaceId, requestId, approved },
      {
        onSuccess: () => {
          toast.success(approved ? "Request approved" : "Request declined");
        },
      }
    );
  };

  const requestList = requests?.documents ?? [];

  return (
    <section className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Join Requests
            {requestList.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center size-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {requestList.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Review and approve pending workspace access requests.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-sm text-gray-400">Loading requests…</div>
      ) : requestList.length === 0 ? (
        <div className="p-10 text-center">
          <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <UserCheck size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No pending requests</p>
          <p className="text-xs text-gray-400 mt-1">
            New join requests will appear here for your review.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {requestList.map((request: any) => (
            <div
              key={request.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <MemberAvatar
                  className="size-9 shrink-0"
                  name={request.user?.name || request.user?.email || "Anonymous"}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {request.user?.name || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{request.user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleResolve(request.id, false)}
                  disabled={isPending}
                  variant="outline"
                  className="h-8 text-xs border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 gap-1.5"
                >
                  <X size={13} />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleResolve(request.id, true)}
                  disabled={isPending}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <Check size={13} />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
