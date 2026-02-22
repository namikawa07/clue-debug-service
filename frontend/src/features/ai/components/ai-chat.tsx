"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, Send, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { usePageContext } from "../hooks/use-page-context";
import Image from "next/image";


interface AiAgentResponse {
    content: string;
    role: string;
    tool_calls_made?: string[] | null;
}


// ── Rich message renderer ───────────────────────────────────────────────────
// Parses @[Name](member:id) and #[Title](task:id) patterns into styled elements
const RichMessage = ({ content, workspaceId }: { content: string; workspaceId: string }) => {
    const parts = useMemo(() => {
        const tokens: { type: "text" | "member" | "task"; value: string; id?: string }[] = [];
        // Match @[Name](member:id) and #[Title](task:id)
        const regex = /(@\[([^\]]+)\]\(member:([^)]+)\))|(#\[([^\]]+)\]\(task:([^)]+)\))/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(content)) !== null) {
            // Push preceding text
            if (match.index > lastIndex) {
                tokens.push({ type: "text", value: content.slice(lastIndex, match.index) });
            }

            if (match[1]) {
                // Member reference
                tokens.push({ type: "member", value: match[2], id: match[3] });
            } else if (match[4]) {
                // Task reference
                tokens.push({ type: "task", value: match[5], id: match[6] });
            }

            lastIndex = match.index + match[0].length;
        }

        // Push trailing text
        if (lastIndex < content.length) {
            tokens.push({ type: "text", value: content.slice(lastIndex) });
        }

        return tokens;
    }, [content]);

    return (
        <span>
            {parts.map((part, i) => {
                if (part.type === "member") {
                    return (
                        <span
                            key={i}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 bg-neutral-200/80 dark:bg-neutral-700/80 text-neutral-700 dark:text-neutral-200 rounded-md text-xs font-medium"
                        >
                            @{part.value}
                        </span>
                    );
                }
                if (part.type === "task") {
                    return (
                        <a
                            key={i}
                            href={`/workspaces/${workspaceId}/tasks/${part.id}`}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium hover:underline cursor-pointer"
                        >
                            #{part.value}
                        </a>
                    );
                }
                return <span key={i}>{part.value}</span>;
            })}
        </span>
    );
};


export const AIChat = () => {
    const workspaceId = useWorkspaceId();
    const queryClient = useQueryClient();
    const pageContext = usePageContext();
    const { data: members } = useGetMembers({ workspaceId });

    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedModel, setSelectedModel] = useState<"kimi" | "qwen">("kimi");
    const [isThinking, setIsThinking] = useState(false);

    const [mentionQuery, setMentionQuery] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai", content: string }[]>([
        { role: "ai", content: "Hello! I can create tasks, look up your team, and manage your workspace. Just ask!" }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isOpen]);

    const onSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isThinking) return;

        const userMessage = message;
        setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);
        setMessage("");
        setIsThinking(true);

        try {
            const data = await api.post<AiAgentResponse>("/ai-agent", {
                message: userMessage,
                workspaceId: workspaceId,
                model: selectedModel,
                chatHistory: chatHistory,
                pageContext: {
                    pageName: pageContext.pageName,
                    spaceId: pageContext.spaceId,
                    epicId: pageContext.epicId,
                    taskId: pageContext.taskId,
                },
            });


            setChatHistory((prev) => [...prev, { role: "ai", content: data.content }]);

            // ── Auto-refresh logic ──────────────────────────────────────
            if (data.tool_calls_made?.length) {
                const tools = data.tool_calls_made;
                if (tools.some(tc => ["create_task", "update_task", "delete_task"].includes(tc))) {
                    queryClient.invalidateQueries({ queryKey: ["tasks"] });
                }
                if (tools.some(tc => ["create_epic", "update_epic"].includes(tc))) {
                    queryClient.invalidateQueries({ queryKey: ["epics"] });
                }
                if (tools.some(tc => ["create_space", "update_space", "delete_space"].includes(tc))) {
                    queryClient.invalidateQueries({ queryKey: ["spaces"] });
                }
                if (tools.some(tc => ["get_teams", "create_team", "update_team", "delete_team", "add_team_member", "remove_team_member"].includes(tc))) {
                    queryClient.invalidateQueries({ queryKey: ["teams"] });
                }
                // Plan execution creates many entities at once
                if (tools.some(tc => tc === "execute_plan")) {
                    queryClient.invalidateQueries({ queryKey: ["tasks"] });
                    queryClient.invalidateQueries({ queryKey: ["epics"] });
                    queryClient.invalidateQueries({ queryKey: ["spaces"] });
                }
            }
        } catch (error: any) {
            console.error("AI Chat Error:", error);
            setChatHistory((prev) => [...prev, {
                role: "ai",
                content: `Error: ${error.message || "Something went wrong. Please try again later."}`
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    // ── @mention logic ──────────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMessage(val);

        const lastAt = val.lastIndexOf("@");
        const cursorPosition = e.target.selectionStart || 0;

        if (lastAt !== -1 && cursorPosition > lastAt) {
            const query = val.substring(lastAt + 1, cursorPosition);
            if (!query.includes(" ")) {
                setMentionQuery(query);
                setShowMentions(true);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const selectMember = (memberName: string) => {
        const lastAt = message.lastIndexOf("@");
        const beforeAt = message.substring(0, lastAt);
        const afterMention = message.substring(inputRef.current?.selectionStart || message.length);

        setMessage(beforeAt + "@" + memberName + " " + afterMention);
        setShowMentions(false);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = beforeAt.length + memberName.length + 2; // +2 for @ and space
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const filteredMembers = members?.documents.filter(m =>
        m.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(mentionQuery.toLowerCase())
    ).slice(0, 5) || [];

    return (
        <div className="fixed inset-x-0 bottom-6 pointer-events-none z-50 flex justify-center">
            <div className="pointer-events-auto flex flex-col items-center">
                {/* Chat Window */}
                {isOpen && (
                    <div className={cn(
                        "mb-4 w-[400px] h-[550px] bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-4 zoom-in-95",
                        "dark:bg-neutral-900/80 dark:border-neutral-800/50"
                    )}>
                        {/* Header */}
                        <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
                            <div className="flex items-center gap-x-2">
                                <div className="bg-white/20 rounded-lg">
                                    <Image src="/images/finepro-lglogo.jpg" className="rounded-lg" alt="FinePro AI Avatar" width={30} height={30} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-sm font-semibold">FinePro AI Assistant</h3>
                                    <div className="flex items-center gap-x-1">
                                        <div className="size-1.5 bg-green-400 rounded-full animate-pulse" />
                                        <span className="text-[10px] opacity-80 uppercase tracking-tighter">
                                            {selectedModel === 'qwen' ? 'Qwen 3 Coder' : 'Kimi 2.5'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-primary-foreground hover:bg-white/10 h-8 w-8"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-neutral-800"
                        >
                            {chatHistory.map((msg, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "max-w-[85%] p-3 rounded-2xl text-sm animate-in fade-in duration-300",
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                                            : "bg-neutral-100 text-neutral-800 mr-auto rounded-tl-none dark:bg-neutral-800 dark:text-neutral-200"
                                    )}
                                >
                                    {msg.role === "ai" ? (
                                        <RichMessage content={msg.content} workspaceId={workspaceId} />
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            ))}
                            {isThinking && (
                                <div className="flex items-center gap-x-2 mr-auto bg-neutral-100 text-neutral-500 p-3 rounded-2xl rounded-tl-none dark:bg-neutral-800">
                                    <Loader2 className="size-4 animate-spin" />
                                    <span className="text-xs italic">AI is thinking...</span>
                                </div>
                            )}
                        </div>

                        {/* Mention List UI */}
                        {showMentions && filteredMembers.length > 0 && (
                            <div className="absolute bottom-[110px] left-4 right-4 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-xl shadow-2xl p-1 z-10 animate-in slide-in-from-bottom-2 dark:bg-neutral-900/95 dark:border-neutral-700">
                                <div className="px-2 py-1.5 text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                                    Workspace Members
                                </div>
                                {filteredMembers.map((member) => (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() => selectMember(member.name)}
                                        className="w-full flex items-center gap-x-2 p-2 hover:bg-neutral-100 rounded-lg transition-colors text-left dark:hover:bg-neutral-800 group"
                                    >
                                        <MemberAvatar
                                            name={member.name}
                                            avatarColor={member.avatarColor}
                                            className="size-7"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-semibold dark:text-white truncate">{member.name}</span>
                                            <span className="text-[10px] text-neutral-500 truncate">{member.email}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Layout for Model Toggle and Input */}
                        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20">
                            {/* Model Toggle */}
                            <div className="flex items-center gap-x-1 mb-3 bg-neutral-100 p-1 rounded-xl w-fit mx-auto dark:bg-neutral-800">
                                <Button
                                    onClick={() => setSelectedModel("kimi")}
                                    variant={selectedModel === "kimi" ? "secondary" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-7 text-[10px] px-3 rounded-lg font-bold uppercase tracking-wider",
                                        selectedModel === "kimi" && "shadow-sm bg-white dark:bg-neutral-700"
                                    )}
                                >
                                    Kimi 2.5
                                </Button>
                                <Button
                                    onClick={() => setSelectedModel("qwen")}
                                    variant={selectedModel === "qwen" ? "secondary" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-7 text-[10px] px-3 rounded-lg font-bold uppercase tracking-wider",
                                        selectedModel === "qwen" && "shadow-sm bg-white dark:bg-neutral-700"
                                    )}
                                >
                                    Qwen 3
                                </Button>
                            </div>

                            <form onSubmit={onSendMessage} className="flex items-center gap-x-2">
                                <Input
                                    ref={inputRef}
                                    value={message}
                                    onChange={handleInputChange}
                                    placeholder="Ask me anything... (@ to mention)"
                                    className="bg-white border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 shadow-sm dark:bg-neutral-800"
                                    autoComplete="off"
                                    disabled={isThinking}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="rounded-xl h-10 w-10 shrink-0 shadow-lg"
                                    disabled={!message.trim() || isThinking}
                                >
                                    <Send className="size-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Toggle Button */}
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "size-14 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group",
                        isOpen ? "bg-neutral-800 hover:bg-neutral-900" : "bg-primary hover:bg-primary/90"
                    )}
                >
                    {isOpen ? (
                        <X className="size-6 text-white transition-all duration-300" />
                    ) : (
                        <div className="relative">
                            <Sparkles className="size-6 text-white group-hover:animate-pulse" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                            </span>
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
};
