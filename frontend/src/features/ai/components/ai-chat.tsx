"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";

export const AIChat = () => {
    const workspaceId = useWorkspaceId();
    const { data: members } = useGetMembers({ workspaceId });

    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [mentionQuery, setMentionQuery] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai", content: string }[]>([
        { role: "ai", content: "Hello! I'm your AI assistant. How can I help you today?" }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, isOpen]);

    const onSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setChatHistory((prev) => [...prev, { role: "user", content: message }]);
        setMessage("");

        // Simulated AI response
        setTimeout(() => {
            setChatHistory((prev) => [...prev, {
                role: "ai",
                content: "I'm currently in 'UI-only' mode, but I've received your message! Soon I'll be able to help you manage your tasks and projects."
            }]);
        }, 600);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMessage(val);

        const lastAt = val.lastIndexOf("@");
        const cursorPosition = e.target.selectionStart || 0;

        // Check if we should show mentions: @ is at cursor and not preceded by non-space
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

    const selectMember = (memberId: string) => {
        const lastAt = message.lastIndexOf("@");
        const beforeAt = message.substring(0, lastAt);
        const afterMention = message.substring(inputRef.current?.selectionStart || message.length);

        // As requested: "the chat internally becomes User ID"
        setMessage(beforeAt + memberId + " " + afterMention);
        setShowMentions(false);

        // Refocus and set cursor
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = beforeAt.length + memberId.length + 1;
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
                        "mb-4 w-[380px] h-[500px] bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-4 zoom-in-95",
                        "dark:bg-neutral-900/80 dark:border-neutral-800/50"
                    )}>
                        {/* Header */}
                        <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
                            <div className="flex items-center gap-x-2">
                                <div className="bg-white/20 p-1.5 rounded-lg">
                                    <Bot className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">FinePro AI Assistant</h3>
                                    <p className="text-[10px] opacity-80">Online and ready to help</p>
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
                                        "max-w-[80%] p-3 rounded-2xl text-sm animate-in fade-in duration-300",
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                                            : "bg-neutral-100 text-neutral-800 mr-auto rounded-tl-none dark:bg-neutral-800 dark:text-neutral-200"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            ))}
                        </div>

                        {/* Mention List UI */}
                        {showMentions && filteredMembers.length > 0 && (
                            <div className="absolute bottom-20 left-4 right-4 bg-white/95 backdrop-blur-md border border-neutral-200 rounded-xl shadow-2xl p-1 z-10 animate-in slide-in-from-bottom-2 dark:bg-neutral-900/95 dark:border-neutral-700">
                                <div className="px-2 py-1.5 text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                                    Workspace Members
                                </div>
                                {filteredMembers.map((member) => (
                                    <button
                                        key={member.id}
                                        type="button"
                                        onClick={() => selectMember(member.id)}
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
                                        <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded font-mono text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                                                {member.id.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
                            <form onSubmit={onSendMessage} className="flex items-center gap-x-2">
                                <Input
                                    ref={inputRef}
                                    value={message}
                                    onChange={handleInputChange}
                                    placeholder="Ask me anything... (type @ for members)"
                                    className="bg-neutral-50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-10 dark:bg-neutral-800/50"
                                    autoComplete="off"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="rounded-xl h-10 w-10 shrink-0"
                                    disabled={!message.trim()}
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
