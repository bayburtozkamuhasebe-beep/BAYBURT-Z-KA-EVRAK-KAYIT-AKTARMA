export interface SupabaseStorageFile {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: {
    eTag?: string;
    size?: number;
    mimetype?: string;
    cacheControl?: string;
    lastModified?: string;
    contentLength?: number;
    httpStatusCode?: number;
  };
}

export type SantiyeBirimOption = 
  | 'BAYBURT ÖZ-KA İNŞAAT'
  | 'SELAHATTİN KALDIRIM İNŞAAT'
  | 'ARNAVUTKÖY (SEKA-ÖZKA)'
  | 'MAMAK (SEKA-ÖZKA)'
  | 'ŞENBAY-ÖZKA ORTAKLIĞI'
  | 'ARNAVUTKOY' 
  | 'BURSA-OZKA' 
  | 'MSB-OZKA' 
  | 'MAMAK' 
  | 'SEKA' 
  | 'DİGER' 
  | '';

export const DONEM_AYLARI = [
  'OCAK',
  'ŞUBAT',
  'MART',
  'NİSAN',
  'MAYIS',
  'HAZİRAN',
  'TEMMUZ',
  'AĞUSTOS',
  'EYLÜL',
  'EKİM',
  'KASIM',
  'ARALIK'
] as const;

export type DonemAyi = typeof DONEM_AYLARI[number];

export const KURUM_SANTIYE_BUTONLARI = [
  'BAYBURT ÖZ-KA İNŞAAT',
  'SELAHATTİN KALDIRIM İNŞAAT',
  'ARNAVUTKÖY (SEKA-ÖZKA)',
  'MAMAK (SEKA-ÖZKA)',
  'ŞENBAY-ÖZKA ORTAKLIĞI'
] as const;

export interface CheckRecordData {
  id: string; // unique identifier or filename
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize?: number;
  fileDate?: string;
  
  // Çek Bilgileri Kayıt Alanları
  evrakTarihi?: string; // EVRAK TARİHİ
  vadeTarihi: string;   // Vade Tarihi / Evrak Tarihi
  donem?: string;       // DÖNEM (OCAK, ŞUBAT, ...)
  cekNo: string;        // EVRAK NUMARASI (Sadece rakam, başta sıfır yok)
  firmaUnvani?: string; // FİRMA ÜNVANI
  alacakliUnvan: string;// Firma Ünvanı / Lehtar
  vergiNo?: string;     // VERGİ NUMARASI
  kesideciVkn?: string; // VKN
  bankaAdi?: string;    // BANKA ADI
  tutar: number | string; // TUTARI
  paraBirimi?: 'TL' | 'USD' | 'EUR';
  isinAdiSantiye?: string;// İŞİN ADI/ŞANTİYE
  santiyeBirim: SantiyeBirimOption | string; // İşin Adı / Şantiye
  aciklama: string;     // AÇIKLAMA/NOT
  
  // Opsiyonel / Geriye Uyumluluk
  subeAdi?: string;
  subeKodu?: string;
  hesapNo?: string;
  kesideciUnvan?: string;
  kesideTarihi?: string;
  cekTuru?: string;
  
  // Kayıt & Aktarım Durumu
  kayitDurumu: 'Beklemede' | 'Kaydedildi' | 'Aktarıldı' | 'İptal';
  aktarimHedefi?: 'Logo' | 'Mikro' | 'Zirve' | 'Luca' | 'Netsis' | 'Excel' | 'Manuel';
  kayitTarihi?: string;
  kaydedenKullanici?: string;
}

export interface FolderItem {
  name: string;
  path: string;
}

export interface CekKayitDbRecord {
  id: string | number;
  evrakTarihi?: string;
  vadeTarihi: string;
  donem?: string;
  cekNo: string;
  firmaUnvani?: string;
  alacakliUnvan: string;
  vergiNo?: string;
  bankaAdi?: string;
  tutar: number;
  paraBirimi: string;
  isinAdiSantiye?: string;
  santiyeBirim: string;
  aciklama: string;
  dosyaAdi: string;
  dosyaUrl: string;
  kayitDurumu: string;
  kayitTarihi?: string;
  createdAt?: string;
  raw?: any;
}
