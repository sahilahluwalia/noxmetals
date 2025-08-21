'use client';

import Image from 'next/image';

interface SlidingCarouselProps {
  items: string[];
  title?: string;
  speed?: number; // animation duration in seconds
  imageSize?: number;
  spacing?: string;
  opacity?: string;
}

export default function SlidingCarousel({ 
  items, 
  title, 
  speed = 20, 
  imageSize = 80,
  spacing = "mx-12",
  opacity = "opacity-60"
}: SlidingCarouselProps) {
  return (
    <div className="overflow-hidden">
      {title && (
        <h3 className="text-center text-gray-400 text-sm mb-8">
          {title}
        </h3>
      )}
      <div 
        className="flex"
        style={{
          animation: `slideLeft ${speed}s linear infinite`,
          width: 'fit-content'
        }}
      >
        {[...items, ...items].map((item, index) => (
          <div key={index} className={`flex-shrink-0 ${spacing}`}>
            <div 
              className="flex items-center justify-center"
              style={{ 
                width: imageSize, 
                height: imageSize 
              }}
            >
              <Image 
                src={item} 
                alt="Logo" 
                width={imageSize} 
                height={imageSize} 
                className="object-contain w-full h-full"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <style jsx global>{`
        @keyframes slideLeft {
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
