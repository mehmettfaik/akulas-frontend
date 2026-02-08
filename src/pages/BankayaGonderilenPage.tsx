import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Calendar, TrendingUp, ThumbsUp, ThumbsDown, RefreshCw, FileSpreadsheet, Eye } from 'lucide-react';
import { deskService } from '../services/deskService';
import { bayiDolumService } from '../services/bayiDolumService';
import { useAuth } from '../context/AuthContext';
import { generatePusulaExcel, generateBulkPusulaExcel } from '../utils/excelExport';
import type { DeskRecord, BayiDolumRecord } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

interface BanknoteDenominations {
  b200: number; b100: number; b50: number; b20: number;
  b10: number; b5: number; c1: number; c050: number;
}

interface BankSentRecord {
  id: string;
  date: string;
  type: 'desk' | 'bayi';
  status: string;
  bankSentCash: {
    dolum?: number;
    kart?: number;
    vize?: number;
    totalSent?: number;
  };
  banknotes?: {
    dolum?: BanknoteDenominations;
    kart?: BanknoteDenominations;
    vize?: BanknoteDenominations;
  };
  submittedByEmail: string;
  submittedAt: string;
  reviewedByEmail?: string;
  reviewedByRole?: string;
  reviewAction?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Beklemede', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Onaylandı', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-800' },
  pending_revision: { label: 'Revize Bekliyor', className: 'bg-orange-100 text-orange-800' },
  revised: { label: 'Revize Edildi', className: 'bg-blue-100 text-blue-800' },
};

const DENOMINATION_VALUES: Record<string, number> = {
  b200: 200, b100: 100, b50: 50, b20: 20, b10: 10, b5: 5, c1: 1, c050: 0.50
};

const DENOMINATION_LABELS: Record<string, string> = {
  b200: '200 TL', b100: '100 TL', b50: '50 TL', b20: '20 TL',
  b10: '10 TL', b5: '5 TL', c1: '1 TL', c050: '50 Kuruş'
};

const DENOM_KEYS = ['b200', 'b100', 'b50', 'b20', 'b10', 'b5', 'c1', 'c050'] as const;

export const BankayaGonderilenPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<BankSentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'desk' | 'bayi'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<BankSentRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const isReviewer = user && ['admin', 'responsible'].includes(user.role);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [deskResponse, bayiResponse] = await Promise.all([
        deskService.getSubmitted(),
        bayiDolumService.getSubmitted()
      ]);

      const deskRecords: BankSentRecord[] = (deskResponse.data || [])
        .filter((record: DeskRecord) => record.bankSentCash &&
          ((record.bankSentCash.dolum || 0) > 0 || (record.bankSentCash.kart || 0) > 0 || (record.bankSentCash.vize || 0) > 0))
        .map((record: DeskRecord) => ({
          id: record.id,
          date: record.date,
          type: 'desk' as const,
          status: record.status,
          bankSentCash: record.bankSentCash || {},
          banknotes: record.banknotes,
          submittedByEmail: record.submittedByEmail || record.submittedBy,
          submittedAt: record.submittedAt,
          reviewedByEmail: record.reviewedByEmail,
          reviewedByRole: record.reviewedByRole,
          reviewAction: record.reviewAction,
          reviewNotes: record.reviewNotes,
          reviewedAt: record.reviewedAt,
        }));

      const bayiRecords: BankSentRecord[] = (bayiResponse.data || [])
        .filter((record: BayiDolumRecord) => record.bankSentCash &&
          ((record.bankSentCash.dolum || 0) > 0 || (record.bankSentCash.kart || 0) > 0))
        .map((record: BayiDolumRecord) => ({
          id: record.id,
          date: record.date,
          type: 'bayi' as const,
          status: record.status,
          bankSentCash: record.bankSentCash || {},
          banknotes: record.banknotes,
          submittedByEmail: record.submittedByEmail || record.submittedBy,
          submittedAt: record.submittedAt,
          reviewedByEmail: record.reviewedByEmail,
          reviewedByRole: record.reviewedByRole,
          reviewAction: record.reviewAction,
          reviewNotes: record.reviewNotes,
          reviewedAt: record.reviewedAt,
        }));

      const allRecords = [...deskRecords, ...bayiRecords].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setRecords(allRecords);
    } catch (error) {
      alert(getErrorMessage(error, 'Kayıtlar yüklenirken hata oluştu.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (recordId: string, action: 'approve' | 'reject' | 'revise') => {
    if (!selectedRecord) return;

    const actionLabels = { approve: 'onaylamak', reject: 'reddetmek', revise: 'revize etmek' };
    if (!window.confirm(`Bu kaydı ${actionLabels[action]} istediğinize emin misiniz?`)) return;

    setReviewLoading(true);
    try {
      if (selectedRecord.type === 'desk') {
        await deskService.review(recordId, action, reviewNotes || undefined);
      } else {
        await bayiDolumService.review(recordId, action, reviewNotes || undefined);
      }

      const statusMap: Record<string, string> = {
        approve: 'approved', reject: 'rejected', revise: 'pending_revision'
      };

      setRecords(prev => prev.map(r =>
        r.id === recordId ? { ...r, status: statusMap[action] } : r
      ));

      const msgMap = { approve: 'onaylandı', reject: 'reddedildi', revise: 'revize için geri gönderildi' };
      alert(`Kayıt başarıyla ${msgMap[action]}!`);
      setReviewNotes('');
      setSelectedRecord(null);
    } catch (error) {
      alert(getErrorMessage(error, 'İşlem sırasında bir hata oluştu!'));
    } finally {
      setReviewLoading(false);
    }
  };

  // Filtreleme
  const filteredRecords = records.filter(record => {
    if (filterType !== 'all' && record.type !== filterType) return false;
    if (startDate && new Date(record.date) < new Date(startDate)) return false;
    if (endDate && new Date(record.date) > new Date(endDate)) return false;
    return true;
  });

  // Toplam hesaplama
  const calculateTotals = () => {
    let totalDolum = 0, totalKart = 0, totalVize = 0;
    filteredRecords.forEach(record => {
      totalDolum += record.bankSentCash.dolum || 0;
      totalKart += record.bankSentCash.kart || 0;
      totalVize += record.bankSentCash.vize || 0;
    });
    return { dolum: totalDolum, kart: totalKart, vize: totalVize, total: totalDolum + totalKart + totalVize };
  };

  const totals = calculateTotals();

  // Kupür tablosu render
  const renderBanknoteTable = (label: string, banknoteData: BanknoteDenominations | undefined, bankSentAmount: number, colorClass: string) => {
    if (!banknoteData) return null;

    const hasData = DENOM_KEYS.some(k => (banknoteData[k] || 0) > 0);

    return (
      <div className="mb-4">
        <h4 className={`text-sm font-bold ${colorClass} mb-2`}>{label}</h4>
        {hasData ? (
          <table className="w-full text-sm border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-1.5 text-left">Kupür</th>
                <th className="px-3 py-1.5 text-right">Adet</th>
                <th className="px-3 py-1.5 text-right">Birim</th>
                <th className="px-3 py-1.5 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {DENOM_KEYS.map(denom => {
                const count = banknoteData[denom] || 0;
                if (count === 0) return null;
                const value = DENOMINATION_VALUES[denom];
                return (
                  <tr key={denom} className="border-t border-gray-100">
                    <td className="px-3 py-1.5">{DENOMINATION_LABELS[denom]}</td>
                    <td className="px-3 py-1.5 text-right">{count}</td>
                    <td className="px-3 py-1.5 text-right">₺{value.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-medium">₺{(count * value).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td colSpan={3} className="px-3 py-1.5">Kupür Toplamı</td>
                <td className="px-3 py-1.5 text-right">
                  ₺{DENOM_KEYS.reduce((sum, k) => sum + (banknoteData[k] || 0) * DENOMINATION_VALUES[k], 0).toFixed(2)}
                </td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={3} className="px-3 py-1.5">Bankaya Gönderilen</td>
                <td className={`px-3 py-1.5 text-right ${colorClass}`}>₺{bankSentAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="text-sm text-gray-400 italic">Kupür verisi yok</p>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Bankaya Gönderilen</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isReviewer && filteredRecords.length > 0 && (
              <button
                onClick={() => generateBulkPusulaExcel(filteredRecords)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Pusula Çıkar (Excel)
              </button>
            )}
            <div className="flex items-center text-lg font-semibold text-gray-700 bg-white px-4 py-2 rounded-lg shadow">
              Toplam: ₺{totals.total.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'desk' | 'bayi')}
              >
                <option value="all">Tümü</option>
                <option value="desk">Desk İşlemleri</option>
                <option value="bayi">Bayi Dolum</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* İstatistikler */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">DOLUM</p>
                <p className="text-lg md:text-2xl font-bold text-blue-600">₺{totals.dolum.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">KART</p>
                <p className="text-lg md:text-2xl font-bold text-purple-600">₺{totals.kart.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          {totals.vize > 0 && (
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">VİZE</p>
                  <p className="text-lg md:text-2xl font-bold text-orange-600">₺{totals.vize.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </Card>
          )}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">TOPLAM</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">₺{totals.total.toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Kayıt Listesi */}
        <Card title={`Bankaya Gönderilen Kayıtlar (${filteredRecords.length})`}>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Yükleniyor...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-700 font-medium mb-2">Henüz bankaya gönderilen kayıt bulunmamaktadır.</p>
              <div className="text-sm text-gray-500 mt-4 space-y-1">
                <p>Bankaya gönderilen kayıtların burada görünmesi için:</p>
                <ul className="list-disc list-inside text-left inline-block mt-2">
                  <li>Desk İşlemleri veya Bayi Dolum sayfasında kupür sayımını doldurun</li>
                  <li>"Bankaya Gönder" butonuna tıklayarak tutarı işaretleyin</li>
                  <li><strong>"Sorumluya Teslim Et"</strong> butonuna tıklayarak kaydı gönderin</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tarih</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tip</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Durum</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Dolum</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Kart</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Vize</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Toplam</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Gönderen</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const recordTotal =
                      (record.bankSentCash.dolum || 0) +
                      (record.bankSentCash.kart || 0) +
                      (record.bankSentCash.vize || 0);

                    const statusInfo = statusLabels[record.status] || { label: record.status, className: 'bg-gray-100 text-gray-800' };

                    return (
                      <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm font-medium">
                              {new Date(record.date).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.type === 'desk'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {record.type === 'desk' ? 'Desk İşlemleri' : 'Bayi Dolum'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {record.bankSentCash.dolum ? `₺${record.bankSentCash.dolum.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {record.bankSentCash.kart ? `₺${record.bankSentCash.kart.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {record.bankSentCash.vize ? `₺${record.bankSentCash.vize.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                          ₺{recordTotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {record.submittedByEmail}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Detay
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-left text-sm">TOPLAM</td>
                    <td className="px-4 py-3 text-right text-sm text-blue-600">
                      ₺{totals.dolum.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-purple-600">
                      ₺{totals.kart.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-orange-600">
                      ₺{totals.vize.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600">
                      ₺{totals.total.toFixed(2)}
                    </td>
                    <td colSpan={2} className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {/* Detay Modal */}
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => { setSelectedRecord(null); setReviewNotes(''); }}
          title={`${selectedRecord?.type === 'desk' ? 'Desk İşlemleri' : 'Bayi Dolum'} - Bankaya Gönderilen Detay`}
          size="xl"
        >
          {selectedRecord && (
            <div className="space-y-6">
              {/* Kayıt Özeti */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Tarih</p>
                  <p className="text-sm font-semibold">{new Date(selectedRecord.date).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Durum</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${(statusLabels[selectedRecord.status] || { className: 'bg-gray-100 text-gray-800' }).className}`}>
                    {(statusLabels[selectedRecord.status] || { label: selectedRecord.status }).label}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Gönderen</p>
                  <p className="text-sm font-semibold">{selectedRecord.submittedByEmail}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Toplam Gönderilen</p>
                  <p className="text-lg font-bold text-green-600">
                    ₺{((selectedRecord.bankSentCash.dolum || 0) + (selectedRecord.bankSentCash.kart || 0) + (selectedRecord.bankSentCash.vize || 0)).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Tutar Detayları */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(selectedRecord.bankSentCash.dolum || 0) > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-blue-600 font-medium">DOLUM</p>
                    <p className="text-xl font-bold text-blue-700">₺{selectedRecord.bankSentCash.dolum?.toFixed(2)}</p>
                  </div>
                )}
                {(selectedRecord.bankSentCash.kart || 0) > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-purple-600 font-medium">KART</p>
                    <p className="text-xl font-bold text-purple-700">₺{selectedRecord.bankSentCash.kart?.toFixed(2)}</p>
                  </div>
                )}
                {(selectedRecord.bankSentCash.vize || 0) > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-orange-600 font-medium">VİZE</p>
                    <p className="text-xl font-bold text-orange-700">₺{selectedRecord.bankSentCash.vize?.toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Kupür Dökümü */}
              {selectedRecord.banknotes && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 border-b pb-2">Kupür Dökümü</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderBanknoteTable('DOLUM', selectedRecord.banknotes.dolum, selectedRecord.bankSentCash.dolum || 0, 'text-blue-700')}
                    {renderBanknoteTable('KART', selectedRecord.banknotes.kart, selectedRecord.bankSentCash.kart || 0, 'text-purple-700')}
                    {selectedRecord.type === 'desk' && renderBanknoteTable('VİZE', selectedRecord.banknotes.vize, selectedRecord.bankSentCash.vize || 0, 'text-orange-700')}
                  </div>
                </div>
              )}

              {/* Pusula Çıkar Butonu */}
              {isReviewer && (
                <div className="flex justify-end">
                  <button
                    onClick={() => generatePusulaExcel(selectedRecord)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    Pusula Çıkar (Excel)
                  </button>
                </div>
              )}

              {/* Önceki İnceleme Bilgisi */}
              {selectedRecord.reviewedByEmail && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">Önceki İnceleme</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">İnceleyen</p>
                      <p className="font-medium">{selectedRecord.reviewedByEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Rol</p>
                      <p className="font-medium capitalize">{selectedRecord.reviewedByRole}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">İşlem</p>
                      <p className="font-medium capitalize">{selectedRecord.reviewAction}</p>
                    </div>
                    {selectedRecord.reviewedAt && (
                      <div>
                        <p className="text-xs text-gray-500">Tarih</p>
                        <p className="font-medium">{new Date(selectedRecord.reviewedAt).toLocaleString('tr-TR')}</p>
                      </div>
                    )}
                  </div>
                  {selectedRecord.reviewNotes && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Not</p>
                      <p className="text-sm mt-1 bg-white p-2 rounded border">{selectedRecord.reviewNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Değerlendirme Bölümü */}
              {isReviewer && ['submitted', 'revised'].includes(selectedRecord.status) && (
                <div className="border-t-2 border-gray-300 pt-4">
                  <h3 className="text-lg font-semibold mb-3">Değerlendirme</h3>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                    rows={3}
                    placeholder="Notlarınızı buraya yazın (isteğe bağlı)..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleReview(selectedRecord.id, 'approve')}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                      disabled={reviewLoading}
                    >
                      <ThumbsUp className="w-5 h-5" />
                      Onayla
                    </button>
                    <button
                      onClick={() => handleReview(selectedRecord.id, 'revise')}
                      className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                      disabled={reviewLoading}
                    >
                      <RefreshCw className="w-5 h-5" />
                      Revize
                    </button>
                    <button
                      onClick={() => handleReview(selectedRecord.id, 'reject')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                      disabled={reviewLoading}
                    >
                      <ThumbsDown className="w-5 h-5" />
                      Reddet
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </MainLayout>
  );
};
