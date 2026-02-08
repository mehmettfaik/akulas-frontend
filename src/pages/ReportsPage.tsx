import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { reportService } from '../services/reportService';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle, VehicleReportResponse, RouteReportResponse, SummaryReportResponse, DateRangeReportResponse } from '../types';
import { Search } from 'lucide-react';
import { getErrorMessage } from '../utils/errorHandler';

type ReportType = 'vehicle' | 'route' | 'summary' | 'dateRange';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('vehicle');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [routeName, setRouteName] = useState('');
  const [vehicleReport, setVehicleReport] = useState<VehicleReportResponse | null>(null);
  const [routeReport, setRouteReport] = useState<RouteReportResponse | null>(null);
  const [summaryReport, setSummaryReport] = useState<SummaryReportResponse | null>(null);
  const [dateRangeReport, setDateRangeReport] = useState<DateRangeReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [routes, setRoutes] = useState<string[]>([]);

  // Araçları ve hatları yükle
  useEffect(() => {
    const fetchData = async () => {
      try {
        setVehiclesLoading(true);
        const response = await vehicleService.getAll();
        setVehicles(response.data);
        
        // Benzersiz hat isimlerini çıkar
        const uniqueRoutes = Array.from(new Set(response.data.map(v => v.routeName)));
        setRoutes(uniqueRoutes.sort());
      } catch (error) {
        setMessage({ type: 'error', text: getErrorMessage(error, 'Araç bilgileri yüklenemedi.') });
      } finally {
        setVehiclesLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setMessage(null);
    setVehicleReport(null);
    setRouteReport(null);
    setSummaryReport(null);
    setDateRangeReport(null);

    try {
      if (reportType === 'vehicle') {
        const vehicleNo = parseInt(vehicleNumber);
        if (isNaN(vehicleNo)) {
          setMessage({ type: 'error', text: 'Geçerli bir araç numarası girin!' });
          setLoading(false);
          return;
        }
        const response = await reportService.getByVehicle(vehicleNo, startDate, endDate);
        setVehicleReport(response.data);
        setMessage({ type: 'success', text: `${response.data.reports.length} kayıt bulundu.` });
      } else if (reportType === 'route') {
        if (!routeName) {
          setMessage({ type: 'error', text: 'Lütfen bir hat seçin!' });
          setLoading(false);
          return;
        }
        const response = await reportService.getByRoute(routeName, startDate, endDate);
        setRouteReport(response.data);
        setMessage({ type: 'success', text: `${response.data.reports.length} kayıt bulundu.` });
      } else if (reportType === 'summary') {
        const response = await reportService.getSummary(startDate, endDate);
        setSummaryReport(response.data);
        setMessage({ type: 'success', text: 'Özet rapor yüklendi.' });
      } else if (reportType === 'dateRange') {
        const response = await reportService.getByDateRange(startDate, endDate);
        setDateRangeReport(response.data);
        setMessage({ type: 'success', text: `${response.data.records.length} kayıt bulundu.` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-6">Raporlar</h1>

        {/* Filter Section */}
        <Card title="Filtrele">
          <div className="space-y-6">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rapor Türü
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="vehicle"
                    checked={reportType === 'vehicle'}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="mr-2 w-4 h-4 text-primary-600"
                  />
                  <span>Araç Bazlı</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="route"
                    checked={reportType === 'route'}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="mr-2 w-4 h-4 text-primary-600"
                  />
                  <span>Hat Bazlı</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="summary"
                    checked={reportType === 'summary'}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="mr-2 w-4 h-4 text-primary-600"
                  />
                  <span>Özet Rapor</span>
                </label>
                </div>
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportType === 'vehicle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Araç Numarası
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  >
                    <option value="">Araç seçiniz</option>
                    {vehiclesLoading ? (
                      <option disabled>Yükleniyor...</option>
                    ) : (
                      vehicles
                        .sort((a, b) => a.vehicleNumber - b.vehicleNumber)
                        .map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.vehicleNumber}>
                            {vehicle.vehicleNumber} - {vehicle.plateNumber} ({vehicle.routeName})
                          </option>
                        ))
                    )}
                  </select>
                </div>
              )}

              {reportType === 'route' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hat
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  >
                    <option value="">Hat seçiniz</option>
                    {routes.map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-5 h-5 mr-2" />
                {loading ? 'Aranıyor...' : 'Ara'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Message */}
        {message && (
          <div
            className={`mt-6 p-4 rounded-lg ${
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
          <Card title="Araç Raporu" className="mt-6">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Araç Bilgisi</p>
                <p className="text-lg font-bold">
                  {vehicleReport.vehicle.vehicleNumber} - {vehicleReport.vehicle.plateNumber}
                </p>
                <p className="text-sm text-gray-600">{vehicleReport.vehicle.routeName}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Toplam Hakediş</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">
                  ₺{vehicleReport.summary.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Hat Bazlı</p>
                <p className="text-lg md:text-2xl font-bold text-purple-600">
                  ₺{vehicleReport.summary.totalRouteAmount.toFixed(2)}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Kredi Kartı</p>
                <p className="text-lg md:text-2xl font-bold text-orange-600">
                  ₺{vehicleReport.summary.totalVehicleAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Hafta</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Hat Tutarı</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Kredi Kartı</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Toplam</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipler</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleReport.reports.map((report, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(report.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-600">
                        ₺{report.routeAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-orange-600">
                        ₺{report.vehicleAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">
                        ₺{report.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {report.types.map(type => (
                          <span
                            key={type}
                            className={`px-2 py-1 text-xs font-medium rounded-full mr-1 ${
                              type === 'HAFTALIK'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {type}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <th className="py-3 px-4 text-left font-bold">TOPLAM</th>
                    <th className="py-3 px-4 text-right font-bold text-purple-600">
                      ₺{vehicleReport.summary.totalRouteAmount.toFixed(2)}
                    </th>
                    <th className="py-3 px-4 text-right font-bold text-orange-600">
                      ₺{vehicleReport.summary.totalVehicleAmount.toFixed(2)}
                    </th>
                    <th className="py-3 px-4 text-right font-bold text-green-600 text-lg">
                      ₺{vehicleReport.summary.totalAmount.toFixed(2)}
                    </th>
                    <th></th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}

        {/* Route Report Results */}
        {routeReport && (
          <Card title="Hat Raporu" className="mt-6">
            <div className="mb-6">
              <h3 className="text-base md:text-xl font-bold mb-4">{routeReport.routeName} Hattı</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Toplam Hakediş</p>
                  <p className="text-lg md:text-2xl font-bold text-green-600">
                    ₺{routeReport.summary.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Hat Bazlı</p>
                  <p className="text-lg md:text-2xl font-bold text-purple-600">
                    ₺{routeReport.summary.totalRouteAmount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Kredi Kartı</p>
                  <p className="text-lg md:text-2xl font-bold text-orange-600">
                    ₺{routeReport.summary.totalVehicleAmount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Araç Sayısı</p>
                  <p className="text-lg md:text-2xl font-bold text-blue-600">
                    {routeReport.summary.vehicleCount}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Bu Hattaki Araçlar:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {routeReport.vehicles.map((vehicle) => (
                    <div key={vehicle.vehicleNumber} className="bg-white p-2 rounded border">
                      <span className="font-bold">{vehicle.vehicleNumber}</span> - {vehicle.plateNumber}
                      <br />
                      <span className="text-sm text-gray-600">{vehicle.driverName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Hafta</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Hat Tutarı</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Kredi Kartı</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Toplam</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Araç Sayısı</th>
                  </tr>
                </thead>
                <tbody>
                  {routeReport.reports.map((report, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(report.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-600">
                        ₺{report.routeAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-orange-600">
                        ₺{report.vehicleAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">
                        ₺{report.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">{report.vehicleCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <th className="py-3 px-4 text-left font-bold">TOPLAM</th>
                    <th className="py-3 px-4 text-right font-bold text-purple-600">
                      ₺{routeReport.summary.totalRouteAmount.toFixed(2)}
                    </th>
                    <th className="py-3 px-4 text-right font-bold text-orange-600">
                      ₺{routeReport.summary.totalVehicleAmount.toFixed(2)}
                    </th>
                    <th className="py-3 px-4 text-right font-bold text-green-600 text-lg">
                      ₺{routeReport.summary.totalAmount.toFixed(2)}
                    </th>
                    <th className="py-3 px-4 text-center font-bold">
                      {routeReport.summary.vehicleCount}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}

        {/* Summary Report Results */}
        {summaryReport && (
          <Card title="Özet Rapor" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-4">Genel Özet</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Kayıt</p>
                    <p className="text-lg md:text-2xl font-bold">{summaryReport.total.records}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Raporal</p>
                    <p className="text-lg md:text-2xl font-bold text-green-600">
                      ₺{summaryReport.total.raporal.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Sistem</p>
                    <p className="text-lg md:text-2xl font-bold text-purple-600">
                      ₺{summaryReport.total.sistem.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Fark</p>
                    <p className={`text-2xl font-bold ${
                      summaryReport.total.difference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₺{summaryReport.total.difference.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">Haftalık Hakediş</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Kayıt</p>
                    <p className="text-base md:text-xl font-bold">{summaryReport.weekly.records}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Raporal</p>
                    <p className="text-base md:text-xl font-bold text-green-600">
                      ₺{summaryReport.weekly.raporal.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Sistem</p>
                    <p className="text-base md:text-xl font-bold text-purple-600">
                      ₺{summaryReport.weekly.sistem.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Fark</p>
                    <p className={`text-xl font-bold ${
                      summaryReport.weekly.difference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₺{summaryReport.weekly.difference.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4">Kredi Kartı</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Kayıt</p>
                    <p className="text-base md:text-xl font-bold">{summaryReport.creditCard.records}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Raporal</p>
                    <p className="text-base md:text-xl font-bold text-green-600">
                      ₺{summaryReport.creditCard.raporal.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Sistem</p>
                    <p className="text-base md:text-xl font-bold text-purple-600">
                      ₺{summaryReport.creditCard.sistem.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Fark</p>
                    <p className={`text-xl font-bold ${
                      summaryReport.creditCard.difference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₺{summaryReport.creditCard.difference.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Date Range Report Results */}
        {dateRangeReport && (
          <Card title="Tarih Aralığı Raporu" className="mt-6">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Toplam Kayıt</p>
                <p className="text-lg md:text-2xl font-bold">{dateRangeReport.totals.recordCount}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Toplam Raporal</p>
                <p className="text-lg md:text-2xl font-bold text-green-600">
                  ₺{dateRangeReport.totals.totalRaporal.toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Toplam Sistem</p>
                <p className="text-lg md:text-2xl font-bold text-purple-600">
                  ₺{dateRangeReport.totals.totalSystem.toFixed(2)}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Toplam Fark</p>
                <p className={`text-2xl font-bold ${
                  dateRangeReport.totals.totalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₺{dateRangeReport.totals.totalDifference.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tarih</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tip</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Raporal</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Sistem</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Fark</th>
                  </tr>
                </thead>
                <tbody>
                  {dateRangeReport.records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(record.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            record.type === 'HAFTALIK'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {record.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">
                        ₺{record.raporal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-purple-600">
                        ₺{record.sistem.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        record.difference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₺{record.difference.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <th colSpan={2} className="py-3 px-4 text-left font-bold">TOPLAM</th>
                    <th className="py-3 px-4 text-right font-bold text-green-600">
                      ₺{dateRangeReport.totals.totalRaporal.toFixed(2)}
                    </th>
                    <th className="py-3 px-4 text-right font-bold text-purple-600">
                      ₺{dateRangeReport.totals.totalSystem.toFixed(2)}
                    </th>
                    <th className={`py-3 px-4 text-right font-bold text-lg ${
                      dateRangeReport.totals.totalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₺{dateRangeReport.totals.totalDifference.toFixed(2)}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
