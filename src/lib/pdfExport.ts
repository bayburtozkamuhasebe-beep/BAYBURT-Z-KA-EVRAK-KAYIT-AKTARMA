import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { CheckRecordData } from '../types';

export interface PdfExportProgress {
  current: number;
  total: number;
  fileName: string;
  status: 'loading' | 'processing' | 'done' | 'error';
}

export interface DocumentImageData {
  dataUrl: string;
  width: number;
  height: number;
}

// Convert Turkish chars to ASCII-safe for default jsPDF helvetica font
function cleanTrChars(str?: string): string {
  if (!str) return '';
  return str
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');
}

// Convert image URL to Data URL (base64) using Canvas with natural width and height
async function getBase64ImageFromUrl(imageUrl: string): Promise<DocumentImageData> {
  // Method 1: Try Image element + Canvas (handles crossOrigin and caching best)
  try {
    const res = await new Promise<DocumentImageData>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const natW = img.naturalWidth || img.width || 1200;
          const natH = img.naturalHeight || img.height || 800;
          const canvas = document.createElement('canvas');
          canvas.width = natW;
          canvas.height = natH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            resolve({ dataUrl, width: natW, height: natH });
          } else {
            reject(new Error('Canvas context failed'));
          }
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Image element failed to load'));
      img.src = imageUrl;
    });
    return res;
  } catch (canvasErr) {
    // Method 2: Fallback to fetch with cors & Blob Object URL
    try {
      const res = await fetch(imageUrl, { mode: 'cors' });
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      return await new Promise<DocumentImageData>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const natW = img.naturalWidth || img.width || 1200;
          const natH = img.naturalHeight || img.height || 800;
          const canvas = document.createElement('canvas');
          canvas.width = natW;
          canvas.height = natH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            URL.revokeObjectURL(objectUrl);
            resolve({ dataUrl, width: natW, height: natH });
          } else {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Canvas context failed'));
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Blob image failed to load'));
        };
        img.src = objectUrl;
      });
    } catch (fetchErr) {
      throw fetchErr;
    }
  }
}

// Convert PDF first page to image Data URL
async function renderPdfFirstPageToImage(pdfUrl: string): Promise<DocumentImageData> {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
  
  let pdf: any;
  try {
    const response = await fetch(pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    pdf = await loadingTask.promise;
  } catch {
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });
    pdf = await loadingTask.promise;
  }

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  return { dataUrl, width: viewport.width, height: viewport.height };
}

// Unified loader for image or pdf evrak
async function loadDocumentImage(check: CheckRecordData): Promise<DocumentImageData | null> {
  const url = check.fileUrl;
  if (!url) return null;

  const isPdf = check.fileName?.toLowerCase().endsWith('.pdf') || url.toLowerCase().includes('.pdf');
  if (isPdf) {
    try {
      return await renderPdfFirstPageToImage(url);
    } catch (pdfErr) {
      console.warn('PDF sayfası render edilemedi, doğrudan görsel olarak deneniyor:', pdfErr);
    }
  }

  try {
    return await getBase64ImageFromUrl(url);
  } catch (imgErr) {
    console.warn('Evrak görseli yüklenemedi:', imgErr);
    return null;
  }
}

// TEK PDF İNDİR: Sayfa yatay (Landscape A4), her sayfada tek evrak,
// sayfada SADECE evrak görseli ve altında LUCA, ZİRVE, SİSTEM şeklinde 3 kutucuk
export async function exportAllChecksToSinglePdf(
  checks: CheckRecordData[],
  onProgress?: (p: PdfExportProgress) => void
): Promise<Blob> {
  if (checks.length === 0) {
    throw new Error('İndirilecek evrak bulunamadı.');
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Evrak görseli için ayrılan alan (Maksimum büyüklük, kenar boşlukları ile)
  const imgMaxW = 277; // 10mm sol/sağ kenar boşluğu
  const imgMaxH = 172; // y = 8mm ile 180mm arası (kutucuklara 6mm boşluk bırakır)
  const imgTargetRatio = imgMaxW / imgMaxH; // ~1.61

  // 3 Kutucuk (LUCA, ZİRVE, SİSTEM) boyut ve yerleşim hesapları
  const boxY = 186;
  const boxH = 15;
  const boxW = 64;
  const spacing = 18;
  const totalBoxesW = boxW * 3 + spacing * 2; // 228mm
  const startX = (pageWidth - totalBoxesW) / 2; // 34.5mm (sayfaya tam ortalanmış)

  const boxLabels = ['LUCA', 'ZIRVE', 'SISTEM'];

  let isFirstPage = true;

  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: checks.length,
        fileName: check.fileName,
        status: 'processing'
      });
    }

    if (!isFirstPage) {
      doc.addPage('a4', 'landscape');
    }
    isFirstPage = false;

    // 1. SADECE EVRAK GÖRSELİ (Maksimum boyut, en-boy oranı korunarak sayfaya ortalanır)
    const imgData = await loadDocumentImage(check);

    if (imgData && imgData.dataUrl) {
      const natW = imgData.width || 1200;
      const natH = imgData.height || 800;
      const imgRatio = natW / natH;

      let renderW = imgMaxW;
      let renderH = imgMaxH;

      if (imgRatio >= imgTargetRatio) {
        renderW = imgMaxW;
        renderH = imgMaxW / imgRatio;
      } else {
        renderH = imgMaxH;
        renderW = imgMaxH * imgRatio;
      }

      const renderX = 10 + (imgMaxW - renderW) / 2;
      const renderY = 8 + (imgMaxH - renderH) / 2;

      // Görseli ekle
      doc.addImage(
        imgData.dataUrl,
        'JPEG',
        renderX,
        renderY,
        renderW,
        renderH,
        undefined,
        'FAST'
      );

      // Evrak etrafına ince, profesyonel çerçeve çizgisi
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.3);
      doc.rect(renderX, renderY, renderW, renderH);
    } else {
      // Görsel yüklenemezse veya bağlantı geçersizse temiz bilgilendirme alanı
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.roundedRect(10, 8, imgMaxW, imgMaxH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `[ EVRAK GÖRSELİ: ${cleanTrChars(check.fileName)} ]`,
        pageWidth / 2,
        8 + imgMaxH / 2,
        { align: 'center' }
      );
    }

    // 2. EVRAKIN ALTINDA 3 KUTUCUK: LUCA, ZİRVE, SİSTEM
    boxLabels.forEach((label, idx) => {
      const currentBoxX = startX + idx * (boxW + spacing);

      // Ana kutucuk kartı
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(51, 65, 85); // slate-700
      doc.setLineWidth(0.6);
      doc.roundedRect(currentBoxX, boxY, boxW, boxH, 2, 2, 'FD');

      // İşaretleme / onay kare kutucuğu [ ]
      const cbSize = 8;
      const cbX = currentBoxX + 6;
      const cbY = boxY + 3.5;
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.5);
      doc.roundedRect(cbX, cbY, cbSize, cbSize, 1.2, 1.2, 'D');

      // Yazı: LUCA / ZİRVE / SİSTEM
      const textX = cbX + cbSize + 6;
      const textY = boxY + 10.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // #0f172a
      doc.text(label, textX, textY);

      // Türkçe karakter noktası (ZİRVE ve SİSTEM'deki İ harfi için)
      if (label === 'ZIRVE') {
        const wZ = doc.getTextWidth('Z');
        const wI = doc.getTextWidth('I');
        doc.circle(textX + wZ + wI / 2, textY - 3.8, 0.45, 'F');
      } else if (label === 'SISTEM') {
        const wS = doc.getTextWidth('S');
        const wI = doc.getTextWidth('I');
        doc.circle(textX + wS + wI / 2, textY - 3.8, 0.45, 'F');
      }
    });
  }

  return doc.output('blob');
}

// Generate single check PDF
export async function exportSingleCheckPdf(check: CheckRecordData): Promise<Blob> {
  return exportAllChecksToSinglePdf([check]);
}

// Direct Download Check PDF with all information (Vade, Çek No, Lehtar, Tutar, Görsel)
export async function downloadCheckPdf(check: CheckRecordData): Promise<{ success: boolean; error?: string }> {
  try {
    const blob = await exportSingleCheckPdf(check);
    const pdfUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = pdfUrl;
    const safeVade = (check.vadeTarihi || '').replace(/[\/\\:*?"<>|]/g, '-').trim();
    const safeSantiye = (check.santiyeBirim || 'MAMAK').replace(/[\/\\:*?"<>|]/g, '-').trim();
    const safeCekNo = (check.cekNo || 'CEK').replace(/[\/\\:*?"<>|]/g, '-').trim();
    const safeLehtar = (check.alacakliUnvan || 'LEHTAR').replace(/[\/\\:*?"<>|]/g, '-').trim();
    
    const nameParts = [safeSantiye, safeVade, safeCekNo, safeLehtar].filter(Boolean);
    a.download = `${nameParts.join(' ')} - CEK BILGI VE GORSEL.pdf`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
    return { success: true };
  } catch (err: any) {
    console.error('PDF indirme hatası:', err);
    return { success: false, error: err?.message || 'PDF oluşturulamadı' };
  }
}

// Full-featured Print and PDF Export that works in all browsers & iframes
export async function exportAndPrintCheckPdf(check: CheckRecordData): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    // 1. Generate real PDF Blob
    const blob = await exportSingleCheckPdf(check);
    const pdfUrl = URL.createObjectURL(blob);

    // 2. Download the PDF directly
    const a = document.createElement('a');
    a.href = pdfUrl;
    const safeCekNo = (check.cekNo || 'CEK').replace(/[\/\\:*?"<>|]/g, '-');
    const safeSantiye = (check.santiyeBirim || 'GENEL').replace(/[\/\\:*?"<>|]/g, '-');
    a.download = `CEK_KAYIT_FISI_${safeSantiye}_${safeCekNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 3. Also trigger HTML Print in a clean tab / popup for immediate printing
    try {
      printCheckReceipt(check, pdfUrl);
    } catch (printErr) {
      console.warn('HTML Print trigger warning:', printErr);
    }

    return { success: true, url: pdfUrl };
  } catch (err: any) {
    console.error('PDF oluşturma ve yazdırma hatası:', err);
    // Fallback: trigger HTML print directly
    try {
      printCheckReceipt(check);
    } catch (fallbackErr) {
      console.error('Fallback print error:', fallbackErr);
    }
    return { success: false, url: '', error: err?.message || 'PDF oluşturulamadı' };
  }
}

// Print check receipt cleanly in all browsers without being blocked
export function printCheckReceipt(check: CheckRecordData, _pdfBlobUrl?: string) {
  const tutarStr = check.tutar 
    ? `${Number(check.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${check.paraBirimi || 'TL'}` 
    : '-';

  // Try opening in new popup window first (most reliable for print dialog across all browsers)
  let printWin: Window | null = null;
  try {
    printWin = window.open('', '_blank', 'width=850,height=900');
  } catch {
    printWin = null;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>BAYBURT ÖZ-KA - ÇEK KAYIT FİŞİ - ${check.cekNo || check.fileName}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            color: #0f172a; 
            margin: 0; 
            padding: 12px; 
            background: #fff;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .header { 
            background: #800020; 
            color: #ffffff; 
            padding: 14px 18px; 
            border-radius: 6px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
          }
          .header h1 { margin: 0; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; }
          .header .date { font-size: 11px; opacity: 0.95; }
          .info-grid { 
            width: 100%;
            background: #f8fafc; 
            border: 1px solid #cbd5e1; 
            border-radius: 6px; 
            margin-top: 12px; 
            border-collapse: collapse;
          }
          .label { font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
          .val { font-size: 13px; font-weight: bold; color: #0f172a; }
          .val.amber { color: #b45309; font-family: monospace; font-size: 14px; }
          .val.bordo { color: #800020; font-weight: bold; font-size: 14px; }
          .val.green { color: #047857; font-size: 15px; font-family: monospace; }
          .img-box { 
            margin-top: 14px; 
            border: 1px solid #cbd5e1; 
            border-radius: 6px; 
            background: #f8fafc; 
            padding: 10px; 
            text-align: center; 
          }
          .img-box .title { font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 8px; text-align: left; }
          .img-box img { max-width: 100%; max-height: 600px; object-fit: contain; border-radius: 4px; }
          .footer { margin-top: 12px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          .no-print-bar {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            margin-bottom: 12px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .print-btn {
            background: #047857;
            color: #fff;
            border: none;
            padding: 6px 14px;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            font-size: 12px;
          }
          @media print {
            .no-print-bar { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <span style="font-size: 12px; font-weight: bold; color: #334155;">Bayburt Öz-Ka İnşaat Çek Kayıt Fişi</span>
          <button class="print-btn" onclick="window.print()">🖨️ Sayfayı Yazdır (Ctrl+P)</button>
        </div>
        <div class="header">
          <h1>BAYBURT ÖZ-KA İNŞAAT - ÇEK KAYIT FİŞİ</h1>
          <div class="date">${new Date().toLocaleDateString('tr-TR')}</div>
        </div>
        <table class="info-grid">
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; width: 33%;">
              <div class="label">Evrak Tarihi</div>
              <div class="val">${check.evrakTarihi || check.vadeTarihi || '-'}</div>
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; width: 33%;">
              <div class="label">Dönem</div>
              <div class="val amber">${check.donem || '-'}</div>
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; width: 34%;">
              <div class="label">Evrak Numarası</div>
              <div class="val amber">${check.cekNo || '-'}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
              <div class="label">Firma Ünvanı</div>
              <div class="val">${check.firmaUnvani || check.alacakliUnvan || 'BAYBURT ÖZ-KA İNŞAAT'}</div>
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
              <div class="label">Vergi Numarası</div>
              <div class="val">${check.vergiNo || check.kesideciVkn || '-'}</div>
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
              <div class="label">Banka Adı</div>
              <div class="val">${check.bankaAdi || '-'}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 12px;">
              <div class="label">İşin Adı / Şantiye</div>
              <div class="val bordo">${check.isinAdiSantiye || check.santiyeBirim || '-'}</div>
            </td>
            <td style="padding: 8px 12px;">
              <div class="label">Tutarı</div>
              <div class="val green">${tutarStr}</div>
            </td>
          </tr>
          ${check.aciklama ? `
            <tr>
              <td colspan="3" style="padding: 8px 12px; border-top: 1px dashed #cbd5e1; font-size: 11px;">
                <strong style="color: #475569;">Açıklama / Not:</strong> <span style="color: #0f172a;">${check.aciklama}</span>
                <span style="color: #94a3b8; float: right;">Dosya: ${check.fileName}</span>
              </td>
            </tr>
          ` : `
            <tr>
              <td colspan="3" style="padding: 6px 12px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #94a3b8;">
                Dosya: ${check.fileName}
              </td>
            </tr>
          `}
        </table>
        <div class="img-box">
          <div class="title">ÇEK GÖRSELİ / EVRAK FOTOKOPİSİ</div>
          ${check.fileUrl && !check.fileName.toLowerCase().endsWith('.pdf') ? `
            <img id="print-check-img" src="${check.fileUrl}" alt="Çek Görseli" />
          ` : `<p style="color: #64748b; font-style: italic; padding: 40px 0;">[PDF Dokümanı: ${check.fileName}]</p>`}
        </div>
        <div class="footer">
          Bayburt Öz-Ka İnşaat Çek Takip Sistemi - Yazdırma Tarihi: ${new Date().toLocaleString('tr-TR')}
        </div>
      </body>
    </html>
  `;

  if (printWin) {
    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();

    const checkImg = printWin.document.getElementById('print-check-img') as HTMLImageElement | null;
    if (checkImg && !checkImg.complete) {
      checkImg.onload = () => {
        setTimeout(() => {
          printWin?.focus();
          printWin?.print();
        }, 300);
      };
      checkImg.onerror = () => {
        setTimeout(() => {
          printWin?.focus();
          printWin?.print();
        }, 300);
      };
    } else {
      setTimeout(() => {
        printWin?.focus();
        printWin?.print();
      }, 350);
    }
  } else {
    // If popup blocked, fallback to hidden iframe
    let printFrame = document.getElementById('receipt-print-iframe') as HTMLIFrameElement | null;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'receipt-print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.zIndex = '-9999';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      const checkImg = doc.getElementById('print-check-img') as HTMLImageElement | null;
      if (checkImg && !checkImg.complete) {
        checkImg.onload = () => {
          setTimeout(() => {
            printFrame?.contentWindow?.focus();
            printFrame?.contentWindow?.print();
          }, 300);
        };
        checkImg.onerror = () => {
          setTimeout(() => {
            printFrame?.contentWindow?.focus();
            printFrame?.contentWindow?.print();
          }, 300);
        };
      } else {
        setTimeout(() => {
          printFrame?.contentWindow?.focus();
          printFrame?.contentWindow?.print();
        }, 350);
      }
    }
  }
}

