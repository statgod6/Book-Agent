"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Book } from "@/types";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  LogOut,
  Trash2,
  Clock,
  Upload,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkUser();
    loadBooks();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
    }
  };

  const loadBooks = async () => {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setBooks(data as Book[]);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const fileName = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(fileName, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("pdfs")
      .getPublicUrl(fileName);

    const title = file.name.replace(".pdf", "").replace(/[_-]/g, " ");

    const { error: dbError } = await supabase.from("books").insert({
      user_id: user.id,
      title,
      file_url: urlData.publicUrl,
    });

    if (!dbError) {
      await loadBooks();
    } else {
      alert("Failed to save book: " + dbError.message);
    }

    setUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm("Delete this book and all its notes and chats?")) return;

    await supabase.from("books").delete().eq("id", id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#16213e] to-[#0a0a1a]">
      {/* Header */}
      <header className="border-b border-white/5 bg-ink/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <span className="text-xl font-bold text-white">
              Book<span className="text-accent">Mind</span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Library</h1>
            <p className="text-gray-400 mt-1">
              Your books, notes, and AI conversations
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-5 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading your library...
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl text-gray-400 mb-2">No books yet</h2>
            <p className="text-gray-500">
              Upload a PDF to start reading with AI
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-surface/50 backdrop-blur border border-white/5 rounded-2xl overflow-hidden hover:border-accent/30 transition group cursor-pointer"
                onClick={() => router.push(`/reader/${book.id}`)}
              >
                <div className="h-40 bg-gradient-to-br from-panel to-surface flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-accent/30 group-hover:text-accent/60 transition" />
                </div>
                <div className="p-5">
                  <h3 className="text-white font-semibold text-lg truncate">
                    {book.title}
                  </h3>
                  {book.author && (
                    <p className="text-gray-400 text-sm mt-1">{book.author}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Page {book.current_page} of {book.total_pages || "—"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBook(book.id);
                      }}
                      className="text-gray-600 hover:text-accent transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Book Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-surface/20 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-10 hover:border-accent/30 transition cursor-pointer min-h-[280px]"
            >
              <Plus className="w-10 h-10 text-gray-500 mb-3" />
              <p className="text-gray-500">Add a new book</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
