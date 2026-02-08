import * as XLSX from 'xlsx';

const DENOMINATION_VALUES: Record<string, number> = {
  b200: 200, b100: 100, b50: 50, b20: 20,
  b10: 10, b5: 5, c1: 1, c050: 0.50
};

const DENOMINATION_LABELS: Record<string, string> = {
  b200: '200 TL', b100: '100 TL', b50: '50 TL', b20: '20 TL',
  b10: '10 TL', b5: '5 TL', c1: '1 TL', c050: '50 Kuruş'
};

const DENOM_KEYS = ['b200', 'b100', 'b50', 'b20', 'b10', 'b5', 'c1', 'c050'] as const;

interface BanknoteDenominations {
  b200: number; b100: number; b50: number; b20: number;
  b10: number; b5: number; c1: number; c050: number;
}

export interface PusulaRecord {
  id: string;
  date: string;
  type: 'desk' | 'bayi';
  bankSentCash: { dolum?: number; kart?: number; vize?: number; };
  banknotes?: {
    dolum?: BanknoteDenominations;
    kart?: BanknoteDenominations;
    vize?: BanknoteDenominations;
  };
  submittedByEmail: string;
}

export function generatePusulaExcel(record: PusulaRecord): void {
  const wb = XLSX.utils.book_new();
  const rows: (string | number)[][] = [];

  // Baslik
  rows.push(['BANKA PUSULA RAPORU']);
  rows.push([]);
  rows.push(['Tarih:', new Date(record.date).toLocaleDateString('tr-TR')]);
  rows.push(['Tip:', record.type === 'desk' ? 'Desk İşlemleri' : 'Bayi Dolum']);
  rows.push(['Gönderen:', record.submittedByEmail]);
  rows.push([]);

  // Kategoriler
  const categories: { key: string; label: string }[] = [
    { key: 'dolum', label: 'DOLUM' },
    { key: 'kart', label: 'KART' },
  ];
  if (record.type === 'desk') {
    categories.push({ key: 'vize', label: 'VİZE' });
  }

  let grandTotal = 0;

  for (const cat of categories) {
    const banknoteData = record.banknotes?.[cat.key as keyof typeof record.banknotes] as BanknoteDenominations | undefined;
    const bankSentAmount = (record.bankSentCash as Record<string, number>)?.[cat.key] || 0;

    rows.push([`--- ${cat.label} ---`]);
    rows.push(['Kupür', 'Adet', 'Birim Değer (TL)', 'Toplam (TL)']);

    let categoryTotal = 0;

    for (const denom of DENOM_KEYS) {
      const count = banknoteData?.[denom] || 0;
      if (count > 0) {
        const value = DENOMINATION_VALUES[denom];
        const subtotal = count * value;
        categoryTotal += subtotal;
        rows.push([DENOMINATION_LABELS[denom], count, value, subtotal]);
      }
    }

    if (categoryTotal === 0) {
      rows.push(['(Kupür verisi yok)', '', '', '']);
    }

    rows.push([]);
    rows.push([`${cat.label} Kupür Toplamı:`, '', '', categoryTotal]);
    rows.push([`${cat.label} Bankaya Gönderilen:`, '', '', bankSentAmount]);
    rows.push([]);

    grandTotal += bankSentAmount;
  }

  rows.push(['=== GENEL TOPLAM ===', '', '', grandTotal]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Kolon genislikleri
  ws['!cols'] = [
    { wch: 30 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Pusula');

  const dateStr = record.date.replace(/-/g, '');
  const typeStr = record.type === 'desk' ? 'Desk' : 'BayiDolum';
  XLSX.writeFile(wb, `Pusula_${typeStr}_${dateStr}.xlsx`);
}

export function generateBulkPusulaExcel(records: PusulaRecord[]): void {
  if (records.length === 0) {
    alert('Dışa aktarılacak kayıt bulunamadı.');
    return;
  }

  const wb = XLSX.utils.book_new();
  const rows: (string | number)[][] = [];

  // Baslik
  rows.push(['BANKA PUSULA RAPORU - TOPLU']);
  rows.push([]);
  rows.push(['Oluşturma Tarihi:', new Date().toLocaleDateString('tr-TR')]);
  rows.push(['Toplam Kayıt:', records.length]);
  rows.push([]);

  let grandTotalDolum = 0;
  let grandTotalKart = 0;
  let grandTotalVize = 0;

  records.forEach((record, index) => {
    const typeLabel = record.type === 'desk' ? 'Desk İşlemleri' : 'Bayi Dolum';
    const dateLabel = new Date(record.date).toLocaleDateString('tr-TR');

    rows.push(['════════════════════════════════════════']);
    rows.push([`KAYIT ${index + 1}: ${dateLabel} - ${typeLabel} - ${record.submittedByEmail}`]);
    rows.push([]);

    const categories: { key: string; label: string }[] = [
      { key: 'dolum', label: 'DOLUM' },
      { key: 'kart', label: 'KART' },
    ];
    if (record.type === 'desk') {
      categories.push({ key: 'vize', label: 'VİZE' });
    }

    let recordTotal = 0;

    for (const cat of categories) {
      const banknoteData = record.banknotes?.[cat.key as keyof typeof record.banknotes] as BanknoteDenominations | undefined;
      const bankSentAmount = (record.bankSentCash as Record<string, number>)?.[cat.key] || 0;

      rows.push([`--- ${cat.label} ---`]);
      rows.push(['Kupür', 'Adet', 'Birim Değer (TL)', 'Toplam (TL)']);

      let categoryTotal = 0;

      for (const denom of DENOM_KEYS) {
        const count = banknoteData?.[denom] || 0;
        if (count > 0) {
          const value = DENOMINATION_VALUES[denom];
          const subtotal = count * value;
          categoryTotal += subtotal;
          rows.push([DENOMINATION_LABELS[denom], count, value, subtotal]);
        }
      }

      if (categoryTotal === 0) {
        rows.push(['(Kupür verisi yok)', '', '', '']);
      }

      rows.push([`${cat.label} Kupür Toplamı:`, '', '', categoryTotal]);
      rows.push([`${cat.label} Bankaya Gönderilen:`, '', '', bankSentAmount]);
      rows.push([]);

      if (cat.key === 'dolum') grandTotalDolum += bankSentAmount;
      if (cat.key === 'kart') grandTotalKart += bankSentAmount;
      if (cat.key === 'vize') grandTotalVize += bankSentAmount;

      recordTotal += bankSentAmount;
    }

    rows.push([`KAYIT ${index + 1} TOPLAMI:`, '', '', recordTotal]);
    rows.push([]);
  });

  // Genel toplam
  rows.push(['════════════════════════════════════════']);
  rows.push([]);
  rows.push(['=== GENEL TOPLAM ===']);
  rows.push(['Toplam Dolum:', '', '', grandTotalDolum]);
  rows.push(['Toplam Kart:', '', '', grandTotalKart]);
  if (grandTotalVize > 0) {
    rows.push(['Toplam Vize:', '', '', grandTotalVize]);
  }
  rows.push(['GENEL TOPLAM:', '', '', grandTotalDolum + grandTotalKart + grandTotalVize]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 45 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Pusula');

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `Pusula_Toplu_${today}.xlsx`);
}
