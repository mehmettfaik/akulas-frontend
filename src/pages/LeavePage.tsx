import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Calendar, UserCheck, FileText, Plus, Edit, Trash2, ThumbsUp, ThumbsDown, X as XIcon } from 'lucide-react';
import { leaveService } from '../services/leaveService';
import type { CreateEmployeeData, CreateLeaveRequestData } from '../services/leaveService';
import type { Employee, LeaveRequest, LeaveEntitlement } from '../types';
import { getErrorMessage } from '../utils/errorHandler';

const leaveTypeLabels: Record<string, string> = {
  annual: 'Yıllık İzin',
  sick: 'Hastalık İzni',
  excuse: 'Mazeret İzni',
  unpaid: 'Ücretsiz İzin',
};

const statusLabels: Record<string, { label: string; className: string }> = {
  pending:{ label: 'Beklemede', className: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Onaylandı', className: 'bg-green-100 text-green-800' },
  rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'İptal Edildi', className: 'bg-gray-100 text-gray-800' },
};

export const LeavePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'requests' | 'summary'>('employees');

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-6">Yıllık İzin Yönetimi</h1>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'employees'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-5 h-5 inline-block mr-2" />
            Çalışanlar
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-5 h-5 inline-block mr-2" />
            İzin Talepleri
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'summary'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-5 h-5 inline-block mr-2" />
            İzin Özeti
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'employees' && <EmployeesTab />}
        {activeTab === 'requests' && <LeaveRequestsTab />}
        {activeTab === 'summary' && <LeaveSummaryTab />}
      </div>
    </MainLayout>
  );
};

// ==============================
// TAB 1: ÇALIŞANLAR
// ==============================
const EmployeesTab: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<CreateEmployeeData>({
    firstName: '',
    lastName: '',
    tcNo: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    startDate: '',
    isActive: true,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await leaveService.getAllEmployees();
      setEmployees(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Çalışanlar yüklenemedi!') });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        tcNo: employee.tcNo,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        startDate: employee.startDate,
        isActive: employee.isActive,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        firstName: '',
        lastName: '',
        tcNo: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        startDate: '',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await leaveService.updateEmployee(editingEmployee.id, formData);
        setMessage({ type: 'success', text: 'Çalışan başarıyla güncellendi!' });
      } else {
        await leaveService.createEmployee(formData);
        setMessage({ type: 'success', text: 'Çalışan başarıyla eklendi!' });
      }
      handleCloseModal();
      fetchEmployees();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'İşlem başarısız!') });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu çalışanı silmek istediğinize emin misiniz?')) return;
    try {
      await leaveService.deleteEmployee(id);
      setMessage({ type: 'success', text: 'Çalışan başarıyla silindi!' });
      fetchEmployees();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Silme işlemi başarısız!') });
    }
  };

  return (
    <>
      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-semibold">Çalışan Listesi ({employees.length})</h2>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Çalışan
          </Button>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-500">Yükleniyor...</p>
        ) : employees.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Henüz çalışan eklenmemiş.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ad Soyad</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">TC No</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Telefon</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Bölüm</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Pozisyon</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">İşe Giriş</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Durum</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{employee.firstName} {employee.lastName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{employee.tcNo}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{employee.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{employee.phone}</td>
                    <td className="py-3 px-4 text-sm">{employee.department}</td>
                    <td className="py-3 px-4 text-sm">{employee.position}</td>
                    <td className="py-3 px-4 text-sm">{new Date(employee.startDate).toLocaleDateString('tr-TR')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(employee)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(employee.id)}>
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmployee ? 'Çalışan Düzenle' : 'Yeni Çalışan Ekle'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ad"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              label="Soyad"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
            <Input
              label="TC Kimlik No"
              required
              maxLength={11}
              value={formData.tcNo}
              onChange={(e) => setFormData({ ...formData, tcNo: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Telefon"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Bölüm"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Örn: Desk, Muhasebe, Yönetim"
            />
            <Input
              label="Pozisyon"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Örn: Gişe Görevlisi, Muhasebeci"
            />
            <Input
              label="İşe Giriş Tarihi"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Aktif Çalışan
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end sm:space-x-3 space-y-2 sm:space-y-0 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button type="submit">
              {editingEmployee ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

// ==============================
// TAB 2: İZİN TALEPLERİ
// ==============================
const LeaveRequestsTab: React.FC = () => {
  // const { user } = useAuth(); // Currently not used
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState<CreateLeaveRequestData>({
    employeeId: '',
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [filterEmployee, filterStatus, filterYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, employeesRes] = await Promise.all([
        leaveService.getLeaveRequests({
          employeeId: filterEmployee || undefined,
          status: filterStatus || undefined,
          year: filterYear,
        }),
        leaveService.getAllEmployees(),
      ]);
      setRequests(requestsRes.data);
      setEmployees(employeesRes.data.filter(e => e.isActive));
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Veriler yüklenemedi!') });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      employeeId: '',
      leaveType: 'annual',
      startDate: '',
      endDate: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await leaveService.createLeaveRequest(formData);
      setMessage({ type: 'success', text: 'İzin talebi başarıyla oluşturuldu!' });
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'İşlem başarısız!') });
    }
  };

  const handleOpenReviewModal = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setReviewNotes('');
    setIsReviewModalOpen(true);
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;
    try {
      await leaveService.reviewLeaveRequest(selectedRequest.id, action, reviewNotes || undefined);
      setMessage({
        type: 'success',
        text: `İzin talebi başarıyla ${action === 'approve' ? 'onaylandı' : 'reddedildi'}!`,
      });
      setIsReviewModalOpen(false);
      fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'İşlem başarısız!') });
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Bu izin talebini iptal etmek istediğinize emin misiniz?')) return;
    try {
      await leaveService.cancelLeaveRequest(id);
      setMessage({ type: 'success', text: 'İzin talebi iptal edildi!' });
      fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'İşlem başarısız!') });
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : '-';
  };

  return (
    <>
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Çalışan</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
            >
              <option value="">Tümü</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="pending">Beklemede</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Yıl</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleOpenModal} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Talep
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">İzin Talepleri ({requests.length})</h2>

        {loading ? (
          <p className="text-center py-8 text-gray-500">Yükleniyor...</p>
        ) : requests.length === 0 ? (
          <p className="text-center py-8 text-gray-500">İzin talebi bulunmamaktadır.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Çalışan</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">İzin Türü</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Başlangıç</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Bitiş</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Gün</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Durum</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const statusInfo = statusLabels[request.status] || { label: request.status, className: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{getEmployeeName(request.employeeId)}</td>
                      <td className="py-3 px-4 text-sm">{leaveTypeLabels[request.leaveType]}</td>
                      <td className="py-3 px-4 text-sm">{new Date(request.startDate).toLocaleDateString('tr-TR')}</td>
                      <td className="py-3 px-4 text-sm">{new Date(request.endDate).toLocaleDateString('tr-TR')}</td>
                      <td className="py-3 px-4 text-center font-medium">{request.totalDays}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenReviewModal(request)}>
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleCancel(request.id)}>
                                <XIcon className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <Button variant="ghost" size="sm" onClick={() => handleCancel(request.id)}>
                              İptal Et
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New Request Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni İzin Talebi" size="md">
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Çalışan *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            >
              <option value="">Seçiniz</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">İzin Türü *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
            >
              <option value="annual">Yıllık İzin</option>
              <option value="sick">Hastalık İzni</option>
              <option value="excuse">Mazeret İzni</option>
              <option value="unpaid">Ücretsiz İzin</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Başlangıç Tarihi"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="Bitiş Tarihi"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end sm:space-x-3 space-y-2 sm:space-y-0 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              İptal
            </Button>
            <Button type="submit">Oluştur</Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="İzin Talebi İncele" size="md">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Çalışan:</strong> {getEmployeeName(selectedRequest.employeeId)}</p>
              <p><strong>İzin Türü:</strong> {leaveTypeLabels[selectedRequest.leaveType]}</p>
              <p><strong>Tarih:</strong> {new Date(selectedRequest.startDate).toLocaleDateString('tr-TR')} - {new Date(selectedRequest.endDate).toLocaleDateString('tr-TR')}</p>
              <p><strong>Gün Sayısı:</strong> {selectedRequest.totalDays} gün</p>
              {selectedRequest.description && <p><strong>Açıklama:</strong> {selectedRequest.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Not (isteğe bağlı)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Onay/Red notunuzu buraya yazabilirsiniz..."
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 pt-4">
              <Button onClick={() => handleReview('approve')} className="flex-1 bg-green-600 hover:bg-green-700">
                <ThumbsUp className="w-4 h-4 mr-2" />
                Onayla
              </Button>
              <Button onClick={() => handleReview('reject')} variant="danger" className="flex-1">
                <ThumbsDown className="w-4 h-4 mr-2" />
                Reddet
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

// ==============================
// TAB 3: İZİN ÖZETİ
// ==============================
const LeaveSummaryTab: React.FC = () => {
  const [summaryData, setSummaryData] = useState<Array<{
    employee: Employee;
    entitlement: LeaveEntitlement | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [filterYear]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const [employeesRes, entitlementsRes] = await Promise.all([
        leaveService.getAllEmployees(),
        leaveService.getAllEntitlements(filterYear),
      ]);

      const employees = employeesRes.data.filter(e => e.isActive);
      const entitlements = entitlementsRes.data;

      const summary = employees.map(employee => ({
        employee,
        entitlement: entitlements.find(e => e.employeeId === employee.id) || null,
      }));

      setSummaryData(summary);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'İzin özeti yüklenemedi.') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Yıl:</label>
          <input
            type="number"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4">İzin Özeti ({summaryData.length})</h2>

        {loading ? (
          <p className="text-center py-8 text-gray-500">Yükleniyor...</p>
        ) : summaryData.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Aktif çalışan bulunmamaktadır.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryData.map(({ employee, entitlement }) => {
              const totalDays = entitlement?.totalDays || 0;
              const usedDays = entitlement?.usedDays || 0;
              const remainingDays = entitlement?.remainingDays || totalDays;
              const usedPercentage = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;

              return (
                <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">{employee.firstName} {employee.lastName}</h3>
                  <p className="text-sm text-gray-600 mb-3">{employee.department} - {employee.position}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Toplam İzin Hakkı:</span>
                      <span className="font-medium">{totalDays} gün</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kullanılan:</span>
                      <span className="font-medium text-orange-600">{usedDays} gün</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kalan:</span>
                      <span className="font-medium text-green-600">{remainingDays} gün</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          usedPercentage > 80 ? 'bg-red-600' : usedPercentage > 50 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ width: `${usedPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      %{usedPercentage.toFixed(0)} kullanılmış
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
};
