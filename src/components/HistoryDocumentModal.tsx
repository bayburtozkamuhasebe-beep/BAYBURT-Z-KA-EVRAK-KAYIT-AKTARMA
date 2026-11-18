import React, { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  SunMedium, 
  Contrast, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  FileText, 
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  Printer,
  Maximize2,
  Minimize2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FileCode,
  Layers
} from 'lucide-react';
import { CekKayitDbRecord } from '../types';
import { 
  resolveCheckDocumentUrl, 
  downloadCheckFileFromStorage,
  getDocumentFormat,
  DEST_BUCKET_NAME 
} from '../lib/supabase';
import { PdfViewer } from './PdfViewer';

interface HistoryDocumentModalProps {
  record: CekKayitDbRecord | null;
  recordsList?: CekKayitDbRecord[];
  onClose: () => void;
  onSelectRecord?: (record: CekKayitDbRecord) => void;
}

export const HistoryDocumentModal: React.FC<HistoryDocumentModalProps> = ({
  record,
  recordsList = [],
  onClose,
  onSelectRecord
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sourceBucket, setSourceBucket] = useState<string>(DEST_BUCKET_NAME);
  const [imgLoadFailed, setImgLoadFailed] = useState<boolean>(false);

  // Zoom & Image Filters
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Navigation indexes
  const currentIndex = record ? recordsList.findIndex(r => r.id === record.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < recordsList.length - 1;

  const handlePrev = () => {
    if (hasPrev && onSelectRecord) {
      onSelectRecord(recordsList[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onSelectRecord) {
      onSelectRecord(recordsList[currentIndex + 1]);
    }
  };

  // Keyboard navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) handlePrev();
      if (e.key === 'ArrowRight' && hasNext) handleNext();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))));
      if (e.key === '-') setZoom(z => Math.max(0.3, Number((z - 0.25).toFixed(2))));
      if (e.key === 'r' || e.key === 'R') setRotation(r => (r + 90) % 360);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, hasPrev, hasNext, currentIndex]);

  // Load document whenever record changes
  useEffect(() => {
    let isMounted = true;
    let createdBlobUrl: string | null = null;

    const fetchDocument = async () => {
      if (!record) return;

      setIsLoadingDoc(true);
      setLoadError(null);
      setImgLoadFailed(false);
      setZoom(1);
      setRotation(0);
      setBrightness(100);
      setContrast(100);
      setInvert(false);

      try {
        const result = await resolveCheckDocumentUrl(record.dosyaAdi, record.dosyaUrl, record.cekNo);

        if (!isMounted) return;

        if (result.url) {
          setResolvedUrl(result.url);
          setSourceBucket(result.sourceBucket || DEST_BUCKET_NAME);
          if (result.isBlob) {
            createdBlobUrl = result.url;
          }
        } else {
          setLoadError(result.error || 'Evrak dosyası depoda bulunamadı.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Evrak getirme hatası:', err);
        setLoadError(err.message || 'Evrak yüklenirken hata oluştu.');
      } finally {
        if (isMounted) {
          setIsLoadingDoc(false);
        }
      }
    };

    fetchDocument();

    return () => {
      isMounted = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [record?.id, record?.dosyaAdi, record?.dosyaUrl, record?.cekNo]);

  if (!record) return null;

  const docFormat = getDocumentFormat(record.dosyaAdi, resolvedUrl || record.dosyaUrl);
  const isPdf = docFormat.isPdf;
  const isImage = docFormat.isImage && !isPdf;

  // Download directly
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadCheckFileFromStorage(record.dosyaAdi, resolvedUrl || record.dosyaUrl);
    } catch (err: any) {
      console.error('İndirme hatası:', err);
      if (resolvedUrl || record.dosyaUrl) {
        window.open(resolvedUrl || record.dosyaUrl, '_blank');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Print Document Window
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ÇEK EVRAKI - ${record.cekNo || record.dosyaAdi}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; color: #111; }
            .header { border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; text-align: left; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; text-align: left; margin-bottom: 20px; }
            .img-box { max-width: 100%; margin: 0 auto; }
            img { max-width: 100%; height: auto; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>BAYBURT ÖZ-KA İNŞAAT - ÇEK EVRAK DÖKÜMÜ</h2>
          </div>
          <div class="meta-grid">
            <div><strong>Şantiye / Birim:</strong> ${record.santiyeBirim || '-'}</div>
            <div><strong>Çek Numarası:</strong> ${record.cekNo || '-'}</div>
            <div><strong>Lehtar / Alacaklı:</strong> ${record.alacakliUnvan || '-'}</div>
            <div><strong>Vade Tarihi:</strong> ${record.vadeTarihi || '-'}</div>
            <div><strong>Çek Tutarı:</strong> ${record.tutar ? Number(record.tutar).toLocaleString('tr-TR') : '0'} ${record.paraBirimi || 'TL'}</div>
            <div><strong>Dosya Adı:</strong> ${record.dosyaAdi || '-'}</div>
          </div>
          <div class="img-box">
            <img src="${resolvedUrl || record.dosyaUrl}" onload="window.print();" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 ${isFullscreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'}`}>
      
      {/* Modal Container */}
      <div className={`bg-slate-900 border border-slate-700 w-full h-full flex flex-col shadow-2xl overflow-hidden ${isFullscreen ? 'rounded-none border-0' : 'rounded-2xl max-w-6xl mx-auto'}`}>
        
        {/* Top Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white shadow-md flex-wrap gap-2">
          
          {/* Left Check Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              {isPdf ? <FileText className="w-5 h-5 text-rose-400" /> : <Eye className="w-5 h-5 text-amber-400" />}
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-sm sm:text-base text-white truncate">
                  ÇEK EVRAKI: {record.cekNo ? `No: ${record.cekNo}` : record.dosyaAdi}
                </h2>
                
                {record.santiyeBirim && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                    {record.santiyeBirim}
                  </span>
                )}

                <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold border ${
                  isPdf 
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700/60' 
                    : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                }`}>
                  {isPdf ? 'PDF EVRAK' : `${docFormat.extension.toUpperCase()} GÖRSELİ`}
                </span>

                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono hidden sm:inline-block">
                  Depo: {sourceBucket}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                {record.alacakliUnvan && (
                  <span className="text-slate-300 font-medium">{record.alacakliUnvan}</span>
                )}
                {record.tutar && (
                  <span className="text-emerald-400 font-mono font-bold">
                    {Number(record.tutar).toLocaleString('tr-TR')} {record.paraBirimi || 'TL'}
                  </span>
                )}
                {record.vadeTarihi && (
                  <span>Vade: <strong className="text-slate-200">{record.vadeTarihi}</strong></span>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Image zoom & rotate controls (if image) */}
            {isImage && resolvedUrl && !imgLoadFailed && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.3, Number((z - 0.25).toFixed(2))))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  title="Küçült (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-1.5 text-slate-400 w-12 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  title="Büyüt (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition ml-0.5 cursor-pointer"
                  title="90° Döndür (R)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${showFilters ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  title="Görüntü Netleştirme / Filtreler"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!resolvedUrl}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-40"
              title="Evrak Fişini Yazdır"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || (!record.dosyaAdi && !resolvedUrl)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-md border border-emerald-400/30 transition cursor-pointer disabled:opacity-50"
              title="Evrakı Bilgisayara İndir"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">İndir</span>
            </button>

            {/* External Link */}
            {resolvedUrl && (
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition"
                title="Yeni Sekmede Tam Boyut Aç"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer hidden md:block"
              title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/70 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer ml-1"
              title="Kapat (ESC)"
            >
              <X className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* Optional Image Filters Bar */}
        {showFilters && isImage && (
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center gap-6 text-xs text-slate-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <SunMedium className="w-4 h-4 text-amber-400" />
              <span>Parlaklık: {brightness}%</span>
              <input 
                type="range" 
                min="50" 
                max="200" 
                value={brightness} 
                onChange={e => setBrightness(Number(e.target.value))}
                className="w-24 accent-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Contrast className="w-4 h-4 text-blue-400" />
              <span>Kontrast: {contrast}%</span>
              <input 
                type="range" 
                min="50" 
                max="250" 
                value={contrast} 
                onChange={e => setContrast(Number(e.target.value))}
                className="w-24 accent-blue-500"
              />
            </div>

            <button 
              type="button"
              onClick={() => setInvert(!invert)}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${invert ? 'bg-indigo-600 text-white border-indigo-400' : 'border-slate-700 hover:bg-slate-800'}`}
            >
              Damga / Negatif Modu
            </button>

            <button 
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setBrightness(100);
                setContrast(100);
                setInvert(false);
              }}
              className="px-2.5 py-1 text-slate-400 hover:text-white text-xs hover:underline cursor-pointer"
            >
              Sıfırla
            </button>
          </div>
        )}

        {/* Main Document Display Stage */}
        <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 bg-slate-950 overflow-auto select-none min-h-[350px]">
          
          {/* Navigation Arrows */}
          {hasPrev && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700 shadow-2xl transition group cursor-pointer"
              title="Önceki Evrak (Sol Ok)"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {hasNext && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700 shadow-2xl transition group cursor-pointer"
              title="Sonraki Evrak (Sağ Ok)"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Loading State */}
          {isLoadingDoc && (
            <div className="text-center p-8 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-200">
                Evrak {sourceBucket} deposundan getiriliyor...
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {record.dosyaAdi}
              </p>
            </div>
          )}

          {/* Error State */}
          {!isLoadingDoc && loadError && (
            <div className="text-center p-8 max-w-md bg-slate-900/90 border border-rose-800/80 rounded-2xl space-y-4 shadow-xl">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
              <div>
                <h4 className="font-bold text-white text-base">Evrak Görüntülenemedi</h4>
                <p className="text-xs text-rose-300/90 mt-1">{loadError}</p>
                <p className="text-xs text-slate-400 mt-2 font-mono">Dosya: {record.dosyaAdi}</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoadingDoc(true);
                    setLoadError(null);
                    resolveCheckDocumentUrl(record.dosyaAdi, record.dosyaUrl).then(res => {
                      if (res.url) {
                        setResolvedUrl(res.url);
                        setSourceBucket(res.sourceBucket);
                      } else {
                        setLoadError(res.error || 'Evrak bulunamadı.');
                      }
                      setIsLoadingDoc(false);
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tekrar Dene</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>İndirmeyi Dene</span>
                </button>
              </div>
            </div>
          )}

          {/* PDF View with Canvas Rendering */}
          {!isLoadingDoc && !loadError && isPdf && resolvedUrl && (
            <div className="w-full h-full min-h-[520px] max-w-5xl rounded-xl overflow-hidden shadow-2xl flex flex-col">
              <PdfViewer
                url={resolvedUrl}
                fileName={record.dosyaAdi}
                onDownload={handleDownload}
                className="h-full min-h-[500px]"
              />
            </div>
          )}

          {/* Image View (JPG, PNG, WEBP, GIF, BMP, etc.) */}
          {!isLoadingDoc && !loadError && !isPdf && resolvedUrl && (
            <div className="max-w-5xl max-h-[80vh] flex items-center justify-center transition-all duration-150">
              {imgLoadFailed ? (
                <div className="text-center p-8 max-w-md bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
                  <ImageIcon className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
                  <div>
                    <h4 className="font-bold text-white text-base">Görsel Yüklenemedi</h4>
                    <p className="text-xs text-slate-400 mt-1">Görsel doğrudan yeni sekmede veya indirilerek açılabilir.</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Yeni Sekmede Aç
                    </a>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                    >
                      İndir
                    </button>
                  </div>
                </div>
              ) : (
                <img
                  src={resolvedUrl}
                  alt={record.dosyaAdi || 'Çek Görseli'}
                  referrerPolicy="no-referrer"
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800 transition-all duration-150 cursor-grab active:cursor-grabbing"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(1) hue-rotate(180deg)' : ''}`
                  }}
                  onError={() => {
                    setImgLoadFailed(true);
                  }}
                />
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Info Bar */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs flex-wrap gap-2">
          
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px] truncate max-w-xl">
            <span className="truncate">
              {sourceBucket} / <strong>{record.dosyaAdi}</strong>
            </span>
            <a
              href="https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/storage/files/buckets/KAYITEDILENCEKLER"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline text-[10px] inline-flex items-center gap-1 shrink-0"
            >
              <span>Supabase Depoda Aç</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || (!record.dosyaAdi && !resolvedUrl)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Evrağı İndir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
            >
              Kapat (ESC)
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
