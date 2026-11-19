import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Eye, HeartHandshake, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about SAWEE CARS — a Tanzanian dealership dedicated to vintage and classic automobiles.",
  alternates: { canonical: "/about" },
};

export const revalidate = 300;

export default async function AboutPage() {
  const settings = await getSiteSettings();

  const sections = [
    {
      icon: Compass,
      title: "Our Mission",
      body:
        settings.aboutMission ||
        "To connect enthusiasts and collectors in Tanzania and beyond with genuine vintage and classic automobiles, presented honestly and cared for personally.",
    },
    {
      icon: Eye,
      title: "Our Vision",
      body:
        settings.aboutVision ||
        "To be the most trusted name for vintage and classic motoring in Tanzania — a showroom known for the quality of its collection and the clarity of its service.",
    },
    {
      icon: ShieldCheck,
      title: "Our Commitment",
      body:
        settings.aboutCommitment ||
        "We photograph every vehicle properly, publish complete specifications, and keep availability up to date. When something sells, we say so. No pressure, no hidden details — just straight answers on WhatsApp.",
    },
  ];

  return (
    <>
      {/* Hero introduction */}
      <section className="bg-ink py-16 text-white dark-section md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="max-w-3xl">
              <p className="eyebrow">About SAWEE CARS</p>
              <h1 className="mt-2 font-heading text-4xl font-bold uppercase leading-tight tracking-tight md:text-5xl">
                Who We Are
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-neutral-300">
                {settings.aboutIntro ||
                  "SAWEE CARS is a Tanzanian dealership specialising in vintage and classic automobiles. The collection you see on this website is presented the same way we present it in person: real photographs, real specifications, and availability that we keep up to date ourselves."}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Story with photography */}
      <section aria-labelledby="story-heading" className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src="/images/demo/about.png"
                alt="Classic automobiles at SAWEE CARS"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div>
              <p className="eyebrow">Our Story</p>
              <h2
                id="story-heading"
                className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl"
              >
                Driven by Classic Motoring
              </h2>
              <div className="mt-5 space-y-4 leading-relaxed text-foreground/90">
                {(settings.aboutStory ||
                  "Our story is being written one car at a time. What began as a passion for the character and craftsmanship of classic motoring has grown into a dealership serving enthusiasts across Tanzania.\n\nWe do not claim decades of history or inventory we do not have. Instead, we focus on what we can prove: a carefully presented collection, honest specification sheets, and a direct line to the people who know each vehicle.")
                  .split("\n\n")
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission / Vision / Commitment */}
      <section aria-labelledby="values-heading" className="bg-secondary py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">What Guides Us</p>
              <h2
                id="values-heading"
                className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl"
              >
                Mission, Vision &amp; Commitment
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {sections.map((s, i) => (
              <Reveal key={s.title} delay={0.08 * i}>
                <div className="flex h-full flex-col rounded-lg border border-border bg-white p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                    <s.icon className="h-6 w-6 text-gold-dark" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-heading text-lg font-bold">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink">
              <HeartHandshake className="h-7 w-7 text-gold" aria-hidden />
            </span>
            <h2 className="mx-auto mt-6 max-w-xl font-heading text-3xl font-bold uppercase tracking-tight md:text-4xl">
              Come and meet the collection
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Browse the inventory online, then message us on WhatsApp to arrange a viewing
              or ask any question about a vehicle.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gold px-8 text-gold-foreground hover:bg-gold-dark">
                <Link href="/inventory">
                  Explore Collection
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
