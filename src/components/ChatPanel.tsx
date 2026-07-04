"use client";

import { useState, useRef, useEffect } from "react";
import { Message, OpenRouterModel } from "@/types";
import { Send, X, Sparkles, Bot, User, ChevronDown, Loader2 } from "lucide-react";
import clsx from "clsx";

interface ChatPanelProps {
  messages: Message[];
  selectedText: string;
  currentPage: number;
  onSend: (content: string, model?: string) => void;
  onClearSelection: () => void;
  loading: boolean;
  models: OpenRouterModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ChatPanel({
  messages,
  selectedText,
  currentPage,
  onSend,
  onClearSelection,
  loading,
  models,
  selectedModel,
  onModelChange,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    onSend(msg, selectedModel);
  };

  const quickQuestions = [
    "Explain this page simply",
    "What are the key ideas?",
    "Give me an analogy",
    "Summarize this section",
  ];

  const currentModel =
    models.find((m) => m.id === selectedModel)?.name || selectedModel;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="font-semibold text-white text-sm">
            AI Reading Companion
          </span>
        </div>

        {/* Model Selector */}
        <div className="relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-1 px-2 py-1 bg-surface/50 border border-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition"
          >
            <span className="max-w-[120px] truncate">{currentModel}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showModelDropdown && (
            <div className="absolute right-0 top-full mt-1 w-64 max-h-64 overflow-y-auto bg-ink border border-white/10 rounded-lg shadow-xl z-50">
              {models.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-500">
                  Loading models...
                </div>
              ) : (
                models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onModelChange(m.id);
                      setShowModelDropdown(false);
                    }}
                    className={clsx(
                      "w-full text-left px-3 py-2 text-xs hover:bg-surface/50 transition truncate",
                      m.id === selectedModel
                        ? "text-accent"
                        : "text-gray-400"
                    )}
                    title={m.id}
                  >
                    {m.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-accent/30 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Hi! I&apos;m your AI reading companion.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Select text from the book or ask me anything!
            </p>

            <div className="mt-4 space-y-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => onSend(q, selectedModel)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 bg-surface/50 hover:bg-surface border border-white/5 rounded-lg text-xs text-gray-400 hover:text-white transition disabled:opacity-50"
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
                  : "chat-bubble-ai text-gray-200"
              )}
            >
              {msg.selected_text && (
                <div className="mb-2 px-2 py-1 bg-white/10 rounded text-xs italic border-l-2 border-accent/50">
                  &ldquo;
                  {msg.selected_text.slice(0, 120)}
                  {msg.selected_text.length > 120 ? "..." : ""}&rdquo;
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">
                {msg.content}
              </div>
              {msg.page_context && (
                <div className="mt-1 text-[10px] opacity-50">
                  Page {msg.page_context}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-panel flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-gray-300" />
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

      {/* Selected Text Banner */}
      {selectedText && (
        <div className="mx-4 mb-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-lg flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-accent font-medium uppercase tracking-wide">
              Selected Text
            </p>
            <p className="text-xs text-gray-300 line-clamp-2 mt-0.5">
              {selectedText}
            </p>
          </div>
          <button
            onClick={onClearSelection}
            className="text-gray-500 hover:text-white shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/5">
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
            className="flex-1 px-4 py-2.5 bg-ink/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-accent transition placeholder:text-gray-600 disabled:opacity-50"
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
