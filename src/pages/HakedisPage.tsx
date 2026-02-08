import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { hakedisService } from '../services/hakedisService';
import type { HakedisFormData } from '../types';
import { Calendar } from 'lucide-react';
import { getErrorMessage } from '../utils/errorHandler';

const ROUTES = ['Makas', 'Makas3', 'Sanayi', 'Hastane', 'Kurtuluş', 'Paşacık', 'Belediye'];
const VEHICLE_NUMBERS = [1, 5, 6, 8, 9, 28, 38, 41, 48, 53, 55, 66, 68, 71, 76, 83, 95, 103, 112, 114, 144, 145, 166, 182, 185];

export const HakedisPage: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'HAFTALIK' | 'KREDI_KARTI'>('HAFTALIK');
  const [routeValues, setRouteValues] = useState<Record<string, number>>({});
  const [vehicleValues, setVehicleValues] = useState<Record<string, number>>({});
  const [raporal, setRaporal] = useState<number>(0);
  const [sistem, setSistem] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const difference = raporal - sistem;

  const handleRouteChange = (route: string, value: string) => {
    if (value === '' || value === null || value === undefined) {
      const newValues = { ...routeValues };
      delete newValues[route];
      setRouteValues(newValues);
    } else {
      setRouteValues({
        ...routeValues,
        [route]: parseFloat(value),
      });
    }
  };

  const handleVehicleChange = (vehicleNo: number, value: string) => {
    if (value === '' || value === null || value === undefined) {
      const newValues = { ...vehicleValues };
      delete newValues[vehicleNo.toString()];
      setVehicleValues(newValues);
    } else {
      setVehicleValues({
        ...vehicleValues,
        [vehicleNo.toString()]: parseFloat(value),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Sadece değer girilmiş (0 veya pozitif) alanları filtrele
      const filteredRoutes: Record<string, number> = {};
      Object.entries(routeValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null && !isNaN(value)) {
          filteredRoutes[key] = value;
        }
      });

      const filteredVehicles: Record<string, number> = {};
      Object.entries(vehicleValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null && !isNaN(value)) {
          filteredVehicles[key] = value;
        }
      });

      const formData: HakedisFormData = {
        date,
        type,
        routes: filteredRoutes,
        raporal,
        sistem,
      };

      if (type === 'KREDI_KARTI') {
        formData.vehicles = filteredVehicles;
      }

      await hakedisService.create(formData);
      setMessage({ type: 'success', text: 'Hakediş başarıyla oluşturuldu!' });

      // Reset form
      setRouteValues({});
      setVehicleValues({});
      setRaporal(0);
      setSistem(0);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Hakediş Hazırla</h1>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tarih ve Tip Seçimi */}
          <Card title="Genel Bilgiler">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Tarih
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hakediş Türü
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="HAFTALIK"
                      checked={type === 'HAFTALIK'}
                      onChange={(e) => setType(e.target.value as 'HAFTALIK' | 'KREDI_KARTI')}
                      className="mr-2 w-4 h-4 text-primary-600"
                    />
                    <span>1. HAFTALIK</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="KREDI_KARTI"
                      checked={type === 'KREDI_KARTI'}
                      onChange={(e) => setType(e.target.value as 'HAFTALIK' | 'KREDI_KARTI')}
                      className="mr-2 w-4 h-4 text-primary-600"
                    />
                    <span>2. KREDİ KARTI</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Hat Listesi */}
          <Card title="Hat Bilgileri">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ROUTES.filter(route => type === 'KREDI_KARTI' ? route !== 'Sanayi' : true).map((route) => (
                <Input
                  key={route}
                  label={route}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={routeValues[route] !== undefined ? routeValues[route] : ''}
                  onChange={(e) => handleRouteChange(route, e.target.value)}
                />
              ))}
            </div>
          </Card>

          {/* Araç Numaraları - Sadece Kredi Kartı için */}
          {type === 'KREDI_KARTI' && (
            <Card title="Araç Numaraları (Sanayi Hattı)">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {VEHICLE_NUMBERS.map((vehicleNo) => (
                  <Input
                    key={vehicleNo}
                    label={`Araç ${vehicleNo}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={vehicleValues[vehicleNo.toString()] !== undefined ? vehicleValues[vehicleNo.toString()] : ''}
                    onChange={(e) => handleVehicleChange(vehicleNo, e.target.value)}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Raporal ve Sistem */}
          <Card title="Kontrol Bilgileri">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Raporal"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={raporal === 0 ? '0' : raporal || ''}
                onChange={(e) => setRaporal(parseFloat(e.target.value) || 0)}
                required
              />

              <Input
                label="Sistem"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={sistem === 0 ? '0' : sistem || ''}
                onChange={(e) => setSistem(parseFloat(e.target.value) || 0)}
                required
              />

              <Input
                label="Fark"
                type="text"
                value={difference.toFixed(2)}
                disabled
                className={`font-semibold ${
                  difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'
                }`}
              />
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Hazırlanıyor...' : 'Hakediş Hazırla'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};
