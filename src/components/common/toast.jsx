import React, { useEffect, useState } from 'react';

function Toast({ message, type, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 px-4 py-2 text-white rounded-md shadow-lg ${bgColor} ${
        isVisible ? 'animate-toast-in' : 'animate-toast-out'
      }`}
    >
      {message}
    </div>
  );
}

export default Toast;