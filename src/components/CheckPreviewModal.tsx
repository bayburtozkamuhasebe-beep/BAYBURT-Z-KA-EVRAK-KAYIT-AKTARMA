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
  RefreshCcw,
  Copy,
  Printer,
  Loader2,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { CheckRecordData } from '../types';
import { printCheckReceipt } from '../lib/pdfExport';
import { 
  resolveCheckDocumentUrl, 
  downloadCheckFileFromStorage,
  getDocumentFormat,
  DEST_BUCKET_NAME 
} from '../lib/supabase';
import { PdfViewer } from './PdfViewer';

interface CheckPreviewModalProps {
  check: CheckRecordData | null;
  onClose: () => void;
  onOpenEditForm: (check: CheckRecordData) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const CheckPreviewModal: React.FC<CheckPreviewModalProps> = ({
  check,
  onClose,
  onOpenEditForm,
  onPrev,
  onNext,
  hasPrev,
  hasNext
}) => {
  const [activeUrl, setActiveUrl] = useState<string>(check?.fileUrl || '');
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [imgLoadFailed, setImgLoadFailed] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Auto-resolve document if missing or URL changes
  useEffect(() => {
    let isMounted = true;
    let createdBlob: string | null = null;

    if (check) {
      setActiveUrl(check.fileUrl || '');
      setIsLoadingDoc(true);
      setImgLoadFailed(false);

      resolveCheckDocumentUrl(check.fileName, check.fileUrl, check.cekNo).then(res => {
        if (!isMounted) return;
        if (res.url) {
          setActiveUrl(res.url);
          if (res.isBlob) {
            createdBlob = res.url;
          }
        }
        setIsLoadingDoc(false);
      });
    }

    return () => {
      isMounted = false;
      if (createdBlob) {
        URL.revokeObjectURL(createdBlob);
      }
    };
  }, [check?.fileName, check?.fileUrl, check?.cekNo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))));
      if (e.key === '-') setZoom(z => Math.max(0.3, Number((z - 0.25).toFixed(2))));
      if (e.key === 'r' || e.key === 'R') setRotation(r => (r + 90) % 360);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  // Reset viewport when active check changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    setShowFilters(false);
    setImgLoadFailed(false);
  }, [check?.fileName]);

  if (!check) return null;

  const docFormat = getDocumentFormat(check.fileName, activeUrl || check.fileUrl);
  const isPdf = docFormat.isPdf;
  const isImage = docFormat.isImage && !isPdf;

  const handleCopyLink = () => {
    if (activeUrl || check.fileUrl) {
      navigator.clipboard.writeText(activeUrl || check.fileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetFilters = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
  };

  const handlePrint = () => {
    printCheckReceipt(check);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadCheckFileFromStorage(check.fileName, activeUrl || check.fileUrl);
    } catch (err: any) {
      console.error('İndirme hatası:', err);
      if (activeUrl || check.fileUrl) {
        window.open(activeUrl || check.fileUrl, '_blank');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white shadow-lg flex-wrap gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {isPdf ? <FileText className="w-5 h-5 text-rose-400" /> : <Eye className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-base truncate flex items-center gap-2">
              <span>{check.fileName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                check.kayitDurumu === 'Kaydedildi' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                check.kayitDurumu === 'Aktarıldı' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {check.kayitDurumu}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                isPdf ? 'bg-rose-950/80 text-rose-300 border-rose-700/60' : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {isPdf ? 'PDF' : docFormat.extension.toUpperCase()}
              </span>
            </h2>
            <p className="text-xs text-slate-400 truncate">
              {check.cekNo ? `Çek No: ${check.cekNo} | Şantiye: ${check.santiyeBirim || 'Belirtilmedi'}` : `Dosya: ${check.fileName}`}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {isImage && !imgLoadFailed && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setZoom(z => Math.max(0.3, Number((z - 0.25).toFixed(2))))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                title="Küçült"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-1.5 text-slate-400 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))))}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition cursor-pointer"
                title="Büyüt"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition ml-1 cursor-pointer"
                title="90° Döndür"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded transition cursor-pointer ${showFilters ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                title="Görüntü Netleştirme & Kontrast"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              {(zoom !== 1 || rotation !== 0 || brightness !== 100 || contrast !== 100 || invert) && (
                <button
                  onClick={handleResetFilters}
                  className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-700 rounded transition cursor-pointer"
                  title="Görünümü Sıfırla"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Quick Print Receipt */}
          <button
            onClick={handlePrint}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
            title="Fişi Yazdır"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Download Original File */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg border border-slate-700 transition cursor-pointer"
            title="Orijinal Dosyayı İndir"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>

          {/* Direct Link */}
          {activeUrl && (
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-lg border border-slate-700 transition"
              title="Yeni Sekmede Aç"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Edit Check Data */}
          <button
            onClick={() => {
              onClose();
              onOpenEditForm(check);
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer shadow"
          >
            Düzenle
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer ml-1"
            title="Kapat (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Optional Filters Bar */}
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
            onClick={handleResetFilters}
            className="px-2.5 py-1 text-slate-400 hover:text-white text-xs hover:underline cursor-pointer"
          >
            Sıfırla
          </button>
        </div>
      )}

      {/* Main Image / PDF Stage */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-auto select-none min-h-[350px]">
        
        {/* Navigation Arrows */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700/80 shadow-2xl transition group cursor-pointer"
            title="Önceki Çek (Sol Ok)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-700/80 shadow-2xl transition group cursor-pointer"
            title="Sonraki Çek (Sağ Ok)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Content View: PDF vs Image */}
        {isLoadingDoc && !activeUrl ? (
          <div className="flex flex-col items-center justify-center p-8 text-amber-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-semibold">Evrak yükleniyor...</span>
          </div>
        ) : isPdf ? (
          <div className="w-full h-full max-w-5xl rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
            <PdfViewer
              url={activeUrl || check.fileUrl}
              fileName={check.fileName}
              onDownload={handleDownload}
              className="h-full min-h-[500px]"
            />
          </div>
        ) : (
          <div className="max-w-5xl max-h-[82vh] flex items-center justify-center transition-all duration-150">
            {imgLoadFailed ? (
              <div className="text-center p-8 max-w-md bg-slate-900 border border-slate-700 rounded-2xl space-y-4">
                <ImageIcon className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
                <div>
                  <h4 className="font-bold text-white text-base">Görsel Yüklenemedi</h4>
                  <p className="text-xs text-slate-400 mt-1">Görseli yeni sekmede açabilir veya doğrudan indirebilirsiniz.</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={activeUrl || check.fileUrl}
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
                src={activeUrl || check.fileUrl}
                alt={check.fileName}
                referrerPolicy="no-referrer"
                className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800 transition-all duration-150 cursor-grab active:cursor-grabbing"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(1) hue-rotate(180deg)' : ''}`,
                  transformOrigin: 'center center'
                }}
                onError={() => setImgLoadFailed(true)}
                loading="eager"
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-slate-500">Vade Tarihi:</span>{' '}
            <strong className="text-white">{check.vadeTarihi || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-500">Çek No:</span>{' '}
            <strong className="text-white font-mono">{check.cekNo || '—'}</strong>
          </div>
          <div>
            <span className="text-slate-500">Lehtar/Alacaklı:</span>{' '}
            <strong className="text-white">{check.alacakliUnvan || 'BAYBURT ÖZ-KA İNŞAAT'}</strong>
          </div>
          <div>
            <span className="text-slate-500">Çek Tutarı:</span>{' '}
            <strong className="text-amber-400 font-mono text-sm">
              {check.tutar ? `${Number(check.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${check.paraBirimi || 'TL'}` : '—'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500">Şantiye/Birim:</span>{' '}
            {check.santiyeBirim ? (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {check.santiyeBirim}
              </span>
            ) : (
              <span className="text-slate-500 italic">Seçilmedi</span>
            )}
          </div>
          {check.aciklama && (
            <div>
              <span className="text-slate-500">Açıklama:</span>{' '}
              <span className="text-slate-300 italic">{check.aciklama}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-[11px]">
            İpucu: Sağ/Sol yön tuşları ile çekler arasında geçiş yapabilirsiniz.
          </span>
        </div>
      </div>

    </div>
  );
};
