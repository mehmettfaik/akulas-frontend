import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Calculator, Send, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/errorHandler';
import { kioskDolumService } from '../services/kioskDolumService';
import type { BanknoteCount } from '../services/kioskDolumService';
import { kioskService } from '../services/kioskService';
import type { Kiosk } from '../services/kioskService';
import { useAuth } from '../context/AuthContext';

const initialBanknotes: BanknoteCount = { b200: 0, b100: 0, b50: 0, b20: 0, b10: 0, b5: 0, c1: 0, c050: 0 };

export const KioskDolumPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [activeKioskId, setActiveKioskId] = useState<string>('');
  const [newKioskName, setNewKioskName] = useState('');

  const [products, setProducts] = useState({ dolum: 0 });
  const [categoryCreditCards, setCategoryCreditCards] = useState({ dolum: 0 });
  const [payments, setPayments] = useState({ gunbasiNakit: 0, krediKarti: 0, bankayaGonderilen: 0, ertesiGuneBirakilan: 0 });
  const [banknotes, setBanknotes] = useState<{ dolum: BanknoteCount }>({ dolum: { ...initialBanknotes } });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchKiosks = async () => {
    try {
      const res = await kioskService.getAll();
      const loadedKiosks = res.data || [];
      setKiosks(loadedKiosks);
      if (loadedKiosks.length > 0 && !activeKioskId) {
        setActiveKioskId(loadedKiosks[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchKiosks();
  }, []);

  // Kiosk değiştiğinde formu sıfırla
  useEffect(() => {
    setProducts({ dolum: 0 });
    setCategoryCreditCards({ dolum: 0 });
    setPayments({ gunbasiNakit: 0, krediKarti: 0, bankayaGonderilen: 0, ertesiGuneBirakilan: 0 });
    setBanknotes({ dolum: { ...initialBanknotes } });
    setMessage(null);
  }, [activeKioskId, date]);

  const handleBanknoteChange = (category: 'dolum', key: keyof BanknoteCount, value: string) => {
    const numValue = parseInt(value) || 0;
    setBanknotes(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: numValue }
    }));
  };

  const calculateBanknoteTotal = (category: 'dolum') => {
    const b = banknotes[category];
    return b.b200 * 200 + b.b100 * 100 + b.b50 * 50 + b.b20 * 20 + b.b10 * 10 + b.b5 * 5 + b.c1 * 1 + b.c050 * 0.50;
  };

  const totalSales = products.dolum;
  const totalCreditCard = categoryCreditCards.dolum;
  const cashInRegister = payments.gunbasiNakit + totalSales - (totalCreditCard + payments.bankayaGonderilen + payments.ertesiGuneBirakilan);
  const difference = totalSales - (payments.gunbasiNakit + totalCreditCard + payments.bankayaGonderilen + payments.ertesiGuneBirakilan);
  const sayilanNakit = calculateBanknoteTotal('dolum');

  const handleSubmit = async () => {
    if (!activeKioskId) return;
    setLoading(true);
    setMessage(null);
    try {
      const selectedKiosk = kiosks.find(k => k.id === activeKioskId);
      
      const submitData = {
        date,
        kioskId: activeKioskId,
        kioskName: selectedKiosk?.name || 'Bilinmeyen Kiosk',
        products,
        categoryCreditCards,
        payments: {
          gunbasiNakit: payments.gunbasiNakit,
          bankayaGonderilen: payments.bankayaGonderilen,
          ertesiGuneBirakilan: payments.ertesiGuneBirakilan
        },
        banknotes,
        bankSentCash: {
          dolum: sayilanNakit,
          totalSent: sayilanNakit
        }
      };

      await kioskDolumService.submit(submitData);
      setMessage({ type: 'success', text: 'Kiosk Dolum başarıyla Sorumluya Teslim Edildi!' });
      
      // Reset after success
      setProducts({ dolum: 0 });
      setCategoryCreditCards({ dolum: 0 });
      setPayments({ gunbasiNakit: 0, krediKarti: 0, bankayaGonderilen: 0, ertesiGuneBirakilan: 0 });
      setBanknotes({ dolum: { ...initialBanknotes } });

    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleAddKiosk = async () => {
    if (!newKioskName.trim()) return;
    try {
      setLoading(true);
      await kioskService.create(newKioskName.trim());
      setNewKioskName('');
      await fetchKiosks();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
      setLoading(false);
    }
  };

  const handleDeleteKiosk = async (id: string) => {
    if (!window.confirm('Bu kiosku silmek istediğinize emin misiniz?')) return;
    try {
      setLoading(true);
      await kioskService.delete(id);
      await fetchKiosks();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isAdmin ? 'Kiosk Ekle/Çıkar' : 'Kiosk Dolum'}
          </h1>
          {!isAdmin && (
            <div className="flex items-center gap-3">
              <input 
                type="date" 
                className="px-4 py-2 border border-gray-300 rounded shadow-sm focus:ring-primary-500"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-center justify-between ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-sm font-bold opacity-50 hover:opacity-100">X</button>
          </div>
        )}

        {isAdmin ? (
          <div className="space-y-6">
            <Card title="Yeni Kiosk Ekle">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Input
                    label="Kiosk Adı"
                    value={newKioskName}
                    onChange={e => setNewKioskName(e.target.value)}
                    placeholder="Örn: Kiosk 1"
                  />
                </div>
                <Button type="button" onClick={handleAddKiosk} disabled={loading || !newKioskName.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ekle
                </Button>
              </div>
            </Card>

            <Card title="Kayıtlı Kiosklar">
              {kiosks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {kiosks.map(kiosk => (
                    <div key={kiosk.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="font-medium text-gray-900">{kiosk.name}</span>
                      <button
                        onClick={() => handleDeleteKiosk(kiosk.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Kayıtlı kiosk bulunmamaktadır.</p>
              )}
            </Card>
          </div>
        ) : (
          <>
            {kiosks.length > 0 ? (
              <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl overflow-x-auto">
                {kiosks.map(kiosk => (
                  <button
                    key={kiosk.id}
                    onClick={() => setActiveKioskId(kiosk.id)}
                    className={`flex-1 whitespace-nowrap py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeKioskId === kiosk.id
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                  >
                    {kiosk.name}
                  </button>
                ))}
              </div>
            ) : (
              <Card>
                <p className="text-gray-500 py-4 text-center">Kayıtlı kiosk bulunmamaktadır.</p>
              </Card>
            )}

            {activeKioskId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol Sütun: Ödeme ve Kredi Kartı */}
                <div className="space-y-6">
                  <Card title={`${kiosks.find(k=>k.id===activeKioskId)?.name} - Ödeme Dağılımı`}>
                    <div className="relative">
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Sisteme Yüklenen (Dolum)"
                          type="number"
                          min="0"
                          step="0.01"
                          value={products.dolum || ''}
                          onChange={e => setProducts({ ...products, dolum: parseFloat(e.target.value) || 0 })}
                        />
                        <div className="flex flex-col justify-end">
                          <div className="text-sm text-gray-500 mb-1">Tutar</div>
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-gray-900 h-[42px] flex items-center">
                            {formatCurrency(products.dolum)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card title="Kredi Kartı">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Dolum KK"
                        type="number"
                        min="0"
                        step="0.01"
                        value={categoryCreditCards.dolum || ''}
                        onChange={e => setCategoryCreditCards({ ...categoryCreditCards, dolum: parseFloat(e.target.value) || 0 })}
                      />
                      <div className="flex flex-col justify-end">
                        <div className="text-sm text-gray-500 mb-1">Toplam Kredi Kartı</div>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-gray-900 h-[42px] flex items-center">
                          {formatCurrency(categoryCreditCards.dolum)}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card title="Nakit Özeti">
                    <div className="space-y-4">
                      <Input
                        label="Günbaşı Nakit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={payments.gunbasiNakit || ''}
                        onChange={e => setPayments({ ...payments, gunbasiNakit: parseFloat(e.target.value) || 0 })}
                      />
                      <Input
                        label="Ertesi Güne Bırakılan"
                        type="number"
                        min="0"
                        step="0.01"
                        value={payments.ertesiGuneBirakilan || ''}
                        onChange={e => setPayments({ ...payments, ertesiGuneBirakilan: parseFloat(e.target.value) || 0 })}
                      />
                      <Input
                        label="Bankaya Gönderilen (Varsa harici)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={payments.bankayaGonderilen || ''}
                        onChange={e => setPayments({ ...payments, bankayaGonderilen: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </Card>
                </div>

                {/* Sağ Sütun: Kupür ve Sonuç */}
                <div className="space-y-6">
                  <Card>
                    <div className="flex items-center gap-2 mb-6 text-gray-800">
                      <Calculator className="w-6 h-6 text-primary-600" />
                      <h2 className="text-xl font-bold">Kupür Hesaplama (Dolum)</h2>
                    </div>

                    <div className="space-y-3">
                      {[
                        { key: 'b200', label: '200 TL', multiplier: 200 },
                        { key: 'b100', label: '100 TL', multiplier: 100 },
                        { key: 'b50', label: '50 TL', multiplier: 50 },
                        { key: 'b20', label: '20 TL', multiplier: 20 },
                        { key: 'b10', label: '10 TL', multiplier: 10 },
                        { key: 'b5', label: '5 TL', multiplier: 5 },
                        { key: 'c1', label: '1 TL', multiplier: 1 },
                        { key: 'c050', label: '0.50 TL', multiplier: 0.5 },
                      ].map((banknote) => {
                        const count = banknotes.dolum[banknote.key as keyof BanknoteCount] || 0;
                        const total = count * banknote.multiplier;
                        return (
                          <div key={banknote.key} className="flex items-center gap-4">
                            <div className="w-24 font-medium text-gray-700">{banknote.label}</div>
                            <input
                              type="number"
                              min="0"
                              className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 text-center"
                              value={count || ''}
                              onChange={(e) => handleBanknoteChange('dolum', banknote.key as keyof BanknoteCount, e.target.value)}
                            />
                            <div className="flex-1 text-right font-medium text-gray-900">
                              {formatCurrency(total)}
                            </div>
                          </div>
                        );
                      })}
                      <div className="pt-4 mt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center text-lg font-bold text-primary-600">
                          <span>Sayılan Nakit Toplamı:</span>
                          <span>{formatCurrency(sayilanNakit)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card title="Finansal Özet">
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Toplam Satış</span>
                        <span className="font-bold">{formatCurrency(totalSales)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Kasa Olması Gereken</span>
                        <span className="font-bold text-blue-600">{formatCurrency(cashInRegister)}</span>
                      </div>
                      <div className={`flex justify-between p-4 rounded-lg font-bold text-lg ${
                        difference === 0 ? 'bg-gray-100 text-gray-700' :
                        difference > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span>FARK:</span>
                        <span>{formatCurrency(difference)}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <Button 
                        type="button" 
                        onClick={handleSubmit} 
                        disabled={loading} 
                        className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg"
                      >
                        <Send className="w-6 h-6 mr-2" />
                        Sorumluya Teslim Et
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};
