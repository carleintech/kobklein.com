"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Marie-Claire J.",
    role: "Small Business Owner, Port-au-Prince",
    text: "KobKlein changed how I run my business. I accept payments instantly and my customers love the QR code system. No more chasing cash!",
    stars: 5,
  },
  {
    name: "Jean-Pierre D.",
    role: "Diaspora, Brooklyn NY",
    text: "Sending money to my family in Haiti used to take 3 days and cost a fortune. With KobKlein it takes 2 seconds and the fees are almost nothing.",
    stars: 5,
  },
  {
    name: "Nadine B.",
    role: "University Student, Cap-Ha\u00EFtien",
    text: "The K-Card is a game changer. I can finally shop online and pay for subscriptions without asking someone abroad. It just works.",
    stars: 5,
  },
  {
    name: "Roberto M.",
    role: "Merchant, P\u00E9tion-Ville",
    text: "My restaurant moved to KobKlein POS and our checkout time dropped by 70%. The dashboard shows me everything in real time.",
    stars: 5,
  },
  {
    name: "Fabiola L.",
    role: "Freelancer, Jacmel",
    text: "As a freelancer, getting paid was always a headache. Now clients send me money through KobKlein and I get it instantly. Love the security features!",
    stars: 5,
  },
];

export function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [active, setActive] = useState(0);

  // Auto-rotate
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prev = () => setActive((a) => (a - 1 + testimonials.length) % testimonials.length);
  const next = () => setActive((a) => (a + 1) % testimonials.length);

  return (
    <section className="relative py-28 lg:py-36 overflow-hidden">
      {/* Top line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[400px] h-[400px] bg-[#C9A84C]/[0.02] rounded-full blur-[130px] pointer-events-none" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium text-[#C9A84C] border border-[#C9A84C]/20 bg-[#C9A84C]/[0.05] mb-6 tracking-wide uppercase"
          >
            Trusted by Thousands
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F0F1F5] font-serif tracking-tight"
          >
            What our users{" "}
            <span className="bg-gradient-to-r from-[#C9A84C] to-[#E2CA6E] bg-clip-text text-transparent">
              are saying.
            </span>
          </motion.h2>
        </div>

        {/* Testimonial Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-3xl mx-auto"
        >
          {/* Card */}
          <div className="relative rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-sm p-10 lg:p-14 min-h-[280px] flex flex-col justify-center">
            {/* Decorative quote mark */}
            <div className="absolute top-6 left-8 text-7xl text-[#C9A84C]/[0.08] font-serif leading-none select-none">
              &ldquo;
            </div>

            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {Array.from({ length: testimonials[active].stars }).map((_, i) => (
                <Star key={i} size={16} className="text-[#C9A84C] fill-[#C9A84C]" />
              ))}
            </div>

            {/* Quote */}
            <motion.p
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-lg lg:text-xl text-[#B8BCC8] leading-relaxed mb-8 italic"
            >
              &ldquo;{testimonials[active].text}&rdquo;
            </motion.p>

            {/* Author */}
            <motion.div
              key={`author-${active}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/15 flex items-center justify-center">
                <span className="text-sm font-bold text-[#C9A84C]">
                  {testimonials[active].name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#F0F1F5]">
                  {testimonials[active].name}
                </div>
                <div className="text-xs text-[#7A8394]">
                  {testimonials[active].role}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] flex items-center justify-center text-[#7A8394] hover:text-white transition-all"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-8 bg-[#C9A84C]"
                      : "w-2 bg-white/[0.15] hover:bg-white/[0.25]"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] flex items-center justify-center text-[#7A8394] hover:text-white transition-all"
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
