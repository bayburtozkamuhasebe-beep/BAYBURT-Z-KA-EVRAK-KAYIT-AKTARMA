import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Save, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  User, 
  FileText, 
  Layers,
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Eye,
  Check, 
  AlertCircle, 
  AlertTriangle,
  Loader2, 
  ExternalLink, 
  Download,
  Banknote,
  CheckCheck,
  Building2,
  Landmark,
  Hash,
  Database,
  Plus,
  List
} from 'lucide-react';
import { 
  CheckRecordData, 
  SantiyeBirimOption,
  DONEM_AYLARI,
  KURUM_SANTIYE_BUTONLARI 
} from '../types';
import { downloadCheckPdf } from '../lib/pdfExport';
import { 
  CORPORATE_COMPANIES, 
  EVRAK_DOSYASI_CURSOR, 
  getCorporateCompanyConfig,
  checkDuplicateInCorporateTable,
  fetchDistinctBanksFromCorporateTable,
  fetchDistinctIsinAdlariFromCorporateTable,
  saveCheckToCorporateTable,
  CorporateDuplicateResult,
  moveCheckFileToArsivCekler,
  ARSIV_DASHBOARD_URL,
  SOURCE_MAMAK_DASHBOARD_URL,
  ARSIV_BUCKET_NAME,
  BUCKET_NAME,
  DEFAULT_FOLDER
} from '../lib/supabase';

export const SANTIYE_LIST: string[] = [
  'BAYBURT ÖZ-KA İNŞAAT',
  'SELAHATTİN KALDIRIM İNŞAAT',
  'ARNAVUTKÖY (SEKA-ÖZKA)',
  'MAMAK (SEKA-ÖZKA)',
  'ŞENBAY-ÖZKA ORTAKLIĞI',
  'ARNAVUTKOY',
  'BURSA-OZKA',
  'MSB-OZKA',
  'MAMAK',
  'SEKA',
  'DİGER'
];

interface CheckFormModalProps {
  check: CheckRecordData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CheckRecordData, oldFileName?: string) => void;
}

export const CheckFormModal: React.FC<CheckFormModalProps> = ({
  check,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<CheckRecordData | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [previewRotation, setPreviewRotation] = useState<number>(0);
  
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [printFeedback, setPrintFeedback] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Kurumsal tablo kayıt ve mükerrer evrak kontrol state'leri
  const [isSavingToTable, setIsSavingToTable] = useState<boolean>(false);
  const [saveStepText, setSaveStepText] = useState<string>('');
  const [isCheckingRealtime, setIsCheckingRealtime] = useState<boolean>(false);
  const [realtimeDuplicate, setRealtimeDuplicate] = useState<CorporateDuplicateResult | null>(null);
  const [showDuplicateConfirmModal, setShowDuplicateConfirmModal] = useState<boolean>(false);
  const [duplicateModalData, setDuplicateModalData] = useState<CorporateDuplicateResult | null>(null);

  // Kurumsal portföy seçimi, banka listesi & işin adı/şantiye listesi state'leri
  const [selectedCompanyKey, setSelectedCompanyKey] = useState<string>(CORPORATE_COMPANIES[0].key);
  const [bankList, setBankList] = useState<string[]>([]);
  const [customBanks, setCustomBanks] = useState<string[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(false);
  const [isManualBankMode, setIsManualBankMode] = useState<boolean>(false);
  const manualBankInputRef = useRef<HTMLInputElement | null>(null);

  const [isinAdiList, setIsinAdiList] = useState<string[]>([]);
  const [customIsinAdlari, setCustomIsinAdlari] = useState<string[]>([]);
  const [isLoadingIsinAdlari, setIsLoadingIsinAdlari] = useState<boolean>(false);
  const [isManualIsinAdiMode, setIsManualIsinAdiMode] = useState<boolean>(false);
  const manualIsinAdiInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (check) {
      const initialEvrakTarihi = check.evrakTarihi || check.vadeTarihi || '';
      
      // Auto-detect month from evrakTarihi if donem is empty
      let initialDonem = check.donem || '';
      if (!initialDonem && initialEvrakTarihi) {
        const parts = initialEvrakTarihi.split('-');
        if (parts.length >= 2) {
          const monthIdx = parseInt(parts[1], 10) - 1;
          if (monthIdx >= 0 && monthIdx < DONEM_AYLARI.length) {
            initialDonem = DONEM_AYLARI[monthIdx];
          }
        }
      }

      // Evrak Numarası: strip non-digits and leading zeros
      const sanitizedCekNo = (check.cekNo || '').replace(/[^0-9]/g, '').replace(/^0+/, '');
      const firmaUnvan = check.firmaUnvani || check.alacakliUnvan || '';
      const initialIsinAdi = check.isinAdiSantiye || check.santiyeBirim || '';
      const initialCorporate = getCorporateCompanyConfig(initialIsinAdi);

      setSelectedCompanyKey(initialCorporate.key);
      setFormData({
        ...check,
        evrakTarihi: initialEvrakTarihi,
        vadeTarihi: initialEvrakTarihi,
        donem: initialDonem,
        cekNo: sanitizedCekNo,
        firmaUnvani: firmaUnvan,
        alacakliUnvan: firmaUnvan,
        vergiNo: check.vergiNo || check.kesideciVkn || '',
        kesideciVkn: check.vergiNo || check.kesideciVkn || '',
        bankaAdi: check.bankaAdi || '',
        tutar: check.tutar || '',
        paraBirimi: check.paraBirimi || 'TL',
        isinAdiSantiye: initialIsinAdi,
        santiyeBirim: initialIsinAdi,
        aciklama: check.aciklama || '',
        kayitDurumu: check.kayitDurumu || 'Kaydedildi'
      });
      setPreviewZoom(1);
      setPreviewRotation(0);
      setFormValidationError(null);
      setRealtimeDuplicate(null);
      setShowDuplicateConfirmModal(false);
      setDuplicateModalData(null);
      setCustomBanks([]);
      setIsManualBankMode(false);
      setCustomIsinAdlari([]);
      setIsManualIsinAdiMode(false);
    }
  }, [check]);

  // Seçili kurumsal şirket ve Supabase hedef tablosu (Kurumsal Portföy butonlarından yönetilir)
  const selectedCorporate = useMemo(
    () => CORPORATE_COMPANIES.find(c => c.key === selectedCompanyKey) || CORPORATE_COMPANIES[0],
    [selectedCompanyKey]
  );

  // Seçili kurumsal portföy tablosundan mükerrersiz banka_adi ve isin_adi listelerini çek
  useEffect(() => {
    if (!isOpen || !selectedCorporate.tableName) return;

    let cancelled = false;
    setIsLoadingBanks(true);
    setIsLoadingIsinAdlari(true);
    setCustomBanks([]);
    setCustomIsinAdlari([]);

    Promise.all([
      fetchDistinctBanksFromCorporateTable(selectedCorporate.tableName),
      fetchDistinctIsinAdlariFromCorporateTable(selectedCorporate.tableName)
    ]).then(([bankRes, isinRes]) => {
      if (cancelled) return;
      setBankList(bankRes.banks || []);
      setIsLoadingBanks(false);
      setIsinAdiList(isinRes.isinAdlari || []);
      setIsLoadingIsinAdlari(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedCorporate.tableName]);

  // Manuel banka ekleme moduna geçildiğinde inputa odaklan
  useEffect(() => {
    if (isManualBankMode) {
      const t = setTimeout(() => manualBankInputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [isManualBankMode]);

  // Manuel işin adı / şantiye ekleme moduna geçildiğinde inputa odaklan
  useEffect(() => {
    if (isManualIsinAdiMode) {
      const t = setTimeout(() => manualIsinAdiInputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [isManualIsinAdiMode]);

  // Mükerrersiz ve sıralı birleştirilmiş banka listesi (DB + manuel eklenen + mevcut değer)
  const mergedBankOptions = useMemo(() => {
    const map = new Map<string, string>();
    const addCandidate = (val?: string) => {
      const cleaned = typeof val === 'string' ? val.trim().replace(/\s+/g, ' ') : '';
      if (!cleaned) return;
      const key = cleaned.toLocaleUpperCase('tr-TR');
      if (!map.has(key)) {
        map.set(key, cleaned);
      }
    };

    bankList.forEach(addCandidate);
    customBanks.forEach(addCandidate);
    if (!isManualBankMode && formData?.bankaAdi) {
      addCandidate(formData.bankaAdi);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.localeCompare(b, 'tr-TR', { sensitivity: 'base' })
    );
  }, [bankList, customBanks, isManualBankMode, formData?.bankaAdi]);

  // Mükerrersiz ve sıralı birleştirilmiş işin adı / şantiye listesi (DB + manuel eklenen + mevcut değer)
  const mergedIsinAdiOptions = useMemo(() => {
    const map = new Map<string, string>();
    const addCandidate = (val?: string) => {
      const cleaned = typeof val === 'string' ? val.trim().replace(/\s+/g, ' ') : '';
      if (!cleaned) return;
      const key = cleaned.toLocaleUpperCase('tr-TR');
      if (!map.has(key)) {
        map.set(key, cleaned);
      }
    };

    isinAdiList.forEach(addCandidate);
    customIsinAdlari.forEach(addCandidate);
    const currentIsinVal = formData?.isinAdiSantiye || formData?.santiyeBirim;
    if (!isManualIsinAdiMode && currentIsinVal) {
      addCandidate(currentIsinVal);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.localeCompare(b, 'tr-TR', { sensitivity: 'base' })
    );
  }, [isinAdiList, customIsinAdlari, isManualIsinAdiMode, formData?.isinAdiSantiye, formData?.santiyeBirim]);

  const handleConfirmManualBank = () => {
    const trimmed = (formData?.bankaAdi || '').trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      setIsManualBankMode(false);
      return;
    }

    const key = trimmed.toLocaleUpperCase('tr-TR');
    const existing = mergedBankOptions.find(b => b.toLocaleUpperCase('tr-TR') === key);

    if (existing) {
      handleChange('bankaAdi', existing);
    } else {
      setCustomBanks(prev => [...prev, trimmed]);
      handleChange('bankaAdi', trimmed);
    }
    setIsManualBankMode(false);
  };

  const handleConfirmManualIsinAdi = () => {
    const raw = formData?.isinAdiSantiye || formData?.santiyeBirim || '';
    const trimmed = raw.trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      setIsManualIsinAdiMode(false);
      return;
    }

    const key = trimmed.toLocaleUpperCase('tr-TR');
    const existing = mergedIsinAdiOptions.find(item => item.toLocaleUpperCase('tr-TR') === key);

    if (existing) {
      handleChange('isinAdiSantiye', existing);
      handleChange('santiyeBirim', existing);
    } else {
      setCustomIsinAdlari(prev => [...prev, trimmed]);
      handleChange('isinAdiSantiye', trimmed);
      handleChange('santiyeBirim', trimmed);
    }
    setIsManualIsinAdiMode(false);
  };

  // Evrak numarası ve seçili şirket değiştikçe arkaplanda gerçek zamanlı kontrol
  useEffect(() => {
    if (!formData?.cekNo || formData.cekNo.trim().length === 0) {
      setRealtimeDuplicate(null);
      setIsCheckingRealtime(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingRealtime(true);
      const res = await checkDuplicateInCorporateTable(
        selectedCorporate.tableName,
        formData.cekNo,
        selectedCorporate.name
      );
      setRealtimeDuplicate(res.exists ? res : null);
      setIsCheckingRealtime(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [formData?.cekNo, selectedCorporate.tableName]);

  if (!isOpen || !formData || !check) return null;

  // Gerçekleştirilen kayıt fonksiyonu (doğrudan veya onay sonrası)
  const executeSaveToCorporateTable = async () => {
    if (!formData || !check) return;
    setIsSavingToTable(true);
    setFormValidationError(null);
    setSaveStepText("Evrak CEKLER/MAMAK'tan ARSIVCEKLER'e taşınıyor...");

    try {
      // 1. İLGİLİ EVRAĞI CEKLER / MAMAK'TAN ARSIVCEKLER DEPOSUNA TAŞI
      const moveRes = await moveCheckFileToArsivCekler(check.fileName, {
        filePath: check.filePath,
        fileUrl: check.fileUrl
      });

      if (!moveRes.success) {
        console.error('Arşive taşıma başarısız:', moveRes.error);
        setFormValidationError(
          `Evrak ARSIVCEKLER deposuna taşınamadı: ${moveRes.error}`
        );
        setIsSavingToTable(false);
        setSaveStepText('');
        setShowDuplicateConfirmModal(false);
        return;
      }

      setSaveStepText(`${selectedCorporate.tableName} tablosuna kaydediliyor...`);

      // 2. Yeni hedef URL ile kurumsal Supabase tablosuna kaydet
      const finalFileUrl = moveRes.newUrl || check.fileUrl;
      const dataToSave: CheckRecordData = {
        ...formData,
        fileUrl: finalFileUrl,
        dosyaUrl: finalFileUrl,
        dosyaAdi: check.fileName
      };

      const saveRes = await saveCheckToCorporateTable(selectedCorporate.tableName, dataToSave);
      
      if (!saveRes.success) {
        console.warn(`[${selectedCorporate.tableName}] Kayıt uyarısı:`, saveRes.error);
      }

      const updatedData: CheckRecordData = {
        ...dataToSave,
        fileName: check.fileName,
        kayitDurumu: 'Kaydedildi',
        kayitTarihi: new Date().toISOString()
      };

      setShowDuplicateConfirmModal(false);
      setIsSavingToTable(false);
      setSaveStepText('');

      // Uygulamaya bildir ve modalı kapat
      onSave(updatedData, check.fileName);
      onClose();
    } catch (err: any) {
      console.error('Kayıt hatası:', err);
      setFormValidationError('Kayıt sırasında bir hata oluştu: ' + (err?.message || 'Bilinmeyen hata'));
      setIsSavingToTable(false);
      setSaveStepText('');
      setShowDuplicateConfirmModal(false);
    }
  };

  // Form submit işlemi: Doğrulama ve Mükerrer Kontrolü
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setFormValidationError(null);

    // 1. EVRAK TARİHİ doğrulama
    const dateVal = formData.evrakTarihi || formData.vadeTarihi;
    if (!dateVal || !dateVal.trim()) {
      setFormValidationError('Lütfen Evrak Tarihini seçiniz.');
      return;
    }

    // 2. EVRAK NUMARASI doğrulama (Sadece rakam, başta sıfır olamaz)
    if (!formData.cekNo || !formData.cekNo.trim()) {
      setFormValidationError('Lütfen Evrak Numarası alanını doldurunuz.');
      return;
    }
    if (/^0/.test(formData.cekNo)) {
      setFormValidationError('Evrak Numarası başında "0" (sıfır) olamaz. Lütfen sıfırsız giriniz.');
      return;
    }
    if (!/^\d+$/.test(formData.cekNo)) {
      setFormValidationError('Evrak Numarası sadece rakamlardan oluşmalıdır.');
      return;
    }

    // 3. FİRMA ÜNVANI doğrulama
    const firmaVal = formData.firmaUnvani || formData.alacakliUnvan;
    if (!firmaVal || !firmaVal.trim()) {
      setFormValidationError('Lütfen Firma Ünvanı alanını doldurunuz.');
      return;
    }

    // 4. İŞİN ADI / ŞANTİYE doğrulama
    const santiyeVal = formData.isinAdiSantiye || formData.santiyeBirim;
    if (!santiyeVal || !santiyeVal.trim()) {
      setFormValidationError('Lütfen İşin Adı / Şantiye alanını seçiniz veya manuel ekleyiniz.');
      return;
    }

    // 5. ÇEK TUTARI doğrulama
    const numericTutar = typeof formData.tutar === 'number' 
      ? formData.tutar 
      : parseFloat(String(formData.tutar).replace(/\./g, '').replace(',', '.'));

    if (formData.tutar === '' || formData.tutar === null || formData.tutar === undefined || isNaN(numericTutar) || numericTutar <= 0) {
      setFormValidationError('Lütfen geçerli bir Çek Tutarı giriniz (0\'dan büyük).');
      return;
    }

    // 6. AYNI EVRAK NUMARASINDA KAYIT KONTROLÜ (DUPLICATE CHECK)
    setIsSavingToTable(true);
    const dupResult = await checkDuplicateInCorporateTable(
      selectedCorporate.tableName,
      formData.cekNo,
      selectedCorporate.name
    );

    if (dupResult.exists) {
      setIsSavingToTable(false);
      setDuplicateModalData(dupResult);
      setShowDuplicateConfirmModal(true);
      return;
    }

    // Mükerrer kayıt yoksa kaydı hemen tamamla
    await executeSaveToCorporateTable();
  };

  const handleChange = (field: keyof CheckRecordData, value: any) => {
    setFormData(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };
      
      // If evrakTarihi changes, sync vadeTarihi and auto-set donem if empty
      if (field === 'evrakTarihi') {
        updated.vadeTarihi = value;
        if (value && typeof value === 'string') {
          const parts = value.split('-');
          if (parts.length >= 2) {
            const mIdx = parseInt(parts[1], 10) - 1;
            if (mIdx >= 0 && mIdx < DONEM_AYLARI.length && !updated.donem) {
              updated.donem = DONEM_AYLARI[mIdx];
            }
          }
        }
      }
      // If firmaUnvani changes, sync alacakliUnvan
      if (field === 'firmaUnvani') {
        updated.alacakliUnvan = value;
      }
      // If isinAdiSantiye changes, sync santiyeBirim
      if (field === 'isinAdiSantiye') {
        updated.santiyeBirim = value;
      }
      // If vergiNo changes, sync kesideciVkn
      if (field === 'vergiNo') {
        updated.kesideciVkn = value;
      }

      return updated;
    });
  };

  const handleDownloadPdf = async () => {
    const recordToDownload = formData;
    if (!recordToDownload) return;

    setIsDownloadingPdf(true);
    setPrintFeedback({ type: '', message: '' });

    try {
      const result = await downloadCheckPdf(recordToDownload);
      if (result.success) {
        setPrintFeedback({
          type: 'success',
          message: 'Evrak bilgilerini içeren PDF başarıyla indirildi.'
        });
        setTimeout(() => setPrintFeedback({ type: '', message: '' }), 5000);
      } else {
        setPrintFeedback({
          type: 'error',
          message: 'PDF indirilemedi: ' + (result.error || 'Bilinmeyen hata')
        });
        setTimeout(() => setPrintFeedback({ type: '', message: '' }), 6000);
      }
    } catch (err: any) {
      console.error('PDF indirme hatası:', err);
      setPrintFeedback({
        type: 'error',
        message: 'PDF indirme hatası: ' + (err?.message || 'Bilinmeyen hata')
      });
      setTimeout(() => setPrintFeedback({ type: '', message: '' }), 6000);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const isPdf = check.fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Çek Bilgileri Kayıt Ekranı</span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 font-mono">
                  {check.fileName}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Evrak görselini inceleyerek alanları doldurunuz veya hızlı şantiye butonlarını kullanınız.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns (Image Preview on Left, Detailed Entry Form on Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Visual Check Inspection */}
          <div className="lg:col-span-5 bg-slate-950/80 p-4 border-r border-slate-800 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" /> Evrak Görseli İnceleme
              </span>
              {!isPdf && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.max(0.6, z - 0.2))}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 cursor-pointer"
                    title="Küçült"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[10px] text-slate-400">{Math.round(previewZoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.min(3, z + 0.2))}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 cursor-pointer"
                    title="Büyüt"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 ml-1 cursor-pointer"
                    title="Döndür"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Check Visual Center */}
            <div className="flex-1 flex items-center justify-center overflow-auto my-3 p-2 bg-slate-900/40 rounded-xl border border-slate-800/80 min-h-[280px]">
              {isPdf ? (
                <div className="text-center p-4 space-y-3">
                  <FileText className="w-14 h-14 text-amber-400 mx-auto" />
                  <div>
                    <p className="text-xs text-slate-200 font-semibold">{check.fileName}</p>
                    <p className="text-[11px] text-slate-400">PDF Formatında Çek Evrağı</p>
                  </div>
                  <a
                    href={check.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>PDF Evrağı Yeni Sekmede Aç</span>
                  </a>
                </div>
              ) : (
                <img
                  src={check.fileUrl}
                  alt={check.fileName}
                  className="max-h-[390px] max-w-full object-contain rounded-lg shadow-lg transition-transform duration-150"
                  style={{
                    transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`
                  }}
                />
              )}
            </div>

            {/* Evrak Dosya Bilgisi */}
            <div className="text-[11px] bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-slate-400">
              <span>Evrak Dosyası:</span>
              <span className="font-mono text-slate-300 truncate max-w-[240px]" title={check.fileName}>{check.fileName}</span>
            </div>
          </div>

          {/* Right Column: Çek Bilgileri Kayıt Formu */}
          <div className="lg:col-span-7 p-5 overflow-y-auto max-h-[calc(96vh-115px)] flex flex-col justify-between">
            <form onSubmit={handleFormSubmit} className="space-y-4">

              {/* KURUMSAL PORTFÖY / HEDEF VERİTABANI SEÇİMİ (FARKLI RENKLER & EVRAK DOSYASI İMLECİ) */}
              <div className="bg-slate-950/85 p-3.5 sm:p-4 rounded-xl border border-slate-800 space-y-2.5 shadow-inner">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    Kurumsal Portföy / Hedef Veritabanı
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline">Kayıt hedefi:</span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 flex items-center gap-1">
                      <Database className="w-3 h-3 text-amber-400" />
                      {selectedCorporate.tableName}
                    </span>
                  </div>
                </div>

                {/* 5 Kurumsal Şirket Butonu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {CORPORATE_COMPANIES.map((company, idx) => {
                    const isSelected = selectedCorporate.tableName === company.tableName;
                    return (
                      <button
                        key={company.key}
                        type="button"
                        style={{ cursor: EVRAK_DOSYASI_CURSOR }}
                        onClick={() => {
                          if (company.key !== selectedCompanyKey) {
                            setSelectedCompanyKey(company.key);
                            handleChange('isinAdiSantiye', '');
                            handleChange('santiyeBirim', '');
                            setIsManualIsinAdiMode(false);
                            setCustomIsinAdlari([]);
                          }
                          if (formValidationError) setFormValidationError(null);
                        }}
                        className={`relative group p-3 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] select-none ${
                          isSelected
                            ? `${company.theme.selectedBg} ${company.theme.activeBorder} ring-2 ${company.theme.ringColor} ${company.theme.shadowColor} ${company.theme.activeTextColor}`
                            : `${company.theme.unselectedBg} ${company.theme.border} ${company.theme.textColor} ${company.theme.hoverGlow}`
                        }`}
                        title={`Kurumsal Portföy: ${company.name}\nHedef Tablo: ${company.tableName}\nİmleç: Evrak Dosyası`}
                      >
                        <div className="flex items-start justify-between gap-1.5 w-full">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : company.theme.badgeText}`} />
                            <span className="font-bold text-xs leading-snug tracking-tight truncate">
                              {company.name}
                            </span>
                          </div>
                          {isSelected ? (
                            <div className="p-0.5 rounded-full bg-white/20 text-white shrink-0">
                              <Check className="w-3.5 h-3.5 font-black" />
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-mono">
                              #{idx + 1}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/10 w-full text-[10.5px]">
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border truncate max-w-[130px] ${
                            isSelected 
                              ? 'bg-black/25 border-white/30 text-white font-semibold' 
                              : `${company.theme.badgeBg} ${company.theme.badgeText}`
                          }`}>
                            {company.tableName}
                          </span>
                          <a
                            href={company.dashboardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`hover:underline flex items-center gap-0.5 text-[10px] transition shrink-0 ${
                              isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-amber-300'
                            }`}
                            title="Supabase tablosunu yeni sekmede aç"
                          >
                            <span>Tablo</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SATIR 1: EVRAK TARİHİ & DÖNEM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. EVRAK TARİHİ */}
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    EVRAK TARİHİ <span className="text-amber-400 font-bold">* (Zorunlu)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.evrakTarihi || formData.vadeTarihi || ''}
                    onChange={e => {
                      handleChange('evrakTarihi', e.target.value);
                      if (formValidationError) setFormValidationError(null);
                    }}
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition shadow-inner"
                  />
                </div>

                {/* 2. DÖNEM (AÇILIR LİSTE OCAK, ŞUBAT, MART... AYLAR) */}
                <div>
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    DÖNEM <span className="text-slate-400 text-[11px] font-normal">(Açılır Liste)</span>
                  </label>
                  <select
                    value={formData.donem || ''}
                    onChange={e => handleChange('donem', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">
                      -- Dönem / Ay Seçiniz --
                    </option>
                    {DONEM_AYLARI.map(ay => (
                      <option key={ay} value={ay} className="bg-slate-900 text-white font-semibold py-1">
                        {ay}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SATIR 2: EVRAK NUMARASI (SADECE RAKAM, BAŞTA SIFIR OLMAZ & MÜKERRER KONTROLÜ) */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-4 h-4" />
                    EVRAK NUMARASI <span className="text-amber-400 font-bold">* (Zorunlu)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {isCheckingRealtime && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-amber-400" /> Kontrol ediliyor...
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Sadece Rakam • Başta Sıfır Olamaz
                    </span>
                  </div>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formData.cekNo || ''}
                  onChange={e => {
                    // SADECE RAKAM GİRİLECEK, BAŞTA SIFIR OLMAYACAK KURALI
                    const cleaned = e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '');
                    handleChange('cekNo', cleaned);
                    if (formValidationError) setFormValidationError(null);
                  }}
                  placeholder="Örn: 9876543 (Rakam giriniz, başında 0 yer alamaz)"
                  className={`w-full px-3.5 py-2 bg-slate-800/90 border rounded-xl text-sm font-bold focus:outline-none transition shadow-inner font-mono ${
                    realtimeDuplicate?.exists
                      ? 'border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                      : 'border-slate-700 text-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                  }`}
                />

                {/* Canlı Tekrar Kayıt Uyarısı (Aynı Evrak Numarasında Kayıt Varsa Uyarı) */}
                {realtimeDuplicate?.exists && (
                  <div className="mt-2 p-2.5 bg-rose-950/80 border border-rose-500/70 rounded-xl flex items-center justify-between text-xs text-rose-200 animate-in fade-in duration-150 shadow-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <span className="font-bold text-rose-300">UYARI: </span>
                        <span>
                          "{formData.cekNo}" numarası <strong>{selectedCorporate.name}</strong> ({selectedCorporate.tableName}) tablosunda zaten kayıtlı!
                        </span>
                      </div>
                    </div>
                    {realtimeDuplicate.record?.tutari && (
                      <span className="font-mono font-bold text-amber-300 text-[11px] shrink-0 ml-2 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/40">
                        {Number(realtimeDuplicate.record.tutari).toLocaleString('tr-TR')} TL
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* SATIR 3: FİRMA ÜNVANI & VERGİ NUMARASI */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* 3. FİRMA ÜNVANI */}
                <div className="sm:col-span-7">
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    FİRMA ÜNVANI <span className="text-amber-400 font-bold">* (Zorunlu)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firmaUnvani || formData.alacakliUnvan || ''}
                    onChange={e => {
                      handleChange('firmaUnvani', e.target.value);
                      handleChange('alacakliUnvan', e.target.value);
                      if (formValidationError) setFormValidationError(null);
                    }}
                    placeholder="Firma ünvanı veya lehtar adı giriniz..."
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition shadow-inner"
                  />
                </div>

                {/* 4. VERGİ NUMARASI */}
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    VERGİ NUMARASI
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    value={formData.vergiNo || formData.kesideciVkn || ''}
                    onChange={e => {
                      const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                      handleChange('vergiNo', numericOnly);
                      handleChange('kesideciVkn', numericOnly);
                    }}
                    placeholder="10 VKN / 11 TCKN..."
                    className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition shadow-inner font-mono"
                  />
                </div>
              </div>

              {/* SATIR 4: BANKA ADI (SEÇİLİ KURUMSAL TABLODAN LİSTBOKS + MANUEL EKLEME) */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-4 h-4" />
                    BANKA ADI
                    <span className="text-[10px] font-mono font-semibold text-slate-400 normal-case bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1">
                      {isLoadingBanks ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                          <span>{selectedCorporate.tableName} yükleniyor...</span>
                        </>
                      ) : (
                        <span>{selectedCorporate.tableName} • {mergedBankOptions.length} banka</span>
                      )}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (isManualBankMode) {
                        setIsManualBankMode(false);
                      } else {
                        setIsManualBankMode(true);
                      }
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                      isManualBankMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {isManualBankMode ? (
                      <>
                        <List className="w-3 h-3" />
                        <span>Listeden Seç</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Manuel Banka Ekle</span>
                      </>
                    )}
                  </button>
                </div>

                {isManualBankMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={manualBankInputRef}
                      type="text"
                      value={formData.bankaAdi || ''}
                      onChange={e => handleChange('bankaAdi', e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmManualBank();
                        }
                      }}
                      placeholder="Yeni banka adı giriniz (Örn: T.C. Ziraat Bankası)..."
                      className="flex-1 px-3.5 py-2 bg-slate-800/90 border border-amber-500/70 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/25 transition shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmManualBank}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
                      title="Yazılan bankayı listeye ekle ve seç"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Ekle & Seç</span>
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.bankaAdi || ''}
                    onChange={e => {
                      if (e.target.value === '__MANUAL_ADD__') {
                        handleChange('bankaAdi', '');
                        setIsManualBankMode(true);
                      } else {
                        handleChange('bankaAdi', e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-400">
                      {isLoadingBanks
                        ? '-- Bankalar yükleniyor... --'
                        : mergedBankOptions.length > 0
                          ? `-- Banka Seçiniz (${selectedCorporate.tableName}) --`
                          : `-- Kayıtlı banka bulunamadı (Manuel ekleyebilirsiniz) --`}
                    </option>
                    {mergedBankOptions.map(bank => (
                      <option key={bank} value={bank} className="bg-slate-900 text-white font-semibold py-1">
                        {bank}
                      </option>
                    ))}
                    <option value="__MANUAL_ADD__" className="bg-slate-900 text-amber-400 font-bold">
                      + Manuel Yeni Banka Ekle...
                    </option>
                  </select>
                )}
              </div>

              {/* SATIR 5: TUTARI (ALTINDA AYRAÇLI TL ÖRNEK GÖSTERSİN) */}
              <div>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8 sm:col-span-9">
                    <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono text-xs">₺</span>
                      TUTARI <span className="text-amber-400 font-bold">* (Zorunlu)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.tutar || ''}
                      onChange={e => {
                        handleChange('tutar', e.target.value);
                        if (formValidationError) setFormValidationError(null);
                      }}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-sm font-bold text-emerald-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition shadow-inner font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      BİRİM
                    </label>
                    <select
                      value={formData.paraBirimi || 'TL'}
                      onChange={e => handleChange('paraBirimi', e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-500 transition cursor-pointer"
                    >
                      <option value="TL">TL (₺)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                {/* ALTINDA AYRAÇLI TL ÖRNEK GÖSTERİMİ */}
                <div className="mt-2 flex items-center justify-between text-xs bg-slate-950/90 px-3.5 py-2 rounded-xl border border-emerald-500/30 font-mono shadow-sm">
                  <span className="text-slate-400 font-sans text-[11px] font-semibold flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                    {formData.tutar && !isNaN(Number(formData.tutar)) ? 'Ayraçlı Tutar:' : 'Ayraçlı TL Örnek Gösterim:'}
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {formData.tutar && !isNaN(Number(formData.tutar))
                      ? `${Number(formData.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${formData.paraBirimi === 'USD' ? '$' : formData.paraBirimi === 'EUR' ? '€' : 'TL (₺)'}`
                      : '1.250.000,00 TL (₺)'}
                  </span>
                </div>
              </div>

              {/* SATIR 6: İŞİN ADI / ŞANTİYE (SEÇİLİ KURUMSAL TABLODAN LİSTBOKS + MANUEL EKLEME) */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    İŞİN ADI / ŞANTİYE <span className="text-amber-400 font-bold">* (Zorunlu)</span>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 normal-case bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 flex items-center gap-1">
                      {isLoadingIsinAdlari ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                          <span>{selectedCorporate.tableName} yükleniyor...</span>
                        </>
                      ) : (
                        <span>{selectedCorporate.tableName} • {mergedIsinAdiOptions.length} iş/şantiye</span>
                      )}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsManualIsinAdiMode(prev => !prev)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                      isManualIsinAdiMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {isManualIsinAdiMode ? (
                      <>
                        <List className="w-3 h-3" />
                        <span>Listeden Seç</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Manuel İş / Şantiye Ekle</span>
                      </>
                    )}
                  </button>
                </div>

                {isManualIsinAdiMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={manualIsinAdiInputRef}
                      type="text"
                      required
                      value={formData.isinAdiSantiye || formData.santiyeBirim || ''}
                      onChange={e => {
                        handleChange('isinAdiSantiye', e.target.value);
                        handleChange('santiyeBirim', e.target.value);
                        if (formValidationError) setFormValidationError(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmManualIsinAdi();
                        }
                      }}
                      placeholder="Yeni işin adı / şantiye yazınız..."
                      className="flex-1 px-3.5 py-2 bg-slate-800/90 border border-amber-500/70 rounded-xl text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/25 transition shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmManualIsinAdi}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
                      title="Yazılan işin adı / şantiyeyi listeye ekle ve seç"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Ekle & Seç</span>
                    </button>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.isinAdiSantiye || formData.santiyeBirim || ''}
                    onChange={e => {
                      if (e.target.value === '__MANUAL_ADD__') {
                        handleChange('isinAdiSantiye', '');
                        handleChange('santiyeBirim', '');
                        setIsManualIsinAdiMode(true);
                      } else {
                        handleChange('isinAdiSantiye', e.target.value);
                        handleChange('santiyeBirim', e.target.value);
                      }
                      if (formValidationError) setFormValidationError(null);
                    }}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-400 font-normal">
                      {isLoadingIsinAdlari
                        ? '-- İşin Adı / Şantiye yükleniyor... --'
                        : mergedIsinAdiOptions.length > 0
                          ? `-- İşin Adı / Şantiye Seçiniz (${selectedCorporate.tableName}) --`
                          : '-- Kayıtlı iş/şantiye bulunamadı (Manuel ekleyebilirsiniz) --'}
                    </option>
                    {mergedIsinAdiOptions.map(isin => (
                      <option key={isin} value={isin} className="bg-slate-900 text-amber-200 font-semibold py-1">
                        {isin}
                      </option>
                    ))}
                    <option value="__MANUAL_ADD__" className="bg-slate-900 text-amber-400 font-bold">
                      + Manuel Yeni İşin Adı / Şantiye Ekle...
                    </option>
                  </select>
                )}
              </div>

              {/* SATIR 7: AÇIKLAMA / NOT */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  AÇIKLAMA / NOT (OPSİYONEL)
                </label>
                <textarea
                  rows={2}
                  value={formData.aciklama || ''}
                  onChange={e => handleChange('aciklama', e.target.value)}
                  placeholder="İlgili fatura, hakediş no veya özel notlar..."
                  className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 transition shadow-inner resize-none"
                />
              </div>

              {/* Doğrulama Hatası Uyarısı */}
              {formValidationError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="font-semibold">{formValidationError}</span>
                </div>
              )}

              {/* İndirme Geri Bildirimi */}
              {printFeedback.message && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
                  printFeedback.type === 'success' 
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}>
                  {printFeedback.type === 'success' ? (
                    <CheckCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span className="font-medium">{printFeedback.message}</span>
                </div>
              )}

              {/* Taşıma Rotası Bilgi Rozeti */}
              <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Taşıma Rotası:</span>
                  <span className="font-mono text-amber-400/90 font-medium">CEKLER/MAMAK</span>
                  <span className="text-slate-600">➔</span>
                  <span className="font-mono text-emerald-400 font-medium">ARSIVCEKLER</span>
                  <span className="text-slate-500 text-[10px]">(mgtunrfpzbyfnmeloeeq)</span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={SOURCE_MAMAK_DASHBOARD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400/80 hover:text-amber-300 underline text-[10px] inline-flex items-center gap-1"
                    title="Kaynak Supabase MAMAK Klasörünü Aç"
                  >
                    Kaynak Depo
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a
                    href={ARSIV_DASHBOARD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400/80 hover:text-emerald-300 underline text-[10px] inline-flex items-center gap-1"
                    title="Hedef Supabase ARSIVCEKLER Deposunu Aç"
                  >
                    Hedef Depo
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isDownloadingPdf || isSavingToTable}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    Vazgeç
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf || isSavingToTable}
                    className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    title="Evrak ve Çek Bilgilerini İçeren PDF Dosyasını İndir"
                  >
                    {isDownloadingPdf ? (
                      <>
                        <Loader2 className="w-4 h-4 text-emerald-200 animate-spin" />
                        <span>PDF İndiriliyor...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-emerald-200" />
                        <span>PDF İndir</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sağ Alt: KAYDET Butonu (Evrağı ARSIVCEKLER'e Taşı ve Kurumsal Tabloya Kaydet) */}
                <button
                  type="submit"
                  disabled={isDownloadingPdf || isSavingToTable}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl text-sm font-extrabold shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  title={`Evrağı ARSIVCEKLER deposuna taşı ve ${selectedCorporate.tableName} tablosuna kaydet`}
                >
                  {isSavingToTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span className="text-xs">{saveStepText || 'Arşive Taşınıyor ve Kaydediliyor...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-slate-950" />
                      <span>Kaydet & Arşive Taşı ({selectedCorporate.tableName})</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* ⚠️ AYNI EVRAK NUMARASINDA KAYIT VARSA UYARI MODALI */}
        {showDuplicateConfirmModal && duplicateModalData && (
          <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl shadow-rose-950/60 space-y-4">
              {/* Başlık */}
              <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                  <AlertTriangle className="w-7 h-7 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>DİKKAT: Aynı Evrak Numarasında Kayıt Bulundu!</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Bu evrak numarası (<strong className="text-amber-300 font-mono text-sm">{formData.cekNo}</strong>) seçtiğiniz tabloda zaten mevcuttur.
                  </p>
                </div>
              </div>

              {/* Hedef Tablo & Veritabanındaki Mevcut Kayıt Bilgileri */}
              <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 flex-wrap gap-1">
                  <span className="text-slate-400">Hedef Tablo:</span>
                  <span className="text-amber-300 font-bold font-mono">
                    {selectedCorporate.name} ➔ <span className="text-rose-400 underline">{selectedCorporate.tableName}</span>
                  </span>
                </div>

                {duplicateModalData.record ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">MEVCUT EVRAK TARİHİ</span>
                      <span className="text-slate-200 font-mono font-semibold">{duplicateModalData.record.evrak_tarihi || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">MEVCUT TUTAR</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {duplicateModalData.record.tutari ? `${Number(duplicateModalData.record.tutari).toLocaleString('tr-TR')} TL` : '—'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">MEVCUT FİRMA / LEHTAR</span>
                      <span className="text-slate-200 font-semibold truncate block">{duplicateModalData.record.firma_unvani || '—'}</span>
                    </div>
                    {duplicateModalData.record.isin_adi && (
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px]">MEVCUT İŞİN ADI / ŞANTİYE</span>
                        <span className="text-amber-400/90 font-medium truncate block">{duplicateModalData.record.isin_adi}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400 italic">
                    Hedef tabloda bu evrak numarası ile kayıtlı bir satır tespit edildi.
                  </div>
                )}
              </div>

              {/* Uyarı Mesajı */}
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  Mükerrer veya yanlış kayıt oluşmaması için lütfen evrak numarasını kontrol ediniz. Yine de devam ederseniz bu evrak numarasına ait mevcut kayıt güncellenecektir.
                </span>
              </div>

              {/* Seçenek Butonları */}
              <div className="flex items-center justify-between gap-3 pt-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowDuplicateConfirmModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Geri Dön ve Numarayı Düzelt
                </button>
                <button
                  type="button"
                  disabled={isSavingToTable}
                  onClick={() => executeSaveToCorporateTable()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingToTable ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Güncelleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Yine de Güncelle ve Kaydet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
