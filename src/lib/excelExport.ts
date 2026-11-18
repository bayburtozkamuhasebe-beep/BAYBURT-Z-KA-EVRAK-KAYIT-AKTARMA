import * as XLSX from 'xlsx';
import { CekKayitDbRecord } from '../types';

interface GroupedRecords {
  [key: string]: CekKayitDbRecord[];
}

const SANTIYE_SHEET_NAMES: { [key: string]: string } = {
  'ARNAVUTKOY': 'ARNAVUTKÖY',
  'BURSA-OZKA': 'BURSA-ÖZKA',
  'MSB-OZKA': 'MSB-ÖZKA',
  'MAMAK': 'MAMAK',
  'SEKA': 'SEKA',
  'DIGER': 'DİĞER'
};

export function exportAllTablesToExcel(
  records: CekKayitDbRecord[],
  groupedRecords: GroupedRecords,
  fileNamePrefix: string = 'CEK_KAYITLARI'
) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Helper to map record to clean row
  const formatRecordRow = (rec: CekKayitDbRecord, index: number) => {
    return {
      'Sıra No': index + 1,
      'Çek Numarası': rec.cekNo || '',
      'Vade Tarihi': rec.vadeTarihi || '',
      'Lehtar / Alacaklı': rec.alacakliUnvan || '',
      'Tutar': typeof rec.tutar === 'number' ? rec.tutar : parseFloat(String(rec.tutar)) || 0,
      'Para Birimi': rec.paraBirimi || 'TL',
      'Şantiye / Birim': rec.santiyeBirim || '',
      'Açıklama': rec.aciklama || '',
      'Evrak Dosya Adı': rec.dosyaAdi || '',
      'Evrak URL': rec.dosyaUrl || '',
      'Kayıt Durumu': rec.kayitDurumu || 'Kaydedildi',
      'Kayıt Tarihi': rec.kayitTarihi || rec.createdAt || ''
    };
  };

  // 1. MASTER SHEET: "TÜM ÇEKLER"
  const allRows = records.map((r, i) => formatRecordRow(r, i));
  const masterWs = XLSX.utils.json_to_sheet(allRows);

  // Set column widths for Master sheet
  masterWs['!cols'] = [
    { wch: 8 },  // Sıra No
    { wch: 18 }, // Çek Numarası
    { wch: 14 }, // Vade Tarihi
    { wch: 32 }, // Lehtar / Alacaklı
    { wch: 16 }, // Tutar
    { wch: 12 }, // Para Birimi
    { wch: 18 }, // Şantiye / Birim
    { wch: 30 }, // Açıklama
    { wch: 35 }, // Evrak Dosya Adı
    { wch: 45 }, // Evrak URL
    { wch: 15 }, // Kayıt Durumu
    { wch: 20 }  // Kayıt Tarihi
  ];

  XLSX.utils.book_append_sheet(wb, masterWs, 'TÜM ÇEKLER');

  // 2. INDIVIDUAL SHEETS FOR EACH ŞANTİYE
  const siteKeys = ['ARNAVUTKOY', 'BURSA-OZKA', 'MSB-OZKA', 'MAMAK', 'SEKA', 'DIGER'];

  siteKeys.forEach(key => {
    const groupItems = groupedRecords[key] || [];
    const sheetName = SANTIYE_SHEET_NAMES[key] || key;

    const groupRows = groupItems.map((r, i) => formatRecordRow(r, i));
    const ws = XLSX.utils.json_to_sheet(groupRows);

    ws['!cols'] = [
      { wch: 8 },  // Sıra No
      { wch: 18 }, // Çek Numarası
      { wch: 14 }, // Vade Tarihi
      { wch: 32 }, // Lehtar / Alacaklı
      { wch: 16 }, // Tutar
      { wch: 12 }, // Para Birimi
      { wch: 18 }, // Şantiye / Birim
      { wch: 30 }, // Açıklama
      { wch: 35 }, // Evrak Dosya Adı
      { wch: 45 }, // Evrak URL
      { wch: 15 }, // Kayıt Durumu
      { wch: 20 }  // Kayıt Tarihi
    ];

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // 3. SUMMARY SHEET: "ÖZET VE İSTATİSTİK"
  const summaryData = siteKeys.map(key => {
    const items = groupedRecords[key] || [];
    const totalTL = items
      .filter(i => !i.paraBirimi || i.paraBirimi === 'TL')
      .reduce((sum, i) => sum + (Number(i.tutar) || 0), 0);
    const totalUSD = items
      .filter(i => i.paraBirimi === 'USD')
      .reduce((sum, i) => sum + (Number(i.tutar) || 0), 0);
    const totalEUR = items
      .filter(i => i.paraBirimi === 'EUR')
      .reduce((sum, i) => sum + (Number(i.tutar) || 0), 0);

    return {
      'Şantiye / Birim': SANTIYE_SHEET_NAMES[key] || key,
      'Çek Sayısı': items.length,
      'Toplam Tutar (TL)': totalTL,
      'Toplam Tutar (USD)': totalUSD,
      'Toplam Tutar (EUR)': totalEUR
    };
  });

  // Calculate totals
  const totalCount = records.length;
  const grandTotalTL = records
    .filter(i => !i.paraBirimi || i.paraBirimi === 'TL')
    .reduce((sum, i) => sum + (Number(i.tutar) || 0), 0);
  const grandTotalUSD = records
    .filter(i => i.paraBirimi === 'USD')
    .reduce((sum, i) => sum + (Number(i.tutar) || 0), 0);
  const grandTotalEUR = records
    .filter(i => i.paraBirimi === 'EUR')
    .reduce((sum, i) => sum + (Number(i.tutar) || 0), 0);

  summaryData.push({
    'Şantiye / Birim': 'GENEL TOPLAM',
    'Çek Sayısı': totalCount,
    'Toplam Tutar (TL)': grandTotalTL,
    'Toplam Tutar (USD)': grandTotalUSD,
    'Toplam Tutar (EUR)': grandTotalEUR
  });

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(wb, summaryWs, 'ÖZET TABLO');

  // Format date stamp for file name
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;

  // Write file
  XLSX.writeFile(wb, fullFileName);
}
