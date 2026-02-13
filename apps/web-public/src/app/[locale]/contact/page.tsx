"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, MessageSquare, Phone, Send } from "lucide-react";

const offices = [
  { city: "Port-au-Prince", country: "Haiti", address: "Rue Capois, Pétion-Ville", flag: "\u{1F1ED}\u{1F1F9}" },
  { city: "Miami", country: "United States", address: "Brickell Avenue, Suite 400", flag: "\u{1F1FA}\u{1F1F8}" },
  { city: "Montreal", country: "Canada", address: "Boulevard Saint-Laurent", flag: "\u{1F1E8}\u{1F1E6}" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden gold-dust">
        <div className="absolute inset-0 gradient-sovereign" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,167,86,0.08),transparent_60%)]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="font-serif-luxury text-4xl md:text-6xl font-bold text-kob-text mb-4">
            Get in <span className="gradient-gold-text">Touch</span>
          </h1>
          <p className="text-lg text-kob-muted max-w-2xl mx-auto">
            Have questions? We&apos;re here to help. Reach out to our team and we&apos;ll get back to you within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="py-20 bg-kob-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <div className="card-sovereign p-8">
              <h2 className="text-xl font-bold text-kob-text mb-6">Send Us a Message</h2>
              {submitted ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-kob-emerald/10 border border-kob-emerald/20 flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-kob-emerald" />
                  </div>
                  <h3 className="text-lg font-semibold text-kob-text mb-2">Message Sent!</h3>
                  <p className="text-sm text-kob-muted">We&apos;ll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      required
                      type="text"
                      placeholder="Full Name"
                      className="w-full px-4 py-3 rounded-xl border border-white/6 bg-kob-black text-kob-text text-sm placeholder:text-kob-muted focus:outline-none focus:border-kob-gold/40 transition-colors"
                    />
                    <input
                      required
                      type="email"
                      placeholder="Email Address"
                      className="w-full px-4 py-3 rounded-xl border border-white/6 bg-kob-black text-kob-text text-sm placeholder:text-kob-muted focus:outline-none focus:border-kob-gold/40 transition-colors"
                    />
                  </div>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-white/6 bg-kob-black text-kob-text text-sm focus:outline-none focus:border-kob-gold/40 transition-colors"
                  >
                    <option value="">Select Subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="business">Business / Partnership</option>
                    <option value="compliance">Compliance / Legal</option>
                    <option value="press">Press / Media</option>
                  </select>
                  <textarea
                    required
                    rows={5}
                    placeholder="Your Message"
                    className="w-full px-4 py-3 rounded-xl border border-white/6 bg-kob-black text-kob-text text-sm placeholder:text-kob-muted focus:outline-none focus:border-kob-gold/40 transition-colors resize-none"
                  />
                  <button type="submit" className="w-full btn-gold py-3 text-sm flex items-center justify-center gap-2">
                    <Send className="h-4 w-4" /> Send Message
                  </button>
                </form>
              )}
            </div>

            {/* Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-kob-text mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-kob-gold" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-kob-text">Email</div>
                      <div className="text-sm text-kob-muted">support@kobklein.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5 text-kob-gold" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-kob-text">Phone</div>
                      <div className="text-sm text-kob-muted">+509 2813 XXXX</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-5 w-5 text-kob-gold" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-kob-text">Live Chat</div>
                      <div className="text-sm text-kob-muted">Available in-app 24/7</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-kob-gold/10 border border-kob-gold/20 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-kob-gold" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-kob-text">Support Hours</div>
                      <div className="text-sm text-kob-muted">Mon-Fri 8AM-8PM EST / Sat 9AM-5PM EST</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offices */}
              <div>
                <h3 className="text-lg font-semibold text-kob-text mb-4">Our Offices</h3>
                <div className="space-y-3">
                  {offices.map((o) => (
                    <div key={o.city} className="card-sovereign p-4 flex items-center gap-4">
                      <span className="text-2xl">{o.flag}</span>
                      <div>
                        <div className="text-sm font-medium text-kob-text">{o.city}, {o.country}</div>
                        <div className="text-xs text-kob-muted flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {o.address}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
