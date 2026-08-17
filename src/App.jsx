import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import MeadowCanvas from './components/MeadowCanvas';
import GardenHUD from './components/GardenHUD';
import FlowerDrawerModal from './components/FlowerDrawerModal';
import FlowerPopup from './components/FlowerPopup';
import SearchModal from './components/SearchModal';
import DeleteCodeModal from './components/DeleteCodeModal';
import MelancholyQuoteModal from './components/MelancholyQuoteModal';
import WindBlownPaper from './components/WindBlownPaper';
import ScreenCracks from './components/ScreenCracks';
import ReachingHands from './components/ReachingHands';
import BurningTreeWithRoots from './components/BurningTreeWithRoots';
import FountainPenWriter from './components/FountainPenWriter';

// Lazy load admin components into a separate dynamic chunk (Never loaded by normal visitors!)
const AdminDashboardModal = lazy(() => import('./components/AdminDashboardModal'));
const AdminFloatingToolbar = lazy(() => import('./components/AdminFloatingToolbar'));
import { Check, X, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
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

const LETTER_SECTIONS = [
  {
    id: 'intro',
    isIntro: true,
    text: 'Neyse'
  },
  {
    id: 'p1',
    isIntro: false,
    text: 'belki bu satırlar hiçbir zaman sana ulaşmayacak, belki de ulaştığında kalbinin kıyısına bile değmeden rüzgârda kaybolacak. yine de yazıyorum; çünkü içimde fırtınalar koparan bu kırgınlığı da, seni her an yeniden çağıran bu devasa özlemi de artık tek başıma taşımakta zorlanıyorum.'
  },
  {
    id: 'p2',
    isIntro: false,
    text: 'sana kırgınım. sadece aramızdaki mesafe için değil; zamanın aramıza ördüğü o sessiz ve soğuk duvarlar için, bitmemiş cümlelerin gölgesinde terk edildiğim için kırgınım. sol tarafımda taşıdığım o cam kırıkları, ne zaman adını hatırlasam canımı yakıyor. kırılan bir şeyin ilk günkü gibi durmayacağını bile bile, o kırıkların arasından sızan ışığa bakıp duruyorum. kalbim seni affetmek ile sana kırılmak arasında sıkışıp kaldı; ama ne gariptir ki, en çok da kırıldığı yerden yine sana uzanmak istiyor.'
  },
  {
    id: 'p3',
    isIntro: false,
    text: 'çünkü özlem, kırgınlıktan daha büyük bir gölge gibi kaplıyor ruhumu. sesinin zihnimde bıraktığı yankıyı, gözlerinin dokunduğu anlardaki o sessiz huzuru arıyorum. bir insanın hem en çok incindiği hem de en çok sığınmak istediği limanın aynı kişi olması nasıl bir çelişkidir, bilmiyorum. sen benim hem acım hem de iyileşmek istediğim tek yersin.'
  },
  {
    id: 'p4',
    isIntro: false,
    text: 'eğer bir gün bu mektubu okursan bil ki, sana kızgın değilim; sadece özlemenin ağır yükü altında bükülmüş bir ruhun feryadıdır bu. bir fırtına koptu, ağacımızın dalları kırıldı belki; ama kökleri hâlen o toprağın derinliklerinde seni bekliyor.'
  },
  {
    id: 'p5',
    isIntro: false,
    text: 'sen neredesin, nasılsın bilmiyorum ama ben hâlâ kaldığım o son cümlede, seni içimde taşımaya devam ediyorum.'
  },
  {
    id: 'p6_food',
    isIntro: false,
    isInteractive: true,
    text: 'sen o yemeği iyi bilirsin.'
  }
];

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

  // Special Guest Interactive Food Answer ("Süt Çorbası") State
  const [foodInput, setFoodInput] = useState('');
  const [isAysenurUnlocked, setIsAysenurUnlocked] = useState(
    () => sessionStorage.getItem('mayko_aysenur_unlocked') === 'true'
  );

  const normalizeFoodAnswer = (str = '') => {
    return str
      .trim()
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');
  };

  const handleFoodInputChange = (e) => {
    const val = e.target.value;
    setFoodInput(val);
    const norm = normalizeFoodAnswer(val);
    if (
      norm === 'sutcorbasi' ||
      norm === 'sutcorba' ||
      norm === 'sutcorbas' ||
      norm.includes('sutcorba')
    ) {
      sessionStorage.setItem('mayko_aysenur_unlocked', 'true');
      setIsAysenurUnlocked(true);
      postLogToApi('special_guest_unlocked', {
        action: 'Ayşenur Özel Mesajı Açıldı ("sen o yemeği iyi bilirsin")',
        answer: val,
        device: detectClientDevice(),
        is_aysenur: true
      });
    }
  };

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

  // Scroll-Driven Animation State
  const [scrollProgress, setScrollProgress] = useState(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScrollable = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      if (totalScrollable > 0) {
        const fraction = Math.min(Math.max(window.scrollY / totalScrollable, 0), 1);
        targetProgressRef.current = fraction * (LETTER_SECTIONS.length - 1);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    let animId;
    const tick = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0001) {
        currentProgressRef.current += diff * 0.14;
        setScrollProgress(currentProgressRef.current);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

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
    showToast(newMode ? '🥀 Hüzün Modu açıldı' : '🌸 Hüzün Modu kapatıldı');
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

  // If unlocked with the secret food answer ("Süt Çorbası"), render new start screen
  if (isAysenurUnlocked) {
    return (
      <div style={styles.aysenurContainer} className="animate-fade-in">
        {/* Top Centered Subtle Return Icon */}
        <button
          onClick={() => {
            sessionStorage.removeItem('mayko_aysenur_unlocked');
            setIsAysenurUnlocked(false);
            setFoodInput('');
          }}
          style={styles.aysenurReturnBtn}
          title="Mektuba geri dön"
          aria-label="Mektuba geri dön"
        >
          <ChevronUp size={22} strokeWidth={1.5} />
        </button>

        <div style={styles.aysenurContentWrapper}>
          <h1 style={styles.aysenurHeading}>
            Ayşenur, ben seni gerçekten de çok özledim.
          </h1>
        </div>

        {/* Bottom Centered Scroll Down Section */}
        <div style={styles.scrollHint}>
          <span style={styles.scrollHintText}>kaydırın</span>
          <ChevronDown size={15} style={{ animation: 'bounceSubtle 2s infinite' }} />
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
      </div>
    );
  }

  return (
    <div style={styles.pageScrollTrack}>
      {/* Fixed Fullscreen Sticky Stage */}
      <div style={styles.fixedViewport}>
        {LETTER_SECTIONS.map((section, idx) => {
          const dist = scrollProgress - idx;
          const absDist = Math.abs(dist);

          let opacity = 0;
          let translateY = 0;
          let blur = 0;
          let pointerEvents = 'none';

          if (absDist < 0.6) {
            opacity = Math.max(0, Math.pow(Math.cos((absDist / 0.6) * (Math.PI / 2)), 1.5));
            translateY = dist * -32;
            blur = Math.max(0, (absDist - 0.16) * 3.5);
            if (absDist < 0.35) pointerEvents = 'auto';
          }

          if (opacity <= 0) return null;

          return (
            <div
              key={section.id}
              style={{
                ...styles.sectionContainer,
                opacity,
                transform: `translateY(${translateY}px)`,
                filter: blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : 'none',
                pointerEvents
              }}
            >
              <div style={styles.contentBox}>
                {section.isIntro ? (
                  <h1 style={styles.introHeading}>
                    {section.text}
                  </h1>
                ) : section.id === 'p5' ? (
                  <FountainPenWriter
                    text={section.text}
                    scrollProgress={scrollProgress}
                  />
                ) : section.id === 'p6_food' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
                    <p style={{ ...styles.paragraphText, textAlign: 'center', padding: 0 }}>
                      {section.text}
                    </p>
                    <input
                      type="text"
                      value={foodInput}
                      onChange={handleFoodInputChange}
                      placeholder=""
                      style={styles.foodInput}
                      autoComplete="off"
                      spellCheck={false}
                      autoFocus
                    />
                  </div>
                ) : (
                  <p style={styles.paragraphText}>
                    {section.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* 3D Wind-Blown Paper Animation across Paragraph 1 */}
        <WindBlownPaper scrollProgress={scrollProgress} />

        {/* Dynamic Glowing Glass Cracks Animation across Paragraph 2 */}
        <ScreenCracks scrollProgress={scrollProgress} />

        {/* Two Reaching & Clasping Hands Animation across Paragraph 3 */}
        <ReachingHands scrollProgress={scrollProgress} />

        {/* Burning Tree with Falling Branch and Growing Roots across Paragraph 4 */}
        <BurningTreeWithRoots scrollProgress={scrollProgress} />

        {/* Delicate Scroll Down Hint (Fades out when scrolling begins) */}
        <div
          style={{
            ...styles.scrollHint,
            opacity: Math.max(0, 1 - scrollProgress / 0.25),
            pointerEvents: 'none'
          }}
        >
          <span style={styles.scrollHintText}>kaydırın</span>
          <ChevronDown size={15} style={{ animation: 'bounceSubtle 2s infinite' }} />
        </div>
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
  // Height creates the scroll timeline length (160vh per stage for a relaxed, poetic writing tempo)
  pageScrollTrack: {
    width: '100%',
    height: `${LETTER_SECTIONS.length * 160}vh`,
    backgroundColor: '#0f1115'
  },
  fixedViewport: {
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
  sectionContainer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    transition: 'filter 0.1s ease-out',
    willChange: 'opacity, transform, filter'
  },
  contentBox: {
    maxWidth: 720,
    width: '100%',
    margin: '0 auto'
  },
  introHeading: {
    fontFamily: "'Cardo', Georgia, serif",
    fontSize: 'clamp(4.2rem, 9.5vw, 7.5rem)',
    fontWeight: 400,
    fontStyle: 'normal',
    color: '#e4e7ec',
    letterSpacing: '0.04em',
    lineHeight: 1.1,
    textAlign: 'center',
    margin: 0,
    padding: 0,
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    opacity: 0.95
  },
  paragraphText: {
    fontFamily: "'Cardo', Georgia, serif",
    fontSize: 'clamp(1.18rem, 2.1vw, 1.48rem)',
    fontWeight: 400,
    fontStyle: 'italic',
    color: '#e2e5eb',
    textAlign: 'left',
    lineHeight: 1.9,
    letterSpacing: '0.015em',
    margin: 0,
    padding: '0 10px',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    opacity: 0.94
  },
  scrollHint: {
    position: 'absolute',
    bottom: 28,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    color: 'rgba(228, 231, 236, 0.42)',
    transition: 'opacity 0.3s ease'
  },
  scrollHintText: {
    fontFamily: "'Cardo', Georgia, serif",
    fontSize: '0.78rem',
    letterSpacing: '0.14em',
    textTransform: 'lowercase',
    fontStyle: 'italic'
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
  },
  foodInput: {
    width: '100%',
    maxWidth: 280,
    padding: '12px 24px',
    backgroundColor: '#0a0b0e',
    color: '#f8fafc',
    fontFamily: "'Cardo', Georgia, serif",
    fontSize: '1.15rem',
    textAlign: 'center',
    borderRadius: '9999px',
    border: '1px solid rgba(255, 255, 255, 0.45)',
    outline: 'none',
    boxShadow: '0 0 20px rgba(255, 255, 255, 0.06), inset 0 2px 4px rgba(0, 0, 0, 0.6)',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    letterSpacing: '0.04em'
  },
  aysenurContainer: {
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
    userSelect: 'none',
    padding: '24px'
  },
  aysenurContentWrapper: {
    maxWidth: 960,
    width: '100%',
    textAlign: 'center',
    animation: 'fadeIn 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
  },
  aysenurHeading: {
    fontFamily: "'Cardo', Georgia, serif",
    fontSize: 'clamp(2.4rem, 5.8vw, 4.5rem)',
    fontWeight: 400,
    fontStyle: 'normal',
    color: '#e4e7ec',
    letterSpacing: '0.03em',
    lineHeight: 1.25,
    margin: 0,
    padding: 0,
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    opacity: 0.96
  },
  aysenurReturnBtn: {
    position: 'absolute',
    top: 36,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'none',
    border: 'none',
    color: 'rgba(228, 231, 236, 0.42)',
    cursor: 'pointer',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.25s ease, transform 0.25s ease',
    zIndex: 20
  }
};
