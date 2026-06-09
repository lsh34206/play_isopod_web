import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function Notification() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      containerStyle={{ top: 70 }}
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #334155',
          borderRadius: '12px',
          fontSize: '14px',
          maxWidth: '320px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#1e293b',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#1e293b',
          },
        },
      }}
    />
  );
}
