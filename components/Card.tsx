import React from 'react';
import { CaptionCard } from '../types';

interface CardProps {
  card: CaptionCard;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, isSelected, onClick, disabled, className = '' }) => {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative aspect-[3/4] bg-white rounded-xl p-6 flex items-center justify-center text-center
        transition-all duration-300 cursor-pointer select-none card-shadow
        ${isSelected ? 'ring-4 ring-yellow-400 transform scale-105 z-10' : 'hover:-translate-y-2'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Card Content */}
      <p className="text-gray-900 font-bold text-lg md:text-xl leading-tight font-sans">
        {card.text}
      </p>

      {/* Branding Icon small at bottom */}
      <div className="absolute bottom-3 right-3">
        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">M</span>
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute -top-3 -right-3 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full shadow-lg text-sm">
          CHOSEN
        </div>
      )}
    </div>
  );
};

export default Card;