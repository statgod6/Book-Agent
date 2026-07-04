"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  Highlighter,
} from "lucide-react";
import type { Highlight } from "@/types";

// Use CDN worker for reliability
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDocumentLoad?: (numPages: number) => void;
  onPageText?: (text: string) => void;
  highlights?: Highlight[];
  onHighlight?: () => void;
  selectedText?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function PDFViewer({
  fileUrl,
  currentPage,
  onPageChange,
  onDocumentLoad,
  onPageText,
  highlights = [],
  onHighlight,
  selectedText = "",
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);

  const handleLoadSuccess = (pdf: { numPages: number }) => {
    setNumPages(pdf.numPages);
    if (onDocumentLoad) onDocumentLoad(pdf.numPages);
  };

  // Extract text content from the current page for AI context
  const handlePageLoad = async (page: any) => {
    if (!onPageText) return;
    try {
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: { str?: string }) => item.str || "")
        .join(" ")
        .trim();
      onPageText(text);
    } catch (e) {
      console.error("Failed to extract page text:", e);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < numPages) onPageChange(currentPage + 1);
  };

  // Custom text renderer to apply highlights
  const customTextRenderer = (textItem: { str: string }) => {
    const text = textItem.str;
    if (!text || !text.trim()) return escapeHtml(text);

    const pageHighlights = highlights.filter(
      (h) => h.page_number === currentPage
    );

    // Check if this text fragment is part of any highlight
    for (const highlight of pageHighlights) {
      if (highlight.text.includes(text.trim()) && text.trim().length > 2) {
        return `<span style="background-color: rgba(255, 215, 0, 0.35); border-radius: 2px;">${escapeHtml(
          text
        )}</span>`;
      }
    }

    return escapeHtml(text);
  };

  return (
    <div className="flex flex-col items-center py-6 px-4">
      {/* Controls */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm flex items-center gap-3 mb-6 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm text-gray-700 min-w-[80px] text-center">
          {currentPage} / {numPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-px h-5 bg-gray-200" />

        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          className="p-1 text-gray-600 hover:text-gray-900 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 min-w-[40px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          className="p-1 text-gray-600 hover:text-gray-900 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {onHighlight && (
          <>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={onHighlight}
              disabled={!selectedText}
              className={`p-1 rounded transition flex items-center gap-1 ${
                selectedText
                  ? "text-amber-600 hover:bg-amber-50 bg-amber-50"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              title={
                selectedText
                  ? "Highlight selected text"
                  : "Select text first, then click to highlight"
              }
            >
              <Highlighter className="w-4 h-4" />
              <span className="text-xs font-medium">Highlight</span>
            </button>
          </>
        )}
      </div>

      {/* PDF Document */}
      <div className="pdf-page-container">
        <Document
          file={fileUrl}
          onLoadSuccess={handleLoadSuccess}
          loading={
            <div className="flex items-center gap-2 text-gray-500 py-20">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading PDF...
            </div>
          }
          error={
            <div className="text-center py-20">
              <p className="text-accent mb-2">Failed to load PDF</p>
              <p className="text-gray-500 text-sm">
                Make sure the file URL is accessible
              </p>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            className="pdf-page shadow-2xl shadow-black/50"
            renderTextLayer={true}
            renderAnnotationLayer={true}
            customTextRenderer={customTextRenderer}
            onLoadSuccess={handlePageLoad}
          />
        </Document>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition"
        >
          ← Previous
        </button>
        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
