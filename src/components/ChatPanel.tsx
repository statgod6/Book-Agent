"use client";

import { useState, useRef, useEffect } from "react";
import { Message, Conversation } from "@/types";
import { Send, X, Sparkles, Bot, User, Loader2, Plus, History, MessageCircle } from "lucide-react";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatPanelProps {
  messages: Message[];
  selectedText: string;
  currentPage: number;
  onSend: (content: string) => void;
  onClearSelection: () => void;
  loading: boolean;
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSwitchConversation: (id: string) => void;
}

export default function ChatPanel({
  messages,
  selectedText,
  currentPage,
  onSend,
  onClearSelection,
  loading,
  conversations,
  currentConversationId,
  onNewChat,
  onSwitchConversation,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    onSend(msg);
  };

  const quickQuestions = [
    "Explain this page simply",
    "What are the key ideas?",
    "Give me an analogy",
    "Summarize this section",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="font-semibold text-gray-900 text-sm flex-1">
          AI Reading Companion
        </span>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={clsx(
            "p-1.5 rounded-lg transition",
            showHistory
              ? "bg-accent text-white"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          )}
          title="Chat History"
        >
          <History className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onNewChat}
          className="p-1.5 rounded-lg text-gray-500 hover:text-accent hover:bg-gray-100 transition"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Conversation History List */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">
              No conversations yet
            </p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => {
                onSwitchConversation(conv.id);
                setShowHistory(false);
              }}
              className={clsx(
                "w-full text-left px-3 py-2.5 rounded-lg transition flex items-center gap-2",
                conv.id === currentConversationId
                  ? "bg-accent/10 border border-accent/20"
                  : "hover:bg-gray-50 border border-transparent"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">
                  {conv.title || "New Chat"}
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(conv.created_at).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-accent/30 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">
              Hi! I&apos;m your AI reading companion.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Select text from the book or ask me anything!
            </p>

            <div className="mt-4 space-y-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => onSend(q)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-accent" />
              </div>
            )}
            <div
              className={clsx(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                msg.role === "user"
                  ? "chat-bubble-user text-white"
                  : "chat-bubble-ai text-gray-800"
              )}
            >
              {msg.selected_text && (
                <div className="mb-2 px-2 py-1 bg-black/5 rounded text-xs italic border-l-2 border-accent/50">
                  &ldquo;
                  {msg.selected_text.slice(0, 120)}
                  {msg.selected_text.length > 120 ? "..." : ""}&rdquo;
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">
                {msg.role === "assistant" ? (
                  <div className="prose-chat">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.page_context && (
                <div className="mt-1 text-[10px] opacity-50">
                  Page {msg.page_context}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="chat-bubble-ai rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-accent rounded-full typing-dot"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-accent rounded-full typing-dot"
                  style={{ animationDelay: "200ms" }}
                />
                <div
                  className="w-2 h-2 bg-accent rounded-full typing-dot"
                  style={{ animationDelay: "400ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      )}

      {/* Selected Text Banner */}
      {selectedText && (
        <div className="mx-4 mb-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-accent font-medium uppercase tracking-wide">
                Selected Text
              </p>
              <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                {selectedText}
              </p>
            </div>
            <button
              onClick={onClearSelection}
              className="text-gray-400 hover:text-gray-900 shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && handleSend()
            }
            placeholder={
              selectedText ? "Ask about selected text..." : "Ask anything..."
            }
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-accent transition placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
