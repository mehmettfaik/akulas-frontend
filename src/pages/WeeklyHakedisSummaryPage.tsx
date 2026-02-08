import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { hakedisService } from '../services/hakedisService';
import type { WeeklyHakedisSummaryResponse } from '../types';
import { Download, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getErrorMessage } from '../utils/errorHandler';

export const WeeklyHakedisSummaryPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<WeeklyHakedisSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      setError('Lütfen başlangıç ve bitiş tarihlerini seçin');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await hakedisService.getWeeklyHakedisSummary(startDate, endDate);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError('Veri alınamadı');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!data) return;

    const excelData: Record<string, string | number>[] = data.vehicles.map(v => ({
      'Araç No': v.vehicleNumber,
      'Plaka': v.plateNumber,
      'Hat': v.routeName,
      'IBAN': v.iban,
      'Vergi/TC Kimlik No': v.taxId,
      'Haftalık (Hat)': v.haftalik.routeAmount,
      'Haftalık (Araç)': v.haftalik.vehicleAmount,
      'Haftalık Toplam': v.haftalik.totalAmount,
      'Kredi Kartı': v.krediKarti.totalAmount,
      'Genel Toplam': v.grandTotal
    }));

    excelData.push({
      'Araç No': '',
      'Plaka': '',
      'Hat': 'TOPLAM',
      'IBAN': '',
      'Vergi/TC Kimlik No': '',
      'Haftalık (Hat)': '',
      'Haftalık (Araç)': '',
      'Haftalık Toplam': data.summary.totalHaftalik,
      'Kredi Kartı': data.summary.totalKrediKarti,
      'Genel Toplam': data.summary.grandTotal
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Haftalık Özet');

    const fileName = `Hakedis_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Haftalık Hakediş Özeti (Banka İletimi)
          </h1>
        </div>

        {/* Tarih Filtresi */}
        <Card>
          <div className="p-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlangıç Tarihi
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bitiş Tarihi
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? 'Yükleniyor...' : 'Getir'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Hata Mesajı */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Özet Kartları */}
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card>
                <div className="p-3 md:p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Toplam Haftalık
                  </h3>
                  <p className="text-xl md:text-3xl font-bold text-gray-900">
                    {data.summary.totalHaftalik.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-3 md:p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Toplam Kredi Kartı
                  </h3>
                  <p className="text-xl md:text-3xl font-bold text-gray-900">
                    {data.summary.totalKrediKarti.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </Card>

              <Card className="bg-primary-50 border-primary-200">
                <div className="p-3 md:p-6">
                  <h3 className="text-sm font-medium text-primary-700 mb-2">
                    Genel Toplam
                  </h3>
                  <p className="text-xl md:text-3xl font-bold text-primary-900">
                    {data.summary.grandTotal.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-3 md:p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Araç Sayısı
                  </h3>
                  <p className="text-xl md:text-3xl font-bold text-gray-900">
                    {data.summary.vehicleCount}
                  </p>
                </div>
              </Card>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex gap-3 print:hidden">
              <Button 
                onClick={exportToExcel}
                variant="secondary"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel'e Aktar
              </Button>
            </div>

            {/* Araç Tablosu */}
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Araç No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plaka
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IBAN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vergi/TC Kimlik No
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Haftalık (Hat)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        KK (Araç)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Haftalık Toplam
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kredi Kartı
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Genel Toplam
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.vehicles.map((vehicle) => (
                      <tr key={vehicle.vehicleNumber} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {vehicle.vehicleNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.plateNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.routeName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {vehicle.iban}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {vehicle.taxId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-mono">
                          {vehicle.haftalik.routeAmount.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-mono">
                          {vehicle.haftalik.vehicleAmount.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold font-mono">
                          {vehicle.haftalik.totalAmount.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-mono">
                          {vehicle.krediKarti.totalAmount.toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-bold font-mono bg-yellow-50">
                          {vehicle.grandTotal.toLocaleString('tr-TR')} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr className="font-bold">
                      <td colSpan={7} className="px-6 py-4 text-sm text-gray-900">
                        TOPLAM
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-mono">
                        {data.summary.totalHaftalik.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-mono">
                        {data.summary.totalKrediKarti.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-mono bg-yellow-100">
                        {data.summary.grandTotal.toLocaleString('tr-TR')} ₺
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          
          table {
            font-size: 10px;
          }
          
          .text-3xl {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </MainLayout>
  );
};
