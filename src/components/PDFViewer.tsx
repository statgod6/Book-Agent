"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";

// Use CDN worker for reliability
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDocumentLoad?: (numPages: number) => void;
  onPageText?: (text: string) => void;
}

export default function PDFViewer({
  fileUrl,
  currentPage,
  onPageChange,
  onDocumentLoad,
  onPageText,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);

  // Lower default scale on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setScale(0.8);
    }
  }, []);

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

  return (
    <div className="flex flex-col items-center py-4 sm:py-6 px-2 sm:px-4">
      {/* Controls */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-3 sm:px-4 py-2 rounded-full border border-gray-200 shadow-sm max-w-full overflow-x-auto no-scrollbar">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 transition shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs sm:text-sm text-gray-700 min-w-[60px] sm:min-w-[80px] text-center shrink-0">
          {currentPage} / {numPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 transition shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          className="p-1 text-gray-600 hover:text-gray-900 transition shrink-0"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[10px] sm:text-xs text-gray-500 min-w-[35px] sm:min-w-[40px] text-center shrink-0">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          className="p-1 text-gray-600 hover:text-gray-900 transition shrink-0"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
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
            onLoadSuccess={handlePageLoad}
          />
        </Document>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-4 sm:mt-6 flex gap-2">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition"
        >
          ← Previous
        </button>
        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30 transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
