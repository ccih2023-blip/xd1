
import React, { useState, useEffect } from 'react';
import MapContainer from './components/MapContainer';
import PoemModal from './components/PoemModal';
import PoetPortal from './components/PoetPortal';
import ArchivePopup from './components/ArchivePopup';
import { PoemLocation, UserProfile, AppRole, AppTheme } from './types';
import { supabase, getUserProfile } from './services/supabase';
import { INITIAL_LOCATIONS } from './constants';

const App: React.FC = () => {
  const [locations, setLocations] = useState<PoemLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<PoemLocation | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [theme, setTheme] = useState<AppTheme>('vivid');
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isPortalOpen, setIsPortalOpen] = useState(false);

  const [archivePopupData, setArchivePopupData] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    fetchLocationsAndHandleDeepLink();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const fetchLocationsAndHandleDeepLink = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('publishDate', { ascending: false });

    const allLocations = data || INITIAL_LOCATIONS;
    setLocations(allLocations);

    const urlParams = new URLSearchParams(window.location.search);
    const locId = urlParams.get('id');

    if (locId) {
      const deepLoc = allLocations.find(l => l.id === locId);
      if (deepLoc) {
        setSelectedLocation(deepLoc);
      }
    }
  };

  const fetchProfile = async (userId: string) => {
    const userProfile = await getUserProfile(userId);
    setProfile(userProfile);
    setTheme(userProfile?.role === 'admin' ? 'photocopy' : 'vivid');
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (authMode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPass,
        options: { data: { role: 'reader' } }
      });
      if (error) alert(error.message);
      else {
        setArchivePopupData({
           title: "تم التسجيل!",
           description: "لقد تم إنشاء حسابك الشعري بنجاح. يرجى تفعيل حسابك عبر البريد الإلكتروني للبدء في اكتشاف مخطوطات نابل.",
           asset_type: 'text'
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPass,
      });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  const handlePurchase = async (id: string) => {
    if (!profile || profile.role === 'admin') return;
    const loc = locations.find(l => l.id === id);
    if (!loc || profile.balance < loc.price) {
      setArchivePopupData({
        title: "رصيد غير كافٍ",
        description: "تحتاج إلى المزيد من الياسمين الرقمي لفك قفل هذه المخطوطة.",
        asset_type: 'text'
      });
      return;
    }

    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: profile.balance - loc.price })
      .eq('id', session.user.id);

    if (balanceError) return;

    setLocations(prev => prev.map(l => 
      l.id === id ? { ...l, isPurchased: true } : l
    ));
    setProfile(prev => prev ? { ...prev, balance: prev.balance - loc.price } : null);
    
    if (selectedLocation?.id === id) {
      setSelectedLocation(prev => prev ? { ...prev, isPurchased: true } : null);
    }

    setArchivePopupData({
      title: "تم فك الشفرة!",
      description: `لقد تم شراء المخطوطة بنجاح.`,
      asset_type: 'text'
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (isPlacementMode && profile?.role === 'admin') {
      setPendingCoords({ lat, lng });
      setIsPortalOpen(true);
      setIsPlacementMode(false);
    }
  };

  const addNewLocation = (newLoc: PoemLocation) => {
    setLocations(prev => [newLoc, ...prev]);
    setPendingCoords(null);
    setIsPortalOpen(false);
    setArchivePopupData({
      title: "إطلاق ناجح",
      description: `تم إرساء الموقع الجديد "${newLoc.name}" بنجاح.`,
      asset_type: 'text'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f4f1ea]">
        <div className="text-center animate-ink">
          <div className="w-24 h-24 border-8 border-t-[#1B4D89] rounded-full animate-spin mb-6"></div>
          <p className="text-2xl font-black calligraphy-font">جاري استرجاع الأرشيف...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f4f1ea] p-6 text-right" dir="rtl">
        <ArchivePopup 
          isOpen={archivePopupData !== null} 
          onClose={() => setArchivePopupData(null)} 
          data={archivePopupData}
          theme={theme}
        />
        <div className="mb-12 text-center animate-ink">
          <h1 className="text-6xl md:text-8xl font-black calligraphy-font text-[#1B4D89] mb-4">أرشيف نابل</h1>
          <p className="text-xl font-bold opacity-60 uppercase tracking-[0.3em]">بوابة الإرساء الشعري الرقمي</p>
        </div>

        <div className="max-w-md w-full animate-text-reveal">
          <form onSubmit={handleAuth} className="bg-white border-8 border-black p-10 shadow-[15px_15px_0px_0px_#1B4D89]">
            <h2 className="text-4xl font-black text-[#1B4D89] mb-8 calligraphy-font">
              {authMode === 'login' ? 'الولوج للمخطوطات' : 'الانضمام للأرشيف'}
            </h2>
            <div className="space-y-6">
              <input 
                type="email" 
                placeholder="البريد الإلكتروني" 
                className="w-full p-4 border-4 border-black outline-none font-bold"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                required
              />
              <input 
                type="password" 
                placeholder="كلمة المرور" 
                className="w-full p-4 border-4 border-black outline-none font-bold"
                value={authPass}
                onChange={e => setAuthPass(e.target.value)}
                required
              />
              <button 
                type="submit"
                className="w-full py-4 bg-[#1B4D89] text-white border-4 border-black font-black text-xl hover:bg-orange-400 transition-colors"
              >
                {authMode === 'login' ? 'دخول' : 'تسجيل جديد'}
              </button>
            </div>
            <p className="mt-8 text-center font-bold">
              {authMode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
              <button 
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-[#1B4D89] underline"
              >
                اضغط هنا
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-all duration-700" dir="rtl">
      <ArchivePopup 
        isOpen={archivePopupData !== null} 
        onClose={() => setArchivePopupData(null)} 
        data={archivePopupData}
        theme={theme}
      />
      
      <header className={`sticky top-0 z-40 border-b-8 py-4 px-6 md:px-12 flex justify-between items-center transition-all ${
        profile?.role === 'admin' 
        ? 'bg-black border-white text-white shadow-2xl' 
        : 'bg-[#1B4D89] border-[#f4c430] text-white shadow-xl'
      }`}>
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => supabase.auth.signOut()}>
          <div className={`w-12 h-12 flex items-center justify-center border-4 transition-transform group-hover:rotate-12 ${profile?.role === 'admin' ? 'bg-white text-black border-white' : 'bg-white text-[#1B4D89] border-white'}`}>
             <span className="text-2xl font-black">{profile?.role === 'admin' ? 'A' : 'P'}</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-2xl font-black calligraphy-font leading-none">
              {profile?.role === 'admin' ? 'إدارة الأرشيف' : (profile?.name || 'رواق نابل')}
            </h1>
            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] opacity-60">
              {session.user.email}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          {deferredPrompt && (
            <button onClick={handleInstallClick} className="hidden md:flex items-center gap-2 px-6 py-2 bg-[#f4c430] text-[#1B4D89] border-4 border-white font-black text-xs animate-bounce">
              تثبيت التطبيق
            </button>
          )}

          <button 
            onClick={() => setIsPortalOpen(true)}
            className={`px-8 py-3 border-4 font-black transition-all text-sm bg-white text-black border-white hover:bg-orange-400`}
          >
            استوديو الشاعر
          </button>

          {profile?.role === 'admin' && (
            <button 
              onClick={() => setIsPlacementMode(!isPlacementMode)}
              className={`px-8 py-3 border-4 font-black transition-all text-sm ${isPlacementMode ? 'bg-red-500 border-white text-white animate-pulse' : 'bg-white text-black border-white'}`}
            >
              {isPlacementMode ? 'إلغاء الإرساء' : 'إرساء جديد +'}
            </button>
          )}

          {/* Fix: Line 294 - Comparison between boolean and string corrected */}
          {profile?.role !== 'admin' && (
            <div className="bg-white/10 border-4 border-white/20 px-6 py-2 rounded-xl flex flex-col items-center">
               <span className="text-2xl font-black">{profile?.balance || 0}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <MapContainer 
              locations={locations} 
              onSelect={setSelectedLocation} 
              onMapClick={handleMapClick}
              isPlacementMode={isPlacementMode}
              theme={theme}
            />
          </div>

          <div className="space-y-8">
            <h3 className={`text-3xl font-black border-b-8 pb-4 calligraphy-font ${profile?.role === 'admin' ? 'text-black border-black' : 'text-[#1B4D89] border-[#1B4D89]'}`}>
              {profile?.role === 'admin' ? 'سجل المخطوطات' : 'فهرس المكتشفات'}
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {locations.map(loc => (
                <div 
                  key={loc.id} 
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-5 border-4 transition-all cursor-pointer flex items-center justify-between group ${
                    selectedLocation?.id === loc.id 
                    ? (profile?.role === 'admin' ? 'bg-black text-white' : 'bg-[#1B4D89] text-white') 
                    : 'bg-white text-gray-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-black text-xl calligraphy-font leading-tight">{loc.name}</span>
                    <span className="text-[10px] opacity-60 font-mono font-bold uppercase mt-2">BY: {loc.poet}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {selectedLocation && (
        <PoemModal 
          location={selectedLocation} 
          onClose={() => {
            setSelectedLocation(null);
            window.history.replaceState({}, '', window.location.origin + window.location.pathname);
          }} 
          onPurchase={handlePurchase}
          walletBalance={profile?.balance || 0}
          theme={theme}
          isAdminView={profile?.role === 'admin'}
        />
      )}

      {isPortalOpen && (
        <PoetPortal 
          coords={pendingCoords} 
          onClose={() => { setIsPortalOpen(false); setPendingCoords(null); }} 
          onAddLocation={addNewLocation}
          theme={theme}
          profile={profile}
          onProfileUpdate={(updated) => setProfile(prev => ({ ...prev!, ...updated }))}
        />
      )}

      <footer className="p-12 text-center font-mono text-[10px] uppercase tracking-[0.5em] mt-20 bg-[#1B4D89] text-white border-t-8 border-[#f4c430]">
         NABEUL POETRY MAP // SYSTEM ROLE: {profile?.role?.toUpperCase()} // 2024
      </footer>
    </div>
  );
}

export default App;
