import React from 'react';
import { X } from 'lucide-react';
import { Customer } from '../types';
import { CustomerAuthCard } from './CustomerAuthCard';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (customer: Customer) => void;
  initialMode?: 'promo' | 'login';
  onTrackOrder?: (query: string) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  onTrackOrder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[420px] z-10">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-30 bg-white hover:bg-gray-100 text-gray-700 hover:text-black rounded-full p-2 shadow-md border border-gray-200 transition-colors cursor-pointer"
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Customer Auth Card */}
        <CustomerAuthCard
          onLoginSuccess={onLoginSuccess}
          onTrackOrder={onTrackOrder}
          initialTab={initialMode === 'promo' ? 'register' : 'signin'}
          isModal={true}
          onCloseModal={onClose}
        />
      </div>
    </div>
  );
};
