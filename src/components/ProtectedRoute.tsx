import React, { type ReactNode, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'admin' | 'responsible' | 'desk'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Eğer kullanıcı var ama rol yetki yoksa ana sayfaya yönlendir
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    }
  }, [user, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erişim Engellendi</h2>
          <p className="text-gray-700 mb-4">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </p>
          <p className="text-sm text-gray-500">
            Rol: <span className="font-semibold capitalize">{user.role}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
