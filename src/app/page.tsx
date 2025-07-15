import { SignOutButton } from "@/components/SignOutButton";
import { authClient, Session } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";

// --- Main Page Component ---
export default async function Home() {
  const { data: session } = await authClient.getSession();

  return (
    <div className="bg-slate-950 text-white">
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-500/20">
        <Header session={session} />
        <Hero session={session} />
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
      <main>
        <HowItWorks />
        <Features />
        <Cta />
      </main>
      <Footer />
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
  <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-32 sm:pt-48 lg:pt-56 pb-24">
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
        Need a great photo of you?
        <br />
        Generate any photo of you in 5 minutes.
      </h1>
      <p className="mt-6 text-lg leading-8 text-slate-300">
        Upload a few of your favorite photos, and our AI will create a model of
        you. Then, generate any photo you want, in any style you can imagine.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          href={session ? '/generate' : '/sign-in'}
          className="rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-transform transform hover:scale-105"
        >
          Get Started
        </Link>
        <a
          href="#features"
          className="text-sm font-semibold leading-6 hover:text-indigo-300"
        >
          Learn more <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
    <div className="mt-16 w-full flex justify-center items-end sm:mt-24 h-72">
      <div className="relative flex justify-center w-[700px] h-[400px]">
        <Image
          src="/placeholder1.svg"
          alt="App screenshot"
          width={400}
          height={400}
          className="rounded-md shadow-2xl ring-1 ring-slate-900/10 absolute z-20 -translate-x-32"
        />
        <Image
          src="/placeholder2.svg"
          alt="App screenshot"
          width={400}
          height={400}
          className="rounded-md shadow-2xl ring-1 ring-slate-900/10 absolute z-10"
        />
        <Image
          src="/placeholder3.svg"
          alt="App screenshot"
          width={400}
          height={400}
          className="rounded-md shadow-2xl ring-1 ring-slate-900/10 absolute z-0 translate-x-32"
        />
      </div>
    </div>
  </div>
)

const HowItWorks = () => (
  <div className="py-24 sm:py-32 bg-slate-950">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl lg:text-center">
        <h2 className="text-base font-semibold leading-7 text-indigo-400">How It Works</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Create Your AI Photos in 3 Simple Steps
        </p>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          Our process is designed to be simple, fast, and secure. Get your personalized AI model without any hassle.
        </p>
      </div>
      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
          {[
            {
              name: "1. Upload Your Photos",
              description: "Quickly upload 10-20 photos of yourself. We'll use them to create your unique AI profile.",
              icon: <IconUpload />,
            },
            {
              name: "2. Train Your AI Model",
              description: "Our secure system trains a personalized AI model that understands your likeness.",
              icon: <IconCpuChip />,
            },
            {
              name: "3. Generate Anything",
              description: "Create anything you want. Professional headshots, fantasy art, and social media avatars.",
              icon: <IconSparkles />,
            },
          ].map((feature) => (
            <div key={feature.name} className="flex flex-col">
              <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                {feature.icon}
                {feature.name}
              </dt>
              <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-300">
                <p className="flex-auto">{feature.description}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  </div>
);

const Features = () => (
  <div id="features" className="py-24 sm:py-32 bg-indigo-950/20">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl lg:mx-0">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Unleash Your Creative Potential
        </h2>
        <p className="mt-6 text-lg leading-8 text-slate-300">
          We provide the tools to generate stunning, high-quality images with full creative control.
        </p>
      </div>
      <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 text-base leading-7 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        {[
          {
            name: "Custom Styles",
            description: "Generate images in any style—from corporate headshots to fantasy art. You're in complete control.",
            icon: <IconPaintBrush />,
          },
          {
            name: "Fast & High-Quality",
            description: "Get stunning, high-resolution images in minutes. Our powerful AI ensures top-tier results every time.",
            icon: <IconBolt />,
          },
          {
            name: "Private & Secure",
            description: "Your photos are used only to train your model and are never shared. Your privacy is our priority.",
            icon: <IconShieldCheck />,
          },
        ].map((feature) => (
          <div key={feature.name} className="relative pl-9">
            <dt className="inline font-semibold">
              <div className="absolute left-1 top-1 h-5 w-5 text-indigo-400">{feature.icon}</div>
              {feature.name}
            </dt>
            <dd className="inline text-slate-400"> {feature.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  </div>
);

const Cta = () => (
  <div className="relative isolate px-6 py-24 sm:px-16 sm:py-32 lg:px-24 bg-slate-950">
      <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to see yourself in a new light?
              <br/>
              Start creating today.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Join thousands of users transforming their photos. Get your professional headshots and creative portraits in minutes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                  href="/sign-in"
                  className="rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-transform transform hover:scale-105"
              >
                  Get started
              </Link>
              <Link href="/#features" className="text-sm font-semibold leading-6">
                  Learn more <span aria-hidden="true">→</span>
              </Link>
          </div>
      </div>
  </div>
)

const Footer = () => (
    <footer className="bg-slate-950">
        <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 lg:px-8">
            <p className="text-center text-xs leading-5 text-slate-400">
                &copy; {new Date().getFullYear()} Amazing Photos, Inc. All rights reserved.
            </p>
        </div>
    </footer>
);


// --- SVG Icons ---
const IconLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-500">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconUpload = () => (
  <svg className="h-5 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.3 9.7a.75.75 0 00-1.1 1.02l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75z" clipRule="evenodd" />
  </svg>
);
const IconCpuChip = () => (
  <svg className="h-5 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.5 5h-13a.5.5 0 00-.5.5v9a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v-9a.5.5 0 00-.5-.5zM15 4a2 2 0 012 2v9a2 2 0 01-2 2h-13a2 2 0 01-2-2v-9a2 2 0 012-2h13z" clipRule="evenodd" />
    <path d="M10 8a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM5.5 4V3a1 1 0 011-1h7a1 1 0 011 1v1h-9zM4.5 5H3V3.5a1 1 0 011-1H16a1 1 0 011 1V5h-1.5v10H17v1.5a1 1 0 01-1 1H4a1 1 0 01-1-1V5h1.5V4z" />
    <path fillRule="evenodd" d="M7 6.5A.5.5 0 017.5 6h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zM7 13.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5z" clipRule="evenodd" />
  </svg>
);
const IconSparkles = () => (
  <svg className="h-5 w-5 flex-none text-indigo-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10.868 2.884c.321.64.321 1.415 0 2.055l-1.46 2.92a1 1 0 00-.364 1.118l1.077 4.31a1 1 0 01-1.664 1.28l-4.31-1.077a1 1 0 00-1.118.364l-2.92 1.46c-.64.321-1.415.321-2.055 0l-2.92-1.46a1 1 0 00-1.118-.364l-4.31 1.077a1 1 0 01-1.28-1.664l1.077-4.31a1 1 0 00-.364-1.118l-1.46-2.92c-.321-.64-.321-1.415 0-2.055l1.46-2.92a1 1 0 00.364-1.118L2.884 1.832a1 1 0 011.664-1.28l4.31 1.077a1 1 0 001.118-.364l2.92-1.46c.64-.321 1.415-.321 2.055 0l2.92 1.46a1 1 0 001.118.364l4.31-1.077a1 1 0 011.28 1.664l-1.077 4.31a1 1 0 00.364 1.118l1.46 2.92z" clipRule="evenodd" />
  </svg>
);
const IconPaintBrush = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.024 4.234a.75.75 0 00-1.06-1.06L3.25 3.889a.75.75 0 001.06 1.061l.715-.715zM2 10a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zm3.889 6.75a.75.75 0 001.06-1.06l-.715-.716a.75.75 0 00-1.06 1.06l.715.715zM10 18a.75.75 0 000-1.5v-1.5a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0zM16.75 16.111a.75.75 0 001.06-1.06l-.715-.716a.75.75 0 00-1.06 1.06l.715.715zM18 10a.75.75 0 00-1.5 0h-1.5a.75.75 0 000 1.5h1.5a.75.75 0 001.5 0zm-.716-6.056a.75.75 0 00-1.06-1.06L15.5 3.6a.75.75 0 101.06 1.06l.715-.715zM10 5a5 5 0 100 10 5 5 0 000-10z" clipRule="evenodd" />
  </svg>
);
const IconBolt = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path d="M11.983 1.904a.75.75 0 00-1.292-.958L5.9 7.25h-1.15a.75.75 0 00-.75.75v3.5a.75.75 0 00.75.75h1.15l4.79 6.294a.75.75 0 001.293-.958L8.017 11.5H13.5a.75.75 0 00.75-.75v-3.5a.75.75 0 00-.75-.75H8.017l3.966-5.246z" />
  </svg>
);
const IconShieldCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);
