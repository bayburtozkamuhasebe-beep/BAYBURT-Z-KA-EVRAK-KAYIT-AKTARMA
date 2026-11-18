import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  Eye, 
  FileText, 
  Clock, 
  CheckCircle2, 
  SendHorizontal, 
  AlertCircle, 
  Loader2, 
  FolderCheck, 
  Calendar, 
  Trash2, 
  ArrowUpDown,
  Download,
  FolderOpen,
  Sparkles,
  RefreshCw,
  FileCheck2,
  ExternalLink,
  FileDown,
  CheckSquare,
  Square,
  ShieldAlert
} from 'lucide-react';
import { supabase, BUCKET_NAME, DEFAULT_FOLDER } from './lib/supabase';
import { CheckRecordData, SupabaseStorageFile } from './types';
import { Header } from './components/Header';
import { CheckPreviewModal } from './components/CheckPreviewModal';
import { CheckFormModal } from './components/CheckFormModal';
import { UploadModal } from './components/UploadModal';
import { ExportModal } from './components/ExportModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { HistoryRecordsPage } from './components/HistoryRecordsPage';
import { exportAllChecksToSinglePdf } from './lib/pdfExport';

const LOCAL_STORAGE_KEY = 'bayburt_ozka_cek_kayitlari_v1';

export default function App() {
  const [currentView, setCurrentView] = useState<'main' | 'history'>('main');
  const [files, setFiles] = useState<SupabaseStorageFile[]>([]);
  const [checkRecords, setCheckRecords] = useState<{ [key: string]: CheckRecordData }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection states
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

  // UI States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Beklemede' | 'Kaydedildi' | 'Aktarıldı'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'amount' | 'dueDate'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [previewCheck, setPreviewCheck] = useState<CheckRecordData | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(-1);
  const [formCheck, setFormCheck] = useState<CheckRecordData | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  
  // Deletion modal state
  const [checkToDelete, setCheckToDelete] = useState<CheckRecordData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // PDF Export Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  // Load saved check records from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setCheckRecords(JSON.parse(saved));
      }
    } catch (e) {
      console.error('LocalStorage error:', e);
    }
  }, []);

  // Save to localStorage whenever checkRecords updates
  const saveRecordsToStorage = (updated: { [key: string]: CheckRecordData }) => {
    setCheckRecords(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  };

  // Fetch files from Supabase Storage: CEKLER / MAMAK
  const fetchStorageFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(DEFAULT_FOLDER, {
          limit: 200,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) {
        console.error('Supabase list error:', listError);
        setError(`Supabase Deposu (${BUCKET_NAME}/${DEFAULT_FOLDER}) sorgulanırken uyarı: ${listError.message}`);
        setFiles([]);
        return;
      }

      const validFiles = (data || []).filter(f => f.name && !f.name.startsWith('.'));
      setFiles(validFiles);

    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Supabase Storage dosyaları yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorageFiles();
  }, [fetchStorageFiles]);

  // Combine storage files with saved check metadata
  const combinedChecksList: CheckRecordData[] = useMemo(() => {
    return files.map(file => {
      const filePath = `${DEFAULT_FOLDER}/${file.name}`;
      const existing = checkRecords[file.name] || {};

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return {
        id: file.id || file.name,
        fileName: file.name,
        filePath: filePath,
        fileUrl: urlData?.publicUrl || '',
        fileSize: file.metadata?.size || file.metadata?.contentLength,
        fileDate: file.created_at || file.updated_at || file.metadata?.lastModified,
        
        vadeTarihi: existing.vadeTarihi || '',
        cekNo: existing.cekNo || '',
        alacakliUnvan: existing.alacakliUnvan || '',
        tutar: existing.tutar || '',
        paraBirimi: existing.paraBirimi || 'TL',
        santiyeBirim: existing.santiyeBirim || '',
        aciklama: existing.aciklama || '',
        
        kayitDurumu: existing.kayitDurumu || (existing.cekNo || existing.tutar ? 'Kaydedildi' : 'Beklemede'),
        aktarimHedefi: existing.aktarimHedefi || 'Zirve',
        kayitTarihi: existing.kayitTarihi
      };
    });
  }, [files, checkRecords]);

  // Filter and Sort checks
  const filteredChecks = useMemo(() => {
    return combinedChecksList.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        c.fileName.toLowerCase().includes(q) ||
        (c.cekNo && c.cekNo.toLowerCase().includes(q)) ||
        (c.alacakliUnvan && c.alacakliUnvan.toLowerCase().includes(q)) ||
        (c.santiyeBirim && c.santiyeBirim.toLowerCase().includes(q)) ||
        (c.vadeTarihi && c.vadeTarihi.toLowerCase().includes(q)) ||
        (c.aciklama && c.aciklama.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || c.kayitDurumu === statusFilter;

      return matchSearch && matchStatus;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.fileName.localeCompare(b.fileName);
      } else if (sortBy === 'date') {
        comparison = (new Date(b.fileDate || 0).getTime()) - (new Date(a.fileDate || 0).getTime());
      } else if (sortBy === 'amount') {
        comparison = (Number(b.tutar) || 0) - (Number(a.tutar) || 0);
      } else if (sortBy === 'dueDate') {
        comparison = (a.vadeTarihi || '').localeCompare(b.vadeTarihi || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [combinedChecksList, searchQuery, statusFilter, sortBy, sortOrder]);

  // Counts & Amounts
  const recordedCount = useMemo(() => combinedChecksList.filter(c => c.kayitDurumu === 'Kaydedildi').length, [combinedChecksList]);
  const transferredCount = useMemo(() => combinedChecksList.filter(c => c.kayitDurumu === 'Aktarıldı').length, [combinedChecksList]);
  const pendingCount = useMemo(() => combinedChecksList.filter(c => c.kayitDurumu === 'Beklemede').length, [combinedChecksList]);
  const totalAmountTL = useMemo(() => {
    return combinedChecksList.reduce((sum, c) => sum + (Number(c.tutar) || 0), 0);
  }, [combinedChecksList]);

  // Selection Logic
  const isAllSelected = useMemo(() => {
    return filteredChecks.length > 0 && filteredChecks.every(c => selectedFileNames.includes(c.fileName));
  }, [filteredChecks, selectedFileNames]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFileNames([]);
    } else {
      setSelectedFileNames(filteredChecks.map(c => c.fileName));
    }
  };

  const toggleSelectCheck = (fileName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFileNames(prev => 
      prev.includes(fileName) ? prev.filter(f => f !== fileName) : [...prev, fileName]
    );
  };

  // Save check record from modal
  const handleSaveCheckRecord = (updatedData: CheckRecordData, oldFileName?: string) => {
    const updated = { ...checkRecords };
    if (oldFileName && oldFileName !== updatedData.fileName) {
      delete updated[oldFileName];
    }
    updated[updatedData.fileName] = updatedData;
    saveRecordsToStorage(updated);

    // Update files state immediately so the renamed/updated file reflects on page right away
    setFiles(prevFiles => {
      const exists = prevFiles.some(f => f.name === updatedData.fileName);
      if (oldFileName && oldFileName !== updatedData.fileName) {
        return prevFiles.map(f => f.name === oldFileName ? { ...f, name: updatedData.fileName } : f);
      }
      if (!exists) {
        return [{ name: updatedData.fileName, updated_at: new Date().toISOString() }, ...prevFiles];
      }
      return prevFiles;
    });
    
    // Also fetch fresh state from Supabase
    setTimeout(() => {
      fetchStorageFiles();
    }, 600);
  };

  // Trigger Delete Confirmation Modal
  const requestDeleteFile = (check: CheckRecordData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCheckToDelete(check);
    setIsDeleteModalOpen(true);
  };

  // Handle callback after delete finishes
  const handleDeletedCheck = (deletedFileName: string) => {
    // Remove from local metadata
    const updated = { ...checkRecords };
    delete updated[deletedFileName];
    saveRecordsToStorage(updated);

    // Remove from selected list
    setSelectedFileNames(prev => prev.filter(f => f !== deletedFileName));

    // Refresh Supabase files
    fetchStorageFiles();
  };

  // Preview Navigation
  const openPreviewAtIndex = (index: number) => {
    if (index >= 0 && index < filteredChecks.length) {
      setPreviewIndex(index);
      setPreviewCheck(filteredChecks[index]);
    }
  };

  const handlePrevPreview = () => {
    if (previewIndex > 0) {
      openPreviewAtIndex(previewIndex - 1);
    }
  };

  const handleNextPreview = () => {
    if (previewIndex < filteredChecks.length - 1) {
      openPreviewAtIndex(previewIndex + 1);
    }
  };

  // Single Merged PDF Generation Action
  const handleGenerateSinglePdf = async (onlySelected: boolean = false) => {
    let checksToExport = filteredChecks;
    if (onlySelected && selectedFileNames.length > 0) {
      checksToExport = filteredChecks.filter(c => selectedFileNames.includes(c.fileName));
    }

    if (checksToExport.length === 0) {
      alert('İndirilecek evrak bulunamadı.');
      return;
    }

    setIsGeneratingPdf(true);
    setPdfProgress({ current: 0, total: checksToExport.length, fileName: 'Başlatılıyor...' });

    try {
      const pdfBlob = await exportAllChecksToSinglePdf(checksToExport, progress => {
        setPdfProgress({
          current: progress.current,
          total: progress.total,
          fileName: progress.fileName
        });
      });

      // Trigger automatic browser download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = onlySelected 
        ? `BAYBURT_OZKA_SECILEN_CEKLER_${dateStr}.pdf` 
        : `BAYBURT_OZKA_TUM_CEKLER_${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF oluşturma hatası:', err);
      alert(`PDF hazırlanırken hata oluştu: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  if (currentView === 'history') {
    return (
      <HistoryRecordsPage
        onBackToHome={() => {
          setCurrentView('main');
          fetchStorageFiles();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Main Navigation Bar */}
      <Header
        bucketName={BUCKET_NAME}
        folderName={DEFAULT_FOLDER}
        totalFiles={files.length}
        recordedCount={recordedCount}
        transferredCount={transferredCount}
        pendingCount={pendingCount}
        totalAmountTL={totalAmountTL}
        isLoading={isLoading}
        onRefresh={fetchStorageFiles}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onExportAllPdf={() => handleGenerateSinglePdf(false)}
        onOpenHistory={() => setCurrentView('history')}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col space-y-5">
        
        {/* Page Section Title & Supabase Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 shadow-lg backdrop-blur">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                SUPABASE STORAGE & CEKKAYIT YÖNETİMİ
              </span>
            </div>
            {/* The requested list title: "KAYIT YAPILACAK ÇEKLER" */}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-3">
              <span>KAYIT YAPILACAK ÇEKLER</span>
              <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                {filteredChecks.length} Çek
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Depo Klasörü:</span>
              <span className="text-slate-300 font-mono font-medium">/{BUCKET_NAME}/{DEFAULT_FOLDER}</span>
              <span className="text-slate-600">•</span>
              <span>Evrakları seçip tek PDF indirebilir, kayıt yapabilir ve güvenle silebilirsiniz.</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* BÜTÜN EVRAKLARI TEK PDF YAPARAK İNDİRME BUTONU */}
            <button
              onClick={() => handleGenerateSinglePdf(false)}
              disabled={filteredChecks.length === 0 || isGeneratingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-900 to-[#800020] hover:from-rose-800 hover:to-rose-900 text-white text-xs font-bold transition border border-rose-700 shadow-lg shadow-rose-950/50 disabled:opacity-50 cursor-pointer"
              title="Çek Listeleme ve Kayıt Tablosundaki bütün evrakları yatay sayfada, altında Luca / Zirve / Sistem kutucuklarıyla tek PDF olarak indirir"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-300" />
              ) : (
                <FileDown className="w-4 h-4 text-rose-300" />
              )}
              <span>
                {isGeneratingPdf 
                  ? `PDF Hazırlanıyor (${pdfProgress?.current || 0}/${pdfProgress?.total || filteredChecks.length})...` 
                  : 'TEK PDF İNDİR'}
              </span>
            </button>

            {/* Seçilen varsa alternatif olarak sadece seçilenleri indirme imkanı */}
            {selectedFileNames.length > 0 && (
              <button
                onClick={() => handleGenerateSinglePdf(true)}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold transition border border-amber-500 shadow-md disabled:opacity-50 cursor-pointer"
                title="Sadece seçilen evrakları yatay sayfada tek PDF olarak indirir"
              >
                <FileDown className="w-4 h-4 text-amber-200" />
                <span>Seçilenleri İndir ({selectedFileNames.length})</span>
              </button>
            )}

            <a
              href={`https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/storage/files/buckets/${BUCKET_NAME}/${DEFAULT_FOLDER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              title="Supabase Storage Panelini Aç"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Supabase Dashboard</span>
            </a>
          </div>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/60 text-amber-200 text-xs flex items-start justify-between gap-3 shadow-md">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-300">Depo Bilgisi:</strong>
                <span>{error}</span>
                <p className="mt-1 text-slate-400">
                  Supabase projenizde <code className="text-amber-300 font-mono">{BUCKET_NAME}</code> isimli bucket ve içinde <code className="text-amber-300 font-mono">{DEFAULT_FOLDER}</code> klasörü mevcutsa dosyalar listelenecektir. 'Yeni Çek Yükle' butonu ile de doğrudan dosya yükleyebilirsiniz.
                </p>
              </div>
            </div>
            <button
              onClick={fetchStorageFiles}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs font-semibold shrink-0"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* Search, Filter & Bulk Action Toolbar */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
          
          {/* Left: Search Bar & Selection Control */}
          <div className="flex items-center gap-2.5 flex-1">
            
            {/* "TÜMÜNÜ SEÇ" KUTUCUĞU */}
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={filteredChecks.length === 0}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border ${
                isAllSelected 
                  ? 'bg-rose-900/40 border-rose-600 text-rose-200' 
                  : selectedFileNames.length > 0
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Tümünü Seç veya Seçimi Kaldır"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-rose-400" />
              ) : selectedFileNames.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span className="whitespace-nowrap">
                {isAllSelected 
                  ? 'Tümü Seçildi' 
                  : selectedFileNames.length > 0 
                  ? `${selectedFileNames.length} Seçili` 
                  : 'Tümünü Seç'}
              </span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Çek no, vade, alacaklı veya dosya adı ara..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="hidden lg:flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition ${statusFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Tümü ({combinedChecksList.length})
              </button>
              <button
                onClick={() => setStatusFilter('Beklemede')}
                className={`px-3 py-1 rounded-lg font-medium transition ${statusFilter === 'Beklemede' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Bekleyen ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('Kaydedildi')}
                className={`px-3 py-1 rounded-lg font-medium transition ${statusFilter === 'Kaydedildi' ? 'bg-blue-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Kaydedilen ({recordedCount})
              </button>
            </div>
          </div>

          {/* Right: Sort and View Controls */}
          <div className="flex items-center justify-end gap-2.5">
            
            {/* Sorting */}
            <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400">
              <span className="text-[11px] text-slate-500 hidden sm:inline">Sırala:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs focus:outline-none px-1 py-0.5 cursor-pointer font-medium"
              >
                <option value="date" className="bg-slate-900">Dosya Tarihi</option>
                <option value="name" className="bg-slate-900">Dosya Adı</option>
                <option value="amount" className="bg-slate-900">Çek Tutarı</option>
                <option value="dueDate" className="bg-slate-900">Vade Tarihi</option>
              </select>
              <button
                onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-slate-400 hover:text-white rounded"
                title={`Sıralama Yönü: ${sortOrder === 'asc' ? 'Artan (A-Z)' : 'Azalan (Z-A)'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Tablo Liste Görünümü"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                title="Kart Izgara Görünümü"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-300">
              Supabase Storage '{BUCKET_NAME}/{DEFAULT_FOLDER}' taranıyor...
            </p>
            <p className="text-xs text-slate-500">
              Dosyalar ve çek kayıtları getiriliyor
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredChecks.length === 0 && (
          <div className="py-16 px-6 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-slate-800/80 text-amber-400 border border-slate-700 shadow-inner">
              <FolderOpen className="w-10 h-10" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-white">
                {searchQuery || statusFilter !== 'all' ? 'Arama Kriterine Uygun Çek Bulunamadı' : 'Depoda Henüz Çek Dosyası Bulunmuyor'}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Arama filtrenizi temizleyerek tüm dosyaları görüntüleyebilirsiniz.' 
                  : `Supabase Storage'daki '${BUCKET_NAME}/${DEFAULT_FOLDER}' klasöründe kayıtlı dosya bulunmuyor. Yeni çek görsellerini yükleyerek işleme başlayabilirsiniz.`}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {searchQuery || statusFilter !== 'all' ? (
                <button
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                >
                  Filtreleri Temizle
                </button>
              ) : (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-lg shadow-amber-500/20"
                >
                  İlk Çeki Yükle
                </button>
              )}
              <button
                onClick={fetchStorageFiles}
                className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Yenile
              </button>
            </div>
          </div>
        )}

        {/* Content View: Table Mode (BORDO KENARLIKLI VE DAİRESEL ÇERÇEVELİ) */}
        {!isLoading && filteredChecks.length > 0 && viewMode === 'table' && (
          <div className="rounded-2xl border-2 border-[#800020] bg-slate-900 shadow-[0_0_30px_rgba(128,0,32,0.25)] ring-1 ring-rose-950/60 overflow-hidden">
            
            {/* Bordeaux Header Badge */}
            <div className="bg-gradient-to-r from-[#800020] via-rose-950 to-slate-900 px-5 py-2.5 border-b border-rose-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-200 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>BAYBURT ÖZ-KA İNŞAAT - ÇEK LİSTELEME VE KAYIT TABLOSU</span>
              </div>
              <span className="text-[11px] text-rose-300 font-mono">
                {selectedFileNames.length > 0 ? `${selectedFileNames.length} / ${filteredChecks.length} Çek Seçili` : `Toplam ${filteredChecks.length} Çek`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    {/* TIK KUTUCUĞU & TÜMÜNÜ SEÇ BAŞLIĞI */}
                    <th className="p-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-slate-400 hover:text-amber-400 transition"
                        title="Tümünü Seç / Kaldır"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-400" />
                        ) : selectedFileNames.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 w-12 text-center">Görsel</th>
                    <th className="p-3">Dosya Adı</th>
                    <th className="p-3">Vade Tarihi</th>
                    <th className="p-3">Çek No</th>
                    <th className="p-3">Lehtar / Alacaklı</th>
                    <th className="p-3">Şantiye / Birim</th>
                    <th className="p-3 text-right">Çek Tutarı</th>
                    <th className="p-3 text-center">Durum</th>
                    <th className="p-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredChecks.map((check, index) => {
                    const isPdf = check.fileName.toLowerCase().endsWith('.pdf');
                    const isSelected = selectedFileNames.includes(check.fileName);

                    return (
                      <tr 
                        key={check.id} 
                        className={`transition ${isSelected ? 'bg-rose-950/25' : 'hover:bg-slate-800/40'}`}
                      >
                        {/* HER EVRAĞIN ÜSTÜNDE TİK KUTUCUĞU */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => toggleSelectCheck(check.fileName, e)}
                            className="text-slate-400 hover:text-amber-400 transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-rose-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                        </td>

                        {/* Image Thumbnail */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => openPreviewAtIndex(index)}
                            className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center hover:border-amber-500 transition group cursor-pointer"
                            title="Görseli İncele"
                          >
                            {isPdf ? (
                              <FileText className="w-4 h-4 text-rose-400" />
                            ) : (
                              <img 
                                src={check.fileUrl} 
                                alt="" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-110 transition" 
                              />
                            )}
                          </button>
                        </td>

                        {/* Dosya Adı */}
                        <td className="p-3">
                          <button
                            onClick={() => openPreviewAtIndex(index)}
                            className="font-semibold text-white hover:text-amber-400 transition text-left block truncate max-w-[190px] cursor-pointer"
                            title={check.fileName}
                          >
                            {check.fileName}
                          </button>
                          <span className="text-[10px] text-slate-500">
                            {check.fileDate ? new Date(check.fileDate).toLocaleDateString('tr-TR') : '—'}
                          </span>
                        </td>

                        {/* Vade Tarihi */}
                        <td className="p-3 font-mono font-semibold text-slate-200">
                          {check.vadeTarihi || <span className="text-slate-500 font-sans italic text-[11px]">Girilmedi</span>}
                        </td>

                        {/* Çek No */}
                        <td className="p-3 font-mono font-bold text-amber-300">
                          {check.cekNo || '—'}
                        </td>

                        {/* Lehtar / Alacaklı */}
                        <td className="p-3">
                          <span className="text-slate-200 block truncate max-w-[160px]" title={check.alacakliUnvan}>
                            {check.alacakliUnvan || 'BAYBURT ÖZ-KA'}
                          </span>
                          {check.aciklama && (
                            <span className="text-[10px] text-slate-400 italic truncate block max-w-[160px]" title={check.aciklama}>
                              {check.aciklama}
                            </span>
                          )}
                        </td>

                        {/* Şantiye / Birim */}
                        <td className="p-3">
                          {check.santiyeBirim ? (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-bold border border-slate-700 text-xs inline-block">
                              {check.santiyeBirim}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Seçilmedi</span>
                          )}
                        </td>

                        {/* Çek Tutarı */}
                        <td className="p-3 text-right font-mono font-bold text-amber-400">
                          {check.tutar ? `${Number(check.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${check.paraBirimi || 'TL'}` : '—'}
                        </td>

                        {/* Durum */}
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            check.kayitDurumu === 'Aktarıldı' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            check.kayitDurumu === 'Kaydedildi' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {check.kayitDurumu}
                          </span>
                        </td>

                        {/* İşlemler (GÖSTER, Kayıt Yap, SİLME UYARISI) */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* GÖSTER BUTONU */}
                            <button
                              type="button"
                              onClick={() => openPreviewAtIndex(index)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold border border-amber-500/30 text-xs transition cursor-pointer shadow-sm group"
                              title="Evrakı Görüntüle ve Büyüt"
                            >
                              <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              <span>GÖSTER</span>
                            </button>

                            <button
                              onClick={() => {
                                setFormCheck(check);
                                setIsFormOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-semibold text-xs transition border border-slate-700 cursor-pointer"
                              title="Bilgileri Kaydet / Düzenle"
                            >
                              {check.cekNo || check.tutar ? 'Düzenle' : 'Kayıt Yap'}
                            </button>

                            {/* SİL BUTONU -> UYARI VERİR VE SİLER */}
                            <button
                              onClick={(e) => requestDeleteFile(check, e)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="Evrağı Depodan Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content View: Grid Mode (HER EVRAĞIN ÜSTÜNDE TİK KUTUCUĞU İLE) */}
        {!isLoading && filteredChecks.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredChecks.map((check, index) => {
              const isPdf = check.fileName.toLowerCase().endsWith('.pdf');
              const isRecorded = check.kayitDurumu === 'Kaydedildi';
              const isTransferred = check.kayitDurumu === 'Aktarıldı';
              const isSelected = selectedFileNames.includes(check.fileName);

              return (
                <div
                  key={check.id}
                  className={`group bg-slate-900 border rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between ${
                    isSelected 
                      ? 'border-rose-600 ring-2 ring-rose-900/50 shadow-rose-950/20' 
                      : 'border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  {/* Card Image Area */}
                  <div className="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800/80">
                    
                    {/* HER EVRAĞIN ÜSTÜNDE TİK KUTUCUĞU (TOP-LEFT) */}
                    <div className="absolute top-2.5 left-2.5 z-20">
                      <button
                        type="button"
                        onClick={(e) => toggleSelectCheck(check.fileName, e)}
                        className={`p-1.5 rounded-lg backdrop-blur-md transition shadow-md ${
                          isSelected 
                            ? 'bg-rose-900 text-rose-200 ring-1 ring-rose-500' 
                            : 'bg-slate-950/80 text-slate-300 hover:text-amber-400 border border-slate-700/80'
                        }`}
                        title="Seç"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-300" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {isPdf ? (
                      <div 
                        onClick={() => openPreviewAtIndex(index)}
                        className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-amber-300 transition cursor-pointer"
                      >
                        <FileText className="w-12 h-12 text-rose-500" />
                        <span className="text-xs font-mono font-semibold">PDF Belgesi</span>
                      </div>
                    ) : (
                      <img
                        src={check.fileUrl}
                        alt={check.fileName}
                        onClick={() => openPreviewAtIndex(index)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        loading="lazy"
                      />
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-md tracking-wide ${
                        isTransferred ? 'bg-emerald-500 text-slate-950' :
                        isRecorded ? 'bg-blue-500 text-white' :
                        'bg-amber-500 text-slate-950'
                      }`}>
                        {check.kayitDurumu}
                      </span>
                    </div>

                    {/* Hover Inspect Button */}
                    <div 
                      onClick={() => openPreviewAtIndex(index)}
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px] cursor-pointer"
                    >
                      <span className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <Eye className="w-3.5 h-3.5" /> İncele & Büyüt
                      </span>
                    </div>
                  </div>

                  {/* Card Content Area */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition" title={check.fileName}>
                          {check.fileName}
                        </h4>
                      </div>

                      {/* Simplified Details */}
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500 text-[11px]">Vade Tarihi:</span>
                          <span className="font-semibold text-slate-200 font-mono">
                            {check.vadeTarihi || <span className="text-slate-500 font-sans italic">Girilmedi</span>}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500 text-[11px]">Çek No:</span>
                          <span className="font-mono text-amber-300 font-semibold">
                            {check.cekNo || '—'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500 text-[11px]">Lehtar/Alacaklı:</span>
                          <span className="text-slate-200 truncate max-w-[130px]" title={check.alacakliUnvan}>
                            {check.alacakliUnvan || 'BAYBURT ÖZ-KA'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500 text-[11px]">Şantiye / Birim:</span>
                          {check.santiyeBirim ? (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700 text-[11px]">
                              {check.santiyeBirim}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Seçilmedi</span>
                          )}
                        </div>

                        {check.aciklama && (
                          <div className="flex items-center justify-between text-slate-400 text-[11px] pt-0.5">
                            <span className="text-slate-500">Not:</span>
                            <span className="truncate max-w-[140px] italic">{check.aciklama}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount Highlight */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Çek Tutarı:</span>
                      <span className="text-sm font-bold font-mono text-amber-400">
                        {check.tutar ? `${Number(check.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${check.paraBirimi || 'TL'}` : '—'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex items-center gap-1.5">
                      {/* GÖSTER BUTONU */}
                      <button
                        type="button"
                        onClick={() => openPreviewAtIndex(index)}
                        className="py-2 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1 border border-amber-500/30 cursor-pointer shadow-sm group"
                        title="Evrakı Görüntüle"
                      >
                        <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span>GÖSTER</span>
                      </button>

                      <button
                        onClick={() => {
                          setFormCheck(check);
                          setIsFormOpen(true);
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{check.cekNo || check.tutar ? 'Düzenle' : 'Kayıt Yap'}</span>
                      </button>

                      {/* SİLME BUTONU */}
                      <button
                        onClick={(e) => requestDeleteFile(check, e)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                        title="Depodan Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* PDF Generation Progress Modal */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-rose-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="p-3 bg-rose-900/30 text-rose-400 rounded-2xl w-fit mx-auto border border-rose-800/60">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tek PDF Dosyası Hazırlanıyor</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tüm evrak görselleri ve kayıt bilgileri birleştiriliyor...
              </p>
            </div>
            {pdfProgress && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300 font-mono">
                  <span>İşlenen Sayfa:</span>
                  <span className="text-rose-300 font-bold">{pdfProgress.current} / {pdfProgress.total}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate" title={pdfProgress.fileName}>
                  {pdfProgress.fileName}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CheckPreviewModal
        check={previewCheck}
        isOpen={!!previewCheck}
        onClose={() => setPreviewCheck(null)}
        onOpenForm={(checkToEdit) => {
          setFormCheck(checkToEdit);
          setIsFormOpen(true);
        }}
        onNext={handleNextPreview}
        onPrev={handlePrevPreview}
        hasNext={previewIndex < filteredChecks.length - 1}
        hasPrev={previewIndex > 0}
      />

      <CheckFormModal
        check={formCheck}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setFormCheck(null);
        }}
        onSave={handleSaveCheckRecord}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchStorageFiles}
      />

      <ExportModal
        isOpen={isExportOpen}
        checks={filteredChecks}
        onClose={() => setIsExportOpen(false)}
        onMarkAsTransferred={(ids, target) => {
          const updated = { ...checkRecords };
          combinedChecksList.forEach(c => {
            if (ids.includes(c.id)) {
              updated[c.fileName] = {
                ...c,
                kayitDurumu: 'Aktarıldı',
                aktarimHedefi: target as any,
                kayitTarihi: new Date().toISOString()
              };
            }
          });
          saveRecordsToStorage(updated);
        }}
      />

      {/* Delete Confirmation Warning Modal */}
      <DeleteConfirmModal
        check={checkToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCheckToDelete(null);
        }}
        onDeleted={handleDeletedCheck}
      />

    </div>
  );
}
