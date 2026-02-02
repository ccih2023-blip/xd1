
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
  const [showShareTooltip, setShowShareTooltip] = useState(false);

  const isVivid = theme === 'vivid';
  const isUnlocked = location.isPurchased || isAdminView;

  useEffect(() => {
    incrementViewCount(location.id);

    if (isUnlocked) {
      if (!poem && !location.isUserSubmitted) {
        handleGenerate();
      }
      if (!isAdminView) {
        const interval = setInterval(() => {
          setRevealProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
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
    } catch (e) {
      setError("فشل استحضار القصيدة.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (playing) return;
    if (location.audioUrl) {
      const audio = new Audio(location.audioUrl);
      setPlaying(true);
      audio.onended = () => setPlaying(false);
      audio.play();
      return;
    }
    if (!poem) return;
    setPlaying(true);
    try {
      const audioData = await textToSpeech(poem);
      await playPcmAudio(audioData);
    } catch (e) {
      setError("فشل الإلقاء الصوتي.");
    } finally {
      setPlaying(false);
    }
  };

  const shareLink = () => {
    const url = `${window.location.origin}/?id=${location.id}`;
    navigator.clipboard.writeText(url);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 space-overlay transition-all duration-700`}>
      <div className="animate-ink w-full max-w-6xl relative">
        <div className={`min-h-[700px] flex flex-col md:flex-row shadow-[0_0_100px_rgba(0,255,255,0.2)] overflow-hidden border-2 transition-all duration-700 ${
          isVivid ? 'bg-[#111] border-[#00ffff] rounded-[3rem]' : 'bg-white border-black photocopy-effect'
        }`} style={{ opacity: isUnlocked ? revealProgress/100 : 1 }}>
          
          <div className={`w-full md:w-5/12 relative overflow-hidden group bg-black`}>
            {(isUnlocked && (location.drive_file_id || location.muralUrl)) ? (
              <div className="absolute inset-0 overflow-hidden flex flex-col">
                {location.drive_file_id ? (
                  <iframe 
                    src={`https://drive.google.com/file/d/${location.drive_file_id}/preview`} 
                    className="w-full h-full border-none opacity-80 group-hover:opacity-100 transition-opacity"
                    title="Google Drive Preview"
                    allow="autoplay"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${location.muralUrl})` }}></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                 <div className={`text-[15rem] font-black mb-4 opacity-5 select-none ${isVivid ? 'text-[#00ffff]' : 'text-white'}`}>أ</div>
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

                  <div className="flex flex-col sm:flex-row gap-8 max-w-4xl mx-auto">
                    <button onClick={handlePlayAudio} disabled={playing} className={`flex-[3] flex items-center justify-center gap-6 py-7 border-2 font-black text-2xl transition-all ${playing ? 'opacity-50' : (isVivid ? 'bg-transparent border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black' : 'bg-white border-black text-black')}`}>
                      {playing ? 'يتردد صدى الكلمات...' : 'تشغيل الإلقاء الرقمي'}
                    </button>
                    
                    <div className="flex-1 relative">
                      <button onClick={shareLink} className={`w-full h-full flex items-center justify-center py-7 border-2 transition-all ${isVivid ? 'bg-transparent border-white/20 text-white hover:border-[#00ffff] hover:text-[#00ffff]' : 'bg-white border-black text-black'}`}>
                        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </button>
                      {showShareTooltip && <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-6 py-3 text-sm font-black bg-[#00ffff] text-black border-2 border-black animate-bounce">تم نسخ الرابط!</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className={`px-12 py-8 text-[11px] font-mono flex justify-between uppercase tracking-[0.6em] ${isVivid ? 'bg-white/5 text-white/30' : 'bg-black text-white/30'}`}>
              <span>ARCHIVE REF: {location.id}</span>
              <span>VERIFIED // NABEUL DIGITAL HERITAGE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoemModal;
