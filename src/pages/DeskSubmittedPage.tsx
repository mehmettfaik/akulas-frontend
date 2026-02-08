import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar, CheckCircle, XCircle, Clock, ThumbsUp, RefreshCw, ThumbsDown } from 'lucide-react';
import type { DeskRecord, BayiDolumRecord } from '../types';
import axios from 'axios';
import apiClient from '../services/api';
import { deskService } from '../services/deskService';
import { bayiDolumService } from '../services/bayiDolumService';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorHandler';

type CombinedRecord = (DeskRecord | BayiDolumRecord) & { recordType: 'desk' | 'bayi' };

export const DeskSubmittedPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<CombinedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRecord, setSelectedRecord] = useState<CombinedRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'desk' | 'bayi'>('all');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { startDate, endDate };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Her iki endpoint'ten paralel veri çek
      const [deskRes, bayiRes] = await Promise.all([
        apiClient.get('/desk/submitted', { params }),
        apiClient.get('/bayi-dolum/submitted', { params })
      ]);

      // Birleştir ve tip ekle
      const allRecords: CombinedRecord[] = [
        ...(deskRes.data.data || []).map((r: DeskRecord) => ({ ...r, recordType: 'desk' as const })),
        ...(bayiRes.data.data || []).map((r: BayiDolumRecord) => ({ ...r, recordType: 'bayi' as const }))
      ];

      // Tarihe göre sırala (en yeni önce)
      allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Tip filtresine göre filtrele
      const filtered = typeFilter === 'all'
        ? allRecords
        : allRecords.filter(r => r.recordType === typeFilter);

      setRecords(filtered);
    } catch (error) {
      if (axios.isAxiosError(error) && (error.code === 'ERR_NETWORK' || error.response?.status === 404)) {
        setRecords([]);
      } else {
        alert(getErrorMessage(error, 'Kayıtlar yüklenirken hata oluştu.'));
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter, typeFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleReview = async (recordId: string, action: 'approve' | 'reject' | 'revise') => {
    if (!window.confirm(`Bu kaydı ${action === 'approve' ? 'onaylamak' : action === 'revise' ? 'revize etmek' : 'reddetmek'} istediğinize emin misiniz?`)) {
      return;
    }

    try {
      // Kayıt tipine göre doğru servisi kullan
      if (selectedRecord?.recordType === 'desk') {
        await deskService.review(recordId, action, reviewNotes || undefined);
      } else {
        await bayiDolumService.review(recordId, action, reviewNotes || undefined);
      }
      
      alert(`Kayıt başarıyla ${action === 'approve' ? 'onaylandı' : action === 'revise' ? 'revize edildi' : 'reddedildi'}!`);
      setReviewNotes('');
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      alert(getErrorMessage(error, 'İşlem başarısız oldu!'));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending_revision: 'bg-yellow-100 text-yellow-800',
      revised: 'bg-orange-100 text-orange-800',
    };
    const icons = {
      submitted: <Clock className="w-4 h-4 mr-1" />,
      approved: <CheckCircle className="w-4 h-4 mr-1" />,
      rejected: <XCircle className="w-4 h-4 mr-1" />,
      pending_revision: <RefreshCw className="w-4 h-4 mr-1" />,
      revised: <CheckCircle className="w-4 h-4 mr-1" />,
    };
    const labels = {
      submitted: 'Sorumluya Teslim Edildi',
      approved: 'Onaylandı',
      rejected: 'Reddedildi',
      pending_revision: 'Revize Edilecek',
      revised: 'Revize Edildi',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-6">Sorumluya Teslim Edilen Bilgiler</h1>

        {/* Filtre */}
        <Card title="Filtrele" className="mb-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                label="Başlangıç Tarihi"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="Bitiş Tarihi"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İşlem Tipi
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as 'all' | 'desk' | 'bayi')}
                >
                  <option value="all">Tümü</option>
                  <option value="desk">Desk</option>
                  <option value="bayi">Bayi Dolum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tümü</option>
                  <option value="submitted">Sorumluya Teslim Edildi</option>
                  <option value="pending_revision">Revize Edilecek</option>
                  <option value="revised">Revize Edildi</option>
                  <option value="approved">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={fetchRecords} disabled={loading}>
                {loading ? 'Yükleniyor...' : 'Ara'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Kayıtlar Listesi */}
        <Card title="Teslim Edilen Kayıtlar">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Kayıt bulunamadı.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tip</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tarih</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Toplam Satış</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Kredi Kartı</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Nakit</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Fark</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Durum</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          record.recordType === 'desk' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {record.recordType === 'desk' ? 'DESK' : 'BAYİ DOLUM'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          {new Date(record.date).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-blue-600">
                        ₺{record.totals.totalSales.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-orange-600">
                        ₺{record.totals.totalCreditCard.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        ₺{record.totals.totalCash.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        record.totals.difference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₺{record.totals.difference.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedRecord(record)}
                        >
                          Detay
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Detay Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                  <h2 className="text-lg md:text-2xl font-bold">
                    {selectedRecord.recordType === 'desk' ? 'Desk' : 'Bayi Dolum'} Kayıt Detayı - {new Date(selectedRecord.date).toLocaleDateString('tr-TR')}
                  </h2>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Ürün Satışları - Desk için */}
                  {selectedRecord.recordType === 'desk' && 'indirimliKart' in selectedRecord.products && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Ürün Satışları</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Dolum</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.dolum}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Tam Kart</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.tamKart}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">İndirimli Kart</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.indirimliKart}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Serbest Kart</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.serbestKart}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Serbest Vize</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.serbestVize}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">İndirimli Vize</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.indirimliVize}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Kart Kılıfı</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.kartKilifi}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ürün Satışları - Bayi Dolum için */}
                  {selectedRecord.recordType === 'bayi' && 'bayiDolum' in selectedRecord.products && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Ürün Satışları</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Bayi Dolum</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.bayiDolum}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Bayi Tam Kart</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.bayiTamKart}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Bayi Kart Kılıfı</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.bayiKartKilifi}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Pos Rulosu</p>
                          <p className="text-lg font-semibold">{selectedRecord.products.posRulosu}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ödeme Dağılımı - Desk için */}
                  {selectedRecord.recordType === 'desk' && 'vize' in selectedRecord.categoryCreditCards && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Ödeme Dağılımı</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-orange-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Dolum KK</p>
                          <p className="text-lg font-semibold text-orange-600">₺{selectedRecord.categoryCreditCards.dolum.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Kart KK</p>
                          <p className="text-lg font-semibold text-orange-600">₺{selectedRecord.categoryCreditCards.kart.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Vize KK</p>
                          <p className="text-lg font-semibold text-orange-600">₺{selectedRecord.categoryCreditCards.vize.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Kart Kılıfı KK</p>
                          <p className="text-lg font-semibold text-orange-600">₺{selectedRecord.categoryCreditCards.kartKilifi.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ödeme Dağılımı - Bayi Dolum için */}
                  {selectedRecord.recordType === 'bayi' && !('vize' in selectedRecord.categoryCreditCards) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Ödeme Dağılımı</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-orange-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Dolum KK</p>
                          <p className="text-lg font-semibold text-orange-600">₺{selectedRecord.categoryCreditCards.dolum.toFixed(2)}</p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <p className="text-sm text-gray-600">Kart KK</p>
                          <p className="text-lg font-semibold text-orange-600">₺{selectedRecord.categoryCreditCards.kart.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hesaplamalar */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Hesaplamalar</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Günbaşı Nakit</p>
                        <p className="text-lg font-semibold text-blue-600">₺{selectedRecord.payments.gunbasiNakit.toFixed(2)}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Bankaya Gönderilen</p>
                        <p className="text-lg font-semibold text-blue-600">₺{selectedRecord.payments.bankayaGonderilen.toFixed(2)}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm text-gray-600">Ertesi Güne Bırakılan</p>
                        <p className="text-lg font-semibold text-blue-600">₺{selectedRecord.payments.ertesiGuneBirakilan.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Banknot/Kupür Bazlı Para Sayımı */}
                  {selectedRecord.banknotes && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Banknot/Kupür Bazlı Para Sayımı</h3>

                      {/* DOLUM Kupürleri */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-blue-700 mb-2">DOLUM</h4>
                        {selectedRecord.banknotes.dolum && Object.values(selectedRecord.banknotes.dolum).some(v => v > 0) ? (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {selectedRecord.banknotes.dolum.b200 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">200 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.dolum.b200} × 200 = ₺{(selectedRecord.banknotes.dolum.b200 * 200).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.dolum.b100 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">100 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.dolum.b100} × 100 = ₺{(selectedRecord.banknotes.dolum.b100 * 100).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.dolum.b50 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">50 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.dolum.b50} × 50 = ₺{(selectedRecord.banknotes.dolum.b50 * 50).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.dolum.b20 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">20 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.dolum.b20} × 20 = ₺{(selectedRecord.banknotes.dolum.b20 * 20).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.dolum.b10 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">10 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.dolum.b10} × 10 = ₺{(selectedRecord.banknotes.dolum.b10 * 10).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.dolum.b5 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">5 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.dolum.b5} × 5 = ₺{(selectedRecord.banknotes.dolum.b5 * 5).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.dolum.c1 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">1 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.dolum.c1} × 1 = ₺{(selectedRecord.banknotes.dolum.c1 * 1).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.dolum.c050 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">50 Kr: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.dolum.c050} × 0.50 = ₺{(selectedRecord.banknotes.dolum.c050 * 0.50).toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 pt-2 border-t border-blue-300 text-right">
                              <span className="font-bold text-blue-700">Toplam: ₺{(
                                (selectedRecord.banknotes.dolum.b200 || 0) * 200 +
                                (selectedRecord.banknotes.dolum.b100 || 0) * 100 +
                                (selectedRecord.banknotes.dolum.b50 || 0) * 50 +
                                (selectedRecord.banknotes.dolum.b20 || 0) * 20 +
                                (selectedRecord.banknotes.dolum.b10 || 0) * 10 +
                                (selectedRecord.banknotes.dolum.b5 || 0) * 5 +
                                (selectedRecord.banknotes.dolum.c1 || 0) * 1 +
                                (selectedRecord.banknotes.dolum.c050 || 0) * 0.50
                              ).toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Kupür verisi yok</p>
                        )}
                      </div>

                      {/* KART Kupürleri */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-purple-700 mb-2">KART</h4>
                        {selectedRecord.banknotes.kart && Object.values(selectedRecord.banknotes.kart).some(v => v > 0) ? (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {selectedRecord.banknotes.kart.b200 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">200 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.kart.b200} × 200 = ₺{(selectedRecord.banknotes.kart.b200 * 200).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.kart.b100 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">100 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.kart.b100} × 100 = ₺{(selectedRecord.banknotes.kart.b100 * 100).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.kart.b50 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">50 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.kart.b50} × 50 = ₺{(selectedRecord.banknotes.kart.b50 * 50).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.kart.b20 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">20 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.kart.b20} × 20 = ₺{(selectedRecord.banknotes.kart.b20 * 20).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.kart.b10 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">10 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.kart.b10} × 10 = ₺{(selectedRecord.banknotes.kart.b10 * 10).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.kart.b5 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">5 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.kart.b5} × 5 = ₺{(selectedRecord.banknotes.kart.b5 * 5).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.kart.c1 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">1 TL: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.kart.c1} × 1 = ₺{(selectedRecord.banknotes.kart.c1 * 1).toFixed(2)}</span>
                                </div>
                              )}
                              {selectedRecord.banknotes.kart.c050 > 0 && (
                                <div className="bg-white p-2 rounded border">
                                  <span className="text-gray-600">50 Kr: </span>
                                  <span className="font-semibold">{selectedRecord.banknotes.kart.c050} × 0.50 = ₺{(selectedRecord.banknotes.kart.c050 * 0.50).toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 pt-2 border-t border-purple-300 text-right">
                              <span className="font-bold text-purple-700">Toplam: ₺{(
                                (selectedRecord.banknotes.kart.b200 || 0) * 200 +
                                (selectedRecord.banknotes.kart.b100 || 0) * 100 +
                                (selectedRecord.banknotes.kart.b50 || 0) * 50 +
                                (selectedRecord.banknotes.kart.b20 || 0) * 20 +
                                (selectedRecord.banknotes.kart.b10 || 0) * 10 +
                                (selectedRecord.banknotes.kart.b5 || 0) * 5 +
                                (selectedRecord.banknotes.kart.c1 || 0) * 1 +
                                (selectedRecord.banknotes.kart.c050 || 0) * 0.50
                              ).toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Kupür verisi yok</p>
                        )}
                      </div>

                      {/* VİZE Kupürleri (sadece Desk kayıtlarında) */}
                      {selectedRecord.recordType === 'desk' && 'vize' in selectedRecord.banknotes && selectedRecord.banknotes.vize && (
                        <div className="mb-4">
                          <h4 className="text-sm font-bold text-orange-700 mb-2">VİZE</h4>
                          {Object.values(selectedRecord.banknotes.vize).some(v => v > 0) ? (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                {selectedRecord.banknotes.vize.b200 > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-gray-600">200 TL: </span>
                                    <span className="font-semibold">{selectedRecord.banknotes.vize.b200} × 200 = ₺{(selectedRecord.banknotes.vize.b200 * 200).toFixed(2)}</span>
                                  </div>
                                )}
                                {selectedRecord.banknotes.vize.b100 > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-gray-600">100 TL: </span>
                                    <span className="font-semibold">{selectedRecord.banknotes.vize.b100} × 100 = ₺{(selectedRecord.banknotes.vize.b100 * 100).toFixed(2)}</span>
                                  </div>
                                )}
                                {selectedRecord.banknotes.vize.b50 > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-gray-600">50  TL: </span>
                                    <span className="font-semibold">{selectedRecord.banknotes.vize.b50} × 50 = ₺{(selectedRecord.banknotes.vize.b50 * 50).toFixed(2)}</span>
                                  </div>
                                )}
                                {selectedRecord.banknotes.vize.b20 > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-gray-600">20 TL: </span>
                                    <span className="font-semibold">{selectedRecord.banknotes.vize.b20} × 20 = ₺{(selectedRecord.banknotes.vize.b20 * 20).toFixed(2)}</span>
                                  </div>
                                )}
                                {selectedRecord.banknotes.vize.b10 > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-gray-600">10 TL: </span>
                                    <span className="font-semibold">{selectedRecord.banknotes.vize.b10} × 10 = ₺{(selectedRecord.banknotes.vize.b10 * 10).toFixed(2)}</span>
                                  </div>
                                )}
                                {selectedRecord.banknotes.vize.b5 > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-gray-600">5 TL: </span>
                                    <span className="font-semibold">{selectedRecord.banknotes.vize.b5} × 5 = ₺{(selectedRecord.banknotes.vize.b5 * 5).toFixed(2)}</span>
                                  </div>
                                )}
                                {selectedRecord.banknotes.vize.c1 > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-gray-600">1 TL: </span>
                                    <span className="font-semibold">{selectedRecord.banknotes.vize.c1} × 1 = ₺{(selectedRecord.banknotes.vize.c1 * 1).toFixed(2)}</span>
                                  </div>
                                )}
                                {selectedRecord.banknotes.vize.c050 > 0 && (
                                  <div className="bg-white p-2 rounded border">
                                    <span className="text-gray-600">50 Kr: </span>
                                    <span className="font-semibold">{selectedRecord.banknotes.vize.c050} × 0.50 = ₺{(selectedRecord.banknotes.vize.c050 * 0.50).toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 pt-2 border-t border-orange-300 text-right">
                                <span className="font-bold text-orange-700">Toplam: ₺{(
                                  (selectedRecord.banknotes.vize.b200 || 0) * 200 +
                                  (selectedRecord.banknotes.vize.b100 || 0) * 100 +
                                  (selectedRecord.banknotes.vize.b50 || 0) * 50 +
                                  (selectedRecord.banknotes.vize.b20 || 0) * 20 +
                                  (selectedRecord.banknotes.vize.b10 || 0) * 10 +
                                  (selectedRecord.banknotes.vize.b5 || 0) * 5 +
                                  (selectedRecord.banknotes.vize.c1 || 0) * 1 +
                                  (selectedRecord.banknotes.vize.c050 || 0) * 0.50
                                ).toFixed(2)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">Kupür verisi yok</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Toplamlar */}
                  <div className="border-t-2 border-gray-300 pt-4">
                    <h3 className="text-lg font-semibold mb-3">Toplamlar</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-blue-100 p-4 rounded">
                        <p className="text-sm text-gray-700">Toplam Satış</p>
                        <p className="text-lg md:text-2xl font-bold text-blue-700">₺{selectedRecord.totals.totalSales.toFixed(2)}</p>
                      </div>
                      <div className="bg-orange-100 p-4 rounded">
                        <p className="text-sm text-gray-700">Kredi Kartı</p>
                        <p className="text-lg md:text-2xl font-bold text-orange-700">₺{selectedRecord.totals.totalCreditCard.toFixed(2)}</p>
                      </div>
                      <div className="bg-green-100 p-4 rounded">
                        <p className="text-sm text-gray-700">Nakit</p>
                        <p className="text-lg md:text-2xl font-bold text-green-700">₺{selectedRecord.totals.totalCash.toFixed(2)}</p>
                      </div>
                      <div className="bg-purple-100 p-4 rounded">
                        <p className="text-sm text-gray-700">Kasada Kalan</p>
                        <p className="text-lg md:text-2xl font-bold text-purple-700">₺{selectedRecord.totals.cashInRegister.toFixed(2)}</p>
                      </div>
                      <div className={`p-4 rounded ${selectedRecord.totals.difference >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                        <p className="text-sm text-gray-700">Fark</p>
                        <p className={`text-lg md:text-2xl font-bold ${selectedRecord.totals.difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          ₺{selectedRecord.totals.difference.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Durum */}
                  <div className="border-t-2 border-gray-300 pt-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Teslim Eden</p>
                        <p className="text-lg font-semibold">{selectedRecord.submittedBy}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Teslim Tarihi</p>
                        <p className="text-lg font-semibold">
                          {new Date(selectedRecord.submittedAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(selectedRecord.status)}
                      </div>
                    </div>
                  </div>

                  {/* Review Bilgileri */}
                  {selectedRecord.reviewedByEmail && (
                    <div className="border-t-2 border-gray-300 pt-4 bg-gray-50 p-4 rounded">
                      <h3 className="text-lg font-semibold mb-3">İnceleme Bilgileri</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">İnceleyen Kişi</p>
                          <p className="text-base font-medium">{selectedRecord.reviewedByEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rol</p>
                          <p className="text-base font-medium">{selectedRecord.reviewedByRole === 'admin' ? 'Admin' : selectedRecord.reviewedByRole === 'responsible' ? 'Sorumlu' : 'Supervisor'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Aksiyon</p>
                          <p className="text-base font-medium">
                            {selectedRecord.reviewAction === 'approve' ? 'Onaylandı' : selectedRecord.reviewAction === 'revise' ? 'Revize Edildi' : 'Reddedildi'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tarih</p>
                          <p className="text-base font-medium">
                            {selectedRecord.reviewedAt ? new Date(selectedRecord.reviewedAt).toLocaleString('tr-TR') : '-'}
                          </p>
                        </div>
                        {selectedRecord.reviewNotes && (
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">Not</p>
                            <p className="text-base font-medium">{selectedRecord.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Review Butonları - Sadece admin ve responsible için, status submitted veya revised ise */}
                  {user && ['admin', 'responsible'].includes(user.role) && (selectedRecord.status === 'submitted' || selectedRecord.status === 'revised') && (
                    <div className="border-t-2 border-gray-300 pt-4">
                      <h3 className="text-lg font-semibold mb-3">Değerlendirme</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notlarınız (Opsiyonel)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={3}
                          placeholder="Notlarınızı buraya yazın..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleReview(selectedRecord.id, 'approve')}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                        >
                          <ThumbsUp className="w-5 h-5" />
                          Onayla
                        </button>
                        <button
                          onClick={() => handleReview(selectedRecord.id, 'revise')}
                          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                        >
                          <RefreshCw className="w-5 h-5" />
                          Revize
                        </button>
                        <button
                          onClick={() => handleReview(selectedRecord.id, 'reject')}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                        >
                          <ThumbsDown className="w-5 h-5" />
                          Reddet
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="secondary" onClick={() => {
                    setSelectedRecord(null);
                    setReviewNotes('');
                  }}>
                    Kapat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
