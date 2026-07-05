import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Calendar, Search, Printer } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { generateDeskPdf, generateBayiDolumPdf, generateKioskDolumPdf } from '../utils/pdfGenerator';
import { deskService } from '../services/deskService';
import { bayiDolumService } from '../services/bayiDolumService';
import { kioskDolumService } from '../services/kioskDolumService';
import { getErrorMessage } from '../utils/errorHandler';

export const AdminIsletimFormlariPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'desk' | 'bayi' | 'kiosk'>('desk');
  const [deskRecords, setDeskRecords] = useState<any[]>([]);
  const [bayiRecords, setBayiRecords] = useState<any[]>([]);
  const [kioskRecords, setKioskRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deskRes, bayiRes, kioskRes] = await Promise.all([
        deskService.getSubmitted({ startDate, endDate }),
        bayiDolumService.getSubmitted({ startDate, endDate }),
        kioskDolumService.getSubmitted({ startDate, endDate })
      ]);
      setDeskRecords(deskRes.data || []);
      setBayiRecords(bayiRes.data || []);
      setKioskRecords(kioskRes.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate]);

  const filteredDeskRecords = deskRecords;
  const filteredBayiRecords = bayiRecords;
  const filteredKioskRecords = kioskRecords;

  const calculateSummary = (records: any[]) => {
    let totalSales = 0;
    let totalCreditCard = 0;
    let totalCash = 0;
    let difference = 0;

    records.forEach(r => {
      if (r.totals) {
        totalSales += r.totals.totalSales || 0;
        totalCreditCard += r.totals.totalCreditCard || 0;
        totalCash += r.totals.totalCash || 0;
        difference += r.totals.difference || 0;
      }
    });

    return { totalSales, totalCreditCard, totalCash, difference };
  };

  const deskSummary = calculateSummary(filteredDeskRecords);
  const bayiSummary = calculateSummary(filteredBayiRecords);
  const kioskSummary = calculateSummary(filteredKioskRecords);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Onaylandı</span>;
      case 'pending': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Bekliyor</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Reddedildi</span>;
      case 'teslim_edildi': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Bankada</span>;
      default: return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const renderTable = (records: any[], type: 'desk'|'bayi'|'kiosk') => (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50 text-gray-700 text-sm border-b">
          <th className="py-3 px-4 font-semibold">Tarih</th>
          {type === 'kiosk' && <th className="py-3 px-4 font-semibold text-left">Kiosk Adı</th>}
          <th className="py-3 px-4 font-semibold text-right">Toplam Satış</th>
          <th className="py-3 px-4 font-semibold text-right">Kredi Kartı</th>
          <th className="py-3 px-4 font-semibold text-right">Nakit</th>
          <th className="py-3 px-4 font-semibold text-right">Fark</th>
          <th className="py-3 px-4 font-semibold text-center">Durum</th>
          <th className="py-3 px-4 font-semibold text-center">İşletim Formu</th>
        </tr>
      </thead>
      <tbody>
        {records.length === 0 ? (
          <tr><td colSpan={type === 'kiosk' ? 8 : 7} className="text-center py-6 text-gray-500">Kayıt bulunamadı.</td></tr>
        ) : (
          records.map(record => (
            <tr key={record.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(record.date).toLocaleDateString('tr-TR')}
                </div>
              </td>
              {type === 'kiosk' && <td className="py-3 px-4 text-left font-medium">{record.kioskName}</td>}
              <td className="py-3 px-4 text-right">{formatCurrency(record.totals.totalSales)}</td>
              <td className="py-3 px-4 text-right text-orange-600">{formatCurrency(record.totals.totalCreditCard)}</td>
              <td className="py-3 px-4 text-right text-green-600">{formatCurrency(record.totals.totalCash)}</td>
              <td className="py-3 px-4 text-right font-medium">
                <span className={record.totals.difference < 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(record.totals.difference)}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {getStatusBadge(record.status)}
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={() => {
                    if (type === 'desk') {
                      generateDeskPdf(record);
                    } else if (type === 'bayi') {
                      generateBayiDolumPdf(record);
                    } else {
                      generateKioskDolumPdf(record);
                    }
                  }}
                  className="inline-flex items-center px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Printer className="w-3 h-3 mr-1" />
                  PDF
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">İşletim Formları</h1>
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <Search className="w-5 h-5 text-gray-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border-none focus:ring-0 text-sm" />
            <span className="text-gray-400">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border-none focus:ring-0 text-sm" />
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <button onClick={() => setActiveTab('desk')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'desk' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>Desk İşlemleri</button>
          <button onClick={() => setActiveTab('bayi')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'bayi' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>Bayi Dolum</button>
          <button onClick={() => setActiveTab('kiosk')} className={`flex-1 py-2.5 text-sm font-medium rounded-lg ${activeTab === 'kiosk' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>Kiosk Dolum</button>
        </div>

        <Card>
          {loading ? (
            <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
          ) : (
            <div className="overflow-x-auto">
              <div className="mb-4 bg-gray-50 p-4 rounded-lg flex justify-between">
                <div><strong>Kayıt Sayısı:</strong> {activeTab === 'desk' ? deskRecords.length : activeTab === 'bayi' ? bayiRecords.length : kioskRecords.length}</div>
                <div><strong>Toplam Fark:</strong> {formatCurrency(activeTab === 'desk' ? deskSummary.difference : activeTab === 'bayi' ? bayiSummary.difference : kioskSummary.difference)}</div>
              </div>
              {renderTable(activeTab === 'desk' ? filteredDeskRecords : activeTab === 'bayi' ? filteredBayiRecords : filteredKioskRecords, activeTab)}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};
