'use client';

import { useEffect, useState } from 'react';

interface Version {
  buildId: string;
  buildDate: string;
}

export default function UpdateNotifier() {
  const [showNotification, setShowNotification] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial version
    fetch('/version.json?' + Date.now())
      .then(res => res.json())
      .then((data: Version) => {
        setCurrentVersion(data.buildId);
      })
      .catch(err => console.error('Failed to fetch initial version:', err));

    // Check for updates every 30 seconds
    const interval = setInterval(() => {
      // Only check if tab is visible to save bandwidth
      if (document.hidden) return;

      fetch('/version.json?' + Date.now())
        .then(res => res.json())
        .then((data: Version) => {
          if (currentVersion && data.buildId !== currentVersion) {
            // New version detected!
            setShowNotification(true);
            console.log('New version available:', data.buildId);
          }
        })
        .catch(err => console.error('Failed to check for updates:', err));
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentVersion]);

  const handleReload = () => {
    // Reload with cache bypass
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: '#861D1D',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          New Content Available!
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Fresh posts are waiting for you.
        </div>
      </div>
      <button
        onClick={handleReload}
        style={{
          backgroundColor: '#F4B34C',
          color: '#2B1E1A',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px',
          whiteSpace: 'nowrap',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#FFD700';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#F4B34C';
        }}
      >
        Refresh
      </button>
      <button
        onClick={handleDismiss}
        style={{
          backgroundColor: 'transparent',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        Later
      </button>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
