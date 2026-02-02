
import React, { useState, useEffect } from 'react';
import { PoemLocation, UserProfile } from '../types';
import { generateMuralImage, generatePoemContent } from '../services/geminiService';
import { supabase, uploadFile, deleteLocation, updateProfile } from '../services/supabase';

interface PoetPortalProps {
  onAddLocation: (location: PoemLocation) => void;
  onClose: () => void;
  coords: { lat: number, lng: number } | null;
  theme: 'vivid' | 'photocopy';
  profile: UserProfile | null;
  onProfileUpdate: (updates: { name?: string, bio?: string }) => void;
}

type Tab = 'new' | 'archive' | 'profile';
type Step = 'details' | 'uploading_files' | 'review' | 'launch_center';

const PoetPortal: React.FC<PoetPortalProps> = ({ onAddLocation, onClose, coords, theme, profile, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>(coords ? 'new' : 'archive');
  const [step, setStep] = useState<Step>('details');
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({ 
    id: '',
    name: '', 
    poet: profile?.name || '', 
    description: '', 
    poemText: '', 
    price: 15,
    muralMode: 'ai' as 'ai' | 'video',
    drive_file_id: ''
  });

  const [userPoems, setUserPoems] = useState<PoemLocation[]>([]);
  const [loadingArchive, setLoadingArchive] = useState(false);

  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    bio: profile?.bio || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [poetImageFile, setPoetImageFile] = useState<File | null>(null);
  const [videoMuralFile, setVideoMuralFile] = useState<File | null>(null);
  
  const [uploadedUrls, setUploadedUrls] = useState({ audio: '', poetImage: '', videoMural: '' });
  const [uploadStatus, setUploadStatus] = useState({ audio: 'idle', poetImage: 'idle', videoMural: 'idle' });

  const [isGeneratingPoem, setIsGeneratingPoem] = useState(false);
  const [statusMessage, setStatusMessage] = useState('جاهز للإطلاق الرقمي...');

  const isVivid = theme === 'vivid';

  useEffect(() => {
    if (activeTab === 'archive' && profile) {
      fetchUserPoems();
    }
  }, [activeTab]);

  const fetchUserPoems = async () => {
    setLoadingArchive(true);
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', profile?.id)
      .order('publishDate', { ascending: false });
    if (!error) setUserPoems(data || []);
    setLoadingArchive(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    try {
      await updateProfile(profile.id, profileData);
      onProfileUpdate(profileData);
      alert("تم تحديث الملف الشخصي بنجاح");
    } catch (err) {
      alert("فشل التحديث");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeletePoem = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المخطوطة نهائياً من الأرشيف؟")) return;
    try {
      await deleteLocation(id);
      setUserPoems(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("فشل الحذف");
    }
  };

  const handleEditPoem = (poem: PoemLocation) => {
    setFormData({
      id: poem.id,
      name: poem.name,
      poet: poem.poet,
      description: poem.description,
      poemText: poem.fullPoem || '',
      price: poem.price,
      muralMode: poem.muralType === 'video' ? 'video' : 'ai',
      drive_file_id: poem.drive_file_id || ''
    });
    setUploadedUrls({
      audio: poem.audioUrl || '',
      poetImage: poem.poetImageUrl || '',
      videoMural: poem.muralUrl || ''
    });
    setActiveTab('new');
    setStep('details');
  };

  const getGoogleThumbnail = (fileId: string) => {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
  };

  const handleStartReviewProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    const needsUpload = audioFile || poetImageFile || (formData.muralMode === 'video' && videoMuralFile);
    if (needsUpload) {
      setStep('uploading_files');
      performAllUploads();
    } else {
      setStep('review');
      if (!formData.poemText.trim()) await triggerAiGeneration();
    }
  };

  const performAllUploads = async () => {
    const timestamp = Date.now();
    const tasks = [];
    if (poetImageFile) tasks.push(handleSingleUpload('poetImage', 'assets', `poets/${timestamp}_${poetImageFile.name}`, poetImageFile));
    if (audioFile) tasks.push(handleSingleUpload('audio', 'assets', `audio/${timestamp}_${audioFile.name}`, audioFile));
    if (formData.muralMode === 'video' && videoMuralFile) tasks.push(handleSingleUpload('videoMural', 'assets', `videos/${timestamp}_${videoMuralFile.name}`, videoMuralFile));
    await Promise.allSettled(tasks);
    setStep('review');
  };

  const handleSingleUpload = async (key: string, bucket: string, path: string, file: File) => {
    setUploadStatus(prev => ({ ...prev, [key]: 'loading' }));
    try {
      const url = await uploadFile(bucket, path, file);
      setUploadedUrls(prev => ({ ...prev, [key]: url }));
      setUploadStatus(prev => ({ ...prev, [key]: 'success' }));
    } catch (err: any) {
      setUploadStatus(prev => ({ ...prev, [key]: 'error' }));
    }
  };

  const triggerAiGeneration = async () => {
    setIsGeneratingPoem(true);
    try {
      const generated = await generatePoemContent(formData.name, formData.poet);
      setFormData(prev => ({ ...prev, poemText: generated }));
    } catch (err) {
      setFormData(prev => ({ ...prev, poemText: "تعذر النظم." }));
    } finally {
      setIsGeneratingPoem(false);
    }
  };

  const startLaunchSequence = async () => {
    setShowConfirm(false);
    setStep('launch_center');
    setStatusMessage('جاري الإرساء الرقمي في الأحساء...');

    try {
      let muralUrl = uploadedUrls.videoMural;
      let muralType: 'image' | 'video' = formData.muralMode === 'video' ? 'video' : 'image';
      
      const thumbnail_url = formData.drive_file_id 
        ? getGoogleThumbnail(formData.drive_file_id) 
        : (muralType === 'image' ? muralUrl : '');

      if (formData.muralMode === 'ai' && !muralUrl) {
        muralUrl = await generateMuralImage(formData.poemText, formData.name);
      }
      
      const locData = {
        name: formData.name, 
        poet: formData.poet, 
        description: formData.description,
        preview: formData.poemText.substring(0, 60) + '...', 
        fullPoem: formData.poemText,
        lat: coords?.lat || 0, 
        lng: coords?.lng || 0, 
        muralUrl, 
        muralType,
        thumbnail_url: thumbnail_url || muralUrl,
        audioUrl: uploadedUrls.audio,
        poetImageUrl: uploadedUrls.poetImage,
        price: formData.price, 
        drive_file_id: formData.drive_file_id,
        isUserSubmitted: true,
        publishDate: new Date().toISOString(),
        user_id: profile?.id,
        views: 0
      };

      const { data, error } = formData.id 
        ? await supabase.from('locations').update(locData).eq('id', formData.id).select().single()
        : await supabase.from('locations').insert([locData]).select().single();

      if (error) throw error;
      setTimeout(() => { onAddLocation(data); onClose(); }, 1000);
    } catch (err: any) { 
      setStatusMessage(`فشل: ${err.message}`);
      setTimeout(() => setStep('review'), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md text-right animate-ink" dir="rtl">
      
      {showConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-10 border-8 ${isVivid ? 'bg-white border-[#2d5a27] rounded-[2rem]' : 'bg-white border-black'}`}>
            <h3 className="text-3xl font-black mb-6">تأكيد الإرساء الرقمي</h3>
            <p className="mb-6 opacity-60">سيتم تثبيت قصيدتك في خريطة الأحساء.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 font-black border-4">تراجع</button>
              <button onClick={startLaunchSequence} className={`flex-1 py-4 font-black border-4 bg-black text-white`}>تأكيد</button>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col border-8 ${isVivid ? 'bg-white border-[#2d5a27] rounded-[3rem]' : 'bg-white border-black'}`}>
        <div className={`flex border-b-8 ${isVivid ? 'bg-[#2d5a27] border-[#2d5a27]' : 'bg-black border-black'}`}>
          <button onClick={() => setActiveTab('new')} className={`flex-1 py-6 font-black text-xl transition-all ${activeTab === 'new' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>
            {formData.id ? 'تعديل مخطوطة' : 'إرساء جديد'}
          </button>
          <button onClick={() => setActiveTab('archive')} className={`flex-1 py-6 font-black text-xl transition-all ${activeTab === 'archive' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>أرشيفي الشعري</button>
          <button onClick={() => setActiveTab('profile')} className={`flex-1 py-6 font-black text-xl transition-all ${activeTab === 'profile' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}>الملف الشخصي</button>
          <button onClick={onClose} className="px-8 text-white hover:rotate-90 transition-transform">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {activeTab === 'new' && (
            <div className="animate-text-reveal">
              {step === 'details' && (
                <form onSubmit={handleStartReviewProcess} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <input required placeholder="عنوان المعلم (مثال: قصر إبراهيم)" className="w-full p-4 border-4 text-xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required placeholder="اسم الشاعر المستعار" className="w-full p-4 border-4 text-xl font-bold" value={formData.poet} onChange={e => setFormData({...formData, poet: e.target.value})} />
                  </div>
                  <input placeholder="Google Drive File ID (اختياري للمعالجة)" className="w-full p-4 border-4 font-mono" value={formData.drive_file_id} onChange={e => setFormData({...formData, drive_file_id: e.target.value})} />
                  <textarea placeholder="نص القصيدة الأحسائية..." className="w-full p-6 border-4 h-48 poetry-font text-3xl" value={formData.poemText} onChange={e => setFormData({...formData, poemText: e.target.value})} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="p-4 border-4 border-dashed relative text-center">
                        <span className="text-xs font-black block mb-2 uppercase">صورة الشاعر</span>
                        <input type="file" accept="image/*" onChange={e => setPoetImageFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <p className="truncate text-xs">{poetImageFile ? poetImageFile.name : 'اسحب ملفك هنا...'}</p>
                     </div>
                     <div className="p-4 border-4 border-dashed relative text-center">
                        <span className="text-xs font-black block mb-2 uppercase">التسجيل الصوتي</span>
                        <input type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <p className="truncate text-xs">{audioFile ? audioFile.name : 'سجل صوتك وارفع...'}</p>
                     </div>
                  </div>
                  <button type="submit" className="w-full py-8 bg-black text-white font-black text-3xl brutalist-shadow">المراجعة قبل الإرساء ←</button>
                </form>
              )}
              {step === 'uploading_files' && <div className="p-20 text-center text-4xl font-black">جاري المعالجة الرقمية لواحة الأحساء...</div>}
              {step === 'review' && (
                <div className="space-y-8 text-center">
                   <div className="p-10 border-8 border-double bg-gray-50">
                      <h3 className="text-5xl font-black calligraphy-font">{formData.name}</h3>
                      <div className="p-12 text-5xl poetry-font leading-relaxed">{formData.poemText}</div>
                   </div>
                   <button onClick={() => setShowConfirm(true)} className="w-full py-8 bg-black text-white font-black text-3xl">تثبيت في الخريطة</button>
                </div>
              )}
              {step === 'launch_center' && <div className="p-20 text-center animate-pulse text-4xl font-black">{statusMessage}</div>}
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="animate-text-reveal space-y-8">
               <h3 className="text-3xl font-black calligraphy-font border-b-4 pb-4">أرشيفك الشعري في الواحة</h3>
               {loadingArchive ? (
                 <div className="p-20 text-center text-xl">جاري فحص السجلات...</div>
               ) : userPoems.length === 0 ? (
                 <div className="p-20 text-center text-gray-400 italic">لا توجد قصائد مسجلة في واحة الأحساء باسمك بعد.</div>
               ) : (
                 <div className="grid grid-cols-1 gap-6">
                    {userPoems.map(poem => (
                      <div key={poem.id} className="p-6 border-4 flex justify-between items-center group hover:bg-black hover:text-white transition-all">
                        <div className="flex items-center gap-4">
                          {poem.thumbnail_url && <img src={poem.thumbnail_url} className="w-16 h-16 object-cover border-2 border-black" />}
                          <div>
                            <h4 className="text-2xl font-black">{poem.name}</h4>
                            <p className="opacity-60 text-xs font-mono uppercase mt-2">المشاهدات: {poem.views || 0}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                           <button onClick={() => handleEditPoem(poem)} className="px-6 py-2 border-2 border-current font-black hover:bg-orange-400">تعديل</button>
                           <button onClick={() => handleDeletePoem(poem.id)} className="px-6 py-2 border-2 border-red-500 text-red-500 font-black hover:bg-red-500 hover:text-white">حذف</button>
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-text-reveal max-w-2xl mx-auto py-12">
               <h3 className="text-3xl font-black calligraphy-font mb-10 text-center">مجلس الشاعر</h3>
               <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="space-y-2">
                     <label className="font-black text-xs uppercase opacity-60">اسم العرض</label>
                     <input className="w-full p-4 border-4 text-xl font-bold" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="font-black text-xs uppercase opacity-60">نبذة شعرية</label>
                     <textarea className="w-full p-4 border-4 h-32 text-lg font-medium" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} />
                  </div>
                  <button type="submit" disabled={savingProfile} className="w-full py-6 bg-black text-white font-black text-2xl brutalist-shadow">
                     {savingProfile ? 'جاري الحفظ...' : 'تحديث البيانات'}
                  </button>
               </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoetPortal;
