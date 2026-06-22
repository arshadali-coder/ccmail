import React from 'react';
import { Check } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-[#313033] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm z-50 animate-bounce duration-150">
      <Check size={18} className="text-green-400" />
      <span>{message}</span>
    </div>
  );
}
