import React, { useEffect, useState, useRef } from 'react';

interface CyberpunkAnimationProps {
  isActive: boolean;
  message?: string;
}

export default function CyberpunkAnimation({ isActive, message = 'Processing data...' }: CyberpunkAnimationProps) {
  const [text, setText] = useState<string[]>([]);
  const [binaryStream, setBinaryStream] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Determine if this is a clearing operation based on the message
  const isClearing = message.toLowerCase().includes('clearing');
  
  // Cyberpunk-style phrases
  const scrapingPhrases = [
    "Initializing neural link...",
    "Scanning data streams...",
    "Breaching security protocols...",
    "Accessing netrunner database...",
    "Compiling code fragments...",
    "Routing through encrypted channels...",
    "Bypassing ICE protection...",
    "Accessing YouTube data mainframe...",
    "Extracting video signatures...",
    "Decrypting metadata...",
    "Analyzing trend patterns...",
    "Injecting data packets...",
    "Syncing with cloud servers...",
    "Executing scraping protocol...",
    "Processing neural data..."
  ];
  
  // Clearing data phrases
  const clearingPhrases = [
    "Initializing database purge sequence...",
    "Scrubbing digital footprints...",
    "Wiping neural archives...",
    "Executing shredder protocols...",
    "Burning data pathways...",
    "Neutralizing digital traces...",
    "Formatting database sectors...",
    "Executing zero-day data purge...",
    "Deploying memory wipe algorithm...",
    "Erasing network fingerprints...",
    "Destroying data clusters...",
    "Running ghost protocol...",
    "Executing blackout sequence...",
    "Deploying EMP to digital storage...",
    "Sterilizing data environment..."
  ];
  
  // Select the appropriate phrases based on the operation
  const cyberpunkPhrases = isClearing ? clearingPhrases : scrapingPhrases;
  
  // Generate random binary stream
  useEffect(() => {
    if (!isActive) return;
    
    const generateBinary = () => {
      const binary = Array(15).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('');
      return binary;
    };
    
    const timer = setInterval(() => {
      setBinaryStream(prev => {
        const newStream = [...prev, generateBinary()];
        return newStream.slice(-20); // Keep last 20 lines
      });
      
      // Scroll to bottom
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100);
    
    return () => clearInterval(timer);
  }, [isActive]);
  
  // Add random cyberpunk phrases
  useEffect(() => {
    if (!isActive) return;
    
    // Reset text when starting a new operation
    setText([]);
    
    const addRandomPhrase = () => {
      const randomIndex = Math.floor(Math.random() * cyberpunkPhrases.length);
      const nextPhrase = cyberpunkPhrases[randomIndex];
      
      setText(prev => {
        const newText = [...prev, nextPhrase];
        return newText.slice(-10); // Keep last 10 phrases
      });
    };
    
    // Add initial phrase
    addRandomPhrase();
    
    const timer = setInterval(addRandomPhrase, 2000);
    
    return () => clearInterval(timer);
  }, [isActive, isClearing, cyberpunkPhrases]);
  
  if (!isActive) return null;
  
  // Customize colors based on operation
  const primaryColor = isClearing ? 'rgba(255, 69, 0, 0.7)' : 'rgba(0, 255, 255, 0.7)';
  const secondaryColor = isClearing ? 'rgba(255, 69, 0, 0.3)' : 'rgba(0, 255, 255, 0.3)';
  const accentColor = isClearing ? 'rgb(255, 69, 0)' : 'rgb(0, 255, 255)';
  const textColor = isClearing ? 'text-red-400' : 'text-green-400';
  const headerBgColor = isClearing ? 'bg-red-900' : 'bg-cyan-900';
  const headerTextColor = isClearing ? 'text-red-300' : 'text-cyan-300';
  const borderColor = isClearing ? 'border-red-500' : 'border-cyan-500';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div 
        className={`w-full max-w-3xl h-[60vh] bg-gray-900 border-2 ${borderColor} rounded-lg overflow-hidden flex flex-col`}
        style={{ 
          boxShadow: `0 0 20px ${primaryColor}, 0 0 40px ${secondaryColor} inset`,
        }}
      >
        <div className={`${headerBgColor} ${headerTextColor} px-4 py-2 font-mono flex justify-between items-center border-b ${borderColor}`}>
          <div className="flex items-center">
            <span className="mr-2">{isClearing ? '🗑️' : '⚙️'}</span>
            <span className="text-white font-bold">{message}</span>
          </div>
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className={`flex-1 p-4 font-mono text-sm ${textColor} overflow-y-auto bg-black bg-opacity-80 relative`}
          style={{ 
            backgroundImage: `linear-gradient(transparent, ${secondaryColor})`,
          }}
        >
          {/* Terminal-like output */}
          <div className="terminal-output">
            <div className="mb-2 text-yellow-500">
              {isClearing ? 'INITIALIZING DATA PURGE...' : 'INITIALIZING CONNECTION...'}
            </div>
            <div className={`mb-4 ${headerTextColor}`}>
              [SYSTEM] {isClearing ? 'Secure deletion protocol activated.' : 'Connection established. Starting scraping operation.'}
            </div>
            
            {text.map((line, i) => (
              <div key={`line-${i}`} className="mb-1 flex">
                <span className={isClearing ? 'text-red-500 mr-2' : 'text-cyan-500 mr-2'}>&gt;</span>
                <span className="typing-effect">{line}</span>
              </div>
            ))}
            
            {/* Binary data stream animation */}
            <div className="mt-4 text-green-600 opacity-60 overflow-hidden">
              {binaryStream.map((binary, i) => (
                <div key={`binary-${i}`} className="binary-row">
                  {binary}
                </div>
              ))}
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex justify-between items-center">
              <div className={headerTextColor}>STATUS: <span className="text-green-400">ACTIVE</span></div>
              <div className="text-yellow-400 animate-pulse">
                {isClearing ? 'DATA PURGING...' : 'DATA PROCESSING...'}
              </div>
            </div>
            <div className="mt-2 h-1 w-full bg-gray-800 rounded overflow-hidden">
              <div className="h-full progress-bar" style={{ backgroundColor: accentColor }}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        .typing-effect {
          overflow: hidden;
          border-right: 2px solid ${primaryColor};
          white-space: nowrap;
          animation: typing 3s steps(40, end), blink-caret 0.75s step-end infinite;
        }
        
        .binary-row {
          font-family: monospace;
          letter-spacing: 2px;
          line-height: 1.2;
        }
        
        .progress-bar {
          animation: progress 20s linear infinite;
        }
        
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: ${primaryColor} }
        }
        
        @keyframes progress {
          0% { width: 0% }
          20% { width: 20% }
          60% { width: 60% }
          100% { width: 100% }
        }
      `}</style>
    </div>
  );
} 