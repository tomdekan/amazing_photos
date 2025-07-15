import { SignOutButton } from "@/components/SignOutButton";
import { authClient, Session } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";

// --- Main Page Component ---
export default async function Home() {
  const { data: session } = await authClient.getSession();

  return (
    <div className="relative isolate overflow-hidden bg-slate-950 text-white min-h-screen flex flex-col">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-500/20" />
      <Header session={session} />
      <main className="flex-grow flex items-center">
          <Hero session={session} />
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

// --- Page Sections ---

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
            <Link href="/sign-in" className="font-semibold leading-6 hover:text-indigo-300">
              Sign In <span aria-hidden="true">&rarr;</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  </header>
);

const Hero = ({ session }: { session: Session | null }) => (
  <div className="w-full">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
          The Perfect Photo of You Doesn&apos;t Exist.
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          So create it. From professional headshots to epic portraits, get
          exactly the image you need in minutes.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href={session ? '/generate' : '/sign-in'}
            className="rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-transform transform hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </div>
      {/* Blurred background element */}
      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#8089ff] to-[#4f46e5] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </div>
  </div>
);



// --- SVG Icons ---
const IconLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
