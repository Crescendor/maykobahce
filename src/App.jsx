import React, { useState, useEffect, useCallback } from 'react';
import MeadowCanvas from './components/MeadowCanvas';
import GardenHUD from './components/GardenHUD';
import FlowerDrawerModal from './components/FlowerDrawerModal';
import FlowerPopup from './components/FlowerPopup';
import SearchModal from './components/SearchModal';
import DeleteCodeModal from './components/DeleteCodeModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import AdminFloatingToolbar from './components/AdminFloatingToolbar';
import { Check, X, Sparkles } from 'lucide-react';
import {
  GARDEN_SIZE,
  loadGardenFlowers,
  saveGardenFlowers,
  isPositionValid,
  fetchFlowersFromApi,
  postFlowerToApi,
  deleteFlowerFromApi,
  patchFlowerToApi,
  addDeletedId,
  loadDeletedIds,
  addPendingId,
  fetchMeadowObjectsFromApi,
  publishMeadowObjectsToApi
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
  // Persist admin auth across sessions
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => localStorage.getItem('mayko_admin_auth') === 'true'
  );
  const handleAdminAuth = () => {
    localStorage.setItem('mayko_admin_auth', 'true');
    setIsAdminAuthenticated(true);
  };

  // Admin Interactive Mode Tools & State
  const [adminTool, setAdminTool] = useState('move_flower'); // 'move_flower' | 'draw' | 'text' | 'delete'
  const [adminColor, setAdminColor] = useState('#ffffff');
  const [selectedMeadowObj, setSelectedMeadowObj] = useState(null);

  const [meadowObjects, setMeadowObjects] = useState(() => {
    try {
      const s = localStorage.getItem('mayko_meadow_objects_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return [];
  });

  // Sync Published Meadow Objects from Cloudflare Edge API for all visitors
  const syncMeadowObjects = useCallback(async () => {
    const data = await fetchMeadowObjectsFromApi();
    if (data && Array.isArray(data)) {
      setMeadowObjects(data);
      try {
        localStorage.setItem('mayko_meadow_objects_v1', JSON.stringify(data));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    syncMeadowObjects();
  }, [syncMeadowObjects]);

  const saveMeadowObjects = (objs) => {
    setMeadowObjects(objs);
    try {
      localStorage.setItem('mayko_meadow_objects_v1', JSON.stringify(objs));
    } catch (e) {}
  };

  const handleAddMeadowObject = (newObj) => {
    saveMeadowObjects([...meadowObjects, newObj]);
  };

  const handleAddPngSticker = (imageUrl) => {
    const newSticker = {
      id: `obj-${Date.now()}`,
      type: 'image',
      imageUrl,
      x: GARDEN_SIZE / 2,
      y: GARDEN_SIZE / 2,
      width: 180,
      height: 180,
      scale: 1
    };
    saveMeadowObjects([...meadowObjects, newSticker]);
    setSelectedMeadowObj(newSticker);
    setViewportTarget({ x: GARDEN_SIZE / 2, y: GARDEN_SIZE / 2, scale: 1.2 });
    showToast('PNG görsel haritaya eklendi! Taşıyabilir ve boyutunu ayarlayabilirsiniz. 🖼️');
  };

  const handleUpdateMeadowObjPos = (objId, x, y) => {
    setMeadowObjects((prev) => {
      const updated = prev.map((o) => (o.id === objId ? { ...o, x, y } : o));
      try {
        localStorage.setItem('mayko_meadow_objects_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleUpdateSelectedImageSize = (newWidth) => {
    if (!selectedMeadowObj) return;
    setMeadowObjects((prev) => {
      const updated = prev.map((o) => (o.id === selectedMeadowObj.id ? { ...o, width: newWidth, height: newWidth } : o));
      try {
        localStorage.setItem('mayko_meadow_objects_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setSelectedMeadowObj((prev) => (prev ? { ...prev, width: newWidth, height: newWidth } : null));
  };

  const handleDeleteMeadowObject = (objId) => {
    saveMeadowObjects(meadowObjects.filter((o) => o.id !== objId));
    if (selectedMeadowObj && selectedMeadowObj.id === objId) {
      setSelectedMeadowObj(null);
    }
  };

  const handleClearAllMeadowDrawings = () => {
    if (window.confirm('Harita üzerindeki tüm özel admin çizimlerini ve görselleri silmek istediğinize emin misiniz?')) {
      saveMeadowObjects([]);
      setSelectedMeadowObj(null);
    }
  };

  const handlePublishMeadowObjects = async () => {
    const adminToken = localStorage.getItem('mayko_admin_token') || '';
    const res = await publishMeadowObjectsToApi(meadowObjects, adminToken);
    if (res && res.success) {
      showToast('🚀 Haritadaki tüm çizimler, yazılar ve PNG görselleri canlıya alındı! Herkes görebilir. 🌐');
    } else {
      showToast('⚠️ Canlıya alma başarısız oldu. Lütfen admin şifresini kontrol edin.');
    }
  };

  // Instant local flower position update on drag
  const handleUpdateFlowerLocalPos = (flowerId, x, y) => {
    setFlowers((prev) => prev.map((f) => (f.id === flowerId ? { ...f, x, y } : f)));
  };

  // Persist flower position update on drop
  const handleUpdateFlowerPosition = (flowerId, x, y) => {
    handlePatchFlower(flowerId, { x, y });
    showToast('Çiçeğin konumu yeni yerine taşındı! 📍');
  };

  const handlePatchFlower = (flowerId, patch) => {
    setFlowers((prevFlowers) => {
      const updated = prevFlowers.map((f) => (f.id === flowerId ? { ...f, ...patch } : f));
      saveGardenFlowers(updated);
      return updated;
    });
    const adminToken = localStorage.getItem('mayko_admin_token') || '';
    patchFlowerToApi(flowerId, patch, adminToken);
  };

  // Camera Viewport Target for Animated Camera focusing
  const [viewportTarget, setViewportTarget] = useState(null);
  const [currentScale, setCurrentScale] = useState(0.85);

  // Initialize Flowers & Sync with Cloudflare Edge API
  const syncFlowers = useCallback(async () => {
    const data = await fetchFlowersFromApi(isAdminAuthenticated);
    // fetchFlowersFromApi already applies tombstone + pending logic;
    // just replace state directly (remote = source of truth)
    if (data && Array.isArray(data)) {
      setFlowers(data);
    }
  }, [isAdminAuthenticated]);

  useEffect(() => {
    syncFlowers();

    // Poll every 10 seconds — safe within Cloudflare D1 free limits
    // D1: 5M reads/day; 100 users × 8,640 polls/day = 864K reads → well within limit
    const POLL_MS = 10000;
    let interval = setInterval(syncFlowers, POLL_MS);

    // Pause polling when tab is hidden, resume immediately on focus
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        syncFlowers();
        interval = setInterval(syncFlowers, POLL_MS);
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
    const adminToken = localStorage.getItem('mayko_admin_token') || '';
    deleteFlowerFromApi(flowerId, deleteCode, adminToken);

    setSelectedFlower(null);
    window.history.replaceState(null, '', window.location.pathname);
    showToast('Çiçeğiniz bahçeden başarıyla silindi! 🌿');
  };


  return (
    <div className="app-container">
      {/* Interactive Admin Mode Floating HUD Toolbar */}
      <AdminFloatingToolbar
        isAdminAuthenticated={isAdminAuthenticated}
        adminTool={adminTool}
        setAdminTool={setAdminTool}
        adminColor={adminColor}
        setAdminColor={setAdminColor}
        onOpenDashboard={() => setIsAdminOpen(true)}
        meadowObjectsCount={meadowObjects.length}
        onClearAllMeadowDrawings={handleClearAllMeadowDrawings}
        onAddPngSticker={handleAddPngSticker}
        onPublishMeadowObjects={handlePublishMeadowObjects}
        selectedImageSize={selectedMeadowObj && selectedMeadowObj.type === 'image' ? selectedMeadowObj.width || 180 : null}
        onUpdateSelectedImageSize={handleUpdateSelectedImageSize}
      />

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
        isAdminAuthenticated={isAdminAuthenticated}
        adminTool={adminTool}
        adminColor={adminColor}
        adminBrushSize={10}
        onUpdateFlowerLocalPos={handleUpdateFlowerLocalPos}
        onUpdateFlowerPosition={handleUpdateFlowerPosition}
        meadowObjects={meadowObjects}
        onAddMeadowObject={handleAddMeadowObject}
        onDeleteMeadowObject={handleDeleteMeadowObject}
        onDeleteFlower={handleDeleteFlower}
        selectedMeadowObjId={selectedMeadowObj ? selectedMeadowObj.id : null}
        onSelectMeadowObj={setSelectedMeadowObj}
        onUpdateMeadowObjPos={handleUpdateMeadowObjPos}
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
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdmin={() => setIsAdminOpen(true)}
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
        onAdminAuth={handleAdminAuth}
        onPatchFlower={handlePatchFlower}
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
