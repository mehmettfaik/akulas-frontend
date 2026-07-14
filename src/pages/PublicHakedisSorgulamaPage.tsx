import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LogOut, CheckCircle, Search, Calendar as CalendarIcon } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import axios from 'axios';
import { getErrorMessage } from '../utils/errorHandler';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import type { VehicleReportResponse } from '../types';

export const PublicHakedisSorgulamaPage: React.FC = () => {
  const [plate, setPlate] = useState('');
  const [taxOrTcNo, setTaxOrTcNo] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<{ plate: string; owner: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleReport, setVehicleReport] = useState<VehicleReportResponse | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !taxOrTcNo) {
      setMessage({ type: 'error', text: 'Lütfen plaka ve Vergi/T.C. Kimlik No giriniz.' });
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      const res = await axios.post(`${API_BASE_URL}/hakedis/verify`, { plate, taxOrTcNo });
      if (res.data.data.token) {
        setToken(res.data.data.token);
        setVehicleInfo(res.data.data.vehicle);
        // Do not auto-fetch here, wait for user to click Search
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Doğrulama başarısız.') });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;
    
    try {
      setLoading(true);
      setMessage(null);
      const res = await axios.get(`${API_BASE_URL}/hakedis/public`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }
      });
      setVehicleReport(res.data.data || null);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Kayıtlar getirilemedi.') });
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setVehicleInfo(null);
    setVehicleReport(null);
    setPlate('');
    setTaxOrTcNo('');
    setMessage(null);
  };

  const setQuickDate = (type: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'today') {
      // defaults to today
    } else if (type === 'yesterday') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (type === 'thisWeek') {
      start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
    } else if (type === 'lastWeek') {
      start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1) - 7);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (type === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AKULAS</span>
          </div>
          <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Personel Girişi
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {!token ? (
            <Card title="Hakediş Sorgulama" className="shadow-lg max-w-md mx-auto">
              <p className="text-gray-600 mb-6 text-sm">
                Lütfen aracınızın plakasını ve vergi/T.C. kimlik numarasını girerek doğrulama yapınız.
              </p>
              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  label="Plaka"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="34 ABC 123"
                  required
                />
                <Input
                  label="Vergi / T.C. Kimlik No"
                  value={taxOrTcNo}
                  onChange={(e) => setTaxOrTcNo(e.target.value)}
                  placeholder="12345678901"
                  required
                />
                {message && (
                  <div className={`p-3 text-sm rounded ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {message.text}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Doğrulanıyor...' : 'Sorgula'}
                </Button>
              </form>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{vehicleInfo?.plate}</h2>
                    <p className="text-sm text-gray-500">{vehicleInfo?.owner}</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={handleLogout} className="shrink-0 text-gray-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış Yap
                </Button>
              </div>

              {/* Date Filter Card */}
              <Card title="Tarih Filtresi" className="shadow-sm border-0">
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setQuickDate('today')} type="button">Bugün</Button>
                    <Button variant="secondary" size="sm" onClick={() => setQuickDate('yesterday')} type="button">Dün</Button>
                    <Button variant="secondary" size="sm" onClick={() => setQuickDate('thisWeek')} type="button">Bu Hafta</Button>
                    <Button variant="secondary" size="sm" onClick={() => setQuickDate('lastWeek')} type="button">Geçen Hafta</Button>
                    <Button variant="secondary" size="sm" onClick={() => setQuickDate('thisMonth')} type="button">Bu Ay</Button>
                  </div>
                  
                  <form onSubmit={fetchRecords} className="flex flex-col md:flex-row items-end gap-4">
                    <div className="w-full md:w-1/3">
                      <Input
                        label="Başlangıç Tarihi"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-full md:w-1/3">
                      <Input
                        label="Bitiş Tarihi"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full md:w-1/3" disabled={loading}>
                      <Search className="w-5 h-5 mr-2" />
                      {loading ? 'Aranıyor...' : 'Ara'}
                    </Button>
                  </form>
                </div>
              </Card>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Vehicle Report Results */}
              {vehicleReport && (
                <Card title="Araç Raporu" className="shadow-lg border-0 ring-1 ring-gray-100">
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                      <p className="text-sm font-medium text-blue-600 mb-1">Araç Bilgisi</p>
                      <p className="text-lg font-bold text-gray-900">
                        {vehicleReport.vehicle.vehicleNumber} - {vehicleReport.vehicle.plateNumber}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{vehicleReport.vehicle.routeName}</p>
                    </div>
                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                      <p className="text-sm font-medium text-green-600 mb-1">Toplam Hakediş</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(vehicleReport.summary.totalAmount)}
                      </p>
                    </div>
                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                      <p className="text-sm font-medium text-purple-600 mb-1">Hat Bazlı</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(vehicleReport.summary.totalRouteAmount)}
                      </p>
                    </div>
                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                      <p className="text-sm font-medium text-orange-600 mb-1">Kredi Kartı</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {formatCurrency(vehicleReport.summary.totalVehicleAmount)}
                      </p>
                    </div>
                  </div>
                  
                  {vehicleReport.reports.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">Bu tarih aralığında kayıt bulunamadı.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="py-3 px-4 text-xs font-semibold tracking-wide text-gray-500 uppercase">Tarih</th>
                            <th className="py-3 px-4 text-xs font-semibold tracking-wide text-gray-500 uppercase">Hakediş Tipi</th>
                            <th className="py-3 px-4 text-xs font-semibold tracking-wide text-gray-500 uppercase text-right">Hat Bazlı</th>
                            <th className="py-3 px-4 text-xs font-semibold tracking-wide text-gray-500 uppercase text-right">Kredi Kartı</th>
                            <th className="py-3 px-4 text-xs font-semibold tracking-wide text-gray-500 uppercase text-right">Toplam</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {vehicleReport.reports.map((report, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 px-4 font-medium text-gray-900">
                                {new Date(report.date).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {report.types.map(type => (
                                    <span key={type} className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      type === 'KREDI_KARTI' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {type === 'KREDI_KARTI' ? 'Kredi Kartı' : 'Hat Bazlı'}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                {formatCurrency(report.routeAmount)}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                {formatCurrency(report.vehicleAmount)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                {formatCurrency(report.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
