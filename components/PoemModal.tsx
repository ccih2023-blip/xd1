
import React, { useState, useEffect } from 'react';
import { PoemLocation } from '../types';
import { generatePoemContent, textToSpeech, playPcmAudio } from '../services/geminiService';
import { incrementViewCount } from '../services/supabase';

interface PoemModalProps {
  location: PoemLocation;
  onClose: () => void;
  onPurchase: (id: string) => void;
  walletBalance: number;
  theme: 'vivid' | 'photocopy';
  isAdminView?: boolean;
}

const PoemModal: React.FC<PoemModalProps> = ({ location, onClose, onPurchase, walletBalance, theme, isAdminView }) => {
  const [loading, setLoading] = useState(false);
  const [poem, setPoem] = useState<string | null>(location.fullPoem || null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealProgress, setRevealProgress] = useState(isAdminView ? 100 : 0);

  const isVivid = theme === 'vivid';
  const isUnlocked = location.isPurchased || isAdminView;

  useEffect(() => {
    incrementViewCount(location.id);
    if (isUnlocked) {
      if (!poem && !location.isUserSubmitted) handleGenerate();
      if (!isAdminView) {
        const interval = setInterval(() => {
          setRevealProgress(prev => {
            if (prev >= 100) { clearInterval(interval); return 100; }
            return prev + 5;
          });
        }, 30);
        return () => clearInterval(interval);
      }
    }
  }, [isUnlocked, location.id]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const content = await generatePoemContent(location.name, location.poet);
      setPoem(content);
    } catch (e) { setError("فشل استحضار القصيدة."); } finally { setLoading(false); }
  };

  const handlePlayAudio = async () => {
    if (playing || !poem) return;
    setPlaying(true);
    try {
      const audioData = await textToSpeech(poem);
      await playPcmAudio(audioData);
    } catch (e) { setError("فشل الإلقاء الصوتي."); } finally { setPlaying(false); }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 space-overlay transition-all duration-700`}>
      <div className="animate-ink w-full max-w-6xl relative">
        <div className={`min-h-[700px] flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,255,255,0.2)] overflow-hidden border-2 transition-all duration-700 ${
          isVivid ? 'bg-[#111] border-[#00ffff] rounded-[3rem]' : 'bg-white border-black photocopy-effect'
        }`} style={{ opacity: isUnlocked ? revealProgress/100 : 1 }}>
          
          <div className={`w-full md:w-5/12 relative overflow-hidden group bg-black`}>
            {isUnlocked && (location.muralUrl || location.thumbnail_url) ? (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.muralUrl || location.thumbnail_url})` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                 <div className={`text-[15rem] font-black mb-4 opacity-5 select-none ${isVivid ? 'text-[#00ffff]' : 'text-white'}`}>ن</div>
              </div>
            )}
            
            <div className="absolute bottom-12 right-12 left-12 text-white z-10 text-right">
              <h3 className={`text-5xl md:text-6xl font-black calligraphy-font leading-tight ${isVivid ? 'neon-text' : ''}`}>{location.name}</h3>
              <p className="text-lg opacity-80 mt-6 font-medium leading-relaxed">{location.description}</p>
            </div>
          </div>

          <div className={`flex-1 flex flex-col relative ${isVivid ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
            <div className={`p-10 border-b-2 flex justify-between items-center ${isVivid ? 'border-white/5 bg-white/5' : 'border-black'}`}>
              <div className="flex flex-col text-right">
                <span className="text-[10px] opacity-40 font-mono font-bold tracking-widest uppercase text-white/40">VIEW COUNT: {location.views || 0}</span>
                <span className={`text-3xl font-black ${isVivid ? 'text-white' : 'text-black'}`}>{location.poet}</span>
              </div>
              <button onClick={onClose} className={`p-2 transition-all hover:scale-125 ${isVivid ? 'text-white/50 hover:text-white' : 'text-black hover:invert'}`}>
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-10 md:p-16 flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-center items-center text-center">
              {!isUnlocked ? (
                <div className="w-full max-w-md animate-text-reveal">
                  <div className={`p-12 border-2 border-dashed mb-12 relative overflow-hidden ${isVivid ? 'border-[#00ffff]/20 bg-[#00ffff]/5' : 'border-gray-200'}`}>
                    <div className="poetry-font text-5xl italic opacity-20 select-none blur-[12px] text-white">{location.preview}</div>
                  </div>
                  <button onClick={() => onPurchase(location.id)} disabled={walletBalance < location.price} className={`w-full py-8 font-black text-3xl border-2 transition-all ${walletBalance >= location.price ? (isVivid ? 'bg-transparent border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black' : 'bg-black text-white') : 'opacity-20'}`}>
                    فتح المخطوطة ({location.price} ياسمينة)
                  </button>
                </div>
              ) : (
                <div className="w-full animate-text-reveal">
                  <div className={`min-h-[400px] flex items-center justify-center p-12 mb-12 border-2 ${isVivid ? 'bg-white/5 border-white/5 rounded-[2rem]' : 'bg-gray-50 border-black/5'}`}>
                    <div className={`poetry-font text-5xl md:text-7xl leading-[2] font-black ${isVivid ? 'text-white' : 'text-black'}`}>{poem}</div>
                  </div>
                  <button onClick={handlePlayAudio} disabled={playing} className={`w-full flex items-center justify-center gap-6 py-7 border-2 font-black text-2xl transition-all ${playing ? 'opacity-50' : (isVivid ? 'bg-transparent border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black' : 'bg-white border-black text-black')}`}>
                    {playing ? 'يتردد صدى الكلمات...' : 'تشغيل الإلقاء الرقمي'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoemModal;
