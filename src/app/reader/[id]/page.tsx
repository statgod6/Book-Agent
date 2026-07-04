"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Book, Note, Message, Conversation } from "@/types";
import PDFViewer from "@/components/PDFViewer";
import ChatPanel from "@/components/ChatPanel";
import NotesPanel from "@/components/NotesPanel";
import {
  MessageSquare,
  StickyNote,
  ArrowLeft,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import clsx from "clsx";

type SidePanel = "chat" | "notes" | null;

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const supabase = createClient();

  const [book, setBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedText, setSelectedText] = useState("");
  const [activePanel, setActivePanel] = useState<SidePanel>("chat");
  const [focusMode, setFocusMode] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [pageText, setPageText] = useState("");

  // Check auth + load initial data
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      await Promise.all([
        loadBook(),
        loadNotes(),
        loadOrCreateConversation(),
      ]);
      setLoadingPage(false);
    };
    init();
  }, [bookId]);

  const loadBook = async () => {
    const { data } = await supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .single();

    if (data) {
      setBook(data as Book);
      setCurrentPage((data as Book).current_page || 1);
    }
  };

  const loadNotes = async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("book_id", bookId)
      .order("page_number", { ascending: true })
      .order("created_at", { ascending: false });

    if (data) setNotes(data as Note[]);
  };

  const loadConversations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setConversations(data as Conversation[]);
  };

  const loadOrCreateConversation = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await loadConversations();

    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let convId: string;

    if (existing) {
      convId = (existing as Conversation).id;
    } else {
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          book_id: bookId,
          title: "New Chat",
        })
        .select()
        .single();

      if (error || !newConv) return;
      convId = (newConv as Conversation).id;
      await loadConversations();
    }

    setConversationId(convId);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (msgs) setMessages(msgs as Message[]);
  };

  const handleNewChat = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        book_id: bookId,
        title: "New Chat",
      })
      .select()
      .single();

    if (error || !newConv) return;

    setConversations((prev) => [newConv as Conversation, ...prev]);
    setConversationId((newConv as Conversation).id);
    setMessages([]);
  };

  const handleSwitchConversation = async (convId: string) => {
    setConversationId(convId);
    setMessages([]);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (msgs) setMessages(msgs as Message[]);
  };

  const savePageProgress = useCallback(
    async (page: number) => {
      setCurrentPage(page);
      supabase.from("books").update({ current_page: page }).eq("id", bookId);
    },
    [bookId, supabase]
  );

  const handleDocumentLoad = async (numPages: number) => {
    if (book && book.total_pages !== numPages) {
      await supabase
        .from("books")
        .update({ total_pages: numPages })
        .eq("id", bookId);
      setBook({ ...book, total_pages: numPages });
    }
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!conversationId) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: "user",
      content,
      page_context: currentPage,
      selected_text: selectedText || undefined,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentSelectedText = selectedText;
    setSelectedText("");
    setChatLoading(true);

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content,
      page_context: currentPage,
      selected_text: currentSelectedText || null,
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          selectedText: currentSelectedText,
          currentPage,
          bookTitle: book?.title,
          pageText,
        }),
      });

      const data = await res.json();

      const aiContent =
        data.content ||
        data.error ||
        "Sorry, I couldn't process that. Please try again.";

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "assistant",
        content: aiContent,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: aiMsg.content,
      });
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSaveNote = async (title: string, content: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        book_id: bookId,
        page_number: currentPage,
        title,
        content,
      })
      .select()
      .single();

    if (data) setNotes((prev) => [...prev, data as Note]);
  };

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from("notes").delete().eq("id", noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  if (loadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Book not found</p>
      </div>
    );
  }

  // In focus mode, hide side panel regardless of activePanel
  const showPanel = focusMode ? null : activePanel;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-4 shrink-0">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-gray-900 font-semibold truncate flex-1">
          {book.title}
        </h1>
        <span className="text-gray-500 text-sm">Page {currentPage}</span>

        <div className="flex gap-1 ml-4">
          {/* Focus Mode Toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={clsx(
              "p-2 rounded-lg transition",
              focusMode
                ? "bg-gray-800 text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
            title={focusMode ? "Exit Focus Mode" : "Focus Mode"}
          >
            {focusMode ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => {
              setFocusMode(false);
              setActivePanel(
                activePanel === "chat" ? null : "chat"
              );
            }}
            className={clsx(
              "p-2 rounded-lg transition",
              !focusMode && activePanel === "chat"
                ? "bg-accent text-white"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
            title="AI Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Notes Toggle */}
          <button
            onClick={() => {
              setFocusMode(false);
              setActivePanel(
                activePanel === "notes" ? null : "notes"
              );
            }}
            className={clsx(
              "p-2 rounded-lg transition",
              !focusMode && activePanel === "notes"
                ? "bg-gold text-ink"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            )}
            title="Notes"
          >
            <StickyNote className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewer */}
        <div
          className="flex-1 overflow-auto bg-gray-100"
          onMouseUp={handleTextSelect}
        >
          <PDFViewer
            fileUrl={book.file_url}
            currentPage={currentPage}
            onPageChange={savePageProgress}
            onDocumentLoad={handleDocumentLoad}
            onPageText={setPageText}
          />
        </div>

        {/* Side Panel */}
        {showPanel && (
          <div className="w-96 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            {showPanel === "chat" ? (
              <ChatPanel
                messages={messages}
                selectedText={selectedText}
                currentPage={currentPage}
                onSend={handleSendMessage}
                onClearSelection={() => setSelectedText("")}
                loading={chatLoading}
                conversations={conversations}
                currentConversationId={conversationId}
                onNewChat={handleNewChat}
                onSwitchConversation={handleSwitchConversation}
              />
            ) : (
              <NotesPanel
                notes={notes}
                currentPage={currentPage}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
