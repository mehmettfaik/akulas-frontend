import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Calendar, Send, Edit, RefreshCw } from 'lucide-react';
import { getErrorMessage } from '../utils/errorHandler';
import { bayiDolumService } from '../services/bayiDolumService';
import type { BayiDolumRecord } from '../types';

// Birim fiyatlar (sabit)
const UNIT_PRICES = {
  bayiDolum: 1,
  bayiTamKart: 50,
  bayiKartKilifi: 20,
  posRulosu: 10,
};

interface ProductValues {
  bayiDolum: number;
  bayiTamKart: number;
  bayiKartKilifi: number;
  posRulosu: number;
}

interface PaymentValues {
  gunbasiNakit: number;
  krediKarti: number;
  bankayaGonderilen: number;
  ertesiGuneBirakilan: number;
}

interface CategoryCreditCards {
  dolum: number;
  kart: number;
}

interface BanknoteCount {
  b200: number;
  b100: number;
  b50: number;
  b20: number;
  b10: number;
  b5: number;
  c1: number;
  c050: number;
}

interface CategoryBanknotes {
  dolum: BanknoteCount;
  kart: BanknoteCount;
}

export const BayiDolumPage: React.FC = () => {
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [products, setProducts] = useState<ProductValues>({
    bayiDolum: 0,
    bayiTamKart: 0,
    bayiKartKilifi: 0,
    posRulosu: 0,
  });

  const [payments, setPayments] = useState<PaymentValues>({
    gunbasiNakit: 0,
    krediKarti: 0,
    bankayaGonderilen: 0,
    ertesiGuneBirakilan: 0,
  });

  const [categoryCreditCards, setCategoryCreditCards] = useState<CategoryCreditCards>({
    dolum: 0,
    kart: 0,
  });

  const [banknotes, setBanknotes] = useState<CategoryBanknotes>({
    dolum: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
    kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
  });

  const [activeTab, setActiveTab] = useState<'dolum' | 'kart'>('dolum');
  const [bankSentCash, setBankSentCash] = useState({ dolum: 0, kart: 0 });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [revisedRecords, setRevisedRecords] = useState<BayiDolumRecord[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Load revised records on mount
  useEffect(() => {
    fetchRevisedRecords();
  }, []);

  const fetchRevisedRecords = async () => {
    try {
      const response = await bayiDolumService.getSubmitted({ status: 'pending_revision' });
      setRevisedRecords(response.data || []);
    } catch (error) {
      // silently ignore fetch error for revised records
    }
  };

  const loadRecordForEditing = (record: BayiDolumRecord) => {
    setEditingRecordId(record.id);
    setProducts(record.products);
    setCategoryCreditCards(record.categoryCreditCards);
    setPayments({
      gunbasiNakit: record.payments.gunbasiNakit,
      krediKarti: record.totals.totalCreditCard,
      bankayaGonderilen: record.payments.bankayaGonderilen,
      ertesiGuneBirakilan: record.payments.ertesiGuneBirakilan,
    });
    // Banknot bilgilerini yükle
    if (record.banknotes) {
      setBanknotes(record.banknotes);
    }
    // Bankaya gönderilen nakit bilgilerini yükle
    if (record.bankSentCash) {
      setBankSentCash(record.bankSentCash);
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // Ürün değeri değiştirme
  const handleProductChange = (key: keyof ProductValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setProducts({ ...products, [key]: numValue });
  };

  // Ödeme değeri değiştirme
  const handlePaymentChange = (key: keyof PaymentValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPayments({ ...payments, [key]: numValue });
  };

  // Kategori kredi kartı değiştirme
  const handleCategoryCreditCardChange = (key: keyof CategoryCreditCards, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCategoryCreditCards({ ...categoryCreditCards, [key]: numValue });
  };

  // Banknot değiştirme
  const handleBanknoteChange = (category: 'dolum' | 'kart', key: keyof BanknoteCount, value: string) => {
    const numValue = parseInt(value) || 0;
    setBanknotes({
      ...banknotes,
      [category]: {
        ...banknotes[category],
        [key]: numValue
      }
    });
  };

  // Banknot toplamı hesaplama (belirli bir kategori için)
  const calculateBanknoteTotal = (category: 'dolum' | 'kart') => {
    const b = banknotes[category];
    return (
      b.b200 * 200 +
      b.b100 * 100 +
      b.b50 * 50 +
      b.b20 * 20 +
      b.b10 * 10 +
      b.b5 * 5 +
      b.c1 * 1 +
      b.c050 * 0.50
    );
  };

  // Bankaya gönder fonksiyonu
  const handleSendToBank = (category: 'dolum' | 'kart') => {
    const categoryTotal = calculateBanknoteTotal(category);
    setBankSentCash({
      ...bankSentCash,
      [category]: categoryTotal
    });
    setMessage({ type: 'success', text: `${category.toUpperCase()} kategorisi için ₺${categoryTotal.toFixed(2)} bankaya gönderildi olarak işaretlendi. Kaydetmek için "Sorumluya Teslim Et" butonunu kullanın.` });
  };

  // Kategori toplamları hesaplama
  const calculateDolumTotal = () => products.bayiDolum * UNIT_PRICES.bayiDolum;
  const calculateKartTotal = () => (
    products.bayiTamKart * UNIT_PRICES.bayiTamKart +
    products.bayiKartKilifi * UNIT_PRICES.bayiKartKilifi +
    products.posRulosu * UNIT_PRICES.posRulosu
  );

  // Kategori nakitleri hesaplama
  const calculateDolumCash = () => Math.max(0, calculateDolumTotal() - categoryCreditCards.dolum);
  const calculateKartCash = () => Math.max(0, calculateKartTotal() - categoryCreditCards.kart);

  // Toplam kategori KK
  const calculateTotalCategoryCreditCard = () => (
    categoryCreditCards.dolum + categoryCreditCards.kart
  );

  // Toplam kategori nakit
  const calculateTotalCategoryCash = () => (
    calculateDolumCash() + calculateKartCash()
  );

  // Toplam satış hesaplama
  const calculateTotalSales = () => {
    return calculateDolumTotal() + calculateKartTotal();
  };

  // Kasada kalan hesaplama
  const calculateCashInRegister = () => {
    return (
      payments.gunbasiNakit + 
      calculateTotalSales() - 
      (calculateTotalCategoryCreditCard() + payments.bankayaGonderilen + payments.ertesiGuneBirakilan)
    );
  };

  // Fark hesaplama
  const calculateDifference = () => {
    const totalSales = calculateTotalSales();
    const totalPayments = payments.gunbasiNakit + calculateTotalCategoryCreditCard() + payments.bankayaGonderilen + payments.ertesiGuneBirakilan;
    return totalSales - totalPayments;
  };

  const handleSubmitToResponsible = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const submitData = {
        date,
        products,
        categoryCreditCards,
        payments: {
          gunbasiNakit: payments.gunbasiNakit,
          bankayaGonderilen: payments.bankayaGonderilen,
          ertesiGuneBirakilan: payments.ertesiGuneBirakilan
        },
        banknotes,
        bankSentCash
      };

      if (editingRecordId) {
        // Revize edilmiş kaydı güncelle
        await bayiDolumService.update(editingRecordId, submitData);
        setMessage({ type: 'success', text: 'Kayıt güncellendi ve tekrar sorumluya gönderildi!' });
      } else {
        // Yeni kayıt oluştur
        await bayiDolumService.submit(submitData);
        setMessage({ type: 'success', text: 'Sorumluya başarıyla teslim edildi ve veritabanına kaydedildi!' });
      }

      // Form sıfırlama
      setEditingRecordId(null);
      setProducts({
        bayiDolum: 0,
        bayiTamKart: 0,
        bayiKartKilifi: 0,
        posRulosu: 0,
      });
      setPayments({
        gunbasiNakit: 0,
        krediKarti: 0,
        bankayaGonderilen: 0,
        ertesiGuneBirakilan: 0,
      });
      setCategoryCreditCards({
        dolum: 0,
        kart: 0,
      });
      setBanknotes({
        dolum: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
        kart: { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 },
      });
      setBankSentCash({ dolum: 0, kart: 0 });

      // Revize edilmiş kayıtları yenile
      fetchRevisedRecords();
    } catch (error) {
      setMessage({
        type: 'error',
        text: getErrorMessage(error, 'Teslim etme sırasında bir hata oluştu!')
      });
    } finally {
      setLoading(false);
    }
  };

  const totalSales = calculateTotalSales();
  const cashInRegister = calculateCashInRegister();
  const difference = calculateDifference();

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bayi Dolum İşlemleri</h1>
          <div className="flex items-center text-lg font-semibold text-gray-700 bg-white px-4 py-2 rounded-lg shadow">
            <Calendar className="w-5 h-5 mr-2" />
            {new Date(date).toLocaleDateString('tr-TR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
        </div>

        {/* Revize Edilecek Kayıtlar */}
        {revisedRecords.length > 0 && (
          <Card title="Revize Edilecek Kayıtlar (Düzenlenmesi Gereken)" className="mb-6">
            <div className="space-y-3">
              {revisedRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(record.date).toLocaleDateString('tr-TR')} - Toplam: ₺{record.totals.totalSales.toFixed(2)}
                    </p>
                    {record.reviewNotes && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Not:</strong> {record.reviewNotes}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => loadRecordForEditing(record)}
                    disabled={editingRecordId === record.id}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {editingRecordId === record.id ? 'Düzenleniyor...' : 'Düzenle'}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Düzenleme Bildirimi */}
        {editingRecordId && (
          <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
            <div className="flex items-center">
              <RefreshCw className="w-5 h-5 text-orange-600 mr-2" />
              <p className="text-orange-800 font-semibold">
                Revize modunda: Değişikliklerinizi yaptıktan sonra "SORUMLUYA TESLİM ET" butonuna tıklayın.
              </p>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Ürünler */}
          <Card title="Ürün Satışları">
            <div className="space-y-4">
              {/* Bayi Dolum */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <Input
                    label="BAYİ DOLUM"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Adet"
                    value={products.bayiDolum || ''}
                    onChange={(e) => handleProductChange('bayiDolum', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Birim Fiyat"
                    type="text"
                    value={`₺${UNIT_PRICES.bayiDolum.toFixed(2)}`}
                    disabled
                  />
                </div>
                <div>
                  <Input
                    label="Toplam"
                    type="text"
                    value={`₺${(products.bayiDolum * UNIT_PRICES.bayiDolum).toFixed(2)}`}
                    disabled
                    className="font-semibold text-green-600"
                  />
                </div>
              </div>

              {/* Bayi Tam Kart */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <Input
                    label="BAYİ Tam Kart"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Adet"
                    value={products.bayiTamKart || ''}
                    onChange={(e) => handleProductChange('bayiTamKart', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Birim Fiyat"
                    type="text"
                    value={`₺${UNIT_PRICES.bayiTamKart.toFixed(2)}`}
                    disabled
                  />
                </div>
                <div>
                  <Input
                    label="Toplam"
                    type="text"
                    value={`₺${(products.bayiTamKart * UNIT_PRICES.bayiTamKart).toFixed(2)}`}
                    disabled
                    className="font-semibold text-green-600"
                  />
                </div>
              </div>

              {/* Bayi Kart Kılıfı */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <Input
                    label="BAYİ KART KILIFI"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Adet"
                    value={products.bayiKartKilifi || ''}
                    onChange={(e) => handleProductChange('bayiKartKilifi', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Birim Fiyat"
                    type="text"
                    value={`₺${UNIT_PRICES.bayiKartKilifi.toFixed(2)}`}
                    disabled
                  />
                </div>
                <div>
                  <Input
                    label="Toplam"
                    type="text"
                    value={`₺${(products.bayiKartKilifi * UNIT_PRICES.bayiKartKilifi).toFixed(2)}`}
                    disabled
                    className="font-semibold text-green-600"
                  />
                </div>
              </div>

              {/* POS Rulosu */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <Input
                    label="POS RULOSU"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="Adet"
                    value={products.posRulosu || ''}
                    onChange={(e) => handleProductChange('posRulosu', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Birim Fiyat"
                    type="text"
                    value={`₺${UNIT_PRICES.posRulosu.toFixed(2)}`}
                    disabled
                  />
                </div>
                <div>
                  <Input
                    label="Toplam"
                    type="text"
                    value={`₺${(products.posRulosu * UNIT_PRICES.posRulosu).toFixed(2)}`}
                    disabled
                    className="font-semibold text-green-600"
                  />
                </div>
              </div>

              {/* Toplam Satış */}
              <div className="border-t-2 border-gray-300 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-3 text-right">
                    <label className="block text-lg font-bold text-gray-900">
                      TOPLAM SATIŞ:
                    </label>
                  </div>
                  <div>
                    <Input
                      type="text"
                      value={`₺${totalSales.toFixed(2)}`}
                      disabled
                      className="font-bold text-xl text-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Kategori Özeti - Ödeme Dağılımı */}
              <div className="border-t-2 border-gray-300 pt-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ödeme Dağılımı</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold"></th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-semibold">TOPLAM</th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-semibold">KREDİ KARTI</th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-semibold">NAKİT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* DOLUM */}
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-medium">DOLUM</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          ₺{calculateDolumTotal().toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={calculateDolumTotal()}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            value={categoryCreditCards.dolum || ''}
                            onChange={(e) => handleCategoryCreditCardChange('dolum', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-green-600">
                          ₺{calculateDolumCash().toFixed(2)}
                        </td>
                      </tr>
                      {/* KART */}
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-medium">KART</td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          ₺{calculateKartTotal().toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={calculateKartTotal()}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            value={categoryCreditCards.kart || ''}
                            onChange={(e) => handleCategoryCreditCardChange('kart', e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-green-600">
                          ₺{calculateKartCash().toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-200 font-bold">
                        <td className="border border-gray-300 px-4 py-2"></td>
                        <td className="border border-gray-300 px-4 py-2 text-right text-blue-600">
                          ₺{totalSales.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right text-orange-700">
                          ₺{calculateTotalCategoryCreditCard().toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                          ₺{calculateTotalCategoryCash().toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Banknot/Kupür Bazlı Para Sayımı */}
              <div className="border-t-2 border-gray-300 pt-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Banknot/Kupür Bazlı Para Sayımı</h3>

                {/* Sekmeler */}
                <div className="flex border-b border-gray-300 mb-4">
                  <button
                    className={`px-6 py-3 font-semibold transition-colors ${
                      activeTab === 'dolum'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('dolum')}
                  >
                    DOLUM
                  </button>
                  <button
                    className={`px-6 py-3 font-semibold transition-colors ${
                      activeTab === 'kart'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('kart')}
                  >
                    KART
                  </button>
                </div>

                {/* Nakit Toplam Gösterimi */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nakit Toplam ({activeTab.toUpperCase()}):</strong> ₺
                    {activeTab === 'dolum' ? calculateDolumCash().toFixed(2) : calculateKartCash().toFixed(2)}
                  </p>
                </div>

                {/* Banknot Giriş Alanları */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* 200 TL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">200 TL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={banknotes[activeTab].b200 || ''}
                        onChange={(e) => handleBanknoteChange(activeTab, 'b200', e.target.value)}
                        placeholder="Adet"
                      />
                      <span className="text-sm font-medium text-gray-600 w-16 text-right">
                        ₺{(banknotes[activeTab].b200 * 200).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* 100 TL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">100 TL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={banknotes[activeTab].b100 || ''}
                        onChange={(e) => handleBanknoteChange(activeTab, 'b100', e.target.value)}
                        placeholder="Adet"
                      />
                      <span className="text-sm font-medium text-gray-600 w-16 text-right">
                        ₺{(banknotes[activeTab].b100 * 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* 50 TL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">50 TL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={banknotes[activeTab].b50 || ''}
                        onChange={(e) => handleBanknoteChange(activeTab, 'b50', e.target.value)}
                        placeholder="Adet"
                      />
                      <span className="text-sm font-medium text-gray-600 w-16 text-right">
                        ₺{(banknotes[activeTab].b50 * 50).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* 20 TL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">20 TL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={banknotes[activeTab].b20 || ''}
                        onChange={(e) => handleBanknoteChange(activeTab, 'b20', e.target.value)}
                        placeholder="Adet"
                      />
                      <span className="text-sm font-medium text-gray-600 w-16 text-right">
                        ₺{(banknotes[activeTab].b20 * 20).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* 10 TL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">10 TL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={banknotes[activeTab].b10 || ''}
                        onChange={(e) => handleBanknoteChange(activeTab, 'b10', e.target.value)}
                        placeholder="Adet"
                      />
                      <span className="text-sm font-medium text-gray-600 w-16 text-right">
                        ₺{(banknotes[activeTab].b10 * 10).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* 5 TL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">5 TL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={banknotes[activeTab].b5 || ''}
                        onChange={(e) => handleBanknoteChange(activeTab, 'b5', e.target.value)}
                        placeholder="Adet"
                      />
                      <span className="text-sm font-medium text-gray-600 w-16 text-right">
                        ₺{(banknotes[activeTab].b5 * 5).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* 1 TL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1 TL</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={banknotes[activeTab].c1 || ''}
                        onChange={(e) => handleBanknoteChange(activeTab, 'c1', e.target.value)}
                        placeholder="Adet"
                      />
                      <span className="text-sm font-medium text-gray-600 w-16 text-right">
                        ₺{(banknotes[activeTab].c1 * 1).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* 50 Kr */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">50 Kr</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={banknotes[activeTab].c050 || ''}
                        onChange={(e) => handleBanknoteChange(activeTab, 'c050', e.target.value)}
                        placeholder="Adet"
                      />
                      <span className="text-sm font-medium text-gray-600 w-16 text-right">
                        ₺{(banknotes[activeTab].c050 * 0.50).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Banknot Karşılaştırma */}
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nakit Toplam (Ödeme Dağılımı)</p>
                      <p className="text-lg font-bold text-blue-600">
                        ₺{activeTab === 'dolum' ? calculateDolumCash().toFixed(2) : calculateKartCash().toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Banknot Sayımı Toplam</p>
                      <p className="text-lg font-bold text-green-600">₺{calculateBanknoteTotal(activeTab).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fark</p>
                      <p className={`text-lg font-bold ${
                        Math.abs(
                          (activeTab === 'dolum' ? calculateDolumCash() : calculateKartCash()) - calculateBanknoteTotal(activeTab)
                        ) < 0.01 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₺{(
                          (activeTab === 'dolum' ? calculateDolumCash() : calculateKartCash()) - calculateBanknoteTotal(activeTab)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {Math.abs(
                    (activeTab === 'dolum' ? calculateDolumCash() : calculateKartCash()) - calculateBanknoteTotal(activeTab)
                  ) >= 0.01 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Uyarı: Nakit toplam ile banknot sayımı uyuşmuyor! Lütfen kontrol edin.
                      </p>
                    </div>
                  )}
                  {Math.abs(
                    (activeTab === 'dolum' ? calculateDolumCash() : calculateKartCash()) - calculateBanknoteTotal(activeTab)
                  ) < 0.01 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">
                        ✓ Nakit toplam ile banknot sayımı uyuşuyor.
                      </p>
                    </div>
                  )}
                </div>

                {/* Bankaya Gönder Butonu */}
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => handleSendToBank(activeTab)}
                    disabled={calculateBanknoteTotal(activeTab) === 0}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    BANKAYA GÖNDER ({activeTab.toUpperCase()})
                  </Button>
                </div>

                {/* Bankaya Gönderilen Toplam */}
                {(bankSentCash.dolum > 0 || bankSentCash.kart > 0) && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-bold text-green-900 mb-3">Bankaya Gönderilen Tutarlar:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {bankSentCash.dolum > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">DOLUM</p>
                          <p className="text-lg font-bold text-green-600">₺{bankSentCash.dolum.toFixed(2)}</p>
                        </div>
                      )}
                      {bankSentCash.kart > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">KART</p>
                          <p className="text-lg font-bold text-green-600">₺{bankSentCash.kart.toFixed(2)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">TOPLAM</p>
                        <p className="text-lg font-bold text-green-600">
                          ₺{(bankSentCash.dolum + bankSentCash.kart).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Hesaplamalar */}
          <Card title="Hesaplamalar">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="GÜNBAŞI NAKİT"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={payments.gunbasiNakit || ''}
                  onChange={(e) => handlePaymentChange('gunbasiNakit', e.target.value)}
                />
                <Input
                  label="KREDİ KARTI (Otomatik)"
                  type="text"
                  value={`₺${calculateTotalCategoryCreditCard().toFixed(2)}`}
                  disabled
                  className="font-semibold text-orange-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="BANKAYA GÖNDERİLEN"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={payments.bankayaGonderilen || ''}
                  onChange={(e) => handlePaymentChange('bankayaGonderilen', e.target.value)}
                />
                <Input
                  label="ERTESİ GÜNE BIRAKILAN"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={payments.ertesiGuneBirakilan || ''}
                  onChange={(e) => handlePaymentChange('ertesiGuneBirakilan', e.target.value)}
                />
              </div>

              <div className="border-t-2 border-gray-300 pt-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="KASADA KALAN"
                    type="text"
                    value={`₺${cashInRegister.toFixed(2)}`}
                    disabled
                    className="font-bold text-lg text-purple-600"
                  />
                  <Input
                    label="FARK"
                    type="text"
                    value={`₺${difference.toFixed(2)}`}
                    disabled
                    className={`font-bold text-lg ${
                      difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Butonlar */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              size="lg"
              onClick={handleSubmitToResponsible}
              disabled={loading}
            >
              <Send className="w-5 h-5 mr-2" />
              SORUMLUYA TESLİM ET
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
