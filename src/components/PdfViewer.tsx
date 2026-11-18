import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  Maximize2,
  RefreshCw,
  FileText
} from 'lucide-react';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfViewerProps {
  url: string;
  fileName?: string;
  onDownload?: () => void;
  className?: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  url,
  fileName = 'belge.pdf',
  onDownload,
  className = ''
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setPageNumber(1);

    const loadPdf = async () => {
      try {
        if (!url) {
          throw new Error('PDF bağlantısı bulunamadı.');
        }

        // Cancel previous render if any
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        // Try loading document with resilient fallbacks
        let pdf: any = null;

        try {
          // If blob or data, fetch arrayBuffer directly
          if (url.startsWith('blob:') || url.startsWith('data:')) {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ 
              data: new Uint8Array(arrayBuffer),
              cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
              cMapPacked: true,
            });
            pdf = await loadingTask.promise;
          } else {
            // First try direct URL
            try {
              const loadingTask = pdfjsLib.getDocument({
                url,
                cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
                cMapPacked: true,
              });
              pdf = await loadingTask.promise;
            } catch (directErr) {
              // Fallback: fetch as arrayBuffer
              const response = await fetch(url);
              const arrayBuffer = await response.arrayBuffer();
              const loadingTask = pdfjsLib.getDocument({ 
                data: new Uint8Array(arrayBuffer),
                cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
                cMapPacked: true,
              });
              pdf = await loadingTask.promise;
            }
          }
        } catch (fetchErr: any) {
          throw fetchErr;
        }

        if (isCancelled) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error('PDF yükleme hatası:', err);
        setError(err.message || 'PDF dokümanı yüklenirken bir sorun oluştu.');
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [url]);

  // Render current page to canvas
  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfDocRef.current || !canvasRef.current || loading) return;

      try {
        // Cancel existing render task
        if (renderTaskRef.current) {
          try {
            await renderTaskRef.current.cancel();
          } catch (e) {
            // ignore cancel exception
          }
        }

        const page = await pdfDocRef.current.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: scale, rotation: rotation });

        // High DPI support
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.warn('Sayfa render hatası:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pageNumber, scale, rotation, loading]);

  const handlePrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(3.0, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div className={`w-full h-full flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800 ${className}`}>
      {/* Top PDF Controls Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-white flex-wrap shadow-md">
        
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={pageNumber <= 1 || loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition cursor-pointer"
            title="Önceki Sayfa"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-mono font-medium text-slate-300 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            {numPages > 0 ? `${pageNumber} / ${numPages}` : '1 / 1'}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={pageNumber >= numPages || loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition cursor-pointer"
            title="Sonraki Sayfa"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom and Rotate controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={loading}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            title="Küçült"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono font-semibold text-amber-400 w-12 text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={loading}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
            title="Büyüt"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            disabled={loading}
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition ml-1 cursor-pointer"
            title="90° Döndür"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions (Open in new tab / Download) */}
        <div className="flex items-center gap-2">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-400 font-medium text-xs border border-slate-700 transition"
              title="Yeni Sekmede Aç"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yeni Sekmede Aç</span>
            </a>
          )}

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              title="PDF İndir"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF İndir</span>
            </button>
          )}
        </div>

      </div>

      {/* Main PDF Rendering Canvas Stage */}
      <div className="flex-1 w-full overflow-auto p-4 flex items-center justify-center bg-slate-950/90 relative min-h-[420px]">
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 text-amber-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-xs font-semibold text-slate-300">PDF dokümanı işleniyor ve sayfalar oluşturuluyor...</p>
          </div>
        )}

        {error && (
          <div className="text-center p-6 max-w-md bg-slate-900 border border-rose-800/80 rounded-2xl space-y-4 shadow-xl">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <div>
              <h4 className="font-bold text-white text-sm">PDF Dokümanı Görüntülenemedi</h4>
              <p className="text-xs text-rose-300/90 mt-1">{error}</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Yeni Sekmede Aç
              </a>
              {onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  İndir
                </button>
              )}
            </div>
          </div>
        )}

        {/* Canvas displaying rendered PDF */}
        <canvas 
          ref={canvasRef} 
          className={`shadow-2xl rounded border border-slate-800 bg-white transition-transform ${loading || error ? 'hidden' : 'block'}`}
        />
      </div>
    </div>
  );
};
