import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import MeadowCanvas from './components/MeadowCanvas';
import GardenHUD from './components/GardenHUD';
import FlowerDrawerModal from './components/FlowerDrawerModal';
import FlowerPopup from './components/FlowerPopup';
import SearchModal from './components/SearchModal';
import DeleteCodeModal from './components/DeleteCodeModal';
import MelancholyQuoteModal from './components/MelancholyQuoteModal';

// Lazy load admin components into a separate dynamic chunk (Never loaded by normal visitors!)
const AdminDashboardModal = lazy(() => import('./components/AdminDashboardModal'));
const AdminFloatingToolbar = lazy(() => import('./components/AdminFloatingToolbar'));
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
  publishMeadowObjectsToApi,
  fetchCustomBgFromApi,
  publishCustomBgToApi,
  fetchSiteSettingsFromApi,
  publishSiteSettingsToApi,
  postLogToApi,
  detectClientDevice
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
  
  // Melancholy / Black & White Mode State
  const [isMelancholyMode, setIsMelancholyMode] = useState(false);
  const [showMelancholyQuote, setShowMelancholyQuote] = useState(false);

  // Persist admin auth across sessions
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => localStorage.getItem('mayko_admin_auth') === 'true'
  );
  const handleAdminAuth = () => {
    localStorage.setItem('mayko_admin_auth', 'true');
    setIsAdminAuthenticated(true);
  };

  // Admin Interactive Mode Tools & State
  const [adminTool, setAdminTool] = useState(null); // null (pan) | 'move_flower' | 'draw' | 'text' | 'delete'
  const [adminColor, setAdminColor] = useState('#38bdf8');
  const [adminFont, setAdminFont] = useState('sans-serif');
  const [adminBrushSize, setAdminBrushSize] = useState(12);
  const [adminIsFilled, setAdminIsFilled] = useState(true);
  const [selectedMeadowObj, setSelectedMeadowObj] = useState(null);

  const [meadowObjects, setMeadowObjects] = useState(() => {
    try {
      const s = localStorage.getItem('mayko_meadow_objects_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return [];
  });

  const [customBg, setCustomBg] = useState(() => {
    try {
      const s = localStorage.getItem('mayko_custom_bg_v1');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return null;
  });

  // Sync Published Meadow Objects, Custom Background & Site Settings from Cloudflare Edge API for all visitors
  const syncMeadowObjects = useCallback(async () => {
    const data = await fetchMeadowObjectsFromApi();
    if (data && Array.isArray(data)) {
      setMeadowObjects(data);
      try {
        localStorage.setItem('mayko_meadow_objects_v1', JSON.stringify(data));
      } catch (e) {}
    }

    const bgData = await fetchCustomBgFromApi();
    if (bgData !== undefined) {
      setCustomBg(bgData);
      try {
        if (bgData) {
          localStorage.setItem('mayko_custom_bg_v1', JSON.stringify(bgData));
        } else {
          localStorage.removeItem('mayko_custom_bg_v1');
        }
      } catch (e) {}
    }

    // Sync Global Site Settings (Melancholy / Black & White Mode)
    const settings = await fetchSiteSettingsFromApi();
    if (settings && typeof settings.isMelancholyMode === 'boolean') {
      setIsMelancholyMode(settings.isMelancholyMode);
      if (settings.isMelancholyMode) {
        const alreadyLogged = sessionStorage.getItem('mayko_melancholy_visit_logged');
        if (!alreadyLogged) {
          sessionStorage.setItem('mayko_melancholy_visit_logged', 'true');
          postLogToApi('melancholy_quote_viewed', {
            action: 'Hüzün Modunda Bahçeye Giriş Yapıldı',
            device: detectClientDevice(),
            viewport: `${window.innerWidth}x${window.innerHeight}`
          });
        }
        const alreadySeen = sessionStorage.getItem('mayko_melancholy_quote_seen');
        if (!alreadySeen) {
          setShowMelancholyQuote(true);
        }
      }
    }
  }, []);

  useEffect(() => {
    syncMeadowObjects();
  }, [syncMeadowObjects]);

  const handleToggleMelancholyMode = async (newMode) => {
    setIsMelancholyMode(newMode);
    if (newMode) {
      setShowMelancholyQuote(true);
      sessionStorage.removeItem('mayko_melancholy_quote_seen');
    }
    const token = localStorage.getItem('mayko_admin_token') || '';
    await publishSiteSettingsToApi({ isMelancholyMode: newMode }, token);
    showToast(newMode ? '🥀 Hüzün Modu açıldı (Siyah-Beyaz Bahçe)' : '🌸 Hüzün Modu kapatıldı (Renkli Bahçe)');
  };

  const saveMeadowObjects = (objs) => {
    setMeadowObjects(objs);
    try {
      localStorage.setItem('mayko_meadow_objects_v1', JSON.stringify(objs));
    } catch (e) {}
  };

  const handleUpdateCustomBg = async (newBg, adminPassword = '') => {
    setCustomBg(newBg);
    try {
      if (newBg) {
        localStorage.setItem('mayko_custom_bg_v1', JSON.stringify(newBg));
      } else {
        localStorage.removeItem('mayko_custom_bg_v1');
      }
    } catch (e) {}

    // Push live background setting to Cloudflare Edge API for all visitors
    const pass = adminPassword || localStorage.getItem('mayko_admin_token') || '';
    await publishCustomBgToApi(newBg, pass);
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
    showToast('PNG görsel haritaya eklendi! 🖼️');
  };

  const handleAddCircleShape = () => {
    const circle = {
      id: `obj-${Date.now()}`,
      type: 'circle',
      x: GARDEN_SIZE / 2,
      y: GARDEN_SIZE / 2,
      radius: 65,
      color: adminColor || '#38bdf8',
      isFilled: adminIsFilled !== false,
      scale: 1,
      rotation: 0
    };
    saveMeadowObjects([...meadowObjects, circle]);
    setSelectedMeadowObj(circle);
    setViewportTarget({ x: GARDEN_SIZE / 2, y: GARDEN_SIZE / 2, scale: 1.2 });
    showToast('⭕ Daire şekli haritaya eklendi!');
  };

  const handleAddSquareShape = () => {
    const square = {
      id: `obj-${Date.now()}`,
      type: 'rect',
      x: GARDEN_SIZE / 2,
      y: GARDEN_SIZE / 2,
      width: 130,
      height: 130,
      color: adminColor || '#38bdf8',
      isFilled: adminIsFilled !== false,
      scale: 1,
      rotation: 0
    };
    saveMeadowObjects([...meadowObjects, square]);
    setSelectedMeadowObj(square);
    setViewportTarget({ x: GARDEN_SIZE / 2, y: GARDEN_SIZE / 2, scale: 1.2 });
    showToast('🔲 Kare şekli haritaya eklendi!');
  };

  const handleAddStraightLine = () => {
    const line = {
      id: `obj-${Date.now()}`,
      type: 'line',
      x: GARDEN_SIZE / 2,
      y: GARDEN_SIZE / 2,
      width: 240,
      height: 12,
      color: adminColor || '#38bdf8',
      strokeWidth: adminBrushSize || 12,
      rotation: 0
    };
    saveMeadowObjects([...meadowObjects, line]);
    setSelectedMeadowObj(line);
    setViewportTarget({ x: GARDEN_SIZE / 2, y: GARDEN_SIZE / 2, scale: 1.2 });
    showToast('📏 Düz çizgi haritaya eklendi!');
  };

  const handleAddSpeechBubble = () => {
    const text = prompt('Sohbet balonuna yazılacak metin:', 'Merhaba Bahçe! 🌸') || 'Sohbet Balonu';
    const bubble = {
      id: `obj-${Date.now()}`,
      type: 'bubble',
      text,
      x: GARDEN_SIZE / 2,
      y: GARDEN_SIZE / 2,
      width: 200,
      height: 95,
      color: adminColor || '#38bdf8',
      bgColor: 'rgba(255, 255, 255, 0.95)',
      textColor: '#0f172a',
      fontFamily: adminFont || 'sans-serif',
      fontSize: 18,
      scale: 1,
      rotation: 0
    };
    saveMeadowObjects([...meadowObjects, bubble]);
    setSelectedMeadowObj(bubble);
    setViewportTarget({ x: GARDEN_SIZE / 2, y: GARDEN_SIZE / 2, scale: 1.2 });
    showToast('💬 Sohbet balonu haritaya eklendi!');
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

  const handleUpdateMeadowObj = (objId, patch) => {
    setMeadowObjects((prev) => {
      const updated = prev.map((o) => (o.id === objId ? { ...o, ...patch } : o));
      try {
        localStorage.setItem('mayko_meadow_objects_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setSelectedMeadowObj((prev) => (prev && prev.id === objId ? { ...prev, ...patch } : prev));
  };

  const handleColorChange = (newColor) => {
    setAdminColor(newColor);
    if (selectedMeadowObj) {
      handleUpdateMeadowObj(selectedMeadowObj.id, { color: newColor });
    }
  };

  const handleBrushSizeChange = (newSize) => {
    setAdminBrushSize(newSize);
    if (selectedMeadowObj) {
      if (selectedMeadowObj.type === 'line' || selectedMeadowObj.type === 'stroke') {
        handleUpdateMeadowObj(selectedMeadowObj.id, { size: newSize, strokeWidth: newSize });
      }
    }
  };

  const handleIsFilledToggle = (filled) => {
    setAdminIsFilled(filled);
    if (selectedMeadowObj && (selectedMeadowObj.type === 'circle' || selectedMeadowObj.type === 'rect')) {
      handleUpdateMeadowObj(selectedMeadowObj.id, { isFilled: filled });
    }
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
    setViewportTarget((prev) => ({
      scale: Math.min((prev?.scale || 0.85) * 1.3, 2.2)
    }));
  };

  const handleZoomOut = () => {
    setViewportTarget((prev) => ({
      scale: Math.max((prev?.scale || 0.85) * 0.75, 0.48)
    }));
  };

  const handleResetView = () => {
    setViewportTarget({ x: GARDEN_SIZE / 2, y: GARDEN_SIZE / 2, scale: 0.85 });
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
    <div style={styles.container}>
      {/* Centered Minimalist "Neyse" */}
      <div style={styles.minimalistWrapper}>
        <h1 style={styles.minimalistText}>
          Neyse
        </h1>
      </div>

      {/* Secret Admin Dashboard (/burak or #burak) */}
      <Suspense fallback={null}>
        {isAdminOpen && (
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
            }}
            customBg={customBg}
            onUpdateCustomBg={handleUpdateCustomBg}
            isMelancholyMode={isMelancholyMode}
            onToggleMelancholyMode={handleToggleMelancholyMode}
          />
        )}
      </Suspense>

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
  container: {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#0f1115',
    backgroundImage: 'radial-gradient(ellipse at center, #15181f 0%, #0a0b0e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none'
  },
  minimalistWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '24px',
    animation: 'fadeIn 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  },
  minimalistText: {
    fontFamily: "'EB Garamond', Garamond, Georgia, serif",
    fontSize: 'clamp(4.2rem, 9.5vw, 7.5rem)',
    fontWeight: 400,
    fontStyle: 'normal',
    color: '#e4e7ec',
    letterSpacing: '0.04em',
    lineHeight: 1.1,
    margin: 0,
    padding: 0,
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    opacity: 0.95,
    transition: 'opacity 0.5s ease'
  },
  toast: {
    position: 'fixed',
    bottom: 30,
    left: '50%',
    transform: 'translateX(-50%)',
    maxWidth: 420,
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
