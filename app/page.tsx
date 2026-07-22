import Link from "next/link";
import { InfoTip } from "@/app/components/InfoTip";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Icon } from "@/app/components/Icon";
import { getRegressivity } from "@/lib/queries";

export const metadata = {
  title: "Overtaxed: are you overpaying on your home?",
  description: "Check if your home is taxed too high, see the proof on a map, and get a ready-to-file appeal. Free, no sign-up.",
};

// refresh the live impact number at most hourly
export const revalidate = 3600;

const usd0 = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0, notation: "compact" }).format(n);

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="card-premium p-6 hover:-translate-y-0.5">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-fg shadow-sm">{n}</div>
      <h3 className="font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

function Stat({ big, small }: { big: string; small: React.ReactNode }) {
  return (
    <div className="card-premium p-6">
      <div className="text-[2rem] font-bold leading-none tracking-tight text-accent tabular-nums">{big}</div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{small}</p>
    </div>
  );
}

function Feature({ icon, title, children }: { icon: React.ComponentProps<typeof Icon>["name"]; title: string; children: React.ReactNode }) {
  return (
    <div className="card-premium p-6 hover:-translate-y-0.5">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/10">
        <Icon name={icon} />
      </div>
      <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-border bg-surface px-5 py-4 transition-colors open:border-border-strong hover:border-border-strong">
      <summary className="flex cursor-pointer list-none items-center font-medium marker:content-none">
        <span className="mr-3 text-lg font-normal leading-none text-accent transition-transform group-open:rotate-45">+</span>
        {q}
      </summary>
      <p className="mt-2.5 pl-8 text-sm leading-relaxed text-muted">{a}</p>
    </details>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-accent">{children}</p>;
}

export default async function Landing() {
  let impact: Awaited<ReturnType<typeof getRegressivity>>["spec"]["impact"] | null = null;
  try {
    impact = (await getRegressivity("Cook County")).spec.impact ?? null;
  } catch { /* landing still renders without the live number */ }

  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm text-accent-fg shadow-sm">O</span>
            Overtaxed
          </span>
          <div className="flex items-center gap-1.5 text-sm">
            <a href="#how" className="hidden rounded-full px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-foreground sm:inline">How it works</a>
            <Link href="/methodology" className="hidden rounded-full px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-foreground sm:inline">Methodology</Link>
            <ThemeToggle />
            <Link href="/app" className="rounded-full bg-accent px-4 py-1.5 font-medium text-accent-fg shadow-sm transition-colors hover:bg-accent-hover">Check my home</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border hero-glow">
        <div className="pointer-events-none absolute inset-0 grid-texture" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-24 text-center sm:pt-28">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3.5 py-1.5 text-xs font-medium text-muted shadow-sm backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Live on public records · US property tax and UK council tax
          </div>
          <h1 className="animate-fade-up text-[2.6rem] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[4.5rem]" style={{ animationDelay: "80ms" }}>
            You could be overpaying
            <span className="block bg-gradient-to-r from-accent to-[#7c6cf7] bg-clip-text text-transparent">
              tax on your home.
            </span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted" style={{ animationDelay: "160ms" }}>
            The tax office often values homes too high, and almost nobody checks. Type your address and see the
            proof on a map, in seconds.
          </p>
          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
            <Link href="/app" className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-fg shadow-md transition-all hover:bg-accent-hover hover:shadow-lg sm:w-auto">
              Check my home, free
              <Icon name="arrowRight" size={17} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#how" className="inline-flex w-full items-center justify-center rounded-full border border-border-strong bg-surface px-7 py-3.5 font-medium shadow-sm transition-colors hover:bg-surface-2 sm:w-auto">See how it works</a>
          </div>
          <p className="mt-4 text-xs text-muted">No sign-up. An estimate from public records, not tax advice.</p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-accent" /> 6M+ UK sales</span>
            <span className="h-3.5 w-px bg-border-strong" />
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-accent" /> 1.6M Chicago parcels</span>
            <span className="h-3.5 w-px bg-border-strong" />
            <span className="inline-flex items-center gap-1.5"><Icon name="check" size={14} className="text-accent" /> 100% public records</span>
          </div>
        </div>
      </header>

      {/* Problem */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <Kicker>The quiet problem</Kicker>
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Millions overpay. Almost nobody checks.</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat big="30–60%" small={<>of US homes are over-assessed, valued too high for tax.</>} />
          <Stat big="400,000+" small="UK homes are in the wrong council tax band, stuck on a rushed 1991 valuation." />
          <Stat big="< 1 in 20" small="people ever challenge it, yet winning saves $1,000–3,000 (or £1,000s) a year." />
        </div>
      </section>

      {/* Impact band */}
      {impact && (
        <section className="border-y border-border bg-neg/5">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-neg">The scale of it</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
              In Cook County alone, an estimated <span className="text-neg">{usd0(impact.estCountyAnnual)}/year</span> is
              quietly shifted onto lower-value homeowners.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              {impact.overAssessedPct}% of homes are over-assessed versus a fair system. The typical over-assessed
              lower-value home overpays about <strong className="text-foreground">{usd0(impact.avgOverpayBelow)}</strong>{" "}
              a year. Not a guess: computed live from public records. We help you claim your share back.
            </p>
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="border-y border-border bg-surface-2/40">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <Kicker>How it works</Kicker>
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight">Three steps. No jargon.</h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-muted">No sign-up, no spreadsheets, just your address.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Step n={1} title="Type your address">Just your home address, nothing else. We look it up in public property records.</Step>
            <Step n={2} title="We compare it to real sales next door">We pull millions of real, recent sales of homes like yours nearby and work out what yours is really worth.</Step>
            <Step n={3} title="See if you're overpaying">A clear verdict, a map of your street, and a ready-to-send appeal. What you do next is up to you.</Step>
          </div>
        </div>
      </section>

      {/* What you'll see */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <Kicker>What you get back</Kicker>
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight">Pictures, not paragraphs.</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature icon="target" title="The verdict">One line: are you overpaying, and by roughly how much a year.</Feature>
          <Feature icon="pin" title="Your street, on a map">Every home near you, coloured by how fairly it&apos;s taxed. Yours stands out.</Feature>
          <Feature icon="chart" title="The fairness check">Whether your whole area quietly taxes cheaper homes harder than expensive ones.</Feature>
          <Feature icon="file" title="A ready-to-file appeal">Pre-filled with the evidence and the official link. Free to send.</Feature>
        </div>
      </section>

      {/* Two countries */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card-premium p-7">
            <span className="inline-flex items-center rounded-md border border-border bg-surface-2 px-2 py-1 text-xs font-semibold tracking-wide text-muted">US</span>
            <h3 className="mt-3 text-lg font-semibold">United States: property tax</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Starting with Cook County (Chicago). We check if your home is over-assessed
              <InfoTip label="Over-assessed">The tax office thinks your home is worth more than it really is, so your tax bill is too high.</InfoTip>{" "}
              versus real nearby sales.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-7 shadow-sm">
            <span className="inline-flex items-center rounded-md border border-border bg-surface-2 px-2 py-1 text-xs font-semibold tracking-wide text-muted">UK</span>
            <h3 className="mt-3 text-lg font-semibold">United Kingdom: council tax band</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              UK bands
              <InfoTip label="Council tax band">A letter (A to H) that decides your council tax. It was set from a quick 1991 valuation, and many are wrong.</InfoTip>{" "}
              still rely on a rushed 1991 valuation. We check if you&apos;re in too high a band, and owed a refund.
            </p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-border bg-surface-2/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Kicker>Is this legit?</Kicker>
          <h2 className="text-3xl font-bold tracking-tight">Built on real public data.</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted">
            Not guesses. <strong className="text-foreground">6 million+</strong> UK property sales and{" "}
            <strong className="text-foreground">1.6 million</strong> Chicago parcels, straight from government records.
            It&apos;s an estimate, not tax advice, and we show exactly how every number is worked out.
          </p>
          <Link href="/methodology" className="mt-6 inline-block rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-surface-2">
            See our methodology &amp; sources
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <Kicker>Questions</Kicker>
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Good to know</h2>
        <div className="space-y-2.5">
          <Faq q="Is it free?" a="Yes. No sign-up, no payment, no catch." />
          <Faq q="Do I need to create an account?" a="No. Just type your address and get your answer." />
          <Faq q="Is my data safe?" a="We only use your address to look up public property records. We don't sell your data or do anything else with it." />
          <Faq q="How accurate is it?" a="It's an estimate based on recent sales of similar homes nearby. We show our working, the comparable sales we used, and a confidence level so you can judge it yourself." />
          <Faq q="What do I do with the result?" a="If you're overpaying, we hand you a pre-filled appeal and the official filing link. Sending it is your choice, and many appeals succeed and get money back." />
        </div>
      </section>

      {/* CTA */}
      <section className="hero-glow">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Check your home in 10 seconds.</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">Free, no sign-up. You might be owed thousands.</p>
          <Link href="/app" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 font-semibold text-accent-fg shadow-md transition-all hover:bg-accent-hover hover:shadow-lg">
            Check my home, free
            <Icon name="arrowRight" size={17} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        <p>An estimate from public records. Not tax or legal advice. Not affiliated with any government body.</p>
        <p className="mt-1">Built with ClickHouse + Trigger.dev · <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">Methodology</Link></p>
      </footer>
    </div>
  );
}
