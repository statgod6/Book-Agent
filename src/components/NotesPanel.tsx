"use client";

import { useState } from "react";
import { Note } from "@/types";
import {
  StickyNote,
  Plus,
  Trash2,
  Save,
  X,
  BookMarked,
} from "lucide-react";

interface NotesPanelProps {
  notes: Note[];
  currentPage: number;
  onSave: (title: string, content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

export default function NotesPanel({
  notes,
  currentPage,
  onSave,
  onDelete,
}: NotesPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await onSave(title.trim() || "Untitled", content.trim());
    setTitle("");
    setContent("");
    setIsCreating(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setTitle("");
    setContent("");
    setIsCreating(false);
  };

  const pageNotes = notes.filter((n) => n.page_number === currentPage);
  const otherNotes = notes.filter((n) => n.page_number !== currentPage);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-gold" />
          <span className="font-semibold text-white text-sm">My Notes</span>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="p-1 text-gray-400 hover:text-white transition"
          title="Add note"
        >
          {isCreating ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Create Note Form */}
      {isCreating && (
        <div className="p-4 border-b border-white/5 bg-gold/5">
          <div className="text-xs text-gold mb-2 font-medium">
            New note for Page {currentPage}
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title (optional)"
            className="w-full mb-2 px-3 py-2 bg-ink/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold transition placeholder:text-gray-600"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your understanding here..."
            rows={4}
            className="w-full px-3 py-2 bg-ink/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-gold transition placeholder:text-gray-600 resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="flex-1 py-2 bg-gold hover:bg-gold/90 text-ink font-semibold rounded-lg text-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Note"}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-surface/50 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Current Page Notes */}
        {pageNotes.length > 0 && (
          <>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1">
              <BookMarked className="w-3 h-3" />
              Page {currentPage}
            </div>
            {pageNotes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={onDelete} />
            ))}
          </>
        )}

        {/* Other Page Notes */}
        {otherNotes.length > 0 && (
          <>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium pt-2">
              Other Pages
            </div>
            {otherNotes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={onDelete} />
            ))}
          </>
        )}

        {/* Empty State */}
        {notes.length === 0 && !isCreating && (
          <div className="text-center py-12">
            <StickyNote className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No notes yet</p>
            <p className="text-gray-500 text-xs mt-1">
              Click + to write your understanding
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="note-card bg-surface/50 border border-white/5 rounded-xl p-3 group">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          {note.title && (
            <h4 className="text-white text-sm font-medium truncate">
              {note.title}
            </h4>
          )}
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: note.color || "#F5A623" }}
            />
            Page {note.page_number} · {formatDate(note.created_at)}
          </span>
        </div>
        <button
          onClick={() => {
            if (confirming) {
              onDelete(note.id);
            } else {
              setConfirming(true);
              setTimeout(() => setConfirming(false), 3000);
            }
          }}
          className={`shrink-0 transition ${
            confirming
              ? "text-accent"
              : "text-gray-600 hover:text-accent opacity-0 group-hover:opacity-100"
          }`}
          title={confirming ? "Click again to confirm" : "Delete note"}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-gray-300 text-xs whitespace-pre-wrap break-words mt-1">
        {note.content}
      </p>
    </div>
  );
}
