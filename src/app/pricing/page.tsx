import PricingCard from '@/components/PricingCard';
import { authClient, Session } from '@/lib/auth-client';
import { PrismaClient, Plan } from '@/generated/prisma';
import { SignOutButton } from '@/components/SignOutButton';
import Image from 'next/image';
import Link from 'next/link';

const prisma = new PrismaClient();

type PlanWithFeatures = Omit<Plan, 'features'> & {
  features: string[];
};

// Reusable Header from home page
const Header = ({ session }: { session: Session | null }) => (
  <header className="absolute inset-x-0 top-0 z-50">
    <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
      <div className="flex lg:flex-1">
        <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
          <span className="sr-only">Amazing Photos</span>
          <IconLogo />
          <span className="font-semibold text-xl">Amazing Photos</span>
        </Link>
      </div>
      <div className="flex items-center gap-x-6">
        {session ? (
            <div className="flex items-center gap-4 bg-black/10 backdrop-blur-sm rounded-full pl-3 pr-5 py-2 border border-white/10">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={`${session.user.name}'s profile`}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-indigo-400"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                  <span>{session.user.name?.[0]}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{session.user.name}</p>
                <div className="flex items-center justify-between gap-3">
                  <Link href="/generate" className="text-xs text-indigo-300 hover:underline">
                    Dashboard
                  </Link>
                  <span className="text-white/20">•</span>
                  <SignOutButton />
                </div>
              </div>
            </div>
        ) : (
          <>
            <Link href="/pricing" className="font-semibold leading-6 hover:text-indigo-300">
              Pricing
            </Link>
            <Link href="/" className="font-semibold leading-6 hover:text-indigo-300">
              Sign In <span aria-hidden="true">&rarr;</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  </header>
);

const IconLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500" aria-labelledby="logoTitle">
    <title id="logoTitle">Amazing Photos Logo</title>
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


export default async function PricingPage() {
  const { data: session } = await authClient.getSession();
  
  const plansData = await prisma.plan.findMany({
    orderBy: {
      price: 'asc',
    },
  });

  const plans: PlanWithFeatures[] = plansData.map((p: Plan) => ({...p, features: Array.isArray(p.features) ? p.features as string[] : []}))

  return (
    <div className="relative isolate bg-slate-950 text-white">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
      </div>
      
      <Header session={session} />

      <main>
        {/* Hero Section */}
        <div className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Always have the perfect photo of yourself
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Generate AI photos of yourself instantly, whenever you need them. No more scheduling photoshoots or asking friends to take pictures.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-slate-300">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-labelledby="checkTitle1">
                  <title id="checkTitle1">Checkmark</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant generation</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-labelledby="checkTitle2">
                  <title id="checkTitle2">Checkmark</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Any setting or style</span>
              </div>
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-labelledby="checkTitle3">
                  <title id="checkTitle3">Checkmark</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Professional quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Choose Your Plan
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Select the perfect plan for your photo generation needs. All plans include high-quality AI generation and instant availability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index: number) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isPopular={index === 1} // Make the second plan popular
                  userId={session?.user.id || undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Why Choose Amazing Photos?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-labelledby="availabilityTitle">
                    <title id="availabilityTitle">Availability Icon</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Always Available</h3>
                <p className="text-slate-300">Generate photos 24/7 whenever you need them. No scheduling required.</p>
              </div>
              <div className="text-center">
                <div className="p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-labelledby="qualityTitle">
                    <title id="qualityTitle">Quality Icon</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Professional Quality</h3>
                <p className="text-slate-300">High-resolution photos that look professional and authentic.</p>
              </div>
              <div className="text-center">
                <div className="p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-labelledby="possibilitiesTitle">
                    <title id="possibilitiesTitle">Endless Possibilities Icon</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Endless Possibilities</h3>
                <p className="text-slate-300">Create photos in any setting, style, or scenario you can imagine.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does AI photo generation work?
                </h3>
                <p className="text-slate-300">
                  You upload a few photos of yourself, and our AI learns to generate new photos of you in different settings, styles, and scenarios. The process is completely automated and takes just a few minutes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I cancel my subscription anytime?
                </h3>
                <p className="text-slate-300">
                  Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What happens to my photos?
                </h3>
                <p className="text-slate-300">
                  Your photos are stored securely and are never shared with anyone. You can download or delete them at any time.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Do unused generations roll over?
                </h3>
                <p className="text-slate-300">
                  No, unused generations don&apos;t roll over to the next month. Each billing period starts fresh with your full allocation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <a
        href="https://tomdekan.com"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-black/20 text-white/50 text-xs font-semibold rounded-full backdrop-blur-sm hover:text-white/80 transition-colors"
      >
        Made by Tom Dekan
      </a>
    </div>
  );
}