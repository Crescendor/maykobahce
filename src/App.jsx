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
import RosePetals from './components/RosePetals';
import LastLetterPage from './components/LastLetterPage';

// Lazy load admin components into a separate dynamic chunk (Never loaded by normal visitors!)
const AdminDashboardModal = lazy(() => import('./components/AdminDashboardModal'));
const AdminFloatingToolbar = lazy(() => import('./components/AdminFloatingToolbar'));
import { Check, X, Sparkles, ChevronDown } from 'lucide-react';
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
  },
  // =========================================================================
  // EXTENDED AYŞENUR LETTER SECTIONS (Unlocked by "Süt Çorbası")
  // =========================================================================
  {
    id: 'ays_title',
    isAysenurHeading: true,
    text: 'Ayşenur, ben seni gerçekten de çok özledim.'
  },
  {
    id: 'ays_1',
    text: 'Eğer buraya kadar geldiysen, teşekkür ederim.'
  },
  {
    id: 'ays_2',
    text: 'Sana, seni hayallerimden bile kaybetmekten korktuğum o yerden sesleniyorum. Son cümlenin de ötesinde, kelimelerin artık yetmediği, insanın kendi içinde kaybolduğu bir yerden… Bir çölün ortasında, susuzluğunu bile unutmuşken uzakta bir ışık görür gibi.'
  },
  {
    id: 'ays_3',
    text: 'Zorlu bir süreç yaşadığını biliyorum Ayşenur. Zorlu bir hayatın, ağır sorumlulukların ve bazen insanın kendi omuzlarının bile taşıyamadığı kadar yükün olduğunu biliyorum. Belki de bu yüzden, sana dair hissettiğim şeyleri hiçbir zaman yalnızca güzel günlere sığdıramadım. Çünkü benim hayatımın en güzel hislerinden bazıları, senin hayatının en zor zamanlarının içinde doğdu. Seni tanımak, sana sarılmak, sesini duymak, bir anlığına bile olsa bütün dünyanın sustuğunu hissetmek… Bunların hepsi benim için hâlâ çok gerçek.'
  },
  {
    id: 'ays_4',
    text: 'İnsan bazen birini kaybettiğinde, onun hayatındaki yerini değil, kendi hayatında bıraktığı boşluğu fark ediyor. Ben seni özlerken yalnızca seni değil; seninle birlikte olduğum hâlimi de özlüyorum. Birlikte güldüğümüz o küçük anları, hiçbir anlamı olmayan konuşmalarımızı, sesindeki o tanıdık tonu, sana bir şey anlatırken yüzündeki ifadeyi… Hatta bazen hiçbir şey yapmadan yan yana durmayı bile.'
  },
  {
    id: 'ays_5',
    text: 'Ve bazı insanlar insanın içinde öyle bir yere dokunuyor ki, yoklukları bile varlıkları kadar gerçek oluyor. Sen benim içimde tam da böyle bir yerdesin.'
  },
  {
    id: 'ays_6',
    text: 'Sana kızdığım, kırıldığım, sustuğum zamanlar oldu. Belki senin de bana karşı aynı duyguları yaşadığın zamanlar oldu. Ama bütün o kırgınlıkların altında değişmeyen tek bir şey vardı: Seni gerçekten sevmiş olmam. Şimdi aramızdaki sessizlikte bunu daha açık görebiliyorum. İçimde kalan en güçlü şey kızgınlık değil, özlem.'
  },
  {
    id: 'ays_7',
    isEmphasis: true,
    text: 'Ayşenur, seni özlüyorum.'
  },
  {
    id: 'ays_8',
    text: 'Hem de bunu kendime itiraf etmemeye çalıştığım anlarda bile. Gün içinde bir şey görüyorum, bir şarkı duyuyorum, aklımdan sana dair küçücük bir an geçiyor ve içimde tarif edemediğim bir eksiklik beliriyor. Sanki hayat devam ediyor ama senin olduğun yer hâlâ olduğu gibi duruyor.'
  },
  {
    id: 'ays_9',
    text: 'Bazen keşke bazı şeyleri daha farklı yapabilseydik diyorum. Keşke birbirimizi kaybetmek zorunda kalmadan birbirimizi anlayabilseydik. Keşke hayat, ikimizin de en zor zamanlarında karşımıza daha kolay bir yol çıkarabilseydi. Keşke bazı cümleleri söylemeden önce birbirimize biraz daha sarılabilseydik.'
  },
  {
    id: 'ays_10',
    text: 'Ama geçmişi değiştiremiyorum. Söylenenleri geri alamıyorum. Yaşananları da yok saymak istemiyorum. Çünkü bütün bunların içinde, sana duyduğum sevgi de var. Ve ben o sevgiyi inkâr ederek kendime dürüst olamam.'
  },
  {
    id: 'ays_11',
    text: 'Senden vazgeçmiş gibi davranmayı öğrenebilirim belki. Susabilirim, bekleyebilirim, kendimi başka şeylere verebilirim. Hayatıma devam edebilirim. Ama kalbime seni özlememeyi emredemiyorum.'
  },
  {
    id: 'ays_12',
    text: 'Belki şu an bunların hiçbirinin senin için bir anlamı yoktur. Belki şu sıralar kendi içinde çözmeye çalıştığın çok daha büyük şeyler vardır. Belki aramızdaki sessizlik, ikimizin de ne hissettiğini anlamaya çalıştığı bir zamandır. Bilmiyorum.'
  },
  {
    id: 'ays_13',
    text: 'Ama bildiğim bir şey var: Ben hâlâ seni düşünüyorum. Hâlâ seni merak ediyorum. Hâlâ iyi olmanı istiyorum. Ve bütün bunların arasında, içimde küçücük de olsa bir inanç taşıyorum.'
  },
  {
    id: 'ays_14',
    isEmphasis: true,
    text: 'Bu yaşananların bizim hikâyemizin son cümlesi olduğuna inanmıyorum.'
  },
  {
    id: 'ays_15',
    text: 'Belki bir gün yeniden karşılaşırız. Belki yeniden konuşuruz. Belki o gün birbirimize bugün olduğumuzdan daha farklı bakarız. Belki ikimiz de bazı şeyleri daha iyi anlamış oluruz. Belki her şey eskisi gibi olmaz; belki eskisinden çok daha güzel olur.'
  },
  {
    id: 'ays_16',
    text: 'Ben o ihtimali hâlâ kalbimin bir köşesinde saklıyorum.'
  },
  {
    id: 'ays_17',
    text: 'Çünkü seni özlemek bana yalnızca yokluğunu hissettirmiyor. Aynı zamanda, bir gün yeniden karşılaşacağımız ihtimalini de hatırlatıyor.'
  },
  {
    id: 'ays_18',
    text: 'Ve eğer o gün gerçekten gelirse, senden geçmişte kalan hiçbir hesabı istemek istemiyorum. Sana “neden?” diye sormak da istemiyorum. Sadece karşında durup, bunca şeyin ardından hâlâ içimde sana ait bir yer olduğunu söylemek istiyorum.'
  },
  {
    id: 'ays_19',
    isShort: true,
    text: 'Belki sana yeniden sarılmak…'
  },
  {
    id: 'ays_20',
    isShort: true,
    text: 'Belki gözlerinin içine bakıp hiçbir şey söylemeden, o anın ikimize de yetmesine izin vermek…'
  },
  {
    id: 'ays_21',
    isShort: true,
    text: 'Ve belki de sana sadece şunu söylemek:'
  },
  {
    id: 'ays_22',
    isEmphasis: true,
    text: '“Ben seni özlemeyi hiç bırakmadım.”'
  },
  {
    id: 'ays_23',
    text: 'Bilmiyorum hayat bizi nereye götürecek, Ayşenur. Ama bildiğim bir şey var; ben bu hikâyenin yeniden güzel bir yere varabileceğine inanıyorum.'
  },
  {
    id: 'ays_24',
    isShort: true,
    text: 'Belki bugün değil.'
  },
  {
    id: 'ays_25',
    isShort: true,
    text: 'Belki yarın da değil.'
  },
  {
    id: 'ays_26',
    isShort: true,
    text: 'Ama bir gün…'
  },
  {
    id: 'ays_27',
    text: 'Eğer yollarımız yeniden kesişirse, ben o günün tesadüf olduğuna inanmayacağım.'
  },
  {
    id: 'ays_28',
    text: 'Çünkü bazı insanlar hayatımıza sadece gelip geçmek için girmez.'
  },
  {
    id: 'ays_29',
    text: 'Bazıları, insanın içinde bir yer bırakır.'
  },
  {
    id: 'ays_30',
    text: 'Sen de benim içimde, hâlâ sana ayrılmış o yerde duruyorsun.'
  },
  {
    id: 'ays_finale',
    isFinaleHeading: true,
    text: 'Seni çok özlüyorum ve seni hâlâ çok seviyorum'
  },
  {
    id: 'ays_compose',
    isComposer: true
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
  const [isFoodCorrect, setIsFoodCorrect] = useState(
    () => sessionStorage.getItem('mayko_aysenur_unlocked') === 'true'
  );

  // SPA Route Handling - Always route directly to /last page
  const [currentPath, setCurrentPath] = useState('/last');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/last') {
      try {
        window.history.replaceState(null, '', '/last');
      } catch (e) {}
    }
  }, []);

  // Webhook milestone tracking refs (Triggered once per visitor)
  const hasLoggedFirstScroll = useRef(false);
  const hasLoggedAysenurReached = useRef(false);
  const hasLoggedBottomReached = useRef(false);

  const getDeviceId = useCallback(() => {
    let id = localStorage.getItem('mayko_persistent_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      localStorage.setItem('mayko_persistent_device_id', id);
    }
    return id;
  }, []);

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

  const foodLogTimerRef = useRef(null);

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
      if (foodLogTimerRef.current) clearTimeout(foodLogTimerRef.current);
      sessionStorage.setItem('mayko_aysenur_unlocked', 'true');
      setIsFoodCorrect(true);
      postLogToApi('sut_corbasi_unlocked', {
        action: 'Süt Çorbası Şifresi Çözüldü & Evine Hoş Geldin Ekranı Açıldı',
        answer: val,
        deviceId: getDeviceId(),
        device: detectClientDevice(),
        is_aysenur: true
      });

      // Smoothly advance just to Section 7 ("Ayşenur, ben seni gerçekten de çok özledim.")
      setTimeout(() => {
        const totalScrollable = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
        const targetScrollY = (7 / (LETTER_SECTIONS.length - 1)) * totalScrollable;
        window.scrollTo({
          top: targetScrollY,
          behavior: 'smooth'
        });
      }, 1200);
    } else if (val.trim().length > 1) {
      if (foodLogTimerRef.current) clearTimeout(foodLogTimerRef.current);
      foodLogTimerRef.current = setTimeout(() => {
        postLogToApi('food_input_typed', {
          action: 'Yemek Kutusuna Cevap Denendi',
          answer: val.trim(),
          deviceId: getDeviceId(),
          device: detectClientDevice(),
          is_aysenur: false
        });
      }, 1800);
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
  const currentSections = isFoodCorrect ? LETTER_SECTIONS : LETTER_SECTIONS.slice(0, 7);
  const [scrollProgress, setScrollProgress] = useState(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const loggedSectionsRef = useRef(new Set());

  // Session & Exit Analytics Refs
  const sessionStartTimeRef = useRef(Date.now());
  const currentStageLabelRef = useRef('Başlangıç / 1. Paragraf');
  const currentScrollPercentRef = useRef('0%');
  const hasSentExitLogRef = useRef(false);

  useEffect(() => {
    // Immediate physical wheel / touch gesture listener for the very first scroll
    const handleFirstPhysicalScroll = () => {
      if (!hasLoggedFirstScroll.current) {
        hasLoggedFirstScroll.current = true;
        postLogToApi('first_scroll_started', {
          action: 'Ziyaretçi Sayfayı Kaydırmaya Başladı',
          scrollStatus: 'Kaydırma Yaptı (Sayfada İlerliyor)',
          stage: 'Başlangıç / 1. Paragraf',
          scrollPercentage: '1%',
          deviceId: getDeviceId(),
          device: detectClientDevice(),
          screenRes: `${window.innerWidth}x${window.innerHeight}`
        });
      }
    };

    window.addEventListener('wheel', handleFirstPhysicalScroll, { passive: true, once: true });
    window.addEventListener('touchmove', handleFirstPhysicalScroll, { passive: true, once: true });

    const handleScroll = () => {
      const totalScrollable = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      if (totalScrollable > 0) {
        const fraction = Math.min(Math.max(window.scrollY / totalScrollable, 0), 1);
        targetProgressRef.current = fraction * (currentSections.length - 1);

        // 1. Webhook: First scroll trigger (only once per visitor)
        if (!hasLoggedFirstScroll.current && fraction > 0.002) {
          hasLoggedFirstScroll.current = true;
          postLogToApi('first_scroll_started', {
            action: 'Ziyaretçi Sayfayı Kaydırmaya Başladı',
            scrollStatus: 'Kaydırma Yaptı (Sayfada İlerliyor)',
            stage: 'Başlangıç / 1. Paragraf',
            scrollPercentage: `${Math.round(fraction * 100)}%`,
            deviceId: getDeviceId(),
            device: detectClientDevice(),
            screenRes: `${window.innerWidth}x${window.innerHeight}`
          });
        }

        // Section Milestone Tracking (Tracks intro paragraphs and all 32 Ayşenur letter paragraphs)
        const currentIdx = Math.round(targetProgressRef.current);
        if (currentIdx > 0 && !loggedSectionsRef.current.has(currentIdx)) {
          loggedSectionsRef.current.add(currentIdx);
          const sec = currentSections[currentIdx];
          if (sec) {
            const isAys = currentIdx >= 7;
            const aysIndex = currentIdx - 6;
            const stageLabel = isAys
              ? sec.isComposer
                ? '🌹 En Alt: Gül Dağları & Mektup Bırakma Bölümü'
                : sec.isAysenurHeading
                ? '🌹 Başlık: "Ayşenur, ben seni gerçekten de çok özledim."'
                : `🌹 Ayşenur Mektubu ${aysIndex}. Paragraf: "${(sec.text || '').slice(0, 42)}..."`
              : sec.isInteractive
              ? '6. Bölüm: "sen o yemeği iyi bilirsin."'
              : `${currentIdx}. Paragraf: "${(sec.text || '').slice(0, 42)}..."`;

            currentStageLabelRef.current = stageLabel;
            currentScrollPercentRef.current = `${Math.round((currentIdx / (currentSections.length - 1)) * 100)}%`;

            const statusLabel = isAys
              ? sec.isComposer
                ? 'Sayfanın En Sonuna Ulaştı'
                : `Ayşenur Mektubunu Okuyor (${aysIndex}/${currentSections.length - 7})`
              : `${currentIdx}. Paragrafta Geziniyor`;

            postLogToApi('section_reached', {
              action: `Ziyaretçi ${isAys ? 'Ayşenur Mektubunda ' + aysIndex + '. Paragrafa' : currentIdx + '. Paragrafa'} Geldi`,
              scrollStatus: statusLabel,
              stage: stageLabel,
              scrollPercentage: `${Math.round((currentIdx / (currentSections.length - 1)) * 100)}%`,
              deviceId: getDeviceId(),
              device: detectClientDevice(),
              is_aysenur: isAys
            });
          }
        }

        // 2. Webhook: Ayşenur letter reached (only once per visitor)
        if (!hasLoggedAysenurReached.current && isFoodCorrect && fraction >= 6.8 / (currentSections.length - 1)) {
          hasLoggedAysenurReached.current = true;
          postLogToApi('aysenur_letter_reached', {
            action: 'Ayşenur Mektubunu Okumaya Başladı',
            scrollStatus: 'Ayşenur Mektubunda İlerliyor',
            stage: '🌹 Başlık: "Ayşenur, ben seni gerçekten de çok özledim."',
            scrollPercentage: `${Math.round(fraction * 100)}%`,
            deviceId: getDeviceId(),
            device: detectClientDevice(),
            is_aysenur: true
          });
        }

        // 3. Webhook: Page bottom reached (only once per visitor)
        if (!hasLoggedBottomReached.current && isFoodCorrect && fraction >= 0.94) {
          hasLoggedBottomReached.current = true;
          currentStageLabelRef.current = '🌹 En Alt: Gül Dağları & Mektup Bırakma Bölümü';
          currentScrollPercentRef.current = '100%';
          postLogToApi('page_bottom_reached', {
            action: 'Sayfanın En Altına (Gül Dağları & Mektup Alanına) Ulaşıldı',
            scrollStatus: 'Sayfanın En Sonuna Ulaştı',
            stage: '🌹 En Alt: Gül Dağları & Mektup Bırakma Bölümü',
            scrollPercentage: '100%',
            deviceId: getDeviceId(),
            device: detectClientDevice(),
            is_aysenur: true
          });
        }
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
      window.removeEventListener('wheel', handleFirstPhysicalScroll);
      window.removeEventListener('touchmove', handleFirstPhysicalScroll);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, [currentSections.length, getDeviceId, isFoodCorrect]);

  // Universal Page Exit Tracker (Sends notification when ANY visitor leaves or closes the page)
  useEffect(() => {
    const handleExit = () => {
      if (getDeviceId() === 'dev_m2troqnl9_mswunr9c') return;
      if (hasLoggedFirstScroll.current && !hasSentExitLogRef.current) {
        hasSentExitLogRef.current = true;
        const durationMs = Date.now() - sessionStartTimeRef.current;
        const totalSec = Math.round(durationMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const durationStr = mins > 0 ? `${mins} dakika ${secs} saniye` : `${secs} saniye`;

        const isAys = isFoodCorrect || (currentProgressRef.current >= 6.5);
        const exitPayload = {
          action: isAys ? 'Ayşenur Sayfayı Kapattı / Ayrıldı' : 'Ziyaretçi Sayfayı Kapattı / Ayrıldı',
          stage: currentStageLabelRef.current,
          scrollPercentage: currentScrollPercentRef.current,
          scrollStatus: `Siteden Ayrıldı (Kaldığı Yer: ${currentStageLabelRef.current})`,
          duration: durationStr,
          answer: foodInput || '-',
          deviceId: getDeviceId(),
          device: detectClientDevice(),
          is_aysenur: isAys
        };

        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          try {
            const blob = new Blob([JSON.stringify({
              eventType: 'visitor_left_page',
              data: exitPayload,
              timestamp: new Date().toISOString()
            })], { type: 'application/json' });
            navigator.sendBeacon('/api/flower-logs', blob);
            return;
          } catch (e) {}
        }

        postLogToApi('visitor_left_page', exitPayload);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleExit();
      }
    };

    window.addEventListener('beforeunload', handleExit);
    window.addEventListener('pagehide', handleExit);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleExit);
      window.removeEventListener('pagehide', handleExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [foodInput, getDeviceId, isFoodCorrect]);

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

  if (currentPath === '/last') {
    return (
      <LastLetterPage
        onGoHome={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState(null, '', '/');
          }
          setCurrentPath('/');
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...styles.pageScrollTrack,
        height: `${currentSections.length * 160}vh`
      }}
    >
      {/* Fixed Fullscreen Sticky Stage */}
      <div style={styles.fixedViewport}>
        {currentSections.map((section, idx) => {
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
                    {isFoodCorrect ? (
                      <div style={styles.welcomeHomeMessage} className="animate-fade-in">
                        Evine hoş geldin..
                      </div>
                    ) : (
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
                    )}
                  </div>
                ) : section.isAysenurHeading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                    <h1 style={styles.aysenurHeading}>
                      {section.text}
                    </h1>
                  </div>
                ) : section.isFinaleHeading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                    <h1 style={styles.aysenurFinaleHeading}>
                      {section.text}
                    </h1>
                  </div>
                ) : section.isEmphasis ? (
                  <p style={styles.aysenurEmphasisText}>
                    {section.text}
                  </p>
                ) : section.isShort ? (
                  <p style={{ ...styles.paragraphText, fontSize: 'clamp(1.25rem, 2.3vw, 1.55rem)', textAlign: 'center' }}>
                    {section.text}
                  </p>
                ) : section.isComposer ? (
                  <LetterComposerSection
                    scrollProgress={scrollProgress}
                    sectionIndex={idx}
                  />
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

        {/* Continuous Swirling 3D Crimson Red Rose Petals across all Ayşenur Letter Sections (Mouse-driven during letter, auto on composer, falling behind mountains) */}
        <RosePetals scrollProgress={scrollProgress} startProgress={6.5} composerIndex={currentSections.length - 1} />

        {/* Delicate Scroll Down Hint (Fades out on scroll, reappears slightly on finale) */}
        <div
          style={{
            ...styles.scrollHint,
            opacity:
              scrollProgress < 0.3
                ? Math.max(0, 1 - scrollProgress / 0.25)
                : isFoodCorrect && scrollProgress > currentSections.length - 1.45
                ? Math.min(Math.max((scrollProgress - (currentSections.length - 1.4)) / 0.35, 0), 1)
                : 0,
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

      {/* Tester Shortcut Button for dev_m2troqnl9_mswunr9c */}
      {getDeviceId() === 'dev_m2troqnl9_mswunr9c' && (
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.history.pushState(null, '', '/last');
            }
            setCurrentPath('/last');
          }}
          style={{
            position: 'fixed',
            bottom: 75,
            right: 18,
            zIndex: 9999,
            padding: '8px 14px',
            borderRadius: 9999,
            background: 'rgba(239, 68, 68, 0.25)',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            color: '#fca5a5',
            fontSize: '0.8rem',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
          }}
        >
          🔥 /last Sayfasına Git (Test Cihazı)
        </button>
      )}

      {/* Clean UI: Audio engine completely removed as requested */}
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
  welcomeHomeMessage: {
    fontFamily: "'Cardo', Georgia, serif",
    fontSize: 'clamp(1.4rem, 2.6vw, 1.85rem)',
    fontStyle: 'italic',
    color: '#e4e7ec',
    letterSpacing: '0.04em',
    textAlign: 'center',
    padding: '12px 24px',
    textShadow: '0 0 16px rgba(255, 255, 255, 0.45)'
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
  aysenurEmphasisText: {
    fontFamily: "'Cardo', Georgia, serif",
    fontSize: 'clamp(1.4rem, 2.7vw, 1.85rem)',
    fontWeight: 400,
    fontStyle: 'italic',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 1.6,
    letterSpacing: '0.02em',
    margin: '0 auto',
    padding: '0 10px',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textShadow: '0 0 16px rgba(255, 255, 255, 0.45)'
  },
  aysenurFinaleHeading: {
    fontFamily: "'Cardo', Georgia, serif",
    fontSize: 'clamp(1.85rem, 4.4vw, 3.2rem)',
    fontWeight: 400,
    fontStyle: 'italic',
    color: '#ffffff',
    letterSpacing: '0.035em',
    lineHeight: 1.35,
    textAlign: 'center',
    margin: 0,
    padding: '0 15px',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    textShadow: '0 0 20px rgba(255, 77, 109, 0.35), 0 0 40px rgba(225, 29, 72, 0.2)'
  }
};
