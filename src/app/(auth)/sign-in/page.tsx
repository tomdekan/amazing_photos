'use client'

import { authClient } from '@/lib/auth-client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const SignIn = () => {
  const [isHovering, setIsHovering] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async () => {
    setIsLoading(true)
    await authClient.signIn.social({ provider: 'google', callbackURL: '/generate' })
    // No need to set isLoading back to false, as the page will redirect.
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black overflow-hidden">
      <Link href="/" className="absolute top-8 left-8 z-20 text-white hover:text-gray-300 transition-colors">
        <BackIcon />
      </Link>
      <div className="relative">
        {/* Animated background elements */}
        {mounted && [...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-blue-500/10"
            initial={{ 
              width: `${50 + i * 20}px`, 
              height: `${50 + i * 20}px`,
              x: -25 - i * 10, 
              y: -25 - i * 10,
              opacity: 0.2,
            }}
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ 
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
        
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center rounded-xl bg-white/5 backdrop-blur-lg p-10 border border-white/10"
          initial={mounted ? { opacity: 0, y: 20 } : false}
          animate={mounted ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h1 
            className="mb-6 text-3xl font-bold text-white"
            initial={mounted ? { opacity: 0 } : false}
            animate={mounted ? { opacity: 1 } : false}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Welcome!
          </motion.h1>
          
          <motion.div
            whileHover={mounted ? { scale: 1.05 } : undefined}
            whileTap={mounted ? { scale: 0.98 } : undefined}
            onHoverStart={() => setIsHovering(true)}
            onHoverEnd={() => setIsHovering(false)}
          >
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="group relative flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-lg font-medium text-gray-900 shadow-lg transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600"
                    initial={{ x: '-100%' }}
                    animate={mounted ? { x: isHovering ? '0%' : '-100%' } : { x: '-100%' }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  <motion.span 
                    className="relative z-10 text-gray-900 group-hover:text-white transition-colors duration-300"
                  >
                    Sign in with Google
                  </motion.span>
                  
                  <motion.svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="relative z-10 h-5 w-5 text-gray-900 group-hover:text-white transition-colors duration-300" 
                    viewBox="0 0 24 24"
                    initial={{ rotate: 0 }}
                    animate={mounted ? { rotate: isHovering ? 360 : 0 } : { rotate: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <path 
                      fill="currentColor" 
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" 
                    />
                    <path 
                      fill="currentColor" 
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" 
                    />
                    <path 
                      fill="currentColor" 
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" 
                    />
                    <path 
                      fill="currentColor" 
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" 
                    />
                  </motion.svg>
                </>
              )}
            </button>
          </motion.div>
          
          <motion.div
            className="mt-8 text-sm text-gray-400"
            initial={mounted ? { opacity: 0 } : false}
            animate={mounted ? { opacity: 1 } : false}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Sign in to Amazing.photos
          </motion.div>
        </motion.div>
      </div>
    </main>
  )
}

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

export default SignIn