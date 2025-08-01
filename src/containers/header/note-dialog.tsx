"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage } from "@/lib/chat-api";
import { getMessages, getChatHistory, addChatHistory, ChatHistory } from "@/lib/storage";
import { MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NoteDialog({ open, onOpenChange }: Props) {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // チャット履歴を読み込む
  useEffect(() => {
    if (open) {
      setChatHistory(getChatHistory());
    }
  }, [open]);

  // チャット履歴が更新された時にスクロール
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory.length, isLoading]);

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendChat = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const text = value.trim();
    if (text && e.key === "Enter" && !composing) {
      if (!e.shiftKey) {
        e.preventDefault();
        setIsLoading(true);
        try {
          // localStorageからメッセージを取得してソート
          const messages = getMessages();
          const sortedMessages = Object.values(messages).sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

          const result = await sendChatMessage(text, sortedMessages);
          scrollToBottom();

          // チャット履歴に保存
          addChatHistory(text, result.response);
          setChatHistory(getChatHistory());
        } catch (error) {
          console.error("Chat error:", error);
          const errorMessage = "エラーが発生しました: " + (error as Error).message;

          // エラーも履歴に保存
          addChatHistory(text, errorMessage);
          setChatHistory(getChatHistory());
        } finally {
          setIsLoading(false);
          scrollToBottom();
        }
      }
    }
  };

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-6 rounded-lg shadow-lg flex flex-col gap-0"
        style={{ maxWidth: "85vw", maxHeight: "85vh", height: "85vh", width: "85vw" }}
      >
        <DialogHeader className="mb-2 flex-shrink-0">
          <DialogTitle>Note with ChatGPT</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 pb-4">
          {/* チャット履歴 */}
          {chatHistory.length > 0 && (
            <div className="space-y-4">
              {chatHistory.map((chat) => (
                <div key={chat.id} className="">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <MessageSquare className="w-3 h-3 flex-shrink-0" />
                    {formatDateTime(chat.datetime)}
                  </div>
                  <div className="space-y-0 text-sm">
                    <div className="bg-background/50 break-words mb-2">
                      <span className="font-medium text-primary">質問: </span>
                      <div className="whitespace-pre-wrap bg-background/50 break-words">{chat.prompt}</div>
                    </div>
                    <div className="bg-background/50 break-words">
                      <span className="font-medium text-secondary">回答: </span>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // コードブロックのスタイリング
                          code: ({ className, children, ...props }: React.HTMLProps<HTMLElement>) => {
                            const isInline = !className?.includes("language-");
                            return (
                              <code
                                className={`${className} ${
                                  isInline ? "bg-muted px-1 py-0.5 rounded text-sm" : "block bg-muted p-2 rounded text-sm overflow-x-auto"
                                }`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          // リンクのスタイリング
                          a: ({ children, href, ...props }: React.HTMLProps<HTMLAnchorElement>) => {
                            return (
                              <a
                                href={href}
                                className="text-blue-600 hover:text-blue-800 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {chat.response}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 回答中表示 */}
          {isLoading && (
            <div className="">
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                {formatDateTime(new Date().toISOString())}
              </div>
              <div className="space-y-0 text-sm">
                <div className="bg-background/50 break-words mb-2">
                  <span className="font-medium text-primary">質問: </span>
                  <div className="whitespace-pre-wrap bg-background/50 break-words">{value}</div>
                </div>
                <div className="bg-background/50 break-words">
                  <span className="font-medium text-secondary">回答: </span>
                  <div className="animate-pulse text-muted-foreground">回答中...</div>
                </div>
              </div>
            </div>
          )}

          {/* スクロール用の要素 */}
          <div ref={scrollEndRef} />
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="w-full">
            <Textarea
              placeholder="質問を入力してください..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full resize-none bg-white/60 text-sm"
              onKeyDown={(e) => {
                handleSendChat(e);
              }}
              disabled={isLoading}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
