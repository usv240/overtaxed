import Link from "next/link";
import { InfoTip } from "@/app/components/InfoTip";

export const metadata = {
  title: "Overtaxed — are you overpaying on your home?",
  description: "Check if your home is taxed too high, see the proof on a map, and get a ready-to-file appeal. Free, no sign-up.",
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{n}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{children}</p>
    </div>
  );
}

function Stat({ big, small }: { big: string; small: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 p-5 dark:border-white/10">
      <div className="text-3xl font-bold text-blue-600">{big}</div>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{small}</p>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-2 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{children}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-black/10 p-4 dark:border-white/10">
      <summary className="cursor-pointer list-none font-medium marker:content-none">
        <span className="mr-2 text-blue-600 group-open:hidden">＋</span>
        <span className="mr-2 hidden text-blue-600 group-open:inline">－</span>
        {q}
      </summary>
      <p className="mt-2 pl-6 text-sm text-neutral-600 dark:text-neutral-300">{a}</p>
    </details>
  );
}

export default function Landing() {
  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold">Overtaxed</span>
          <div className="flex items-center gap-2 text-sm">
            <a href="#how" className="hidden rounded-full px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 sm:inline">How it works</a>
            <Link href="/methodology" className="hidden rounded-full px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 sm:inline">Methodology</Link>
            <Link href="/app" className="rounded-full bg-blue-600 px-4 py-1.5 font-medium text-white hover:bg-blue-700">Check my home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center">
        <p className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          US property tax · UK council tax
        </p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          You could be overpaying<br />tax on your home.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600 dark:text-neutral-300">
          The tax office often values homes too high — and almost nobody checks. Type your address and see if
          you&apos;re one of them, with the proof on a map, in seconds.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/app" className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">Check my home — free →</Link>
          <a href="#how" className="rounded-full border border-black/15 px-6 py-3 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">See how it works</a>
        </div>
        <p className="mt-3 text-xs text-neutral-400">No sign-up. It&apos;s an estimate from public records, not tax advice.</p>
      </header>

      {/* Problem */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-6 text-center text-2xl font-bold">The quiet problem</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat big="30–60%" small={<>of US homes are over-assessed — valued too high for tax.</>} />
          <Stat big="400,000+" small="UK homes are in the wrong council tax band, stuck on a rushed 1991 valuation." />
          <Stat big="< 1 in 20" small="people ever challenge it — yet winning saves $1,000–3,000 (or £1,000s) a year." />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-2 text-center text-2xl font-bold">How it works</h2>
        <p className="mx-auto mb-6 max-w-xl text-center text-sm text-neutral-500">Three steps. No jargon, no sign-up.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Step n={1} title="Type your address">Just your home address — nothing else. We look it up in public property records.</Step>
          <Step n={2} title="We compare it to real sales next door">We pull millions of real, recent sales of homes like yours nearby and work out what yours is really worth.</Step>
          <Step n={3} title="See if you&apos;re overpaying">A clear verdict, a map of your street, and a ready-to-send appeal. What you do next is up to you.</Step>
        </div>
      </section>

      {/* What you'll see */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="mb-6 text-center text-2xl font-bold">What you&apos;ll get back — pictures, not paragraphs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon="🎯" title="The verdict">One line: are you overpaying, and by roughly how much a year.</Feature>
          <Feature icon="🗺️" title="Your street, on a map">Every home near you, coloured by how fairly it&apos;s taxed. Yours stands out.</Feature>
          <Feature icon="⚖️" title="The fairness check">Whether your whole area quietly taxes cheaper homes harder than expensive ones.</Feature>
          <Feature icon="📄" title="A ready-to-file appeal">Pre-filled with the evidence and the official link. Free to send.</Feature>
        </div>
      </section>

      {/* Two countries */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
            <div className="text-2xl">🇺🇸</div>
            <h3 className="mt-2 font-semibold">United States — property tax</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              Starting with Cook County (Chicago). We check if your home is{" "}
              <span className="whitespace-nowrap">over-assessed
                <InfoTip label="Over-assessed">The tax office thinks your home is worth more than it really is — so your tax bill is too high.</InfoTip>
              </span>{" "}versus real nearby sales.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
            <div className="text-2xl">🇬🇧</div>
            <h3 className="mt-2 font-semibold">United Kingdom — council tax band</h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              UK bands
              <InfoTip label="Council tax band">A letter (A–H) that decides your council tax. It was set from a quick 1991 valuation — and many are wrong.</InfoTip>{" "}
              still rely on a rushed 1991 valuation. We check if you&apos;re in too high a band — and owed a refund.
            </p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-3xl px-4 py-10 text-center">
        <h2 className="text-2xl font-bold">Is this legit?</h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600 dark:text-neutral-300">
          Yes — it&apos;s built on <strong>real public data</strong>, not guesses: 6 million+ UK property sales and
          1.6 million Chicago parcels, straight from government records. It&apos;s an <strong>estimate, not tax advice</strong>,
          and we show exactly how every number is worked out.
        </p>
        <Link href="/methodology" className="mt-4 inline-block rounded-full border border-black/15 px-5 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
          See our methodology &amp; sources
        </Link>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h2 className="mb-6 text-center text-2xl font-bold">Common questions</h2>
        <div className="space-y-2">
          <Faq q="Is it free?" a="Yes. No sign-up, no payment, no catch." />
          <Faq q="Do I need to create an account?" a="No. Just type your address and get your answer." />
          <Faq q="Is my data safe?" a="We only use your address to look up public property records. We don't sell your data or do anything else with it." />
          <Faq q="How accurate is it?" a="It's an estimate based on recent sales of similar homes nearby. We show our working, the comparable sales we used, and a confidence level so you can judge it yourself." />
          <Faq q="What do I do with the result?" a="If you're overpaying, we hand you a pre-filled appeal and the official filing link. Sending it is your choice — many appeals succeed and get money back." />
        </div>
      </section>

      {/* CTA + footer */}
      <section className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h2 className="text-2xl font-bold">Check your home in 10 seconds</h2>
        <Link href="/app" className="mt-4 inline-block rounded-full bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700">Check my home — free →</Link>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-xs text-neutral-400 dark:border-white/10">
        <p>An estimate from public records — not tax or legal advice. Not affiliated with any government body.</p>
        <p className="mt-1">Built with ClickHouse + Trigger.dev · <Link href="/methodology" className="underline">Methodology</Link></p>
      </footer>
    </div>
  );
}
