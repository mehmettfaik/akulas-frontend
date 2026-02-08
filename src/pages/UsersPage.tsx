import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { userService, type CreateUserData, type UpdateUserData } from '../services/userService';
import type { User } from '../types';
import { Plus, Edit, Trash2, UserCircle } from 'lucide-react';
import { getErrorMessage } from '../utils/errorHandler';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'desk' as 'admin' | 'responsible' | 'desk',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      setUsers(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Kullanıcılar yüklenirken hata oluştu.') });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        displayName: user.displayName,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        displayName: '',
        role: 'desk',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      role: 'desk',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      if (editingUser) {
        // Update user
        const updateData: UpdateUserData = {
          email: formData.email,
          displayName: formData.displayName,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await userService.update(editingUser.uid, updateData);
        setMessage({ type: 'success', text: 'Kullanıcı başarıyla güncellendi!' });
      } else {
        // Create new user
        if (!formData.password) {
          setMessage({ type: 'error', text: 'Şifre gereklidir!' });
          return;
        }
        const createData: CreateUserData = {
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role,
        };
        await userService.create(createData);
        setMessage({ type: 'success', text: 'Kullanıcı başarıyla oluşturuldu!' });
      }

      handleCloseModal();
      fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await userService.delete(id);
      setMessage({ type: 'success', text: 'Kullanıcı başarıyla silindi!' });
      fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'responsible':
        return 'bg-blue-100 text-blue-800';
      case 'desk':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Yönetici';
      case 'responsible':
        return 'Sorumlu';
      case 'desk':
        return 'Desk';
      default:
        return role;
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5 mr-2" />
            Yeni Kullanıcı Ekle
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
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Henüz kullanıcı bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Kullanıcı</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">E-posta</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.uid} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold">
                              {user.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{user.displayName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(user.uid)}
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
          title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Ad Soyad"
              type="text"
              placeholder="Ahmet Yılmaz"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />

            <Input
              label="E-posta"
              type="email"
              placeholder="kullanici@akulas.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label={editingUser ? 'Şifre (Boş bırakın değiştirmek istemiyorsanız)' : 'Şifre'}
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'responsible' | 'desk' })}
                    className="mr-3 w-4 h-4 text-purple-600"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Yönetici (Admin)</span>
                    <p className="text-xs text-gray-500">Tüm sayfalara erişim yetkisi</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value="responsible"
                    checked={formData.role === 'responsible'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'responsible' | 'desk' })}
                    className="mr-3 w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Sorumlu</span>
                    <p className="text-xs text-gray-500">Hakediş, Cari Yönetimi, Raporlar</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    value="desk"
                    checked={formData.role === 'desk'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'responsible' | 'desk' })}
                    className="mr-3 w-4 h-4 text-green-600"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Desk</span>
                    <p className="text-xs text-gray-500">Hakediş ve Raporlar</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                İptal
              </Button>
              <Button type="submit">
                {editingUser ? 'Güncelle' : 'Oluştur'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
};
