import React, { Fragment, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <Fragment>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />

          {/* Modal */}
          <div className={`relative bg-white sm:rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[100vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-lg`}>
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 pr-8">{title}</h3>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 md:right-6 md:top-6 text-gray-400 hover:text-gray-500 transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6">{children}</div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};
