
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
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    if (isPlacementMode) return; 
    e.preventDefault();
    const zoomSpeed = 0.001;
    const scale = 1 + e.deltaY * zoomSpeed;
    
    if (svgRef.current) {
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
      const newW = viewBox.w * scale;
      const newH = viewBox.h * scale;
      if (newW < 100 || newW > 4000) return;
      const newX = svgP.x - (svgP.x - viewBox.x) * scale;
      const newY = svgP.y - (svgP.y - viewBox.y) * scale;
      setViewBox({ x: newX, y: newY, w: newW, h: newH });
    }
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

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPlacementMode || !onMapClick || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    onMapClick(svgP.y, svgP.x);
  };

  const isVivid = theme === 'vivid';

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-square md:aspect-video border-4 transition-all duration-500 overflow-hidden ${
        isVivid 
        ? 'bg-[#050505] border-[#00ffff] shadow-[0_0_30px_rgba(0,255,255,0.3)] rounded-[2rem]' 
        : 'bg-white border-black photocopy-texture shadow-[12px_12px_0px_0px_#000]'
      } ${isPlacementMode ? 'cursor-crosshair ring-8 ring-[#00ffff]/20' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00ffff 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid slice"
        onClick={handleSvgClick}
        className={`${!isVivid ? 'photocopy-effect' : ''} select-none transition-all duration-700`}
      >
        <defs>
          <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
          {locations.map(loc => (
            <pattern key={`pattern-${loc.id}`} id={`thumb-${loc.id}`} patternUnits="objectBoundingBox" width="1" height="1">
              <image 
                href={loc.thumbnail_url || 'https://www.transparenttextures.com/patterns/stardust.png'} 
                x="0" y="0" width="100%" height="100%" 
                preserveAspectRatio="xMidYMid slice" 
                style={{ opacity: 0.7 }}
              />
            </pattern>
          ))}
        </defs>

        {/* The Coastline */}
        <path 
          d="M100 50 C 300 100, 500 150, 700 300 C 750 450, 600 550, 400 580 C 200 550, 100 400, 50 200 Z" 
          fill={isVivid ? "rgba(0, 255, 255, 0.05)" : "none"} 
          stroke={isVivid ? "#00ffff" : "black"} 
          strokeWidth={isVivid ? "2" : "6"}
          strokeDasharray={isVivid ? "0" : "20,10"}
          className="transition-all duration-700"
        />

        {/* Markers */}
        {locations.map((loc) => (
          <g 
            key={loc.id} 
            onClick={(e) => { e.stopPropagation(); onSelect(loc); }}
            className="group cursor-pointer"
          >
            {/* Outer Neon Glow Circle */}
            <circle 
              cx={loc.lng} 
              cy={loc.lat} 
              r={Math.max(25, viewBox.w * 0.035)} 
              className={`transition-all duration-300 group-hover:scale-110 ${
                isVivid 
                ? 'fill-[#0a0a0a] stroke-[#00ffff] stroke-[2px]' 
                : 'fill-white stroke-black stroke-[4px]'
              }`}
              style={{ filter: isVivid ? 'url(#neon-glow)' : 'none' }}
            />
            
            {/* Thumbnail Circle */}
            <circle 
              cx={loc.lng} 
              cy={loc.lat} 
              r={Math.max(22, viewBox.w * 0.031)} 
              fill={`url(#thumb-${loc.id})`}
              className="transition-all duration-300 group-hover:opacity-100"
            />

            <text 
              x={loc.lng} 
              y={loc.lat + Math.max(45, viewBox.w * 0.06)} 
              textAnchor="middle"
              className={`font-black opacity-0 group-hover:opacity-100 transition-all calligraphy-font select-none ${isVivid ? 'fill-[#00ffff] neon-text' : 'fill-black'}`}
              style={{ fontSize: Math.max(16, viewBox.w * 0.025) }}
            >
              {loc.name}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Zoom Control Button */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => setViewBox({ x: 0, y: 0, w: 800, h: 600 })}
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
