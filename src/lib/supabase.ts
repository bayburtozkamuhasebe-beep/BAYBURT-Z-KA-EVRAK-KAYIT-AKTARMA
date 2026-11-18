import { createClient } from '@supabase/supabase-js';
import { CheckRecordData, CekKayitDbRecord } from '../types';

export const SUPABASE_URL = 'https://gboathwmaanqxuwsryud.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdib2F0aHdtYWFucXh1d3NyeXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NjQ1NzMsImV4cCI6MjEwMzI0MDU3M30.kfzk-ftX6VOjJCqHO20YOtfNzipa5AQz4fJ5xvcRpUc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const BUCKET_NAME = 'CEKLER';
export const DEFAULT_FOLDER = 'MAMAK';
export const DEST_BUCKET_NAME = 'KAYITEDILENCEKLER';
export const DB_TABLE_NAME = 'CEKKAYIT';

// -------------------------------------------------------------
// ARŞİV SUPABASE HEDEF DEPO TANIMLAMALARI (mgtunrfpzbyfnmeloeeq / ARSIVCEKLER)
// -------------------------------------------------------------
export const ARSIV_PROJECT_ID = 'mgtunrfpzbyfnmeloeeq';
export const ARSIV_SUPABASE_URL = 'https://mgtunrfpzbyfnmeloeeq.supabase.co';
export const ARSIV_BUCKET_NAME = 'ARSIVCEKLER';
export const ARSIV_DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndHVucmZwemJ5Zm5tZWxvZWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDUwMjgsImV4cCI6MjEwNDcyMTAyOH0.HcdwZbO-oHXQxytE-G221_62irBwuv0-8e3P_ux4a7k';
export const ARSIV_DASHBOARD_URL = 'https://supabase.com/dashboard/project/mgtunrfpzbyfnmeloeeq/storage/files/buckets/ARSIVCEKLER';
export const SOURCE_MAMAK_DASHBOARD_URL = 'https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/storage/files/buckets/CEKLER/MAMAK';

export function getArsivSupabaseKey(): string {
  const key = (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_ARSIV_SUPABASE_SERVICE_ROLE_KEY || (import.meta as any).env?.VITE_ARSIV_SUPABASE_ANON_KEY))
    || (typeof process !== 'undefined' && (process.env?.VITE_ARSIV_SUPABASE_SERVICE_ROLE_KEY || process.env?.VITE_ARSIV_SUPABASE_ANON_KEY))
    || (typeof window !== 'undefined' && (window.localStorage.getItem('VITE_ARSIV_SUPABASE_SERVICE_ROLE_KEY') || window.localStorage.getItem('VITE_ARSIV_SUPABASE_ANON_KEY') || window.localStorage.getItem('ARSIV_SUPABASE_ANON_KEY')));

  if (key && typeof key === 'string' && key.trim().length > 20 && key.trim() !== SUPABASE_ANON_KEY) {
    return key.trim();
  }
  return ARSIV_DEFAULT_ANON_KEY;
}

export function getArsivSupabaseClient() {
  const key = getArsivSupabaseKey();
  if (!key) return null;
  return createClient(ARSIV_SUPABASE_URL, key);
}

// -------------------------------------------------------------
// KURUMSAL PORTFÖY ŞİRKET VE HEDEF TABLO TANIMLAMALARI
// -------------------------------------------------------------
export interface CorporateCompanyConfig {
  key: string;
  name: string;
  tableName: string;
  dashboardUrl: string;
  theme: {
    colorName: string;
    border: string;
    activeBorder: string;
    unselectedBg: string;
    selectedBg: string;
    textColor: string;
    activeTextColor: string;
    badgeBg: string;
    badgeText: string;
    ringColor: string;
    shadowColor: string;
    hoverGlow: string;
  };
}

export const CORPORATE_COMPANIES: CorporateCompanyConfig[] = [
  {
    key: 'BAYBURT_OZKA',
    name: 'BAYBURT ÖZ-KA İNŞAAT',
    tableName: 'bayburtozkaevrakkayit',
    dashboardUrl: 'https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/editor/18650?schema=public/bayburtozkaevrakkayit',
    theme: {
      colorName: 'blue',
      border: 'border-blue-500/40 hover:border-blue-400',
      activeBorder: 'border-blue-400',
      unselectedBg: 'bg-gradient-to-br from-blue-950/40 via-slate-900/90 to-slate-900/90 hover:from-blue-900/50 hover:to-slate-900',
      selectedBg: 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600',
      textColor: 'text-blue-200 hover:text-white',
      activeTextColor: 'text-white font-black',
      badgeBg: 'bg-blue-500/20 border-blue-500/30',
      badgeText: 'text-blue-300',
      ringColor: 'ring-blue-400',
      shadowColor: 'shadow-blue-500/30',
      hoverGlow: 'hover:shadow-blue-500/20'
    }
  },
  {
    key: 'SEKA',
    name: 'SELAHATTİN KALDIRIM İNŞAAT',
    tableName: 'sekaevrakkayit',
    dashboardUrl: 'https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/editor/18650?schema=public/sekaevrakkayit',
    theme: {
      colorName: 'emerald',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      activeBorder: 'border-emerald-400',
      unselectedBg: 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900/90 hover:from-emerald-900/50 hover:to-slate-900',
      selectedBg: 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600',
      textColor: 'text-emerald-200 hover:text-white',
      activeTextColor: 'text-white font-black',
      badgeBg: 'bg-emerald-500/20 border-emerald-500/30',
      badgeText: 'text-emerald-300',
      ringColor: 'ring-emerald-400',
      shadowColor: 'shadow-emerald-500/30',
      hoverGlow: 'hover:shadow-emerald-500/20'
    }
  },
  {
    key: 'ARNAVUTKOY',
    name: 'ARNAVUTKÖY (SEKA-ÖZKA)',
    tableName: 'arnavutkoyevrakkayit',
    dashboardUrl: 'https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/editor/18650?schema=public/arnavutkoyevrakkayit',
    theme: {
      colorName: 'amber',
      border: 'border-amber-500/40 hover:border-amber-400',
      activeBorder: 'border-amber-400',
      unselectedBg: 'bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900/90 hover:from-amber-900/50 hover:to-slate-900',
      selectedBg: 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500',
      textColor: 'text-amber-200 hover:text-white',
      activeTextColor: 'text-slate-950 font-black',
      badgeBg: 'bg-amber-500/20 border-amber-500/30',
      badgeText: 'text-amber-300',
      ringColor: 'ring-amber-400',
      shadowColor: 'shadow-amber-500/30',
      hoverGlow: 'hover:shadow-amber-500/20'
    }
  },
  {
    key: 'MAMAK',
    name: 'MAMAK (SEKA-ÖZKA)',
    tableName: 'mamakevrakkayit',
    dashboardUrl: 'https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/editor/18650?schema=public/mamakevrakkayit',
    theme: {
      colorName: 'purple',
      border: 'border-purple-500/40 hover:border-purple-400',
      activeBorder: 'border-purple-400',
      unselectedBg: 'bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-slate-900/90 hover:from-purple-900/50 hover:to-slate-900',
      selectedBg: 'bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-600',
      textColor: 'text-purple-200 hover:text-white',
      activeTextColor: 'text-white font-black',
      badgeBg: 'bg-purple-500/20 border-purple-500/30',
      badgeText: 'text-purple-300',
      ringColor: 'ring-purple-400',
      shadowColor: 'shadow-purple-500/30',
      hoverGlow: 'hover:shadow-purple-500/20'
    }
  },
  {
    key: 'SENBAY_OZKA',
    name: 'ŞENBAY-ÖZKA ORTAKLIĞI',
    tableName: 'senbayevrakkayit',
    dashboardUrl: 'https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/editor/18650?schema=public/senbayevrakkayit',
    theme: {
      colorName: 'rose',
      border: 'border-rose-500/40 hover:border-rose-400',
      activeBorder: 'border-rose-400',
      unselectedBg: 'bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-900/90 hover:from-rose-900/50 hover:to-slate-900',
      selectedBg: 'bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600',
      textColor: 'text-rose-200 hover:text-white',
      activeTextColor: 'text-white font-black',
      badgeBg: 'bg-rose-500/20 border-rose-500/30',
      badgeText: 'text-rose-300',
      ringColor: 'ring-rose-400',
      shadowColor: 'shadow-rose-500/30',
      hoverGlow: 'hover:shadow-rose-500/20'
    }
  }
];

// Özel evrak dosyası SVG fare imleci (mouse hover cursor)
export const EVRAK_DOSYASI_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M4 7a2 2 0 0 1 2-2h7l2 2h11a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z' fill='%23f59e0b' stroke='%230f172a' stroke-width='2' stroke-linejoin='round'/%3E%3Cpath d='M10 13h12M10 17h8M10 21h10' stroke='%23ffffff' stroke-width='1.75' stroke-linecap='round'/%3E%3Cpath d='M4 11h24' stroke='%23d97706' stroke-width='1.5'/%3E%3C/svg%3E") 2 2, pointer`;

// Firma adına göre konfigürasyonu eşleştiren yardımcı fonksiyon
export function getCorporateCompanyConfig(nameOrSite?: string): CorporateCompanyConfig {
  if (!nameOrSite) return CORPORATE_COMPANIES[0];
  const upper = nameOrSite.toUpperCase().trim();
  const exact = CORPORATE_COMPANIES.find(c => c.name.toUpperCase() === upper);
  if (exact) return exact;

  if (upper.includes('SELAHATT') || (upper.includes('SEKA') && !upper.includes('ARNAVUT') && !upper.includes('MAMAK'))) {
    return CORPORATE_COMPANIES[1];
  }
  if (upper.includes('ARNAVUT')) {
    return CORPORATE_COMPANIES[2];
  }
  if (upper.includes('MAMAK')) {
    return CORPORATE_COMPANIES[3];
  }
  if (upper.includes('ŞENBAY') || upper.includes('SENBAY')) {
    return CORPORATE_COMPANIES[4];
  }
  return CORPORATE_COMPANIES[0];
}

// -------------------------------------------------------------
// EVRAK NUMARASI TEKRAR KONTROLÜ (DUPLICATE CHECK)
// -------------------------------------------------------------
export interface CorporateDuplicateResult {
  exists: boolean;
  tableName: string;
  companyName: string;
  record?: {
    id: string;
    evrak_numarasi: string;
    firma_unvani: string | null;
    isin_adi: string | null;
    evrak_tarihi: string | null;
    tutari: number | null;
  };
  error?: string;
}

export async function checkDuplicateInCorporateTable(
  tableName: string,
  cekNo: string,
  companyName?: string
): Promise<CorporateDuplicateResult> {
  const cleanNo = String(cekNo || '').trim();
  if (!cleanNo || !tableName) {
    return { exists: false, tableName, companyName: companyName || '' };
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, evrak_numarasi, firma_unvani, isin_adi, evrak_tarihi, tutari')
      .eq('evrak_numarasi', cleanNo)
      .limit(1);

    if (error) {
      console.warn(`Duplicate check on ${tableName} error:`, error.message);
      return { exists: false, tableName, companyName: companyName || '', error: error.message };
    }

    if (data && data.length > 0) {
      return {
        exists: true,
        tableName,
        companyName: companyName || '',
        record: data[0]
      };
    }

    return { exists: false, tableName, companyName: companyName || '' };
  } catch (err: any) {
    return { exists: false, tableName, companyName: companyName || '', error: err.message };
  }
}

// -------------------------------------------------------------
// SEÇİLİ KURUMSAL TABLODAN MÜKERRERSİZ BANKA LİSTESİ ÇEKME
// -------------------------------------------------------------
async function fetchDistinctColumnFromCorporateTable(
  tableName: string,
  columnName: 'banka_adi' | 'isin_adi'
): Promise<{ values: string[]; error?: string }> {
  if (!tableName) return { values: [] };

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .not(columnName, 'is', null)
      .neq(columnName, '')
      .limit(5000);

    if (error) {
      console.warn(`fetchDistinctColumnFromCorporateTable (${columnName}) on ${tableName} error:`, error.message);
      return { values: [], error: error.message };
    }

    const uniqueMap = new Map<string, string>();
    for (const row of (data as Record<string, any>[]) || []) {
      const rawVal = row?.[columnName];
      const raw = typeof rawVal === 'string'
        ? rawVal.trim().replace(/\s+/g, ' ')
        : '';
      if (!raw) continue;
      const normalizedKey = raw.toLocaleUpperCase('tr-TR');
      if (!uniqueMap.has(normalizedKey)) {
        uniqueMap.set(normalizedKey, raw);
      }
    }

    const values = Array.from(uniqueMap.values()).sort((a, b) =>
      a.localeCompare(b, 'tr-TR', { sensitivity: 'base' })
    );

    return { values };
  } catch (err: any) {
    console.warn(`fetchDistinctColumnFromCorporateTable (${columnName}) unexpected error on ${tableName}:`, err);
    return { values: [], error: err?.message || 'Liste alınamadı.' };
  }
}

export async function fetchDistinctBanksFromCorporateTable(
  tableName: string
): Promise<{ banks: string[]; error?: string }> {
  const res = await fetchDistinctColumnFromCorporateTable(tableName, 'banka_adi');
  return { banks: res.values, error: res.error };
}

export async function fetchDistinctIsinAdlariFromCorporateTable(
  tableName: string
): Promise<{ isinAdlari: string[]; error?: string }> {
  const res = await fetchDistinctColumnFromCorporateTable(tableName, 'isin_adi');
  return { isinAdlari: res.values, error: res.error };
}

// -------------------------------------------------------------
// SEÇİLİ KURUMSAL TABLOYA EVRAK KAYDETME
// -------------------------------------------------------------
export async function saveCheckToCorporateTable(
  tableName: string,
  formData: CheckRecordData
): Promise<{ success: boolean; error?: string; isUpdate?: boolean }> {
  try {
    const numericTutar = typeof formData.tutar === 'number'
      ? formData.tutar
      : parseFloat(String(formData.tutar).replace(/\./g, '').replace(',', '.')) || 0;

    const evrakTarihi = formData.evrakTarihi || formData.vadeTarihi || null;
    const firmaUnvani = formData.firmaUnvani || formData.alacakliUnvan || null;
    const rawIsinAdi = formData.isinAdiSantiye || formData.santiyeBirim || '';
    const isinAdi = rawIsinAdi ? String(rawIsinAdi).trim().replace(/\s+/g, ' ') || null : null;
    const vergiNo = formData.vergiNo || formData.kesideciVkn || null;
    const donem = formData.donem || null;
    const bankaAdi = formData.bankaAdi ? String(formData.bankaAdi).trim().replace(/\s+/g, ' ') || null : null;
    const aciklama = formData.aciklama || null;
    const cekNo = String(formData.cekNo).trim();

    const rowPayload = {
      evrak_tarihi: evrakTarihi,
      donem: donem,
      evrak_numarasi: cekNo,
      firma_unvani: firmaUnvani,
      vergi_numarasi: vergiNo,
      banka_adi: bankaAdi,
      isin_adi: isinAdi,
      tutari: numericTutar,
      aciklama: aciklama
    };

    // Varlık kontrolü
    const { data: existingRows } = await supabase
      .from(tableName)
      .select('id, evrak_numarasi')
      .eq('evrak_numarasi', cekNo)
      .limit(1);

    if (existingRows && existingRows.length > 0) {
      const { error: updateErr } = await supabase
        .from(tableName)
        .update({
          ...rowPayload,
          guncellenme_tarihi: new Date().toISOString()
        })
        .eq('evrak_numarasi', cekNo);

      if (updateErr) {
        console.warn(`Update on ${tableName} error:`, updateErr.message);
        return { success: false, error: updateErr.message };
      }
      return { success: true, isUpdate: true };
    } else {
      const { error: insertErr } = await supabase
        .from(tableName)
        .insert([rowPayload]);

      if (insertErr) {
        console.warn(`Insert into ${tableName} error:`, insertErr.message);
        return { success: false, error: insertErr.message };
      }
      return { success: true, isUpdate: false };
    }
  } catch (err: any) {
    console.error(`saveCheckToCorporateTable error on ${tableName}:`, err);
    return { success: false, error: err.message || 'Kayıt sırasında hata oluştu.' };
  }
}

// Helper to convert Turkish characters and sanitize file names for S3/Supabase Storage key compatibility
export function sanitizeFileNameForStorage(str: string): string {
  if (!str) return '';
  const trMap: Record<string, string> = {
    'İ': 'I', 'I': 'I', 'ı': 'i', 'i': 'i',
    'Ş': 'S', 'ş': 's',
    'Ğ': 'G', 'ğ': 'g',
    'Ü': 'U', 'ü': 'u',
    'Ö': 'O', 'ö': 'o',
    'Ç': 'C', 'ç': 'c',
    'Â': 'A', 'â': 'a',
    'Î': 'I', 'î': 'i',
    'Û': 'U', 'û': 'u'
  };

  return str
    .replace(/[İıŞşĞğÜüÖöÇçÂâÎîÛû]/g, m => trMap[m] || m)
    .replace(/[\/\\:*?"<>|#%&{}\\<>*?/$!'":@+`|=~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Format new file name: [ŞANTİYE/BİRİM] [ÇEKNUMARASI] [LEHTAR].uzanti
export function generateNewCheckFileName(
  santiye: string,
  cekNo: string,
  alacakli: string,
  originalFileName: string
): string {
  // Extract extension
  const extIndex = originalFileName.lastIndexOf('.');
  const ext = extIndex !== -1 ? originalFileName.substring(extIndex).toLowerCase() : '.jpg';
  
  // Clean Turkish non-ASCII chars & illegal storage characters
  const cleanSantiye = sanitizeFileNameForStorage(santiye || 'MAMAK');
  const cleanCekNo = sanitizeFileNameForStorage(cekNo || 'CEK');
  const cleanAlacakli = sanitizeFileNameForStorage(alacakli || 'LEHTAR');

  return `${cleanSantiye} ${cleanCekNo} ${cleanAlacakli}${ext}`;
}

// Check if a file or check record with the same name/number already exists in KAYITEDILENCEKLER or CEKKAYIT
export async function checkIfFileExistsInDestination(
  targetFileName: string,
  cekNo?: string
): Promise<{ exists: boolean; reason?: string }> {
  try {
    // 1. Check in Storage bucket KAYITEDILENCEKLER
    const { data: storageList, error: listErr } = await supabase.storage
      .from(DEST_BUCKET_NAME)
      .list('', { search: targetFileName });

    if (storageList && storageList.some(f => f.name.toLowerCase() === targetFileName.toLowerCase())) {
      return { 
        exists: true, 
        reason: `Storage "${DEST_BUCKET_NAME}" deposunda "${targetFileName}" isimli bir evrak zaten mevcut!` 
      };
    }

    // Secondary storage check without search parameter (for exact list match)
    if (!storageList || storageList.length === 0) {
      const { data: allFiles } = await supabase.storage.from(DEST_BUCKET_NAME).list('', { limit: 100 });
      if (allFiles && allFiles.some(f => f.name.toLowerCase() === targetFileName.toLowerCase())) {
        return { 
          exists: true, 
          reason: `Storage "${DEST_BUCKET_NAME}" deposunda "${targetFileName}" isimli bir evrak zaten mevcut!` 
        };
      }
    }

    // 2. Check in CEKKAYIT table by DOSYA_ADI or CEK_NUMARASI
    if (targetFileName || cekNo) {
      try {
        let query = supabase.from(DB_TABLE_NAME).select('DOSYA_ADI, CEK_NUMARASI, SANTIYE_BIRIM').limit(1);
        if (targetFileName) {
          query = query.eq('DOSYA_ADI', targetFileName);
        }
        const { data: dbData } = await query;
        if (dbData && dbData.length > 0) {
          return {
            exists: true,
            reason: `Veritabanı "${DB_TABLE_NAME}" tablosunda "${targetFileName}" adlı evrak kaydı zaten mevcut!`
          };
        }
      } catch {
        // Table check is secondary
      }
    }

    return { exists: false };
  } catch (err) {
    console.warn('Dosya varlık kontrolü hatası:', err);
    return { exists: false };
  }
}

// Move file from CEKLER bucket (MAMAK/...) to KAYITEDILENCEKLER bucket
export async function moveCheckFileToDestinationBucket(
  originalFileName: string,
  newFileName: string,
  sourceFolder: string = DEFAULT_FOLDER
): Promise<{ success: boolean; newUrl?: string; error?: string }> {
  try {
    const sourcePath = sourceFolder ? `${sourceFolder}/${originalFileName}` : originalFileName;

    // 1. Try downloading from source bucket
    let fileBlob: Blob | null = null;
    const { data: blobWithFolder, error: dlErr1 } = await supabase.storage
      .from(BUCKET_NAME)
      .download(sourcePath);

    if (blobWithFolder) {
      fileBlob = blobWithFolder;
    } else {
      // Fallback: try download with 'MAMAK/' explicitly
      const { data: blobMamak } = await supabase.storage
        .from(BUCKET_NAME)
        .download(`MAMAK/${originalFileName}`);
      if (blobMamak) {
        fileBlob = blobMamak;
      } else {
        // Fallback: try download from root of CEKLER
        const { data: blobRoot } = await supabase.storage
          .from(BUCKET_NAME)
          .download(originalFileName);
        if (blobRoot) {
          fileBlob = blobRoot;
        }
      }
    }

    if (!fileBlob) {
      return { 
        success: false, 
        error: `"${originalFileName}" kaynak depodan (${BUCKET_NAME}) indirilemedi.` 
      };
    }

    // 2. Upload to KAYITEDILENCEKLER bucket
    const { data: uploadData, error: upError } = await supabase.storage
      .from(DEST_BUCKET_NAME)
      .upload(newFileName, fileBlob, {
        contentType: fileBlob.type || 'image/jpeg',
        upsert: true
      });

    if (upError) {
      console.error('KAYITEDILENCEKLER yükleme hatası:', upError);
      return { 
        success: false, 
        error: `"${DEST_BUCKET_NAME}" hedefine yüklenirken hata: ${upError.message}. (Lütfen Supabase Storage'da "${DEST_BUCKET_NAME}" adında bir bucket oluşturulduğundan ve Public olduğundan emin olun)` 
      };
    }

    // 3. Remove original file from CEKLER bucket
    try {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([sourcePath, `MAMAK/${originalFileName}`, originalFileName]);
    } catch (remErr) {
      console.warn('Eski dosya silinirken uyarı:', remErr);
    }

    // 4. Get new public URL
    const { data: publicUrlData } = supabase.storage
      .from(DEST_BUCKET_NAME)
      .getPublicUrl(newFileName);

    return {
      success: true,
      newUrl: publicUrlData?.publicUrl || ''
    };
  } catch (err: any) {
    console.error('Taşıma genel hatası:', err);
    return { success: false, error: err.message || 'Dosya taşınırken bilinmeyen hata oluştu.' };
  }
}

/**
 * İLGİLİ EVRAĞI CEKLER / MAMAK KLASÖRÜNDEN ARSIVCEKLER DEPOSUNA TAŞI:
 * Kaynak: https://supabase.com/dashboard/project/gboathwmaanqxuwsryud/storage/files/buckets/CEKLER/MAMAK
 * Hedef:  https://supabase.com/dashboard/project/mgtunrfpzbyfnmeloeeq/storage/files/buckets/ARSIVCEKLER
 */
export interface MoveCheckToArsivResult {
  success: boolean;
  sourceDeleted?: boolean;
  newUrl?: string;
  error?: string;
}

export async function moveCheckFileToArsivCekler(
  fileName: string,
  checkData?: { filePath?: string; fileUrl?: string }
): Promise<MoveCheckToArsivResult> {
  try {
    if (!fileName) {
      return { success: false, error: 'Taşınacak evrak dosya adı bulunamadı.' };
    }

    // 1. Kaynak projeden (gboathwmaanqxuwsryud / CEKLER / MAMAK) dosyayı indir
    let fileBlob: Blob | null = null;
    let detectedContentType = 'image/jpeg';

    if (fileName.toLowerCase().endsWith('.pdf')) {
      detectedContentType = 'application/pdf';
    } else if (fileName.toLowerCase().endsWith('.png')) {
      detectedContentType = 'image/png';
    } else if (fileName.toLowerCase().endsWith('.webp')) {
      detectedContentType = 'image/webp';
    }

    // 1a. MAMAK/<fileName> yolundan indirmeyi dene
    const { data: blobMamak, error: mamakErr } = await supabase.storage
      .from(BUCKET_NAME)
      .download(`${DEFAULT_FOLDER}/${fileName}`);

    if (blobMamak) {
      fileBlob = blobMamak;
      detectedContentType = blobMamak.type || detectedContentType;
    } else {
      // 1b. Eğer checkData.filePath tanımlıysa oradan dene
      if (checkData?.filePath && checkData.filePath !== `${DEFAULT_FOLDER}/${fileName}`) {
        const { data: blobCustom } = await supabase.storage
          .from(BUCKET_NAME)
          .download(checkData.filePath);
        if (blobCustom) {
          fileBlob = blobCustom;
          detectedContentType = blobCustom.type || detectedContentType;
        }
      }

      // 1c. Kök dizinden dene
      if (!fileBlob) {
        const { data: blobRoot } = await supabase.storage
          .from(BUCKET_NAME)
          .download(fileName);
        if (blobRoot) {
          fileBlob = blobRoot;
          detectedContentType = blobRoot.type || detectedContentType;
        }
      }

      // 1d. fileUrl üzerinden doğrudan fetch dene
      if (!fileBlob && checkData?.fileUrl) {
        try {
          const resp = await fetch(checkData.fileUrl);
          if (resp.ok) {
            fileBlob = await resp.blob();
            detectedContentType = fileBlob.type || detectedContentType;
          }
        } catch (fErr) {
          console.warn('fileUrl fetch denemesi:', fErr);
        }
      }

      // 1e. Public URL oluşturup fetch etmeyi dene
      if (!fileBlob) {
        const { data: pubData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(`${DEFAULT_FOLDER}/${fileName}`);
        if (pubData?.publicUrl) {
          try {
            const resp = await fetch(pubData.publicUrl);
            if (resp.ok) {
              fileBlob = await resp.blob();
              detectedContentType = fileBlob.type || detectedContentType;
            }
          } catch (pErr) {
            console.warn('pubData fetch denemesi:', pErr);
          }
        }
      }
    }

    if (!fileBlob) {
      return {
        success: false,
        error: `"${fileName}" evrakı kaynak CEKLER/MAMAK klasöründen indirilemedi (${mamakErr?.message || 'Dosya bulunamadı'}).`
      };
    }

    // 2. Hedef projeye (mgtunrfpzbyfnmeloeeq / ARSIVCEKLER) yükle
    const arsivClient = getArsivSupabaseClient();
    if (!arsivClient) {
      return {
        success: false,
        error: `Hedef ARSIVCEKLER projesinin (${ARSIV_PROJECT_ID}) Anon/Public API anahtarı (VITE_ARSIV_SUPABASE_ANON_KEY) tanımlı değil. İki ayrı Supabase projesi kullanıldığı için hedef projenin kendi 'anon public' anahtarı gereklidir. Lütfen hedef projenin (mgtunrfpzbyfnmeloeeq) Project Settings > API ekranından 'anon' anahtarını alıp Settings menüsündeki VITE_ARSIV_SUPABASE_ANON_KEY alanına ekleyiniz.`
      };
    }

    const { data: uploadData, error: upError } = await arsivClient.storage
      .from(ARSIV_BUCKET_NAME)
      .upload(fileName, fileBlob, {
        contentType: fileBlob.type || detectedContentType,
        upsert: true
      });

    if (upError) {
      console.error(`[${ARSIV_BUCKET_NAME}] Yükleme hatası:`, upError);
      const isRlsError = upError.message?.toLowerCase().includes('row-level security') || upError.message?.toLowerCase().includes('policy');
      return {
        success: false,
        error: isRlsError
          ? `Hedef ARSIVCEKLER deposuna yükleme izni (Row Level Security / RLS Policy) kısıtlamasına takıldı: "${upError.message}". Çözüm: mgtunrfpzbyfnmeloeeq projesinin SQL Editor ekranında ARSIVCEKLER için INSERT/ALL izni veren Storage Policy çalıştırılmalı veya Ayarlar'a hedef projenin service_role anahtarı girilmelidir.`
          : `Hedef ARSIVCEKLER deposuna yüklenirken hata oluştu: ${upError.message}.`
      };
    }

    // 3. Hedef public URL'yi al
    const { data: arsivUrlData } = arsivClient.storage
      .from(ARSIV_BUCKET_NAME)
      .getPublicUrl(fileName);
    const destinationUrl = arsivUrlData?.publicUrl || 
      `${ARSIV_SUPABASE_URL}/storage/v1/object/public/${ARSIV_BUCKET_NAME}/${encodeURIComponent(fileName)}`;

    // 4. Kaynak projeden (gboathwmaanqxuwsryud / CEKLER / MAMAK) eski dosyayı SİL (Taşıma işlemi)
    let sourceDeleted = false;
    try {
      const { error: remError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([`${DEFAULT_FOLDER}/${fileName}`, fileName]);

      if (!remError) {
        sourceDeleted = true;
      } else {
        console.warn('Kaynak dosya silinirken uyarı:', remError.message);
      }
    } catch (delErr) {
      console.warn('Kaynak dosya silme hatası:', delErr);
    }

    return {
      success: true,
      sourceDeleted,
      newUrl: destinationUrl
    };
  } catch (err: any) {
    console.error('Arşive taşıma genel hatası:', err);
    return {
      success: false,
      error: err.message || 'Evrak arşive taşınırken bir hata meydana geldi.'
    };
  }
}

// Save Check record to Supabase "CEKKAYIT" table
export async function saveCheckToSupabaseDb(
  checkData: CheckRecordData,
  finalFileName: string,
  finalFileUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const numericTutar = typeof checkData.tutar === 'number' 
      ? checkData.tutar 
      : parseFloat(String(checkData.tutar).replace(/\./g, '').replace(',', '.')) || 0;

    const evrakTarihi = checkData.evrakTarihi || checkData.vadeTarihi;
    const firmaUnvani = checkData.firmaUnvani || checkData.alacakliUnvan;
    const isinAdi = checkData.isinAdiSantiye || checkData.santiyeBirim;
    const vergiNo = checkData.vergiNo || checkData.kesideciVkn || '';
    const donem = checkData.donem || '';
    const bankaAdi = checkData.bankaAdi || '';

    // Enriched description to preserve Dönem, VKN and Banka even if distinct columns don't exist
    let enrichedAciklama = checkData.aciklama || '';
    const metadataTags: string[] = [];
    if (donem && !enrichedAciklama.includes(donem)) metadataTags.push(`[Dönem: ${donem}]`);
    if (vergiNo && !enrichedAciklama.includes(vergiNo)) metadataTags.push(`[VKN: ${vergiNo}]`);
    if (bankaAdi && !enrichedAciklama.includes(bankaAdi)) metadataTags.push(`[Banka: ${bankaAdi}]`);
    if (metadataTags.length > 0) {
      enrichedAciklama = `${metadataTags.join(' ')} ${enrichedAciklama}`.trim();
    }

    // Extended upper payload with all new columns
    const extendedUpperPayload: Record<string, any> = {
      VADE_TARIHI: evrakTarihi,
      CEK_NUMARASI: checkData.cekNo,
      ALACAKLI: firmaUnvani,
      CEK_TUTARI: numericTutar,
      PARA_BIRIMI: checkData.paraBirimi || 'TL',
      SANTIYE_BIRIM: isinAdi,
      ACIKLAMA: enrichedAciklama,
      DOSYA_ADI: finalFileName,
      DOSYA_URL: finalFileUrl,
      KAYIT_DURUMU: 'Kaydedildi',
      DONEM: donem,
      VERGI_NUMARASI: vergiNo,
      BANKA_ADI: bankaAdi
    };

    // 1. Try extended insert with all columns
    const { error: errExtended } = await supabase
      .from(DB_TABLE_NAME)
      .insert([extendedUpperPayload]);

    if (!errExtended) {
      return { success: true };
    }

    // 2. Standard UpperCase column mapping (matches base SQL schema)
    const upperPayload = {
      VADE_TARIHI: evrakTarihi,
      CEK_NUMARASI: checkData.cekNo,
      ALACAKLI: firmaUnvani,
      CEK_TUTARI: numericTutar,
      PARA_BIRIMI: checkData.paraBirimi || 'TL',
      SANTIYE_BIRIM: isinAdi,
      ACIKLAMA: enrichedAciklama,
      DOSYA_ADI: finalFileName,
      DOSYA_URL: finalFileUrl,
      KAYIT_DURUMU: 'Kaydedildi'
    };

    const { error: errUpper } = await supabase
      .from(DB_TABLE_NAME)
      .insert([upperPayload]);

    if (!errUpper) {
      return { success: true };
    }

    console.warn('CEKKAYIT büyük harf insert uyarısı, alternatif deneniyor:', errUpper.message);

    // 3. Alternative Lowercase column mapping fallback
    const lowerPayload = {
      vade_tarihi: evrakTarihi,
      cek_numarasi: checkData.cekNo,
      alacakli: firmaUnvani,
      cek_tutari: numericTutar,
      para_birimi: checkData.paraBirimi || 'TL',
      santiye_birim: isinAdi,
      aciklama: enrichedAciklama,
      dosya_adi: finalFileName,
      dosya_url: finalFileUrl,
      kayit_durumu: 'Kaydedildi'
    };

    const { error: errLower } = await supabase
      .from(DB_TABLE_NAME)
      .insert([lowerPayload]);

    if (!errLower) {
      return { success: true };
    }

    // 4. Fallback without quotes / lowercase table name
    const { error: errLowerTable } = await supabase
      .from('cekkayit')
      .insert([lowerPayload]);

    if (!errLowerTable) {
      return { success: true };
    }

    return { 
      success: false, 
      error: `Supabase CEKKAYIT tablosuna kayıt yazılamadı: ${errUpper.message}` 
    };
  } catch (err: any) {
    console.error('Database kayıt hatası:', err);
    return { success: false, error: err.message || 'Veritabanı kaydı sırasında hata oluştu.' };
  }
}

// Delete file from CEKLER or KAYITEDILENCEKLER buckets
export async function deleteCheckFileFromStorage(
  fileName: string,
  folder: string = DEFAULT_FOLDER
): Promise<{ success: boolean; error?: string }> {
  try {
    const pathsToDelete = [
      `${folder}/${fileName}`,
      fileName
    ];

    // Try deleting from CEKLER
    await supabase.storage.from(BUCKET_NAME).remove(pathsToDelete);
    // Also try deleting from KAYITEDILENCEKLER if present
    await supabase.storage.from(DEST_BUCKET_NAME).remove(pathsToDelete);

    return { success: true };
  } catch (err: any) {
    console.error('Silme hatası:', err);
    return { success: false, error: err.message || 'Dosya silinirken hata oluştu.' };
  }
}

// Fetch all check records from Supabase "CEKKAYIT" table
export async function fetchCekKayitDbRecords(): Promise<{
  success: boolean;
  data: CekKayitDbRecord[];
  error?: string;
}> {
  try {
    let rows: any[] = [];
    let fetchError: any = null;

    // 1. Try uppercase table name "CEKKAYIT"
    const { data: dataUpper, error: errUpper } = await supabase
      .from(DB_TABLE_NAME)
      .select('*')
      .order('id', { ascending: false });

    if (dataUpper && !errUpper) {
      rows = dataUpper;
    } else {
      fetchError = errUpper;
      // 2. Fallback to lowercase table name "cekkayit"
      const { data: dataLower, error: errLower } = await supabase
        .from('cekkayit')
        .select('*')
        .order('id', { ascending: false });

      if (dataLower && !errLower) {
        rows = dataLower;
        fetchError = null;
      }
    }

    if (fetchError && rows.length === 0) {
      console.warn('CEKKAYIT tablosu okunurken uyarı:', fetchError.message);
      return {
        success: false,
        data: [],
        error: fetchError.message || 'CEKKAYIT tablosu okunamadı.'
      };
    }

    // Map and normalize records
    const records: CekKayitDbRecord[] = rows.map((row, idx) => {
      const id = row.id ?? row.ID ?? idx + 1;
      const vadeTarihi = row.VADE_TARIHI || row.vade_tarihi || row.Vade_Tarihi || row.vadeTarihi || '';
      const cekNo = String(row.CEK_NUMARASI || row.cek_numarasi || row.CEK_NO || row.cek_no || row.cekNo || '').trim();
      const alacakliUnvan = row.ALACAKLI || row.alacakli || row.LEHTAR || row.lehtar || row.alacakliUnvan || '';
      
      const rawTutar = row.CEK_TUTARI ?? row.cek_tutari ?? row.tutar ?? 0;
      const tutar = typeof rawTutar === 'number'
        ? rawTutar
        : parseFloat(String(rawTutar).replace(/\./g, '').replace(',', '.')) || 0;

      const paraBirimi = row.PARA_BIRIMI || row.para_birimi || 'TL';
      const santiyeBirim = String(row.SANTIYE_BIRIM || row.santiye_birim || row.santiyeBirim || 'MAMAK').trim();
      const aciklama = row.ACIKLAMA || row.aciklama || '';
      const dosyaAdi = row.DOSYA_ADI || row.dosya_adi || row.fileName || '';
      
      let dosyaUrl = row.DOSYA_URL || row.dosya_url || row.fileUrl || '';
      // If file is in KAYITEDILENCEKLER, ensure valid URL
      if (dosyaAdi) {
        const { data: urlData } = supabase.storage
          .from(DEST_BUCKET_NAME)
          .getPublicUrl(dosyaAdi);
        if (urlData?.publicUrl) {
          dosyaUrl = urlData.publicUrl;
        }
      }

      const kayitDurumu = row.KAYIT_DURUMU || row.kayit_durumu || 'Kaydedildi';
      const kayitTarihi = row.KAYIT_TARIHI || row.kayit_tarihi || row.created_at || row.CREATED_AT || '';

      const donem = row.DONEM || row.donem || '';
      const vergiNo = row.VERGI_NUMARASI || row.vergi_numarasi || row.VERGI_NO || row.vergi_no || '';
      const bankaAdi = row.BANKA_ADI || row.banka_adi || '';
      const evrakTarihi = row.EVRAK_TARIHI || row.evrak_tarihi || vadeTarihi;
      const firmaUnvani = row.FIRMA_UNVANI || row.firma_unvani || alacakliUnvan;
      const isinAdiSantiye = row.ISIN_ADI || row.isin_adi || santiyeBirim;

      return {
        id,
        evrakTarihi,
        vadeTarihi,
        donem,
        cekNo,
        firmaUnvani,
        alacakliUnvan,
        vergiNo,
        bankaAdi,
        tutar,
        paraBirimi,
        isinAdiSantiye,
        santiyeBirim,
        aciklama,
        dosyaAdi,
        dosyaUrl,
        kayitDurumu,
        kayitTarihi,
        createdAt: row.created_at || row.CREATED_AT || '',
        raw: row
      };
    });

    return {
      success: true,
      data: records
    };
  } catch (err: any) {
    console.error('fetchCekKayitDbRecords hatası:', err);
    return {
      success: false,
      data: [],
      error: err.message || 'Kayıtlar yüklenirken beklenmeyen hata.'
    };
  }
}

/**
 * Helper to get proper MIME type from file name or URL
 */
export function getDocumentFormat(fileName?: string, url?: string): {
  isPdf: boolean;
  isImage: boolean;
  mimeType: string;
  extension: string;
} {
  const target = (fileName || url || '').split('?')[0].toLowerCase();
  const ext = target.split('.').pop() || '';
  
  const isPdf = ext === 'pdf' || target.includes('.pdf');
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'jfif', 'pjpeg', 'avif', 'tif', 'tiff'];
  const isImage = imageExts.includes(ext) || (!isPdf && (target.includes('image') || ext === ''));
  
  let mimeType = 'application/octet-stream';
  if (isPdf) mimeType = 'application/pdf';
  else if (['jpg', 'jpeg', 'jfif', 'pjpeg'].includes(ext)) mimeType = 'image/jpeg';
  else if (ext === 'png') mimeType = 'image/png';
  else if (ext === 'webp') mimeType = 'image/webp';
  else if (ext === 'gif') mimeType = 'image/gif';
  else if (ext === 'svg') mimeType = 'image/svg+xml';
  else if (ext === 'bmp') mimeType = 'image/bmp';
  else if (isImage) mimeType = 'image/jpeg';

  return { isPdf, isImage, mimeType, extension: ext };
}

/**
 * Clean and extract base file name from path or URL
 */
export function extractCleanFileName(rawNameOrUrl?: string): string {
  if (!rawNameOrUrl) return '';
  let clean = rawNameOrUrl.trim();
  
  // Remove URL query params if any
  clean = clean.split('?')[0];

  // If it's a full URL, get the last segment
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    const parts = clean.split('/');
    clean = parts[parts.length - 1];
  }

  // Remove bucket prefixes
  clean = clean
    .replace(/^KAYITEDILENCEKLER\//i, '')
    .replace(/^CEKLER\/MAMAK\//i, '')
    .replace(/^CEKLER\//i, '')
    .replace(/^MAMAK\//i, '');

  try {
    clean = decodeURIComponent(clean);
  } catch (e) {
    // ignore decode error
  }

  return clean.trim();
}

/**
 * Robust document resolver that checks KAYITEDILENCEKLER and CEKLER locations,
 * supporting signed URLs, direct blob downloads with correct MIME types, public URLs,
 * and bucket-listing fuzzy matching if exact name differs.
 */
export async function resolveCheckDocumentUrl(
  fileName?: string,
  fallbackUrl?: string,
  cekNo?: string
): Promise<{ 
  url: string; 
  isBlob: boolean; 
  sourceBucket: string; 
  error?: string; 
  isPdf: boolean; 
  isImage: boolean; 
  mimeType: string 
}> {
  const rawFileName = (fileName || '').trim();
  const cleanName = extractCleanFileName(rawFileName);
  const format = getDocumentFormat(cleanName || rawFileName || fallbackUrl || '', fallbackUrl);

  // Build list of candidate file names and paths
  const nameVariants = new Set<string>();
  if (cleanName) {
    nameVariants.add(cleanName);
    nameVariants.add(decodeURIComponent(cleanName));
    nameVariants.add(encodeURIComponent(cleanName));
    nameVariants.add(sanitizeFileNameForStorage(cleanName));
  }
  if (rawFileName) {
    nameVariants.add(rawFileName);
    nameVariants.add(decodeURIComponent(rawFileName));
    nameVariants.add(encodeURIComponent(rawFileName));
  }
  if (fallbackUrl) {
    const urlClean = extractCleanFileName(fallbackUrl);
    if (urlClean) {
      nameVariants.add(urlClean);
      nameVariants.add(decodeURIComponent(urlClean));
    }
  }

  const candidateNames = Array.from(nameVariants).filter(Boolean);

  // 1. Try createSignedUrl in KAYITEDILENCEKLER
  for (const name of candidateNames) {
    try {
      const { data: signedData, error: signErr } = await supabase.storage
        .from(DEST_BUCKET_NAME)
        .createSignedUrl(name, 7200);

      if (signedData?.signedUrl && !signErr) {
        return {
          url: signedData.signedUrl,
          isBlob: false,
          sourceBucket: DEST_BUCKET_NAME,
          isPdf: format.isPdf,
          isImage: format.isImage,
          mimeType: format.mimeType
        };
      }
    } catch (e) {
      // Continue next candidate
    }
  }

  // 2. Try createSignedUrl in CEKLER (both MAMAK/ and root)
  for (const name of candidateNames) {
    try {
      // Try MAMAK/ prefix
      const { data: signedMamak, error: mamakErr } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(`MAMAK/${name}`, 7200);

      if (signedMamak?.signedUrl && !mamakErr) {
        return {
          url: signedMamak.signedUrl,
          isBlob: false,
          sourceBucket: `${BUCKET_NAME}/MAMAK`,
          isPdf: format.isPdf,
          isImage: format.isImage,
          mimeType: format.mimeType
        };
      }

      // Try root in CEKLER
      const { data: signedRoot, error: rootErr } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(name, 7200);

      if (signedRoot?.signedUrl && !rootErr) {
        return {
          url: signedRoot.signedUrl,
          isBlob: false,
          sourceBucket: BUCKET_NAME,
          isPdf: format.isPdf,
          isImage: format.isImage,
          mimeType: format.mimeType
        };
      }
    } catch (e) {
      // Continue next candidate
    }
  }

  // 3. Try direct blob download from KAYITEDILENCEKLER (handles private bucket with anon key)
  for (const name of candidateNames) {
    try {
      const { data: blobData, error: dlErr } = await supabase.storage
        .from(DEST_BUCKET_NAME)
        .download(name);

      if (blobData && !dlErr && blobData.size > 0) {
        const typedBlob = new Blob([blobData], { type: format.mimeType });
        const blobUrl = URL.createObjectURL(typedBlob);
        return {
          url: blobUrl,
          isBlob: true,
          sourceBucket: DEST_BUCKET_NAME,
          isPdf: format.isPdf,
          isImage: format.isImage,
          mimeType: format.mimeType
        };
      }
    } catch (e) {
      // Continue next candidate
    }
  }

  // 4. Try direct blob download from CEKLER (MAMAK/ and root)
  for (const name of candidateNames) {
    try {
      const { data: blobSourceMamak } = await supabase.storage
        .from(BUCKET_NAME)
        .download(`MAMAK/${name}`);

      if (blobSourceMamak && blobSourceMamak.size > 0) {
        const typedBlob = new Blob([blobSourceMamak], { type: format.mimeType });
        const blobUrl = URL.createObjectURL(typedBlob);
        return {
          url: blobUrl,
          isBlob: true,
          sourceBucket: `${BUCKET_NAME}/MAMAK`,
          isPdf: format.isPdf,
          isImage: format.isImage,
          mimeType: format.mimeType
        };
      }

      const { data: blobSourceRoot } = await supabase.storage
        .from(BUCKET_NAME)
        .download(name);

      if (blobSourceRoot && blobSourceRoot.size > 0) {
        const typedBlob = new Blob([blobSourceRoot], { type: format.mimeType });
        const blobUrl = URL.createObjectURL(typedBlob);
        return {
          url: blobUrl,
          isBlob: true,
          sourceBucket: BUCKET_NAME,
          isPdf: format.isPdf,
          isImage: format.isImage,
          mimeType: format.mimeType
        };
      }
    } catch (e) {
      // Continue next candidate
    }
  }

  // 5. Bucket listing fallback (fuzzy search for matching file)
  try {
    // Check KAYITEDILENCEKLER list
    const { data: destList } = await supabase.storage
      .from(DEST_BUCKET_NAME)
      .list('', { limit: 200 });

    if (destList && destList.length > 0) {
      const targetLower = cleanName.toLowerCase();
      const cekNoClean = cekNo ? cekNo.replace(/\D/g, '') : '';

      const matchedFile = destList.find(f => {
        const fLower = f.name.toLowerCase();
        if (fLower === targetLower) return true;
        if (cleanName && (fLower.includes(targetLower) || targetLower.includes(fLower))) return true;
        if (cekNoClean && cekNoClean.length >= 4 && fLower.includes(cekNoClean)) return true;
        return false;
      });

      if (matchedFile) {
        const { data: blobData } = await supabase.storage
          .from(DEST_BUCKET_NAME)
          .download(matchedFile.name);

        if (blobData) {
          const matchedFormat = getDocumentFormat(matchedFile.name);
          const typedBlob = new Blob([blobData], { type: matchedFormat.mimeType });
          const blobUrl = URL.createObjectURL(typedBlob);
          return {
            url: blobUrl,
            isBlob: true,
            sourceBucket: DEST_BUCKET_NAME,
            isPdf: matchedFormat.isPdf,
            isImage: matchedFormat.isImage,
            mimeType: matchedFormat.mimeType
          };
        }
      }
    }

    // Check CEKLER/MAMAK list
    const { data: mamakList } = await supabase.storage
      .from(BUCKET_NAME)
      .list(DEFAULT_FOLDER, { limit: 200 });

    if (mamakList && mamakList.length > 0) {
      const targetLower = cleanName.toLowerCase();
      const cekNoClean = cekNo ? cekNo.replace(/\D/g, '') : '';

      const matchedMamak = mamakList.find(f => {
        const fLower = f.name.toLowerCase();
        if (fLower === targetLower) return true;
        if (cleanName && (fLower.includes(targetLower) || targetLower.includes(fLower))) return true;
        if (cekNoClean && cekNoClean.length >= 4 && fLower.includes(cekNoClean)) return true;
        return false;
      });

      if (matchedMamak) {
        const { data: blobData } = await supabase.storage
          .from(BUCKET_NAME)
          .download(`${DEFAULT_FOLDER}/${matchedMamak.name}`);

        if (blobData) {
          const matchedFormat = getDocumentFormat(matchedMamak.name);
          const typedBlob = new Blob([blobData], { type: matchedFormat.mimeType });
          const blobUrl = URL.createObjectURL(typedBlob);
          return {
            url: blobUrl,
            isBlob: true,
            sourceBucket: `${BUCKET_NAME}/${DEFAULT_FOLDER}`,
            isPdf: matchedFormat.isPdf,
            isImage: matchedFormat.isImage,
            mimeType: matchedFormat.mimeType
          };
        }
      }
    }
  } catch (listErr) {
    console.warn('Storage listeleme fallback hatası:', listErr);
  }

  // 6. Direct public URL from KAYITEDILENCEKLER
  if (cleanName) {
    const { data: pubData } = supabase.storage
      .from(DEST_BUCKET_NAME)
      .getPublicUrl(cleanName);

    if (pubData?.publicUrl) {
      return {
        url: pubData.publicUrl,
        isBlob: false,
        sourceBucket: DEST_BUCKET_NAME,
        isPdf: format.isPdf,
        isImage: format.isImage,
        mimeType: format.mimeType
      };
    }
  }

  // 7. Direct fallbackUrl
  if (fallbackUrl) {
    return {
      url: fallbackUrl,
      isBlob: false,
      sourceBucket: 'Harici URL',
      isPdf: format.isPdf,
      isImage: format.isImage,
      mimeType: format.mimeType
    };
  }

  return {
    url: '',
    isBlob: false,
    sourceBucket: '',
    error: 'Evrak dosyası depoda bulunamadı veya erişilemedi.',
    isPdf: format.isPdf,
    isImage: format.isImage,
    mimeType: format.mimeType
  };
}


/**
 * Get direct public storage URL for a file in KAYITEDILENCEKLER
 */
export function getDestStorageFileUrl(fileName: string): string {
  if (!fileName) return '';
  const { data } = supabase.storage
    .from(DEST_BUCKET_NAME)
    .getPublicUrl(fileName);
  return data?.publicUrl || '';
}

/**
 * Download a file from KAYITEDILENCEKLER bucket directly to user's device
 */
export async function downloadCheckFileFromStorage(fileName: string, fallbackUrl?: string): Promise<boolean> {
  if (!fileName && !fallbackUrl) return false;

  try {
    if (fileName) {
      // 1. Try Supabase SDK Storage Download
      const { data, error } = await supabase.storage
        .from(DEST_BUCKET_NAME)
        .download(fileName);

      if (data && !error) {
        const blobUrl = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
        return true;
      }
    }
  } catch (sdkErr) {
    console.warn('Supabase storage SDK download hatası, URL fetch denenecek:', sdkErr);
  }

  // 2. Try Fetching via URL
  const targetUrl = fallbackUrl || (fileName ? getDestStorageFileUrl(fileName) : '');
  if (targetUrl) {
    try {
      const resp = await fetch(targetUrl);
      if (resp.ok) {
        const blob = await resp.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || 'cek_evraki';
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
        return true;
      }
    } catch (fetchErr) {
      console.warn('Direct fetch download error, opening tab fallback:', fetchErr);
    }

    // 3. Fallback: Trigger anchor download
    const link = document.createElement('a');
    link.href = targetUrl;
    link.download = fileName || 'cek_evraki';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  return false;
}

