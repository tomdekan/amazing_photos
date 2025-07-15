'use client'

import { authClient } from '@/lib/auth-client'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BackButton } from '@/components/BackButton'
import Image from 'next/image'
import Link from 'next/link'

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
    <div className="min-h-screen bg-slate-950 text-white grid lg:grid-cols-2">
      {/* Left side: Sign in form */}
      <div className="flex flex-col items-center justify-center p-8 relative">
        <BackButton
          href="/"
          className="absolute top-8 left-8 z-20 text-white hover:text-gray-300 transition-colors"
        />

        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <IconLogo />
              <span className="font-semibold text-2xl">Amazing Photos</span>
            </Link>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
            <h1 className="text-3xl font-bold tracking-tight text-center">
              Sign in to your account
            </h1>
            <p className="text-center text-slate-400 mt-2">
              Get started creating your AI photos.
            </p>

            <div className="mt-8 flex justify-center">
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
            </div>
          </div>
          
          <div className="mt-10 space-y-6 text-slate-300">
            <BenefitItem text="Instant Generation: Get your photos in minutes, not days." />
            <BenefitItem text="Any Style, Any Setting: From professional headshots to fantasy portraits." />
            <BenefitItem text="Private and Secure: Your photos are used only to train your model." />
          </div>
        </div>
      </div>

      {/* Right side: Image showcase */}
      <div className="hidden lg:block relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-950">
        <div className="absolute inset-0 grid grid-cols-2 gap-4">
          <div className="flex flex-col space-y-4 animate-scroll-up">
            <Image src="/placeholder1.svg" alt="Generated photo 1" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder3.svg" alt="Generated photo 3" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder2.svg" alt="Generated photo 2" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder1.svg" alt="Generated photo 4" width={400} height={500} className="rounded-xl shadow-2xl" />
            {/* Duplicates for seamless scroll */}
            <Image src="/placeholder1.svg" alt="Generated photo 1" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder3.svg" alt="Generated photo 3" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder2.svg" alt="Generated photo 2" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder1.svg" alt="Generated photo 4" width={400} height={500} className="rounded-xl shadow-2xl" />
          </div>
          <div className="flex flex-col space-y-4 animate-scroll-down">
            <Image src="/placeholder2.svg" alt="Generated photo 2" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder1.svg" alt="Generated photo 4" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder3.svg" alt="Generated photo 3" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder1.svg" alt="Generated photo 1" width={400} height={500} className="rounded-xl shadow-2xl" />
            {/* Duplicates for seamless scroll */}
            <Image src="/placeholder2.svg" alt="Generated photo 2" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder1.svg" alt="Generated photo 4" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder3.svg" alt="Generated photo 3" width={400} height={500} className="rounded-xl shadow-2xl" />
            <Image src="/placeholder1.svg" alt="Generated photo 1" width={400} height={500} className="rounded-xl shadow-2xl" />
          </div>
        </div>
      </div>
      
      <a
        href="https://tomdekan.com"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-black/20 text-white/50 text-xs font-semibold rounded-full backdrop-blur-sm hover:text-white/80 transition-colors"
      >
        Made by Tom Dekan
      </a>
    </div>
  )
}

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

const BenefitItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3">
    <svg className="h-6 w-6 flex-none text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>{text}</span>
  </div>
);

const IconLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default SignIn