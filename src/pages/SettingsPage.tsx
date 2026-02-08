import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';

export const SettingsPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Ayarlar</h1>
        
        <Card title="Sistem Ayarları">
          <p className="text-gray-600">
            Ayarlar sayfası yakında eklenecektir.
          </p>
        </Card>
      </div>
    </MainLayout>
  );
};
