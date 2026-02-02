
import React, { useRef, useState, useEffect } from 'react';
import { PoemLocation } from '../types';

interface MapContainerProps {
  locations: PoemLocation[];
  onSelect: (location: PoemLocation) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isPlacementMode?: boolean;
  theme: 'vivid' | 'photocopy';
}

const MapContainer: React.FC<MapContainerProps> = ({ locations, onSelect, onMapClick, isPlacementMode, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    if (isPlacementMode) return; 
    e.preventDefault();
    const zoomSpeed = 0.001;
    const scale = 1 + e.deltaY * zoomSpeed;
    const newW = viewBox.w * scale;
    const newH = viewBox.h * scale;
    if (newW < 200 || newW > 3000) return;
    setViewBox(prev => ({ ...prev, w: newW, h: newH }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlacementMode) return;
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isPlacementMode) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    const scaleX = viewBox.w / (containerRef.current?.clientWidth || 800);
    const scaleY = viewBox.h / (containerRef.current?.clientHeight || 600);
    setViewBox(prev => ({ ...prev, x: prev.x - dx * scaleX, y: prev.y - dy * scaleY }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!isPlacementMode || !onMapClick || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
    const y = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
    onMapClick(y, x);
  };

  const isVivid = theme === 'vivid';

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-square md:aspect-video border-4 transition-all duration-500 overflow-hidden ${
        isVivid 
        ? 'bg-[#050505] border-[#00ffff] shadow-[0_0_30px_rgba(0,255,255,0.3)] rounded-[2rem]' 
        : 'bg-white border-black photocopy-texture shadow-[12px_12px_0px_0px_#000]'
      } ${isPlacementMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleContainerClick}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00ffff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      <div className="absolute inset-0 transition-all duration-700" style={{
        transform: `scale(${800/viewBox.w}) translate(${-viewBox.x}px, ${-viewBox.y}px)`,
        transformOrigin: 'top left'
      }}>
        {/* رسم النقاط في الفضاء بناءً على كود المستخدم */}
        {locations.map((loc) => (
          <div 
            key={loc.id}
            className="anchor-point"
            style={{ 
              top: `${loc.lat}px`, 
              left: `${loc.lng}px` 
            }}
            onClick={(e) => { e.stopPropagation(); onSelect(loc); }}
          >
            {/* عرض الصورة داخل النقطة كما طلبت */}
            {loc.thumbnail_url ? (
              <img src={loc.thumbnail_url} alt={loc.name} title={loc.name} />
            ) : (
              <div className="w-full h-full bg-[#00ffff]/20 flex items-center justify-center">
                <span className="text-[8px] font-black">?</span>
              </div>
            )}
            <div className="anchor-label calligraphy-font">{loc.name}</div>
          </div>
        ))}
      </div>
      
      <div className="absolute top-6 left-6 z-[110]">
        <button 
          onClick={(e) => { e.stopPropagation(); setViewBox({ x: 0, y: 0, w: 800, h: 600 }); }}
          className={`p-3 border-2 transition-all shadow-[0_0_15px_rgba(0,255,255,0.5)] active:scale-95 ${
            isVivid ? 'bg-[#111] border-[#00ffff] text-[#00ffff] rounded-full' : 'bg-white border-black text-black'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MapContainer;
