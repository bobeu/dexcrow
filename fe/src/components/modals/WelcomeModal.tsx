import React, { useState, useEffect } from 'react';
import { Users, Gavel, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, Button, Badge } from '@/components/ui';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Chain",
      description: "Trade across multiple blockchain networks seamlessly"
    },
    {
      icon: <Gavel className="w-8 h-8" />,
      title: "Arbitration",
      description: "Decentralized dispute resolution with trusted arbiters"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Fast Settlement",
      description: "Quick and secure transaction settlements"
    }
  ];

  // Auto-swipe functionality
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, features.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => (prev + 1) % features.length);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, features.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to Tradeverse"
      size="md"
    >
      <div className="space-y-6">
        {/* Brand Section */}
        <div className="text-center">
          <Badge variant="info" className="text-xs">
            Secure • Trustless • Decentralized
          </Badge>
        </div>

        {/* Feature Slides */}
        <div className="relative h-48 sm:h-56 overflow-hidden">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-transform duration-500 ease-in-out ${
                index === currentSlide
                  ? 'translate-x-0'
                  : index < currentSlide
                  ? '-translate-x-full'
                  : 'translate-x-full'
              }`}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#333] border border-[#ffff00] rounded-full flex items-center justify-center mb-3 sm:mb-4 text-[#ffff00]">
                {feature.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-mono mb-2">
                {feature.title}
              </h3>
              <p className="text-[#ffff00] font-mono text-sm sm:text-base max-w-xs px-2">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="space-y-4">
          {/* Dots */}
          <div className="flex justify-center space-x-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                  index === currentSlide
                    ? 'bg-[#ffff00]'
                    : 'bg-[#333] hover:bg-[#666]'
                }`}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              icon={ChevronLeft}
            />
            <span className="text-xs sm:text-sm text-[#ffff00] font-mono">
              {currentSlide + 1} of {features.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              icon={ChevronRight}
            />
          </div>
        </div>

        {/* Description */}
        <div className="text-center">
          <p className="text-[#ffff00] font-mono text-xs sm:text-sm leading-relaxed px-2">
            Secure peer-to-peer transactions with smart contract escrow, 
            multi-chain support, and decentralized arbitration
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={onClose}
            variant="primary"
            className="flex-1"
          >
            Get Started
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Learn More
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeModal;
