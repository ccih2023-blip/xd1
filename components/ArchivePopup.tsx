
import React from 'react';

interface ArchivePopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    description: string;
    asset_type?: 'image' | 'text';
    drive_file_id?: string;
    image_url?: string;
  } | null;
  theme: 'vivid' | 'photocopy';
}

const ArchivePopup: React.FC<ArchivePopupProps> = ({ isOpen, onClose, data, theme }) => {
  if (!isOpen || !data) return null;

  const isVivid = theme === 'vivid';
  
  // دالة لاستخراج رابط الصورة المصغرة من Google Drive ID
  const getImageUrl = () => {
    if (data.drive_file_id) {
      return `https://lh3.googleusercontent.com/u/0/d/${data.drive_file_id}=w800-h600-p`;
    }
    return data.image_url;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-[12px] animate-ink"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-lg p-1 border-2 transition-all duration-500 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] ${
          isVivid 
          ? 'bg-[#1a1a1a] border-[#1B4D89]/30 rounded-[2rem]' 
          : 'bg-white border-black rounded-none photocopy-texture'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* زر الإغلاق */}
        <button 
          onClick={onClose}
          className={`absolute -top-4 -left-4 w-12 h-12 flex items-center justify-center border-4 font-black text-2xl transition-transform hover:rotate-90 z-10 ${
            isVivid ? 'bg-[#f4c430] border-[#1B4D89] text-[#1B4D89] rounded-full' : 'bg-black border-black text-white'
          }`}
        >
          &times;
        </button>

        <div className="overflow-hidden rounded-[1.8rem]">
          {data.asset_type === 'image' && (getImageUrl()) && (
            <div className={`w-full aspect-video overflow-hidden border-b-4 ${isVivid ? 'border-[#1B4D89]/20' : 'border-black'}`}>
              <img 
                src={getImageUrl()} 
                alt={data.title}
                className={`w-full h-full object-cover transition-transform duration-[10s] hover:scale-110 ${!isVivid ? 'photocopy-effect' : ''}`}
              />
            </div>
          )}

          <div className="p-10 text-right" dir="rtl">
            <h2 className={`text-3xl font-black calligraphy-font mb-4 ${isVivid ? 'text-[#f4c430]' : 'text-black'}`}>
              {data.title}
            </h2>
            <div className={`text-lg leading-relaxed opacity-90 ${isVivid ? 'text-white' : 'text-gray-800'}`}>
              {data.description}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={onClose}
                className={`px-8 py-3 font-black transition-all ${
                  isVivid 
                  ? 'bg-[#1B4D89] text-white rounded-xl hover:bg-[#f4c430]' 
                  : 'bg-black text-white border-2 border-black hover:bg-white hover:text-black'
                }`}
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
        
        {/* تفاصيل فنية للديكور */}
        <div className={`absolute -bottom-3 -right-3 px-4 py-1 text-[9px] font-mono font-bold uppercase tracking-widest ${
          isVivid ? 'bg-[#1B4D89] text-white' : 'bg-black text-white'
        }`}>
          Archive Module Ref: {Math.random().toString(36).substring(7).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default ArchivePopup;
