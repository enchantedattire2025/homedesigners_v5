import React, { useState, useMemo } from 'react';
import { Home, X, Check, ChevronRight, Sofa, Bed, UtensilsCrossed, DoorOpen, Bath, Zap, Paintbrush, CookingPot, WashingMachine, Sparkles, Layers, CheckCircle2, Circle } from 'lucide-react';
import {
  HOME_TEMPLATES,
  SCOPE_LEVELS,
  KITCHEN_SHAPES,
  getRoomsForTemplate,
  countItemsForSelection,
  type HomeTemplate,
  type ScopeLevel,
  type KitchenShape,
} from '../data/quoteTemplates';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sofa: Sofa,
  bed: Bed,
  utensils: UtensilsCrossed,
  door: DoorOpen,
  shower: Bath,
  zap: Zap,
  paintbrush: Paintbrush,
  cooking: CookingPot,
  'washing-machine': WashingMachine,
};

interface QuoteTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: HomeTemplate, selectedRoomIds: string[], scope: ScopeLevel, kitchenShape: KitchenShape) => void;
}

const QuoteTemplateSelector: React.FC<QuoteTemplateSelectorProps> = ({ isOpen, onClose, onApply }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<HomeTemplate | null>(null);
  const [scope, setScope] = useState<ScopeLevel>('standard');
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [kitchenShape, setKitchenShape] = useState<KitchenShape>('L-shaped');

  const rooms = useMemo(() => {
    if (!selectedTemplate) return [];
    return getRoomsForTemplate(selectedTemplate, scope);
  }, [selectedTemplate, scope]);

  const itemCount = useMemo(() => {
    if (!selectedTemplate) return 0;
    return countItemsForSelection(selectedTemplate, Array.from(selectedRooms), scope);
  }, [selectedTemplate, selectedRooms, scope]);

  const handleSelectTemplate = (template: HomeTemplate) => {
    setSelectedTemplate(template);
    const defaultRooms = new Set<string>();
    template.rooms.forEach(room => {
      if (room.defaultIncluded) {
        const hasItemsForScope = room.items.some(item => item.scopes.includes(scope));
        if (hasItemsForScope) defaultRooms.add(room.id);
      }
    });
    setSelectedRooms(defaultRooms);
  };

  const handleScopeChange = (newScope: ScopeLevel) => {
    setScope(newScope);
    if (selectedTemplate) {
      const defaultRooms = new Set<string>();
      selectedTemplate.rooms.forEach(room => {
        if (room.defaultIncluded) {
          const hasItemsForScope = room.items.some(item => item.scopes.includes(newScope));
          if (hasItemsForScope) defaultRooms.add(room.id);
        }
      });
      setSelectedRooms(defaultRooms);
    }
  };

  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) {
        next.delete(roomId);
      } else {
        next.add(roomId);
      }
      return next;
    });
  };

  const handleApply = () => {
    if (!selectedTemplate || selectedRooms.size === 0) return;
    onApply(selectedTemplate, Array.from(selectedRooms), scope, kitchenShape);
    handleClose();
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setSelectedRooms(new Set());
    setScope('standard');
    setKitchenShape('L-shaped');
    onClose();
  };

  if (!isOpen) return null;

  const hasKitchen = selectedRooms.has('kitchen');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-5 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-secondary-800">Quick Quote Template</h2>
                <p className="text-sm text-gray-500">Start with a pre-filled quotation you can edit</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 1: Home Type */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">1</span>
              <h3 className="text-sm font-semibold text-secondary-800 uppercase tracking-wide">Select Home Type</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {HOME_TEMPLATES.map(template => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <Home className={`w-7 h-7 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                    <span className="font-bold text-sm">{template.name}</span>
                    <span className="text-xs text-gray-500 text-center">{template.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTemplate && (
            <>
              {/* Step 2: Scope Level */}
              <div className="mb-8 animate-fadeIn">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h3 className="text-sm font-semibold text-secondary-800 uppercase tracking-wide">Select Scope</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {SCOPE_LEVELS.map(level => {
                    const isSelected = scope === level.id;
                    return (
                      <button
                        key={level.id}
                        onClick={() => handleScopeChange(level.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-primary-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-300" />
                          )}
                          <span className={`font-semibold text-sm ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                            {level.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 ml-6">{level.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Room Selection */}
              <div className="mb-8 animate-fadeIn">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="text-sm font-semibold text-secondary-800 uppercase tracking-wide">Select Areas</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rooms.map(room => {
                    const isSelected = selectedRooms.has(room.id);
                    const Icon = ICON_MAP[room.icon] || Home;
                    return (
                      <button
                        key={room.id}
                        onClick={() => toggleRoom(room.id)}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-medium text-sm ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                              {room.name}
                            </span>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {room.totalItems} item{room.totalItems !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                            <span>{room.includedItems} included</span>
                            {room.optionalItems > 0 && <span>{room.optionalItems} optional</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kitchen Shape Selector */}
              {hasKitchen && (
                <div className="mb-8 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">4</span>
                    <h3 className="text-sm font-semibold text-secondary-800 uppercase tracking-wide">Kitchen Shape</h3>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {KITCHEN_SHAPES.map(shape => {
                      const isSelected = kitchenShape === shape.id;
                      return (
                        <button
                          key={shape.id}
                          onClick={() => setKitchenShape(shape.id)}
                          className={`px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {shape.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Adjusts default running feet: {KITCHEN_SHAPES.find(s => s.id === kitchenShape)?.baseRft} RFT base, {KITCHEN_SHAPES.find(s => s.id === kitchenShape)?.wallRft} RFT wall cabinets
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              {selectedTemplate ? (
                <span className="text-gray-600">
                  <span className="font-bold text-secondary-800">{selectedTemplate.name}</span>
                  {' · '}
                  <span className="font-medium text-primary-600">{SCOPE_LEVELS.find(s => s.id === scope)?.name}</span>
                  {' · '}
                  <span className="font-medium">{selectedRooms.size} rooms</span>
                  {' · '}
                  <span className="font-medium">{itemCount} items</span>
                </span>
              ) : (
                <span className="text-gray-400">Select a home type to begin</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!selectedTemplate || selectedRooms.size === 0}
                className="px-5 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Create Quote from Template</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteTemplateSelector;
