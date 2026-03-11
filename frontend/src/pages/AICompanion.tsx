import { useState, useRef, useEffect } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

const AICompanion = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Hello! I'm your AI Sales Coach. How can I help you practice today? You can ask me how to handle specific objections, request roleplay scenarios, or get tips on closing deals."
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const newMessages = [...messages, { role: "user", content: input } as Message];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const history = newMessages.map(m => ({ role: m.role, content: m.content }));

            const response = await api.post<{ response: string }>("/companion/chat", {
                message: input,
                history: history
            });

            setMessages([...newMessages, { role: "assistant", content: response.response }]);
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const renderMessageContent = (content: string) => {
        const html = DOMPurify.sanitize(marked.parse(content) as string);
        return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl h-[calc(100vh-2rem)] flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-2">
                <CardHeader className="bg-primary/5 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Sales Practice Companion</CardTitle>
                            <CardDescription>Get expert guidance, tips, and roleplay practice.</CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden p-0 relative flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                        <div className="flex flex-col gap-4 pb-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex gap-3 max-w-[80%]",
                                        message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>

                                    <div className={cn(
                                        "p-3 rounded-lg text-sm",
                                        message.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-muted text-foreground rounded-tl-none"
                                    )}>
                                        {message.role === "user" ? (
                                            message.content
                                        ) : (
                                            renderMessageContent(message.content)
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 max-w-[80%] mr-auto">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-4 bg-background border-t">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type your question or scenario..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            AI can make mistakes. Please verify important information.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AICompanion;
