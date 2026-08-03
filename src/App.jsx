import React, { useState, useEffect, useCallback } from 'react';
import MeadowCanvas from './components/MeadowCanvas';
import GardenHUD from './components/GardenHUD';
import FlowerDrawerModal from './components/FlowerDrawerModal';
import FlowerPopup from './components/FlowerPopup';
import SearchModal from './components/SearchModal';
import DeleteCodeModal from './components/DeleteCodeModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import { Check, X, Sparkles } from 'lucide-react';
import {
  GARDEN_SIZE,
  loadGardenFlowers,
  saveGardenFlowers,
  isPositionValid,
  fetchFlowersFromApi,
  postFlowerToApi,
  deleteFlowerFromApi,
  addDeletedId,
  loadDeletedIds,
  addPendingId
} from './utils/gardenEngine';

export default function App() {
  const [flowers, setFlowers] = useState([]);
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [isPlantingMode, setIsPlantingMode] = useState(false);
  const [pendingPlantPosition, setPendingPlantPosition] = useState(null);
  const [targetPosition, setTargetPosition] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [newlyPlantedFlower, setNewlyPlantedFlower] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Camera Viewport Target for Animated Camera focusing
  const [viewportTarget, setViewportTarget] = useState(null);
  const [currentScale, setCurrentScale] = useState(0.85);

  // Initialize Flowers & Sync with Cloudflare Edge API
  const syncFlowers = useCallback(async () => {
    const data = await fetchFlowersFromApi();
    // fetchFlowersFromApi already applies tombstone + pending logic;
    // just replace state directly (remote = source of truth)
    if (data && Array.isArray(data)) {
      setFlowers(data);
    }
  }, []);

  useEffect(() => {
    syncFlowers();

    // Poll every 30 seconds — respects Cloudflare KV free-tier limits
    // (30s × 60min × 24h = 2,880 reads/day per user; stays well within 100k limit)
    let interval = setInterval(syncFlowers, 30000);

    // Pause polling when tab is hidden, resume immediately on focus (saves API calls)
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        syncFlowers(); // immediate refresh on tab re-focus
        interval = setInterval(syncFlowers, 30000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncFlowers]);

  // Handle URL Hash & Slug Routing (#flower-xyz, /#burak, /burak)
  const handleUrlRoute = useCallback(() => {
    const hash = window.location.hash;
    const pathname = window.location.pathname;

    // Secret Admin Route /burak or #burak
    if (hash === '#burak' || hash === '#/burak' || pathname === '/burak') {
      setIsAdminOpen(true);
      return;
    }

    // Flower Deep Link #flower-xyz
    if (hash && hash.startsWith('#flower-')) {
      const flowerId = hash.replace('#flower-', '');
      const target = flowers.find((f) => f.id === flowerId || f.id === `flower-${flowerId}`);
      if (target) {
        setSelectedFlower(target);
        setViewportTarget({ x: target.x, y: target.y, scale: 1.5 });
      }
    }
  }, [flowers]);

  useEffect(() => {
    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, [flowers, handleUrlRoute]);

  // Show Toast Alert
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Zoom Control Handlers
  const handleZoomIn = () => {
    setCurrentScale((prev) => {
      const nextScale = Math.min(prev * 1.25, 2.5);
      return nextScale;
    });
    setViewportTarget((prev) => ({
      x: prev ? prev.x : GARDEN_SIZE / 2,
      y: prev ? prev.y : GARDEN_SIZE / 2,
      scale: Math.min(currentScale * 1.25, 2.5)
    }));
  };

  const handleZoomOut = () => {
    setCurrentScale((prev) => {
      const nextScale = Math.max(prev * 0.75, 0.4);
      return nextScale;
    });
    setViewportTarget((prev) => ({
      x: prev ? prev.x : GARDEN_SIZE / 2,
      y: prev ? prev.y : GARDEN_SIZE / 2,
      scale: Math.max(currentScale * 0.75, 0.4)
    }));
  };

  const handleResetView = () => {
    setViewportTarget({ x: GARDEN_SIZE / 2, y: GARDEN_SIZE / 2, scale: 0.75 });
    setCurrentScale(0.75);
  };

  // Select Flower (Centers Camera & Opens Popup)
  const handleSelectFlower = (flower) => {
    setSelectedFlower(flower);
    setViewportTarget({ x: flower.x, y: flower.y, scale: 1.5 });
    window.history.replaceState(null, '', `#flower-${flower.id}`);
  };

  // User taps meadow coordinate to place flag marker
  const handlePlantAtPosition = (x, y) => {
    const check = isPositionValid(x, y, flowers);
    if (!check.valid) {
      showToast(check.reason);
      return;
    }

    setPendingPlantPosition({ x, y });
    setIsPlantingMode(false);
    // Smoothly focus camera on flag pin
    setViewportTarget({ x, y, scale: 1.4 });
  };

  // Confirm Flag Location & Start Drawing
  const handleConfirmFlagLocation = () => {
    if (!pendingPlantPosition) return;
    setTargetPosition(pendingPlantPosition);
    setIsDrawerOpen(true);
    setPendingPlantPosition(null);
  };

  // Save Newly Drawn Flower
  const handleSaveFlower = async (newFlower) => {
    const updatedFlowers = [newFlower, ...flowers];
    setFlowers(updatedFlowers);
    saveGardenFlowers(updatedFlowers);

    // Mark as pending so sync won't drop it before D1 confirms it
    addPendingId(newFlower.id);

    // Sync with Cloudflare D1 & KV Edge Storage
    postFlowerToApi(newFlower);

    setIsDrawerOpen(false);
    setNewlyPlantedFlower(newFlower);
    setViewportTarget({ x: newFlower.x, y: newFlower.y, scale: 1.5 });
  };

  // Delete Flower using 8-character code or Admin
  const handleDeleteFlower = async (flowerId, deleteCode = '') => {
    // Tombstone: mark as deleted so it never comes back on sync
    addDeletedId(flowerId);

    const updated = flowers.filter((f) => f.id !== flowerId);
    setFlowers(updated);
    saveGardenFlowers(updated);

    // Sync deletion with Cloudflare D1 & KV
    deleteFlowerFromApi(flowerId, deleteCode, 'Doxish44_');

    setSelectedFlower(null);
    window.history.replaceState(null, '', window.location.pathname);
    showToast('Çiçeğiniz bahçeden başarıyla silindi! 🌿');
  };

  return (
    <div className="app-container">
      {/* Interactive Meadow Canvas */}
      <MeadowCanvas
        flowers={flowers}
        selectedFlower={selectedFlower}
        onSelectFlower={handleSelectFlower}
        isPlantingMode={isPlantingMode}
        pendingPlantPosition={pendingPlantPosition}
        onPlantAtPosition={handlePlantAtPosition}
        viewportTarget={viewportTarget}
        onViewportChange={(tf) => setCurrentScale(tf.scale)}
      />

      {/* Floating HUD Controls */}
      <GardenHUD
        flowerCount={flowers.length}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onOpenSearch={() => setIsSearchOpen(true)}
        onStartPlanting={() => {
          setPendingPlantPosition(null);
          setIsPlantingMode(true);
        }}
        isPlantingMode={isPlantingMode}
        onCancelPlanting={() => setIsPlantingMode(false)}
      />

      {/* Flag Confirmation Overlay Bar */}
      {pendingPlantPosition && (
        <div style={styles.flagConfirmBar} className="animate-slide-up glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>🚩</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
                Dikim Konumu Seçildi!
              </p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>
                Çiçeği buraya dikmek için onaylayın veya konumu değiştirin.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', color: '#ffffff', background: 'rgba(255,255,255,0.15)' }}
              onClick={() => setPendingPlantPosition(null)}
            >
              <X size={16} /> İptal / Konum Değiştir
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              onClick={handleConfirmFlagLocation}
            >
              <Check size={16} /> Burada Dikimi Başlat
            </button>
          </div>
        </div>
      )}

      {/* Touch Flower Drawer Modal */}
      <FlowerDrawerModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaveFlower={handleSaveFlower}
        targetPosition={targetPosition}
      />

      {/* Flower Detail Popup */}
      <FlowerPopup
        flower={selectedFlower}
        onClose={() => {
          setSelectedFlower(null);
          window.history.replaceState(null, '', window.location.pathname);
        }}
        onDeleteFlower={handleDeleteFlower}
      />

      {/* Delete Code Display Modal */}
      <DeleteCodeModal
        isOpen={Boolean(newlyPlantedFlower)}
        flower={newlyPlantedFlower}
        onClose={() => {
          const target = newlyPlantedFlower;
          setNewlyPlantedFlower(null);
          if (target) {
            handleSelectFlower(target);
          }
        }}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        flowers={flowers}
        onSelectFlower={handleSelectFlower}
      />

      {/* Secret Admin Dashboard (/burak or #burak) */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          if (window.location.hash === '#burak' || window.location.hash === '#/burak') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        flowers={flowers}
        onDeleteFlower={handleDeleteFlower}
        onFocusFlower={(flower) => {
          setSelectedFlower(flower);
          setViewportTarget({ x: flower.x, y: flower.y, scale: 1.5 });
        }}
      />

      {/* Toast Alert Banner */}
      {toastMsg && (
        <div style={styles.toast} className="animate-slide-up glass-panel">
          ⚠️ {toastMsg}
        </div>
      )}
    </div>
  );
}

const styles = {
  flagConfirmBar: {
    position: 'fixed',
    bottom: 95,
    left: 18,
    right: 18,
    maxWidth: 480,
    margin: '0 auto',
    borderRadius: 22,
    padding: '14px 18px',
    zIndex: 1050,
    border: '2px solid #10b981',
    background: 'rgba(10, 25, 18, 0.92)'
  },
  toast: {
    position: 'fixed',
    bottom: 95,
    left: 18,
    right: 18,
    maxWidth: 420,
    margin: '0 auto',
    padding: '14px 20px',
    borderRadius: 18,
    background: 'rgba(239, 68, 68, 0.95)',
    color: '#ffffff',
    fontWeight: 600,
    fontSize: '0.9rem',
    textAlign: 'center',
    zIndex: 2000,
    boxShadow: 'var(--shadow-glass)'
  }
};
