import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  SendHorizontal, 
  Layers, 
  CheckCircle2,
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CheckRecordData } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  checks: CheckRecordData[];
  onMarkAsTransferred: (ids: string[], target: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  checks,
  onMarkAsTransferred
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'zirve' | 'logo' | 'luca' | 'json'>('excel');
  const [copied, setCopied] = useState<boolean>(false);
  const [targetSoftware, setTargetSoftware] = useState<string>('Zirve');

  if (!isOpen) return null;

  const validChecks = checks.filter(c => c.kayitDurumu === 'Kaydedildi' || c.kayitDurumu === 'Aktarıldı' || c.cekNo || c.tutar);

  // Generate Excel CSV with UTF-8 BOM and semicolon separator
  const generateExcelCsv = (): string => {
    const headers = [
      'Sıra No',
      'Dosya Adı',
      'Vade Tarihi',
      'Çek Numarası',
      'Lehtar (Alacaklı)',
      'Çek Tutarı',
      'Para Birimi',
      'Şantiye / Birim',
      'Açıklama',
      'Kayıt Durumu',
      'Dosya URL'
    ];

    const rows = validChecks.map((c, index) => [
      index + 1,
      `"${c.fileName || ''}"`,
      `"${c.vadeTarihi || ''}"`,
      `"${c.cekNo || ''}"`,
      `"${c.alacakliUnvan || 'BAYBURT ÖZ-KA İNŞAAT'}"`,
      `"${typeof c.tutar === 'number' ? c.tutar.toFixed(2).replace('.', ',') : (c.tutar || '')}"`,
      `"${c.paraBirimi || 'TL'}"`,
      `"${c.santiyeBirim || 'MAMAK'}"`,
      `"${c.aciklama || ''}"`,
      `"${c.kayitDurumu || ''}"`,
      `"${c.fileUrl || ''}"`
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\r\n');

    return csvContent;
  };

  const handleDownloadXlsx = () => {
    const data = validChecks.map((c, index) => ({
      'Sıra No': index + 1,
      'Dosya Adı': c.fileName || '',
      'Vade Tarihi': c.vadeTarihi || '',
      'Çek Numarası': c.cekNo || '',
      'Lehtar (Alacaklı)': c.alacakliUnvan || 'BAYBURT ÖZ-KA İNŞAAT',
      'Çek Tutarı': typeof c.tutar === 'number' ? c.tutar : parseFloat(String(c.tutar)) || 0,
      'Para Birimi': c.paraBirimi || 'TL',
      'Şantiye / Birim': c.santiyeBirim || 'MAMAK',
      'Açıklama': c.aciklama || '',
      'Kayıt Durumu': c.kayitDurumu || 'Kaydedildi',
      'Dosya URL': c.fileUrl || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 14 },
      { wch: 18 },
      { wch: 30 },
      { wch: 16 },
      { wch: 12 },
      { wch: 18 },
      { wch: 30 },
      { wch: 15 },
      { wch: 45 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ÇEK KAYITLARI');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `BAYBURT_OZKA_CEKLER_${dateStr}.xlsx`);
  };

  const handleDownloadCsv = () => {
    const csvContent = generateExcelCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `BAYBURT_OZKA_CEK_KAYITLARI_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkTransferred = () => {
    const idsToTransfer = validChecks.map(c => c.id);
    onMarkAsTransferred(idsToTransfer, targetSoftware);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = validChecks.reduce((acc, c) => acc + (Number(c.tutar) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Çek Kayıtları Dışa Aktar & Muhasebe Transferi</h2>
              <p className="text-xs text-slate-400">
                Kayıtlı çekleri Excel tablosu olarak indirin veya muhasebe programına aktarılmış olarak işaretleyin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400">Aktarıma Hazır Çek Sayısı</span>
              <p className="text-xl font-bold text-white mt-1">{validChecks.length} Adet</p>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400">Toplam Portföy Tutarı</span>
              <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </p>
            </div>
            <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400">Alacaklı Firma</span>
              <p className="text-sm font-semibold text-emerald-300 mt-1">BAYBURT ÖZ-KA İNŞAAT</p>
            </div>
          </div>

          {/* Table Preview */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Aktarılacak Çek Listesi ({validChecks.length})</span>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition"
              >
                <Printer className="w-3.5 h-3.5" /> Yazdır / PDF
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Vade Tarihi</th>
                    <th className="p-2.5">Çek No</th>
                    <th className="p-2.5">Lehtar / Alacaklı</th>
                    <th className="p-2.5">Şantiye / Birim</th>
                    <th className="p-2.5 text-right">Tutar</th>
                    <th className="p-2.5 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {validChecks.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono text-white">{c.vadeTarihi || '—'}</td>
                      <td className="p-2.5 font-mono text-amber-300 font-semibold">{c.cekNo || '—'}</td>
                      <td className="p-2.5 text-slate-300 truncate max-w-[150px]">{c.alacakliUnvan || 'BAYBURT ÖZ-KA'}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                          {c.santiyeBirim || 'MAMAK'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-amber-400">
                        {c.tutar ? `${Number(c.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${c.paraBirimi || 'TL'}` : '—'}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          c.kayitDurumu === 'Aktarıldı' ? 'bg-emerald-500/20 text-emerald-300' :
                          c.kayitDurumu === 'Kaydedildi' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {c.kayitDurumu}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {validChecks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        Henüz kayıt yapılmış çek bulunmuyor. Listeden çekleri seçip bilgileri kaydedebilirsiniz.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Options */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-300">
                Hedef Muhasebe Programı:
              </label>
              <select
                value={targetSoftware}
                onChange={e => setTargetSoftware(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Zirve">Zirve Yazılım</option>
                <option value="Logo">Logo Yazılım (Tiger / Go)</option>
                <option value="Luca">Luca Muhasebe</option>
                <option value="Mikro">Mikro Yazılım</option>
                <option value="Netsis">Netsis</option>
                <option value="Excel">Excel Arşivi</option>
              </select>
            </div>

            <button
              onClick={handleMarkTransferred}
              disabled={validChecks.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-emerald-950/40"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Tümünü '{targetSoftware}'e Aktarıldı Olarak İşaretle</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Kapat
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              disabled={validChecks.length === 0}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV İndir</span>
            </button>

            <button
              onClick={handleDownloadXlsx}
              disabled={validChecks.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (.xlsx) İndir</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
