import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Truck,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Calculator,
  FileCheck,
  Home,
  Store,
  Landmark,
  DollarSign,
  Calendar,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { name: 'Ana Sayfa', path: '/', icon: Home, roles: ['admin', 'responsible', 'desk'] },

  // DESK specific
  { name: 'Desk İşlemleri', path: '/desk', icon: Calculator, roles: ['desk'] },
  { name: 'Bayi Dolum', path: '/bayi-dolum', icon: Store, roles: ['desk'] },

  // RESPONSIBLE
  { name: 'Sorumluya Teslim Edilen', path: '/desk-submitted', icon: FileCheck, roles: ['desk', 'responsible', 'admin'] },
  { name: 'Bankaya Gönderilen', path: '/bankaya-gonderilen', icon: DollarSign, roles: ['desk', 'responsible', 'admin'] },

  // ADMIN only
  { name: 'Hakediş', path: '/hakedis', icon: FileText, roles: ['admin'] },
  { name: 'Haftalık Özet (Banka)', path: '/hakedis/weekly-summary', icon: Landmark, roles: ['admin'] },
  { name: 'Cari Yönetimi', path: '/vehicles', icon: Truck, roles: ['admin'] },
  { name: 'Raporlar', path: '/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Kullanıcılar', path: '/users', icon: Users, roles: ['admin'] },
  { name: 'Yıllık İzin', path: '/leave', icon: Calendar, roles: ['admin'] },
  { name: 'Ayarlar', path: '/settings', icon: Settings, roles: ['admin'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            <div className="flex items-center">
              <img
                src="/akulas.png"
                alt="Akulas Logo"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <LayoutDashboard className="w-8 h-8 text-primary-400 hidden" />
              <span className="ml-3 text-xl font-bold">Akulas Panel</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-800 md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-800">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-semibold flex-shrink-0">
                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-2 py-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
