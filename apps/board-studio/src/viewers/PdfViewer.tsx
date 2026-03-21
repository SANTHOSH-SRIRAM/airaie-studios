import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@airaie/ui';
import { ViewerError } from './shared/ViewerError';
import type { ViewerProps } from '@/types/viewer';

// Configure PDF.js worker at module scope
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PdfViewer: React.FC<ViewerProps> = ({ url, filename }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setError('Failed to load PDF');
    setLoading(false);
  }, []);

  const handlePageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= numPages) {
        setPageNumber(value);
      }
    },
    [numPages],
  );

  return (
    <div className="flex flex-col h-full">
      {!loading && !error && (
        <div className="flex items-center justify-center gap-2 py-2 border-b border-surface-border">
          <button
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="number"
            value={pageNumber}
            onChange={handlePageChange}
            className="w-12 text-center border rounded px-1"
            min={1}
            max={numPages}
          />
          <span className="text-sm text-content-muted">/ {numPages}</span>
          <button
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto flex justify-center bg-slate-100 p-4">
        {error ? (
          <ViewerError message={error} filename={filename} />
        ) : (
          <>
            {loading && <Skeleton className="h-96 w-full max-w-2xl" />}
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<Skeleton className="h-96 w-full max-w-2xl" />}
            >
              <Page pageNumber={pageNumber} />
            </Document>
          </>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
