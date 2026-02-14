"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DottedSeparator } from "@/components/dotted-separator";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { createEpicSchema } from "@/features/tasks/schemas";
import { useCreateEpic } from "../api/use-create-epic";
import { useSpaceId } from "@/features/spaces/hooks/use-space-id";

interface CreateEpicFormProps {
    onCancel?: () => void;
}

export const CreateEpicForm = ({ onCancel }: CreateEpicFormProps) => {
    const spaceId = useSpaceId();
    const { mutate, isPending } = useCreateEpic();

    const form = useForm<any>({
        resolver: zodResolver(createEpicSchema),
        defaultValues: {
            title: "",
            status: "todo",
            priority: "medium",
            spaceId: spaceId,
        }
    });

    const onSubmit = (values: z.infer<typeof createEpicSchema>) => {
        mutate({ ...values, spaceId }, {
            onSuccess: () => {
                form.reset();
                // onCancel?.(); // Keep open to create multiple? Or close? User choice. Let's keep open for now or reset.
            }
        });
    };

    return (
        <Card className="w-full h-full border-none shadow-none">
            <CardHeader className="flex p-7">
                <CardTitle className="text-xl font-bold">
                    Create a new epic
                </CardTitle>
            </CardHeader>
            <div className="px-7">
                <DottedSeparator />
            </div>
            <CardContent className="p-7">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Epic Title</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Enter epic title" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                defaultValue={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <FormMessage />
                                                <SelectContent>
                                                    <SelectItem value="todo">Todo</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="done">Done</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select
                                                defaultValue={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select priority" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <FormMessage />
                                                <SelectContent>
                                                    <SelectItem value="critical">Critical</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <DottedSeparator className="py-7" />
                        <div className="flex items-center justify-end">
                            <Button type="submit" size="lg" disabled={isPending}>
                                {isPending ? <Loader className="animate-spin size-4 mr-2" /> : null}
                                Create Epic
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
