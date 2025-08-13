import React from 'react';
import { motion } from 'framer-motion';

const BitcoinLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center" style={{ paddingBottom: '5vh' }}>
      <div className="relative flex items-center justify-center">
        
        {/* Outer glow */}
        <motion.div
          className="absolute w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 212, 212, 0.2) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
          initial={{
            scale: 1,
            opacity: 0.3
          }}
          animate={{
            scale: [1, 1.3, 1.2],
            opacity: [0.3, 0.7, 0.5]
          }}
          transition={{
            duration: 2,
            ease: "easeInOut"
          }}
        />

        {/* Inner glow */}
        <motion.div
          className="absolute w-20 h-20 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255, 212, 212, 0.4) 0%, transparent 60%)',
            filter: 'blur(10px)',
          }}
          initial={{
            scale: 1,
            opacity: 0.4
          }}
          animate={{
            scale: [1, 1.2, 1.1],
            opacity: [0.4, 0.8, 0.6]
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            delay: 0.2
          }}
        />

        {/* Bitcoin Symbol */}
        <motion.div
          className="text-7xl font-bold text-white relative z-10"
          style={{
            textShadow: '0 0 30px rgba(255, 212, 212, 0.8), 0 0 60px rgba(255, 212, 212, 0.4)'
          }}
          initial={{
            scale: 0.9,
            opacity: 0.7
          }}
          animate={{
            scale: [0.9, 1.1, 1.0],
            opacity: [0.7, 1, 1]
          }}
          transition={{
            duration: 2,
            ease: "easeInOut"
          }}
        >
          ₿
        </motion.div>

        {/* Orbiting Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-pink-200 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-4px',
              marginTop: '-4px',
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 0
            }}
            animate={{
              x: Math.cos((i * 60) * Math.PI / 180) * 50,
              y: Math.sin((i * 60) * Math.PI / 180) * 50,
              opacity: 1
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              delay: i * 0.3
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BitcoinLoader;
