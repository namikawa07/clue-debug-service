"use client";

import { z } from "zod";
import Image from "next/image";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Trash2, Upload } from "lucide-react";

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

import useConfirm from "@/hooks/use-confirm";
import { Space } from "../types";
import { updateSpaceSchema } from "../schemas";
import { useUpdateSpace } from "../api/use-update-space";
import { useDeleteSpace } from "../api/use-delete-space";

interface EditSpaceFormProps {
  onCancel?: () => void;
  initialValues: Space;
}

export const EditSpaceForm = ({ initialValues }: EditSpaceFormProps) => {
  const { mutate: updateSpace, isPending } = useUpdateSpace();
  const { mutate: deleteSpace, isPending: isDeletingSpace } = useDeleteSpace();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Space",
    `This will permanently delete "${initialValues.name}" and all associated tasks. This action cannot be undone.`,
    "destructive"
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof updateSpaceSchema>>({
    resolver: zodResolver(updateSpaceSchema),
    defaultValues: {
      ...initialValues,
      image: initialValues.imageUrl ?? "",
    },
  });

  const onSubmit = (values: z.infer<typeof updateSpaceSchema>) => {
    updateSpace({
      form: {
        ...values,
        image: values.image instanceof File ? values.image : "",
        name: values.name || "",
      },
      param: { spaceId: initialValues.$id },
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) form.setValue("image", file);
  };

  const handleDelete = async () => {
    const ok = await confirmDelete();
    if (!ok) return;
    deleteSpace(
      { param: { spaceId: initialValues.$id } },
      { onSuccess: () => { window.location.href = `/workspaces/${initialValues.workspaceId}`; } }
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <DeleteDialog />

      {/* ── Space details ── */}
      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Space Details</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Space Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Frontend, Design, Marketing"
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
                  <FormLabel className="text-sm font-medium text-gray-700">Space Icon</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      {field.value ? (
                        <div className="size-16 relative rounded-xl overflow-hidden border border-gray-200 shrink-0">
                          <Image
                            alt="Space Icon"
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

      {/* ── Danger zone ── */}
      <section className="bg-white border border-red-100 rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Permanently delete this space and all its tasks. This cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending || isDeletingSpace}
            onClick={handleDelete}
            className="shrink-0 gap-1.5 h-8"
          >
            <Trash2 size={13} />
            Delete Space
          </Button>
        </div>
      </section>
    </div>
  );
};
