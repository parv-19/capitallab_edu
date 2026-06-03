import Link from "next/link";
import { Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { companyInfo, marketingCourses } from "@/lib/site-content";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Programs", href: "/courses" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Login", href: "/login" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-navyDark text-white">
      <div className="container-shell py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img
                src="/api/site-assets/logo"
                alt="Capital Lab Education"
                className="h-14 w-auto rounded-sm bg-white p-1"
              />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-5">
              {companyInfo.tagline}
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Youtube, href: "#", label: "YouTube" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-brand-gold transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
              <a
                href={companyInfo.whatsappHref}
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-brand-gold transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.554 4.106 1.523 5.828L.057 23.5l5.83-1.527A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.583-.502-5.073-1.377l-.364-.215-3.77.988.988-3.699-.234-.381A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/60 text-sm hover:text-brand-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Our Programs</h3>
            <ul className="space-y-2">
              {marketingCourses.map((course) => (
                <li key={course.slug}>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="text-white/60 text-sm hover:text-brand-gold transition-colors"
                  >
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Office Hours</h3>
              <p className="text-white/60 text-sm">{companyInfo.officeHours}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/60">
                <MapPin className="w-4 h-4 text-brand-gold mt-0.5 shrink-0" />
                <span>{companyInfo.location}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60">
                <Phone className="w-4 h-4 text-brand-gold shrink-0" />
                <a href={companyInfo.phoneHref} className="hover:text-brand-gold transition-colors">
                  {companyInfo.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60">
                <Mail className="w-4 h-4 text-brand-gold shrink-0" />
                <a href={`mailto:${companyInfo.email}`} className="hover:text-brand-gold transition-colors">
                  {companyInfo.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-shell py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <span>&copy; 2026 {companyInfo.name}. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
