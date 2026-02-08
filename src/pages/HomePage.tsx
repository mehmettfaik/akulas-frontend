import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { 
  FileText, 
  Truck, 
  BarChart3, 
  Users,
  Settings, 
  Calculator,
  FileCheck,
  Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PageCard {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
  color: string;
}

const pages: PageCard[] = [
  {
    title: 'Desk İşlemleri',
    description: 'Günlük satış ve ödeme bilgilerini kaydedin, sorumluya teslim edin',
    icon: Calculator,
    path: '/desk',
    roles: ['desk'],
    color: 'bg-gray-500'
  },
  {
    title: 'Bayi Dolum',
    description: 'Bayi dolum, tam kart, kart kılıfı ve POS rulosu satışlarını kaydedin',
    icon: Store,
    path: '/bayi-dolum',
    roles: ['desk'],
    color: 'bg-gray-500'
  },
  {
    title: 'Hakediş',
    description: 'Haftalık ve kredi kartı hakediş kayıtları oluşturun',
    icon: FileText,
    path: '/hakedis',
    roles: ['admin'],
    color: 'bg-gray-500'
  },
  {
    title: 'Haftalık Özet (Banka)',
    description: 'Haftalık hakediş özetini görüntüleyin ve Excel olarak indirin',
    icon: FileCheck,
    path: '/hakedis/weekly-summary',
    roles: ['admin'],
    color: 'bg-gray-500'
  },
  {
    title: 'Sorumluya Teslim Edilen',
    description: 'Teslim edilen desk kayıtlarını görüntüleyin ve onaylayın',
    icon: FileCheck,
    path: '/desk-submitted',
    roles: ['desk', 'responsible', 'admin'],
    color: 'bg-gray-500'
  },
  {
    title: 'Cari Yönetimi',
    description: 'Araç ve sürücü bilgilerini yönetin',
    icon: Truck,
    path: '/vehicles',
    roles: ['admin'],
    color: 'bg-gray-500'
  },
  {
    title: 'Raporlar',
    description: 'Araç, hat ve tarih bazlı raporları görüntüleyin',
    icon: BarChart3,
    path: '/reports',
    roles: ['admin'],
    color: 'bg-gray-500'
  },
  {
    title: 'Kullanıcılar',
    description: 'Kullanıcı hesaplarını ve rollerini yönetin',
    icon: Users,
    path: '/users',
    roles: ['admin'],
    color: 'bg-gray-500'
  },
  {
    title: 'Ayarlar',
    description: 'Sistem ayarlarını yapılandırın',
    icon: Settings,
    path: '/settings',
    roles: ['admin'],
    color: 'bg-gray-500'
  }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const accessiblePages = pages.filter(page => 
    user && page.roles.includes(user.role)
  );

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hoş Geldiniz, {user?.displayName}!
          </h1>
          <p className="text-gray-600">
            Erişiminiz olan sayfaları aşağıdan seçebilirsiniz
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessiblePages.map((page) => {
            const Icon = page.icon;
            return (
              <div
                key={page.path}
                onClick={() => handleNavigate(page.path)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-200 overflow-hidden"
              >
                <div className={`${page.color} h-2`}></div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`${page.color} bg-opacity-10 p-3 rounded-lg`}>
                      <Icon className={`w-8 h-8 ${page.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {page.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {page.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {accessiblePages.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FileText className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Erişilebilir Sayfa Bulunamadı
              </h3>
              <p className="text-gray-600">
                Hesabınıza henüz bir rol atanmamış. Lütfen yönetici ile iletişime geçin.
              </p>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
