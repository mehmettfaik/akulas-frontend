import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DeskRecord, BayiDolumRecord } from '../types';
import type { KioskDolumRecord } from '../services/kioskDolumService';
import { formatCurrency } from './formatCurrency';

const formatPdfCurrency = (value: number) => {
  return formatCurrency(value).replace('₺', 'TL');
};

// Add roboto font mapping
// Since we don't have the font file as base64 easily available here, we will rely on default fonts.
// To support Turkish characters, we can try to use a standard font that supports them (like Times or Helvetica).
// Actually, standard jsPDF fonts (Helvetica, Times) do not fully support Turkish ISO-8859-9/UTF-8 out of the box in all cases without a VFS font, but we will use english equivalents for headers if needed or just output standard text.

const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Canvas context not found'));
      }
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

export const generateDeskPdf = async (record: DeskRecord) => {
  const doc = new jsPDF();
  
  const primaryColor: [number, number, number] = [185, 28, 28]; // Red-700
  const secondaryColor: [number, number, number] = [55, 65, 81]; // Gray-700

  // Try to load the logo
  try {
    const logoBase64 = await loadImage('/akulas.png');
    // Add logo (x, y, width, height)
    doc.addImage(logoBase64, 'PNG', 15, 10, 40, 40);
  } catch (error) {
    console.error("Logo could not be loaded for PDF:", error);
  }

  // Header
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AKULAS DESK ISLETIM FORMU', 60, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Tarih: ${new Date(record.date).toLocaleDateString('tr-TR')}`, 60, 35);
  if (record.id) {
    doc.text(`Islem ID: ${record.id.substring(0, 8).toUpperCase()}`, 60, 42);
  }

  // Draw a line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 55, 196, 55);

  let startY = 65;

  // 1. SATISLAR (Sales)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SATIS DETAYLARI', 14, startY);
  
  const salesBody = [
    ['Dolum', formatPdfCurrency(record.products.dolum)],
    ['Tam Kart', formatPdfCurrency(record.products.tamKart)],
    ['Indirimli Kart', formatPdfCurrency(record.products.indirimliKart)],
    ['Serbest Kart', formatPdfCurrency(record.products.serbestKart)],
    ['Serbest Vize', formatPdfCurrency(record.products.serbestVize)],
    ['Indirimli Vize', formatPdfCurrency(record.products.indirimliVize)],
    ['Kart Kilifi', formatPdfCurrency(record.products.kartKilifi)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Urun', 'Tutar']],
    body: salesBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  // 2. KREDI KARTLARI (Credit Cards)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('KREDI KARTI DETAYLARI', 14, startY);

  const ccBody = [
    ['Dolum', formatPdfCurrency(record.categoryCreditCards.dolum)],
    ['Kart', formatPdfCurrency(record.categoryCreditCards.kart)],
    ['Vize', formatPdfCurrency(record.categoryCreditCards.vize)],
    ['Kart Kilifi', formatPdfCurrency(record.categoryCreditCards.kartKilifi)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Kategori', 'Tutar']],
    body: ccBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  // Check page break
  if (startY > 250) {
    doc.addPage();
    startY = 20;
  }

  // 3. TOPLAM VE FARK (Totals & Differences)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FINANSAL OZET', 14, startY);

  const totalsBody = [
    ['Toplam Satis', formatPdfCurrency(record.totals.totalSales)],
    ['Toplam Kredi Karti', formatPdfCurrency(record.totals.totalCreditCard)],
    ['Gunbasi Nakit', formatPdfCurrency(record.payments.gunbasiNakit)],
    ['Ertesi Gune Birakilan', formatPdfCurrency(record.payments.ertesiGuneBirakilan)],
    ['Bankaya Gonderilen', formatPdfCurrency((record.bankSentCash?.dolum || 0) + (record.bankSentCash?.kart || 0) + (record.bankSentCash?.vize || 0))],
    ['Hesaplanan Nakit', formatPdfCurrency(record.totals.totalCash)],
    ['Sayilan Nakit Toplami', formatPdfCurrency(record.totals.cashInRegister || 0)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Aciklama', 'Tutar']],
    body: totalsBody,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });
  
  startY = (doc as any).lastAutoTable.finalY + 10;

  // Fark (Difference)
  const difference = (record.totals.cashInRegister || 0) - (record.totals.totalCash || 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  if (Math.abs(difference) < 0.01) {
    doc.setTextColor(22, 163, 74); // Green
    doc.text(`FARK: KASA DENK (0.00 TL)`, 14, startY);
  } else {
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`FARK: ${formatPdfCurrency(difference)}`, 14, startY);
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `AKULAS ISLETIM FORMU - Sayfa ${i} / ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`desk_isletim_formu_${record.id?.substring(0,8) || 'yeni'}.pdf`);
};

export const generateBayiDolumPdf = async (record: BayiDolumRecord) => {
  const doc = new jsPDF();
  
  const primaryColor: [number, number, number] = [30, 64, 175]; // Blue-800
  const secondaryColor: [number, number, number] = [55, 65, 81]; // Gray-700

  // Try to load the logo
  try {
    const logoBase64 = await loadImage('/akulas.png');
    doc.addImage(logoBase64, 'PNG', 15, 10, 40, 40);
  } catch (error) {
    console.error("Logo could not be loaded for PDF:", error);
  }

  // Header
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AKULAS BAYI DOLUM FORMU', 60, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Tarih: ${new Date(record.date).toLocaleDateString('tr-TR')}`, 60, 35);
  if (record.id) {
    doc.text(`Islem ID: ${record.id.substring(0, 8).toUpperCase()}`, 60, 42);
  }

  // Draw a line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 55, 196, 55);

  let startY = 65;

  // 1. SATISLAR (Sales)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SATIS DETAYLARI', 14, startY);
  
  const salesBody = [
    ['Bayi Dolum', formatPdfCurrency(record.products.bayiDolum)],
    ['Bayi Tam Kart', formatPdfCurrency(record.products.bayiTamKart)],
    ['Bayi Kart Kilifi', formatPdfCurrency(record.products.bayiKartKilifi)],
    ['Pos Rulosu', formatPdfCurrency(record.products.posRulosu)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Urun', 'Tutar']],
    body: salesBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  // 2. KREDI KARTLARI (Credit Cards)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('KREDI KARTI DETAYLARI', 14, startY);

  const ccBody = [
    ['Dolum', formatPdfCurrency(record.categoryCreditCards.dolum)],
    ['Kart', formatPdfCurrency(record.categoryCreditCards.kart)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Kategori', 'Tutar']],
    body: ccBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  if (startY > 250) {
    doc.addPage();
    startY = 20;
  }

  // 3. TOPLAM VE FARK (Totals & Differences)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FINANSAL OZET', 14, startY);

  const totalsBody = [
    ['Toplam Satis', formatPdfCurrency(record.totals.totalSales)],
    ['Toplam Kredi Karti', formatPdfCurrency(record.totals.totalCreditCard)],
    ['Gunbasi Nakit', formatPdfCurrency(record.payments.gunbasiNakit)],
    ['Ertesi Gune Birakilan', formatPdfCurrency(record.payments.ertesiGuneBirakilan)],
    ['Bankaya Gonderilen', formatPdfCurrency((record.bankSentCash?.dolum || 0) + (record.bankSentCash?.kart || 0))],
    ['Hesaplanan Nakit', formatPdfCurrency(record.totals.totalCash)],
    ['Sayilan Nakit Toplami', formatPdfCurrency(record.totals.cashInRegister || 0)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Aciklama', 'Tutar']],
    body: totalsBody,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  if (record.totals.difference !== 0) {
    doc.setFontSize(14);
    doc.setTextColor(record.totals.difference > 0 ? 0 : 220, record.totals.difference > 0 ? 128 : 38, 38);
    doc.text(`FARK: ${formatPdfCurrency(record.totals.difference)}`, 14, startY);
    startY += 15;
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Bu belge Akulas sistemi tarafindan otomatik olusturulmustur.', 14, 280);

  doc.save(`bayi_dolum_formu_${record.id?.substring(0,8) || 'yeni'}.pdf`);
};

export const generateDailySummaryPdf = async (type: string, date: string, summary: any) => {
  const doc = new jsPDF();
  
  const primaryColor: [number, number, number] = [15, 118, 110]; // Teal-700
  const secondaryColor: [number, number, number] = [55, 65, 81]; // Gray-700

  // Try to load the logo
  try {
    const logoBase64 = await loadImage('/akulas.png');
    doc.addImage(logoBase64, 'PNG', 15, 10, 40, 40);
  } catch (error) {
    console.error("Logo could not be loaded for PDF:", error);
  }

  // Header
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`AKULAS ${type.toUpperCase()} OZETI`, 60, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Tarih: ${new Date(date).toLocaleDateString('tr-TR')}`, 60, 35);

  // Draw a line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 55, 196, 55);

  let startY = 65;

  // 1. SATISLAR (Sales)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SATIS OZETI', 14, startY);
  
  let salesBody = [];
  if (type === 'Desk İşlemleri') {
    salesBody = [
      ['Dolum', `${summary.dolum} Adet`],
      ['Tam Kart', `${summary.tamKart} Adet`],
      ['Indirimli Kart', `${summary.indirimliKart} Adet`],
      ['Serbest Kart', `${summary.serbestKart} Adet`],
      ['Serbest Vize', `${summary.serbestVize} Adet`],
      ['Indirimli Vize', `${summary.indirimliVize} Adet`],
      ['Kart Kilifi', `${summary.kartKilifi} Adet`],
    ];
  } else {
    salesBody = [
      ['Bayi Dolum', `${summary.bayiDolum} Adet`],
      ['Bayi Tam Kart', `${summary.bayiTamKart} Adet`],
      ['Bayi Kart Kilifi', `${summary.bayiKartKilifi} Adet`],
      ['Pos Rulosu', `${summary.posRulosu} Adet`],
    ];
  }

  autoTable(doc, {
    startY: startY + 5,
    head: [['Urun', 'Miktar']],
    body: salesBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  // 2. FINANSAL OZET
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FINANSAL OZET', 14, startY);

  const totalsBody = [
    ['Toplam Satis', formatPdfCurrency(summary.totalSales)],
    ['Toplam Kredi Karti', formatPdfCurrency(summary.totalCreditCard)],
    ['Toplam Nakit', formatPdfCurrency(summary.totalCash)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Aciklama', 'Tutar']],
    body: totalsBody,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  if (summary.difference !== 0) {
    doc.setFontSize(14);
    doc.setTextColor(summary.difference > 0 ? 0 : 220, summary.difference > 0 ? 128 : 38, 38);
    doc.text(`FARK: ${formatPdfCurrency(summary.difference)}`, 14, startY);
    startY += 15;
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Bu belge Akulas sistemi tarafindan otomatik olusturulmustur.', 14, 280);

  doc.save(`${type === 'Desk İşlemleri' ? 'desk' : 'bayi'}_ozet_rapor_${date}.pdf`);
};

export const generateKioskDolumPdf = async (record: KioskDolumRecord) => {
  const doc = new jsPDF();
  
  const primaryColor: [number, number, number] = [234, 88, 12]; // Orange-600
  const secondaryColor: [number, number, number] = [55, 65, 81]; // Gray-700

  // Try to load the logo
  try {
    const logoBase64 = await loadImage('/akulas.png');
    doc.addImage(logoBase64, 'PNG', 15, 10, 40, 40);
  } catch (error) {
    console.error("Logo could not be loaded for PDF:", error);
  }

  // Header
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AKULAS KIOSK DOLUM FORMU', 60, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Tarih: ${new Date(record.date).toLocaleDateString('tr-TR')}`, 60, 35);
  doc.text(`Kiosk: ${record.kioskName}`, 60, 42);
  if (record.id) {
    doc.text(`Islem ID: ${record.id.substring(0, 8).toUpperCase()}`, 60, 49);
  }

  // Draw a line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 55, 196, 55);

  let startY = 65;

  // 1. SATISLAR (Sales)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SATIS DETAYLARI', 14, startY);
  
  const salesBody = [
    ['Kiosk Dolum', formatPdfCurrency(record.products?.dolum || 0)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Urun', 'Tutar']],
    body: salesBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  // 2. KREDI KARTLARI (Credit Cards)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('KREDI KARTI DETAYLARI', 14, startY);

  const ccBody = [
    ['Dolum', formatPdfCurrency(record.categoryCreditCards?.dolum || 0)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Kategori', 'Tutar']],
    body: ccBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  if (startY > 250) {
    doc.addPage();
    startY = 20;
  }

  // 3. TOPLAM VE FARK (Totals & Differences)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('FINANSAL OZET', 14, startY);

  const totalsBody = [
    ['Toplam Satis', formatPdfCurrency(record.totals?.totalSales || 0)],
    ['Toplam Kredi Karti', formatPdfCurrency(record.totals?.totalCreditCard || 0)],
    ['Gunbasi Nakit', formatPdfCurrency(record.payments?.gunbasiNakit || 0)],
    ['Ertesi Gune Birakilan', formatPdfCurrency(record.payments?.ertesiGuneBirakilan || 0)],
    ['Bankaya Gonderilen', formatPdfCurrency(record.bankSentCash?.dolum || 0)],
    ['Hesaplanan Nakit', formatPdfCurrency(record.totals?.totalCash || 0)],
    ['Sayilan Nakit Toplami', formatPdfCurrency(record.totals?.cashInRegister || 0)],
  ];

  autoTable(doc, {
    startY: startY + 5,
    head: [['Aciklama', 'Tutar']],
    body: totalsBody,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    margin: { left: 14 }
  });

  startY = (doc as any).lastAutoTable.finalY + 15;

  const difference = record.totals?.difference || 0;
  if (difference !== 0) {
    doc.setFontSize(14);
    doc.setTextColor(difference > 0 ? 0 : 220, difference > 0 ? 128 : 38, 38);
    doc.text(`FARK: ${formatPdfCurrency(difference)}`, 14, startY);
    startY += 15;
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74); // Green
    doc.text(`FARK: KASA DENK (0.00 TL)`, 14, startY);
    startY += 15;
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Bu belge Akulas sistemi tarafindan otomatik olusturulmustur.', 14, 280);

  doc.save(`kiosk_dolum_formu_${record.id?.substring(0,8) || 'yeni'}.pdf`);
};
