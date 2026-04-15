import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

// pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  title: string;
  isFullscreen?: boolean;
}

export default function PdfViewer({ url, title, isFullscreen = false }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(isFullscreen ? 1.2 : 1);

  useEffect(() => {
    setPageNumber(1);
    setNumPages(0);
  }, [url]);

  useEffect(() => {
    setScale(isFullscreen ? 1.2 : 1);
  }, [isFullscreen]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <span className="text-sm">
          Page {pageNumber} / {numPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
          disabled={!numPages || pageNumber >= numPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>

        <span className="text-sm">{Math.round(scale * 100)}%</span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setScale((s) => Math.min(2.5, s + 0.1))}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      <div
        className={`w-full rounded-lg border border-border bg-white overflow-auto ${
          isFullscreen ? "h-[85vh]" : "h-[70vh]"
        }`}
        style={{ userSelect: "none" }}
      >
        <div className="flex justify-center p-4">
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
              setPageNumber(1);
            }}
            onLoadError={(error) => {
              console.error("PDF load error:", error);
            }}
            loading={
              <div className="py-10 text-sm text-muted-foreground text-center">
                Loading PDF...
              </div>
            }
            error={
              <div className="py-10 text-sm text-red-500 text-center px-4">
                Failed to load PDF. This usually means the link is not returning a valid PDF file
                or Google Drive is blocking direct access for this file.
              </div>
            }
          >
            <Page
              key={`${url}-${pageNumber}-${scale}`}
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}