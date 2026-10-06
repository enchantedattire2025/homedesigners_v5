import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, MapPin, ExternalLink, Sparkles, X } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { supabase } from '../lib/supabase';

interface DesignerCard {
  id: string;
  name: string;
  location: string;
  profile_image: string | null;
  instagram_url: string;
  rating: number | null;
  specialization: string | null;
}

type BubbleSize = 'sm' | 'md' | 'lg' | 'xl';

interface BubbleConfig {
  size: BubbleSize;
  // percentage positions within the container
  top: string;
  left: string;
  floatClass: string;
  delay: string;
}

const SIZE_DIMENSIONS: Record<BubbleSize, { container: string; img: string; text: string }> = {
  sm: { container: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28', img: 'text-xl', text: 'text-[10px]' },
  md: { container: 'w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36', img: 'text-2xl', text: 'text-xs' },
  lg: { container: 'w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48', img: 'text-3xl', text: 'text-sm' },
  xl: { container: 'w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60', img: 'text-4xl', text: 'text-sm' },
};

const GRADIENTS = [
  'from-rose-400 to-orange-400',
  'from-amber-400 to-orange-500',
  'from-teal-400 to-cyan-500',
  'from-blue-400 to-sky-500',
  'from-emerald-400 to-teal-500',
  'from-orange-400 to-pink-500',
  'from-rose-500 to-amber-400',
  'from-stone-500 to-amber-600',
];

const pickGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

const FLOAT_CLASSES = [
  'bubble-float-0',
  'bubble-float-1',
  'bubble-float-2',
  'bubble-float-3',
  'bubble-float-4',
];

// Pre-computed organic scattered positions, cycled through
const BUBBLE_LAYOUTS: BubbleConfig[] = [
  { size: 'xl', top: '8%',  left: '15%', floatClass: 'bubble-float-0', delay: '0s' },
  { size: 'sm', top: '12%', left: '52%', floatClass: 'bubble-float-2', delay: '0.5s' },
  { size: 'md', top: '6%',  left: '72%', floatClass: 'bubble-float-1', delay: '1s' },
  { size: 'lg', top: '30%', left: '40%', floatClass: 'bubble-float-3', delay: '0.3s' },
  { size: 'sm', top: '28%', left: '8%',  floatClass: 'bubble-float-4', delay: '0.8s' },
  { size: 'md', top: '35%', left: '68%', floatClass: 'bubble-float-0', delay: '1.2s' },
  { size: 'sm', top: '22%', left: '88%', floatClass: 'bubble-float-2', delay: '0.6s' },
  { size: 'lg', top: '52%', left: '20%', floatClass: 'bubble-float-1', delay: '0.4s' },
  { size: 'sm', top: '48%', left: '50%', floatClass: 'bubble-float-3', delay: '0.9s' },
  { size: 'xl', top: '55%', left: '78%', floatClass: 'bubble-float-4', delay: '0.2s' },
  { size: 'md', top: '72%', left: '10%', floatClass: 'bubble-float-2', delay: '0.7s' },
  { size: 'sm', top: '68%', left: '40%', floatClass: 'bubble-float-0', delay: '1.1s' },
  { size: 'lg', top: '75%', left: '58%', floatClass: 'bubble-float-1', delay: '0.5s' },
  { size: 'sm', top: '82%', left: '85%', floatClass: 'bubble-float-3', delay: '0.3s' },
  { size: 'md', top: '88%', left: '30%', floatClass: 'bubble-float-4', delay: '0.8s' },
  { size: 'sm', top: '90%', left: '70%', floatClass: 'bubble-float-2', delay: '1s' },
];

const INTERIOR_DECOR = [
  { className: 'top-[5%] left-[3%] w-24 h-24 rounded-full bg-amber-200/20 blur-2xl', drift: 'ambient-drift', delay: '0s' },
  { className: 'top-[20%] right-[5%] w-32 h-32 rounded-full bg-rose-200/15 blur-3xl', drift: 'ambient-drift', delay: '2s' },
  { className: 'bottom-[15%] left-[8%] w-28 h-28 rounded-full bg-teal-200/15 blur-2xl', drift: 'ambient-drift', delay: '1s' },
  { className: 'bottom-[30%] right-[10%] w-36 h-36 rounded-full bg-orange-200/15 blur-3xl', drift: 'ambient-drift', delay: '3s' },
  { className: 'top-[45%] left-[48%] w-20 h-20 rounded-full bg-accent-200/20 blur-2xl', drift: 'ambient-drift', delay: '1.5s' },
];

const Gallery = () => {
  const [designers, setDesigners] = useState<DesignerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(900);

  useEffect(() => {
    fetchDesigners();
  }, []);

  const fetchDesigners = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('designers')
        .select('id, name, location, profile_image, instagram_url, rating, specialization')
        .not('instagram_url', 'is', null)
        .neq('instagram_url', '')
        .eq('verification_status', 'verified')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setDesigners(data || []);
    } catch (err: any) {
      console.error('Error fetching designers:', err);
      setError(err.message || 'Failed to load designers');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return designers.filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        (d.location && d.location.toLowerCase().includes(q)) ||
        (d.specialization && d.specialization.toLowerCase().includes(q))
      );
    });
  }, [designers, searchQuery]);

  // Calculate container height based on number of bubbles
  useEffect(() => {
    const count = filtered.length;
    if (count === 0) {
      setContainerHeight(500);
      return;
    }
    // Need enough vertical space for scattered layout
    const rows = Math.ceil(count / 3);
    const h = Math.max(700, rows * 280);
    setContainerHeight(h);
  }, [filtered]);

  const getBubbleConfig = (index: number): BubbleConfig => {
    return BUBBLE_LAYOUTS[index % BUBBLE_LAYOUTS.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-stone-500 font-serif text-lg">Curating the gallery wall...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4 font-medium">{error}</p>
          <button onClick={fetchDesigners} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-stone-50 via-amber-50/40 to-stone-100">
      {/* ===== Ambient interior backdrop ===== */}
      {/* Base warm wall gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-100 via-amber-50/50 to-stone-200/60 pointer-events-none" />

      {/* Subtle wall texture - vertical paneling lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(120, 80, 40, 0.8) 80px, rgba(120, 80, 40, 0.8) 81px)',
        }}
      />

      {/* Warm light glow from top-left (like a window) */}
      <div
        className="absolute top-0 left-0 w-[60%] h-[50%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(255, 220, 180, 0.25), transparent 70%)',
        }}
      />

      {/* Soft ambient light from bottom-right */}
      <div
        className="absolute bottom-0 right-0 w-[50%] h-[45%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at bottom right, rgba(240, 200, 160, 0.2), transparent 70%)',
        }}
      />

      {/* Floating ambient decor orbs */}
      {INTERIOR_DECOR.map((orb, i) => (
        <div
          key={`orb-${i}`}
          className={`absolute ${orb.className} ${orb.drift} pointer-events-none`}
          style={{ animationDelay: orb.delay }}
        />
      ))}

      {/* ===== Content layer ===== */}
      <div className="relative z-10">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-amber-200/50 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-medium text-stone-600 tracking-wide">Designer Social Wall</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-3">
              Portraits of Inspiration
            </h1>
            <p className="text-stone-500 text-base max-w-xl mx-auto leading-relaxed">
              Our verified designers, floating in a gallery of their own. Tap any portrait to visit their Instagram.
            </p>

            {/* Search bar - glassmorphism */}
            <div className="mt-6 max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by name, city, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-sm border border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white/70 backdrop-blur-md shadow-sm text-stone-700 placeholder:text-stone-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-stone-200/60 hover:bg-stone-300/80 text-stone-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Result label */}
            <div className="mt-4">
              <span className="inline-block px-3 py-1 rounded-full bg-stone-200/40 text-stone-500 text-xs font-medium">
                {filtered.length} {filtered.length === 1 ? 'designer' : 'designers'} on display
              </span>
            </div>
          </div>
        </div>

        {/* ===== Bubble canvas ===== */}
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-24 px-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/50 backdrop-blur-sm border border-amber-200/40 mb-4 shadow-sm">
                <FaInstagram className="text-stone-300" style={{ width: '32px', height: '32px' }} />
              </div>
              <p className="text-stone-500 text-lg font-serif">
                {searchQuery ? 'No designers match your search.' : 'No designers have linked their Instagram yet.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-sm text-primary-500 hover:text-primary-600 font-medium underline underline-offset-2"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
            style={{ height: `${containerHeight}px` }}
          >
            {filtered.map((designer, index) => {
              const config = getBubbleConfig(index);
              const dims = SIZE_DIMENSIONS[config.size];
              const isLarge = config.size === 'lg' || config.size === 'xl';
              const isHovered = hoveredId === designer.id;

              return (
                <div
                  key={designer.id}
                  className="absolute"
                  style={{
                    top: config.top,
                    left: config.left,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isHovered ? 30 : 10,
                  }}
                >
                  {/* Float wrapper - entrance + continuous float */}
                  <div
                    className={`${config.floatClass} bubble-entrance`}
                    style={{
                      animationDelay: config.delay,
                      animationDuration: '0.6s, 0s',
                    }}
                  >
                    <a
                      href={designer.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group cursor-pointer"
                      style={{ position: 'relative' }}
                      onMouseEnter={() => setHoveredId(designer.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {/* Portrait bubble */}
                      <div
                        className={`${dims.container} rounded-full overflow-hidden relative transition-all duration-300 group-hover:scale-110`}
                        style={{
                          boxShadow: isHovered
                            ? '0 20px 50px -10px rgba(120, 80, 40, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.9), 0 0 0 6px rgba(224, 122, 95, 0.3)'
                            : '0 10px 30px -8px rgba(120, 80, 40, 0.25), 0 0 0 3px rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        {designer.profile_image ? (
                          <img
                            src={designer.profile_image}
                            alt={designer.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${pickGradient(designer.name)} flex items-center justify-center`}>
                            <span className={`text-white ${dims.img} font-bold select-none font-serif`}>
                              {getInitials(designer.name)}
                            </span>
                          </div>
                        )}

                        {/* Hover darkening overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

                        {/* Instagram badge - always visible */}
                        <div className="absolute bottom-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200">
                          <FaInstagram className="text-white" style={{ width: '12px', height: '12px' }} />
                        </div>
                      </div>

                      {/* Plaque label (gallery-style name tag) */}
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 whitespace-nowrap pointer-events-none ${
                          isLarge
                            ? 'top-full mt-2 opacity-100'
                            : isHovered
                            ? 'top-full mt-2 opacity-100 translate-y-0'
                            : 'top-full mt-1 opacity-0 translate-y-[-4px]'
                        }`}
                      >
                        <div className="bg-white/85 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md border border-amber-100/60 text-center">
                          <p className={`font-semibold text-stone-800 leading-tight ${dims.text} font-serif`}>
                            {designer.name}
                          </p>
                          {designer.location && (
                            <p className="text-stone-400 flex items-center justify-center gap-0.5 mt-0.5" style={{ fontSize: '10px' }}>
                              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                              <span>{designer.location}</span>
                            </p>
                          )}
                          {isHovered && (
                            <div className="flex items-center justify-center gap-1 mt-1 pt-1 border-t border-stone-200/50">
                              <ExternalLink className="w-2.5 h-2.5 text-primary-500" />
                              <span className="text-primary-500 font-medium" style={{ fontSize: '9px' }}>View on Instagram</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="pb-12 pt-6 text-center">
          <p className="text-stone-400 text-xs">
            Each portrait floats to its own rhythm — tap to explore their world on Instagram.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
