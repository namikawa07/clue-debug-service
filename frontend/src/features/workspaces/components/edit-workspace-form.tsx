"use client";

import { z } from "zod";
import { useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon, ImageIcon, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Workspace } from "../types";
import useConfirm from "@/hooks/use-confirm";
import { updateWorkspaceSchema } from "../schemas";
import { useUpdateWorkspace } from "../api/use-update-workspace";
import { useDeleteWorkspace } from "../api/use-delete-workspace";
import { useResetInviteCode } from "../api/use-reset-invite-code";

interface EditWorkspaceFormProps {
  onCancel?: () => void;
  initialValues: Workspace;
}

export const EditWorkspaceForm = ({ initialValues }: EditWorkspaceFormProps) => {
  const { mutate: updateWorkspace, isPending } = useUpdateWorkspace();
  const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } = useDeleteWorkspace();
  const { mutate: resetInviteCode, isPending: isResettingInviteCode } = useResetInviteCode();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Workspace",
    `This will permanently delete "${initialValues.name}" and all associated data. This action cannot be undone.`,
    "destructive"
  );
  const [ResetDialog, confirmReset] = useConfirm(
    "Reset Invite Link",
    "All existing invite links will be invalidated immediately. New members will need the updated link.",
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      ...initialValues,
      image: initialValues.imageUrl ?? "",
    },
  });

  const onSubmit = (values: z.infer<typeof updateWorkspaceSchema>) => {
    updateWorkspace({
      form: {
        ...values,
        image: values.image instanceof File ? values.image : "",
        name: values.name || initialValues.name,
      },
      param: { workspaceId: initialValues.$id },
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) form.setValue("image", file);
  };

  const fullInviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/workspaces/${initialValues.$id}/join/${initialValues.inviteCode}`
    : "";

  const handleCopyInviteLink = () => {
    navigator.clipboard
      .writeText(fullInviteLink)
      .then(() => toast.success("Invite link copied to clipboard"))
      .catch(() => toast.error("Failed to copy invite link"));
  };

  const handleResetInviteCode = async () => {
    const ok = await confirmReset();
    if (!ok) return;
    resetInviteCode({ param: { workspaceId: initialValues.$id } });
  };

  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (!ok) return;
    deleteWorkspace(
      { param: { workspaceId: initialValues.$id } },
      { onSuccess: () => { window.location.href = "/"; } }
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <DeleteDialog />
      <ResetDialog />

      {/* ── Workspace details ── */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Workspace Details</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Workspace Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Acme Corp"
                      className="h-9 border-gray-200 focus-visible:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Workspace Icon</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      {field.value ? (
                        <div className="size-16 relative rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <Image
                            alt="Workspace Icon"
                            fill
                            className="object-cover"
                            src={
                              field.value instanceof File
                                ? URL.createObjectURL(field.value)
                                : field.value
                            }
                          />
                        </div>
                      ) : (
                        <Avatar className="size-16 rounded-xl border border-gray-200 shrink-0">
                          <AvatarFallback className="rounded-xl bg-gray-50">
                            <ImageIcon className="size-6 text-gray-300" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-gray-500">JPG, PNG, SVG or JPEG · max 1 MB</p>
                        <Input
                          type="file"
                          accept=".jpg,.png,.svg,.jpeg"
                          className="hidden"
                          ref={inputRef}
                          disabled={isPending}
                          onChange={handleImageChange}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => inputRef.current?.click()}
                            className="h-8 text-xs border-gray-200 gap-1.5"
                          >
                            <Upload size={12} />
                            {field.value ? "Change" : "Upload"}
                          </Button>
                          {field.value && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                field.onChange(null);
                                if (inputRef.current) inputRef.current.value = "";
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5"
              >
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </section>

      {/* ── Invite link ── */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Invite Link</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Share this link to invite new members to your workspace.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isResettingInviteCode}
            onClick={handleResetInviteCode}
            className="h-8 text-xs text-gray-500 hover:text-gray-700 gap-1.5 shrink-0"
          >
            <RefreshCw size={12} className={isResettingInviteCode ? "animate-spin" : ""} />
            Reset link
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            readOnly
            value={fullInviteLink}
            className="h-9 bg-gray-50 border-gray-200 text-sm text-gray-600 font-mono focus-visible:ring-0"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopyInviteLink}
            className="h-9 shrink-0 border-gray-200 gap-1.5"
          >
            <CopyIcon size={14} />
            Copy
          </Button>
        </div>
      </section>

      {/* ── Danger zone ── */}
      <section className="bg-white border border-red-100 rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently delete this workspace and all its data. This cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending || isDeletingWorkspace}
            onClick={handleDelete}
            className="shrink-0 gap-1.5 h-8"
          >
            <Trash2 size={13} />
            Delete Workspace
          </Button>
        </div>
      </section>
    </div>
  );
};
