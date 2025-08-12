import React, { useState, useEffect } from 'react';

const BITCOIN_QUOTES = [
  "Saving is a virtue.",
  "You were right about Bitcoin.",
  "The final satoshi will be mined around February 2140.",
  "Do you have enough bitcoin?",
  "HODL",
  "There can only ever be 21 million.",
  "El Salvador was the first country to adopt bitcoin as legal tender on September 7, 2021.",
  "The first bitcoin transaction was sent from Satoshi Nakamoto to Hal Finney on January 12, 2009.",
  "Prove your work, get rewarded.",
  "Hard money > soft money",
  "\"It might make sense just to get some in case it catches on.\" - Satoshi Nakamoto",
  "Bitcoin fixes this.",
  "Gradually, then suddenly.",
  "1 bitcoin = 1 bitcoin",
  "Opt out of fiat.",
  "Stay humble, stack sats.",
  "Bitcoin was launched on January 3rd, 2009.",
  "The first commercial bitcoin transaction was on May 22nd, 2010 - 10,000 bitcoin for 2 pizzas.",
  "Fix the money, fix the world.",
  "There is no second best.",
  "Tick tock, next block",
  "Inflation is a stealth tax.",
  "Better money",
  "Bitcoin is savings technology.",
  "Bitcoin is for everyone.",
  "You can't print bitcoin.",
  "Rules, not rulers",
  "Every day is a good day to stack sats.",
  "It's Fuck You Money",
  "Bitcoin is freedom money."
];

interface BitcoinQuoteProps {
  className?: string;
}

const BitcoinQuote: React.FC<BitcoinQuoteProps> = ({ className = '' }) => {
  const [quote, setQuote] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolledAway, setHasScrolledAway] = useState(false);

  // Function to get a random quote
  const getRandomQuote = () => {
    return BITCOIN_QUOTES[Math.floor(Math.random() * BITCOIN_QUOTES.length)];
  };

  // Select a random quote on component mount
  useEffect(() => {
    setQuote(getRandomQuote());
  }, []);

  // Detect scroll position and show/hide quote
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Check if user is within 100px of the bottom
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 100;
      
      if (isNearBottom) {
        // If first time reaching bottom or coming back after scrolling away
        if (!isVisible || hasScrolledAway) {
          setQuote(getRandomQuote());
          setIsVisible(true);
          setHasScrolledAway(false);
        }
      } else {
        // User scrolled away from bottom
        if (isVisible) {
          setIsVisible(false);
          setHasScrolledAway(true);
        }
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // Check initial position
    handleScroll();

    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, hasScrolledAway]);

  return (
    <div className={`mt-24 mb-16 text-center transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}>
      <p className="text-xs text-gray-400 px-4 max-w-2xl mx-auto pb-safe">
        {quote}
      </p>
    </div>
  );
};

export default BitcoinQuote;
