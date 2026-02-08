import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { getErrorMessage } from '../utils/errorHandler';

const ROUTES = ['Makas', 'Makas3', 'Sanayi', 'Hastane', 'Kurtuluş', 'Paşacık', 'Belediye'];

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    plateNumber: '',
    vehicleNumber: '',
    routeName: '',
    driverName: '',
    iban: '',
    taxId: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getAll();
      setVehicles(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Araçlar yüklenirken hata oluştu.') });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        plateNumber: vehicle.plateNumber,
        vehicleNumber: vehicle.vehicleNumber.toString(),
        routeName: vehicle.routeName,
        driverName: vehicle.driverName,
        iban: vehicle.iban,
        taxId: vehicle.taxId || '',
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        plateNumber: '',
        vehicleNumber: '',
        routeName: '',
        driverName: '',
        iban: '',
        taxId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    setFormData({
      plateNumber: '',
      vehicleNumber: '',
      routeName: '',
      driverName: '',
      iban: '',
      taxId: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const vehicleData = {
        plateNumber: formData.plateNumber,
        vehicleNumber: parseInt(formData.vehicleNumber),
        routeName: formData.routeName,
        driverName: formData.driverName,
        iban: formData.iban,
        taxId: formData.taxId.trim() || '',
      };

      if (editingVehicle) {
        await vehicleService.update(editingVehicle.id, vehicleData);
        setMessage({ type: 'success', text: 'Araç başarıyla güncellendi!' });
      } else {
        await vehicleService.create(vehicleData);
        setMessage({ type: 'success', text: 'Araç başarıyla eklendi!' });
      }

      handleCloseModal();
      fetchVehicles();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu aracı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await vehicleService.delete(id);
      setMessage({ type: 'success', text: 'Araç başarıyla silindi!' });
      fetchVehicles();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Araç Yönetimi</h1>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5 mr-2" />
            Yeni Araç Ekle
          </Button>
        </div>

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

        <Card>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Yükleniyor...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Henüz araç kaydı bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Araç No</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Plaka</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Hat Adı</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Sürücü</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">IBAN</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Vergi/TC Kimlik No</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{vehicle.vehicleNumber}</td>
                      <td className="py-3 px-4 font-medium">{vehicle.plateNumber}</td>
                      <td className="py-3 px-4">{vehicle.routeName}</td>
                      <td className="py-3 px-4">{vehicle.driverName}</td>
                      <td className="py-3 px-4 font-mono text-sm">{vehicle.iban}</td>
                      <td className="py-3 px-4 font-mono text-sm">{vehicle.taxId || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(vehicle)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Araç Numarası"
              type="number"
              placeholder="1"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              required
            />

            <Input
              label="Plaka"
              type="text"
              placeholder="34 ABC 123"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hat Adı
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={formData.routeName}
                onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                required
              >
                <option value="">Hat seçiniz</option>
                {ROUTES.map((route) => (
                  <option key={route} value={route}>
                    {route}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Sürücü Adı"
              type="text"
              placeholder="Ahmet Yılmaz"
              value={formData.driverName}
              onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
              required
            />

            <Input
              label="IBAN"
              type="text"
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              required
            />

            <Input
              label="Vergi/TC Kimlik No"
              type="text"
              placeholder="12345678901"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                İptal
              </Button>
              <Button type="submit">
                {editingVehicle ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
};
