import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Database, 
  Building2, 
  FileText, 
  Eye, 
  Calendar, 
  Hash, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Filter, 
  Layers, 
  X, 
  ChevronRight,
  Maximize2,
  FileSpreadsheet,
  Download,
  Table
} from 'lucide-react';
import { CekKayitDbRecord, SantiyeBirimOption } from '../types';
import { 
  fetchCekKayitDbRecords, 
  DB_TABLE_NAME, 
  DEST_BUCKET_NAME,
  downloadCheckFileFromStorage
} from '../lib/supabase';
import { exportAllTablesToExcel } from '../lib/excelExport';
import { HistoryDocumentModal } from './HistoryDocumentModal';

interface HistoryRecordsPageProps {
  onBackToHome: () => void;
}

// Fixed list of requested sites for separate tables
const SANTIYE_GROUPS = [
  { key: 'ARNAVUTKOY', label: 'ARNAVUTKÖY', color: 'from-blue-950/60 to-slate-900 border-blue-600/40 text-blue-300' },
  { key: 'BURSA-OZKA', label: 'BURSA-ÖZKA', color: 'from-amber-950/60 to-slate-900 border-amber-600/40 text-amber-300' },
  { key: 'MSB-OZKA', label: 'MSB-ÖZKA', color: 'from-emerald-950/60 to-slate-900 border-emerald-600/40 text-emerald-300' },
  { key: 'MAMAK', label: 'MAMAK', color: 'from-rose-950/60 to-slate-900 border-rose-600/40 text-rose-300' },
  { key: 'SEKA', label: 'SEKA', color: 'from-purple-950/60 to-slate-900 border-purple-600/40 text-purple-300' },
  { key: 'DIGER', label: 'DİĞER', color: 'from-cyan-950/60 to-slate-900 border-cyan-600/40 text-cyan-300' },
] as const;

// Helper to normalize site name to match group key
function getNormalizedSantiyeKey(site: string): string {
  if (!site) return 'DIGER';
  const s = site.toUpperCase().trim()
    .replace('İ', 'I')
    .replace('Ö', 'O')
    .replace('Ü', 'U')
    .replace('Ş', 'S')
    .replace('Ğ', 'G')
    .replace('Ç', 'C');

  if (s.includes('ARNAVUT')) return 'ARNAVUTKOY';
  if (s.includes('BURSA')) return 'BURSA-OZKA';
  if (s.includes('MSB')) return 'MSB-OZKA';
  if (s.includes('MAMAK')) return 'MAMAK';
  if (s.includes('SEKA')) return 'SEKA';
  return 'DIGER';
}

// Compare check numbers ascending (küçükten büyüğe sırala)
function compareCekNumbersAsc(aNo: string, bNo: string): number {
  const cleanA = (aNo || '').trim();
  const cleanB = (bNo || '').trim();

  // Try pure numeric parse
  const numA = parseInt(cleanA.replace(/\D/g, ''), 10);
  const numB = parseInt(cleanB.replace(/\D/g, ''), 10);

  if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
    return numA - numB;
  }

  // Fallback to natural string sort
  return cleanA.localeCompare(cleanB, undefined, { numeric: true, sensitivity: 'base' });
}

export const HistoryRecordsPage: React.FC<HistoryRecordsPageProps> = ({ onBackToHome }) => {
  const [records, setRecords] = useState<CekKayitDbRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Preview Modal for Document Image
  const [previewRecord, setPreviewRecord] = useState<CekKayitDbRecord | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);

  // Download check file directly from KAYITEDILENCEKLER storage
  const handleDownloadFile = async (rec: CekKayitDbRecord, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!rec.dosyaAdi && !rec.dosyaUrl) {
      alert('Bu kayda ait evrak dosyası bulunamadı.');
      return;
    }

    setDownloadingId(rec.id);
    try {
      const ok = await downloadCheckFileFromStorage(rec.dosyaAdi, rec.dosyaUrl);
      if (!ok) {
        if (rec.dosyaUrl) {
          window.open(rec.dosyaUrl, '_blank');
        } else {
          alert('Evrak indirilemedi veya dosyaya ulaşılamadı.');
        }
      }
    } catch (err: any) {
      console.error('İndirme hatası:', err);
      if (rec.dosyaUrl) {
        window.open(rec.dosyaUrl, '_blank');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Export All Tables to Excel (.xlsx)
  const handleExportAllToExcel = () => {
    if (records.length === 0) {
      alert('Dışa aktarılacak çek kaydı bulunamadı.');
      return;
    }

    try {
      setIsExportingExcel(true);
      exportAllTablesToExcel(records, groupedRecords, 'CEKKAYIT_TUM_TABLOLAR');
      setExportSuccessMsg('Tüm tablolar başarıyla Excel dosyası (.xlsx) olarak indirildi!');
      setTimeout(() => setExportSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Excel export error:', err);
      alert('Excel dosyası oluşturulurken hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Load records from Supabase CEKKAYIT
  const loadRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchCekKayitDbRecords();
      if (res.success) {
        setRecords(res.data);
      } else {
        setError(res.error || 'Kayıtlar yüklenemedi.');
      }
    } catch (err: any) {
      setError(err.message || 'Veritabanına bağlanırken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Filter records by "BUL" Search query (Alacaklı İsmi ve Çek Numarası ile)
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return records;

    return records.filter(r => {
      const matchCekNo = (r.cekNo || '').toLowerCase().includes(q);
      const matchAlacakli = (r.alacakliUnvan || '').toLowerCase().includes(q);
      const matchSantiye = (r.santiyeBirim || '').toLowerCase().includes(q);
      const matchAciklama = (r.aciklama || '').toLowerCase().includes(q);
      const matchVade = (r.vadeTarihi || '').toLowerCase().includes(q);
      const matchDosya = (r.dosyaAdi || '').toLowerCase().includes(q);

      return matchCekNo || matchAlacakli || matchSantiye || matchAciklama || matchVade || matchDosya;
    });
  }, [records, searchQuery]);

  // Group and sort records by SANTIYE_BIRIM
  const groupedRecords = useMemo(() => {
    const groups: { [key: string]: CekKayitDbRecord[] } = {
      'ARNAVUTKOY': [],
      'BURSA-OZKA': [],
      'MSB-OZKA': [],
      'MAMAK': [],
      'SEKA': [],
      'DIGER': []
    };

    filteredRecords.forEach(rec => {
      const key = getNormalizedSantiyeKey(rec.santiyeBirim);
      if (groups[key]) {
        groups[key].push(rec);
      } else {
        groups['DIGER'].push(rec);
      }
    });

    // Sort each group by CEK_NUMARASI ascending (Küçükten Büyüğe)
    Object.keys(groups).forEach(k => {
      groups[k].sort((a, b) => compareCekNumbersAsc(a.cekNo, b.cekNo));
    });

    return groups;
  }, [filteredRecords]);

  // Overall Statistics
  const totalCount = records.length;
  const filteredCount = filteredRecords.length;
  
  const totalAmountTL = useMemo(() => {
    return filteredRecords.reduce((sum, r) => {
      if (!r.paraBirimi || r.paraBirimi === 'TL') {
        return sum + (Number(r.tutar) || 0);
      }
      return sum;
    }, 0);
  }, [filteredRecords]);

  const totalAmountUSD = useMemo(() => {
    return filteredRecords.reduce((sum, r) => {
      if (r.paraBirimi === 'USD') {
        return sum + (Number(r.tutar) || 0);
      }
      return sum;
    }, 0);
  }, [filteredRecords]);

  const totalAmountEUR = useMemo(() => {
    return filteredRecords.reduce((sum, r) => {
      if (r.paraBirimi === 'EUR') {
        return sum + (Number(r.tutar) || 0);
      }
      return sum;
    }, 0);
  }, [filteredRecords]);

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#090d16]/95 backdrop-blur sticky top-0 z-30 shadow-xl shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Back Button & Title */}
            <div className="flex items-center gap-3">
              {/* ANA SAYFAYA GERİ DÖN BUTONU */}
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700/80 shadow-md cursor-pointer group"
                title="Ana Sayfaya Geri Dön"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
                <span>ANA SAYFAYA GERİ DÖN</span>
              </button>

              <div className="h-6 w-px bg-slate-800 hidden sm:block" />

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                    SUPABASE: {DB_TABLE_NAME}
                  </span>
                  <span className="text-xs text-slate-400 font-mono hidden md:inline">
                    public.CEKKAYIT
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>GEÇMİŞ ÇEK KAYITLARI</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {totalCount} Toplam Kayıt
                  </span>
                </h1>
              </div>
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* BÜTÜN TABLOLARI EXCEL'E AKTAR BUTONU */}
              <button
                type="button"
                onClick={handleExportAllToExcel}
                disabled={isLoading || records.length === 0 || isExportingExcel}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/50 border border-emerald-400/40 disabled:opacity-50 cursor-pointer group"
                title="Tüm Şantiye Tablolarını Excel Dosyası (.xlsx) Olarak İndir"
              >
                {isExportingExcel ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                )}
                <span>EXCEL'E AKTAR</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-900/80 text-[10px] font-mono font-bold text-emerald-200">
                  {records.length}
                </span>
              </button>

              <button
                type="button"
                onClick={loadRecords}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700/80 shadow-sm disabled:opacity-50 cursor-pointer"
                title="Veritabanından Yenile"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
                <span>Yenile</span>
              </button>

              <a
                href="https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/editor/18291?schema=public/CEKKAYIT"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition shadow-sm hidden md:inline-flex"
                title="Supabase Veritabanı Tablo Editörünü Aç"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase CEKKAYIT</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>

          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col space-y-6">
        
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {SANTIYE_GROUPS.map(g => {
            const count = (groupedRecords[g.key] || []).length;
            const subtotal = (groupedRecords[g.key] || []).reduce((acc, c) => acc + (Number(c.tutar) || 0), 0);

            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setActiveTab(activeTab === g.key ? 'ALL' : g.key)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === g.key 
                    ? 'bg-slate-800/90 border-amber-500 ring-2 ring-amber-500/30 shadow-lg' 
                    : 'bg-slate-900/60 hover:bg-slate-800/50 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-300">{g.label}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                    {count}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-400 truncate">
                  {subtotal > 0 ? `${subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '-'}
                </div>
              </button>
            );
          })}
        </div>

        {/* BUL / FILTER TOOLBAR */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg backdrop-blur space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* BUL TEXTBOX (Alacaklı İsmiyle ve Çek Numarasıyla Filtreleme) */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="BUL: Alacaklı (Lehtar) ismi veya Çek Numarası yazarak arayın..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-500 transition outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  title="Aramayı Temizle"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Tab Selector & Export */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tüm Şantiyeler (Ayrı Tablolar)</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-900/30 text-[10px] font-mono">
                  {filteredCount}
                </span>
              </button>

              {SANTIYE_GROUPS.map(g => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setActiveTab(g.key)}
                  className={`px-3 py-2 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
                    activeTab === g.key
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{g.label}</span>
                  <span className="ml-1.5 px-1.5 py-0.2 rounded bg-slate-950/50 text-[10px] font-mono text-slate-300">
                    {(groupedRecords[g.key] || []).length}
                  </span>
                </button>
              ))}

              <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={handleExportAllToExcel}
                disabled={isLoading || records.length === 0 || isExportingExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition whitespace-nowrap cursor-pointer shadow border border-emerald-400/40 disabled:opacity-50"
                title="Tüm Şantiye Tablolarını Excel'e Aktar"
              >
                {isExportingExcel ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                )}
                <span>Excel'e Aktar</span>
              </button>
            </div>

          </div>

          {/* Search info & Active Filters badge */}
          {searchQuery && (
            <div className="flex items-center justify-between text-xs text-amber-300/90 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span>Filtre sonucu: <strong>{filteredCount}</strong> çek kaydı bulundu.</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Çek numarasına göre küçükten büyüğe sıralandı.</span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-amber-400 hover:underline font-semibold"
              >
                Filtreyi Temizle
              </button>
            </div>
          )}
        </div>

        {/* SUCCESS NOTIFICATION TOAST */}
        {exportSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs flex items-center justify-between shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-semibold">{exportSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setExportSuccessMsg(null)}
              className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm font-semibold text-slate-300">
              Supabase CEKKAYIT tablosundaki veriler alınıyor...
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && !isLoading && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-700/60 text-rose-200 text-xs flex items-start gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block text-rose-300">Veritabanı Okuma Hatası:</strong>
              <span>{error}</span>
              <p className="mt-1 text-slate-400">
                Supabase projenizde <code className="text-amber-300 font-mono">CEKKAYIT</code> tablosunun oluşturulduğundan ve okuma izinlerinin aktif olduğundan emin olun.
              </p>
            </div>
            <button
              onClick={loadRecords}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded text-xs font-semibold shrink-0 cursor-pointer"
            >
              Tekrar Dene
            </button>
          </div>
        )}

        {/* SEPARATE TABLES FOR EACH SANTIYE_BIRIM */}
        {!isLoading && (
          <div className="space-y-8">
            {SANTIYE_GROUPS.filter(g => activeTab === 'ALL' || activeTab === g.key).map(group => {
              const groupItems = groupedRecords[group.key] || [];
              const groupTotalTL = groupItems.reduce((sum, r) => sum + (Number(r.tutar) || 0), 0);

              return (
                <div 
                  key={group.key}
                  id={`table-${group.key}`}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur"
                >
                  
                  {/* Table Category Header */}
                  <div className={`px-5 py-3.5 bg-gradient-to-r ${group.color} border-b flex flex-wrap items-center justify-between gap-3`}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-700/50">
                        <Building2 className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-black tracking-wide text-white flex items-center gap-2">
                          <span>{group.label} ŞANTİYESİ ÇEKLERİ</span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950/70 text-amber-300 border border-slate-700">
                            {groupItems.length} Çek
                          </span>
                        </h2>
                        <p className="text-[11px] text-slate-400">
                          SANTIYE_BIRIM = '{group.key}' • Çek numarasına göre küçükten büyüğe sıralı
                        </p>
                      </div>
                    </div>

                    {/* Subtotal & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Şantiye Toplam Tutarı
                        </span>
                        <span className="text-sm sm:text-base font-mono font-extrabold text-white">
                          {groupTotalTL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Table Content */}
                  {groupItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Bu şantiyeye ({group.label}) ait kayıtlı çek bulunmuyor.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="px-3.5 py-3 text-center w-12">#</th>
                            <th className="px-4 py-3 font-mono">ÇEK NUMARASI</th>
                            <th className="px-4 py-3">VADE TARİHİ</th>
                            <th className="px-4 py-3">LEHTAR / ALACAKLI</th>
                            <th className="px-4 py-3 text-right">TUTAR</th>
                            <th className="px-4 py-3">ŞANTİYE / BİRİM</th>
                            <th className="px-4 py-3">AÇIKLAMA</th>
                            <th className="px-4 py-3">EVRAK / DOSYA</th>
                            <th className="px-4 py-3 text-center min-w-[170px]">EVRAK İŞLEMLERİ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {groupItems.map((item, index) => {
                            const isPdf = item.dosyaAdi?.toLowerCase().endsWith('.pdf');
                            const isDownloading = downloadingId === item.id;

                            return (
                              <tr 
                                key={item.id || index}
                                className="hover:bg-slate-800/50 transition-colors"
                              >
                                {/* SIRA NO */}
                                <td className="px-3.5 py-3 text-center font-mono text-slate-500 font-semibold">
                                  {index + 1}
                                </td>

                                {/* CEK_NUMARASI (Highlight) */}
                                <td className="px-4 py-3 font-mono font-bold text-amber-400 text-sm whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                    <Hash className="w-3 h-3 text-amber-500 opacity-70" />
                                    <span>{item.cekNo || '-'}</span>
                                  </div>
                                </td>

                                {/* VADE_TARIHI */}
                                <td className="px-4 py-3 font-mono text-slate-200 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{item.vadeTarihi || '-'}</span>
                                  </div>
                                </td>

                                {/* ALACAKLI / LEHTAR */}
                                <td className="px-4 py-3 font-bold text-white max-w-[200px] truncate" title={item.alacakliUnvan}>
                                  {item.alacakliUnvan || '-'}
                                </td>

                                {/* CEK_TUTARI & PARA_BIRIMI */}
                                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                                  {item.tutar ? `${Number(item.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${item.paraBirimi || 'TL'}` : '-'}
                                </td>

                                {/* SANTIYE_BIRIM */}
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                                    {item.santiyeBirim || group.label}
                                  </span>
                                </td>

                                {/* ACIKLAMA */}
                                <td className="px-4 py-3 text-slate-400 max-w-[180px] truncate" title={item.aciklama}>
                                  {item.aciklama || '-'}
                                </td>

                                {/* DOSYA_ADI */}
                                <td className="px-4 py-3 max-w-[160px] truncate text-slate-300 font-mono text-[11px]" title={item.dosyaAdi}>
                                  <div className="flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{item.dosyaAdi || '-'}</span>
                                  </div>
                                </td>

                                {/* İŞLEM / GÖSTER VE İNDİR */}
                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {/* GÖSTER BUTONU */}
                                    <button
                                      type="button"
                                      onClick={() => setPreviewRecord(item)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold border border-amber-500/30 text-xs transition cursor-pointer shadow-sm group"
                                      title="KAYITEDILENCEKLER deposundaki evrakı görüntüle"
                                    >
                                      <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                      <span>GÖSTER</span>
                                    </button>

                                    {/* İNDİR BUTONU */}
                                    <button
                                      type="button"
                                      onClick={(e) => handleDownloadFile(item, e)}
                                      disabled={isDownloading || (!item.dosyaAdi && !item.dosyaUrl)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-800 text-emerald-300 hover:text-white font-semibold border border-emerald-700/60 text-xs transition cursor-pointer shadow-sm disabled:opacity-40"
                                      title="KAYITEDILENCEKLER deposundaki evrakı bilgisayara indir"
                                    >
                                      {isDownloading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Download className="w-3.5 h-3.5" />
                                      )}
                                      <span>İNDİR</span>
                                    </button>

                                    {/* YENİ SEKMEDE DOĞRUDAN AÇ */}
                                    {item.dosyaUrl && (
                                      <a
                                        href={item.dosyaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                                        title="Yeni Sekmede Tam Boyut Aç"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                                      </a>
                                    )}
                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Table Footer Summary */}
                  {groupItems.length > 0 && (
                    <div className="px-5 py-2.5 bg-slate-950/90 border-t border-slate-800 text-slate-400 text-xs flex items-center justify-between">
                      <span>Kayıt Sayısı: <strong className="text-white">{groupItems.length}</strong></span>
                      <div className="flex items-center gap-2">
                        <span>Ara Toplam:</span>
                        <strong className="text-emerald-400 font-mono">
                          {groupTotalTL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                        </strong>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* COMPREHENSIVE DOCUMENT PREVIEW & INSPECTION MODAL */}
      {previewRecord && (
        <HistoryDocumentModal
          record={previewRecord}
          recordsList={filteredRecords}
          onClose={() => setPreviewRecord(null)}
          onSelectRecord={(rec) => setPreviewRecord(rec)}
        />
      )}

    </div>
  );
};

