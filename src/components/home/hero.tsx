"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";

type HeroProps = {
  imageUrl: string | null;
  headline: string;
  description: string;
};

export function Hero({ imageUrl, headline, description }: HeroProps) {
  const reduceMotion = useReducedMotion();

  const fadeUp = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.21, 0.65, 0.35, 1] as const },
        };

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative flex min-h-[560px] items-center overflow-hidden bg-ink md:min-h-[640px]"
    >
      {/* Background photography */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Vintage and classic automobile from the SAWEE CARS collection"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.p
          {...fadeUp(0)}
          className="eyebrow mb-5 text-[#d9c7a3]"
        >
          SAWEE CARS — Tanzania
        </motion.p>
        <motion.h1
          {...fadeUp(0.12)}
          id="hero-heading"
          className="max-w-3xl font-heading text-4xl font-bold uppercase leading-[1.08] text-white sm:text-5xl lg:text-6xl"
        >
          {headline}
        </motion.h1>
        <motion.p
          {...fadeUp(0.24)}
          className="mt-6 max-w-xl text-base leading-relaxed text-neutral-200 sm:text-lg"
        >
          {description}
        </motion.p>
        <motion.div {...fadeUp(0.36)} className="mt-10 flex flex-wrap items-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-gold px-8 text-gold-foreground hover:bg-gold-dark"
          >
            <Link href="/inventory">Explore Collection</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/contact">Contact Us</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
