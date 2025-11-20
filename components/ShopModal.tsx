
import React, { useState } from 'react';
import { ThemePack, User } from '../types';
import { THEME_PACKS } from '../constants';
import { shopService } from '../services/mockBackend';
import Button from './Button';
import { X, Lock, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onPurchase: () => void; // Trigger user refresh
}

const ShopModal: React.FC<Props> = ({ isOpen, onClose, user, onPurchase }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuy = async (pack: ThemePack) => {
    if (user.unlockedThemes.includes(pack.id)) return;

    setProcessingId(pack.id);
    try {
        const success = await shopService.buyTheme(pack.id);
        if (success) {
            onPurchase();
        }
    } catch (e) {
        console.error("Payment failed");
    } finally {
        setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
            <div>
                <h2 className="text-2xl font-black text-white">Meme Shop</h2>
                <p className="text-gray-400 text-sm">Unlock new themes for your games</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {THEME_PACKS.map(pack => {
                const isOwned = user.unlockedThemes.includes(pack.id);
                const isProcessing = processingId === pack.id;

                return (
                    <div key={pack.id} className={`relative group border rounded-2xl p-5 transition-all ${isOwned ? 'border-green-900 bg-green-900/10' : 'border-gray-700 bg-gray-800 hover:border-purple-500'}`}>
                        <div className="text-5xl mb-4 text-center">{pack.coverImage}</div>
                        <h3 className="text-xl font-bold text-white mb-1">{pack.name}</h3>
                        <p className="text-sm text-gray-400 mb-4 h-10">{pack.description}</p>
                        
                        <div className="flex items-center justify-between">
                             <span className="font-mono text-yellow-400 font-bold">
                                {pack.price === 0 ? 'FREE' : `$${(pack.price / 100).toFixed(2)}`}
                             </span>

                             {isOwned ? (
                                 <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                                     <Check size={16} /> Owned
                                 </div>
                             ) : (
                                 <Button 
                                    size="sm" 
                                    variant="primary" 
                                    isLoading={isProcessing}
                                    onClick={() => handleBuy(pack)}
                                >
                                    {isProcessing ? 'Processing...' : 'Buy Pack'}
                                </Button>
                             )}
                        </div>
                        {!isOwned && (
                            <div className="absolute top-3 right-3 text-gray-600">
                                <Lock size={16} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default ShopModal;
