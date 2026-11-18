import React from 'react';
import { 
  Building2, 
  Database, 
  RefreshCw, 
  Upload, 
  FileSpreadsheet, 
  FolderCheck,
  CheckCircle2,
  Clock,
  SendHorizontal,
  FileDown,
  History
} from 'lucide-react';

interface HeaderProps {
  bucketName: string;
  folderName: string;
  totalFiles: number;
  recordedCount: number;
  transferredCount: number;
  pendingCount: number;
  totalAmountTL: number;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onExportAllPdf?: () => void;
  onOpenHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  bucketName,
  folderName,
  totalFiles,
  recordedCount,
  transferredCount,
  pendingCount,
  totalAmountTL,
  isLoading,
  onRefresh,
  onOpenUpload,
  onOpenExport,
  onExportAllPdf,
  onOpenHistory
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#090d16]/95 backdrop-blur sticky top-0 z-30 shadow-xl shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand Logo and Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black ring-1 ring-amber-400/40">
              <Building2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wider">
                  İNŞAAT & MUHASEBE
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Supabase Bağlantısı Aktif
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                BAYBURT ÖZ-KA İNŞAAT CEK KAYIT AKTARMA
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-sm font-medium transition border border-slate-700/60 shadow-sm disabled:opacity-50"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>

            {onExportAllPdf && (
              <button
                onClick={onExportAllPdf}
                disabled={totalFiles === 0}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-sm font-semibold transition border border-rose-700/60 shadow-md shadow-rose-950/40 disabled:opacity-50 cursor-pointer"
                title="Çek Listeleme ve Kayıt Tablosundaki bütün evrakları yatay sayfada, altında Luca / Zirve / Sistem kutucuklarıyla tek PDF olarak indirir"
              >
                <FileDown className="w-4 h-4 text-rose-300" />
                <span>Tek PDF İndir</span>
              </button>
            )}

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold transition shadow-md shadow-amber-500/15"
            >
              <Upload className="w-4 h-4" />
              <span>Yeni Çek Yükle</span>
            </button>

            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-md shadow-emerald-900/30"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Aktarım / Excel</span>
            </button>
          </div>
        </div>

        {/* Path & Live Stats Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 text-slate-400">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Depo Yolu:</span>
              <code className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 font-mono border border-slate-700/80">
                {bucketName} / {folderName}
              </code>
            </div>

            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition shadow-sm border border-amber-400/50 cursor-pointer"
                title="Supabase CEKKAYIT Tablosundaki Geçmiş Kayıtları Görüntüle"
              >
                <History className="w-3.5 h-3.5" />
                <span>GEÇMİŞ KAYITLAR</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <FolderCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Toplam Dosya:</span>
              <strong className="text-white font-semibold">{totalFiles}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>Bekleyen:</span>
              <strong className="font-semibold">{pendingCount}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Kaydedilen:</span>
              <strong className="font-semibold">{recordedCount}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <SendHorizontal className="w-3.5 h-3.5" />
              <span>Aktarılan:</span>
              <strong className="font-semibold">{transferredCount}</strong>
            </div>
            {totalAmountTL > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 text-amber-400 font-medium pl-2 border-l border-slate-700">
                <span>Kayıtlı Toplam:</span>
                <span className="text-white font-bold font-mono">
                  {totalAmountTL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
