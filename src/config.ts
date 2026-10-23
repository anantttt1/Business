const correctionPrice = 59
const freeChangeDays = 2

// Values can come from public VITE_* env vars, so validate them before they reach a link.
const httpsUrl = (value: string | undefined, fallback: string): string => {
  try {
    const u = new URL(value ?? '')
    return u.protocol === 'https:' ? u.toString() : fallback
  } catch {
    return fallback
  }
}
const phoneDigits = (value: string | undefined, fallback: string): string => {
  const d = (value ?? '').replace(/\D/g, '')
  return d.length >= 10 && d.length <= 15 ? d : fallback
}
const emailOr = (value: string | undefined, fallback: string): string =>
  /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(value ?? '') ? (value as string) : fallback

// Services are free for now, so prices are hidden everywhere on the site.
// To bring prices back later: set showPrices to true (and update public/terms.html).
const showPrices = false

export const config = {
  showPrices,
  brand: import.meta.env.VITE_BRAND_NAME || 'AP Creative Studio',
  whatsapp: phoneDigits(import.meta.env.VITE_WHATSAPP_NUMBER, '919286034026'),
  email: emailOr(import.meta.env.VITE_CONTACT_EMAIL, 'apcreativestudio0@gmail.com'),
  googleFormUrl: httpsUrl(import.meta.env.VITE_GOOGLE_FORM_URL, 'https://forms.gle/giqJYaECf3upcc6Y7'),
  correctionPrice,
  freeChangeDays,
  services: [
    { title: 'Professional Resume Creation', description: 'A sharp, story-led resume that makes your strengths easy to see.', originalPrice: 249, price: 99, icon: 'file' },
    { title: 'ATS-Friendly Resume Design', description: 'A clean, readable format built to work well with common ATS parsers.', originalPrice: 249, price: 99, icon: 'scan' },
    { title: 'Personal Portfolio Website', description: 'A responsive home for your projects, skills, story and contact details.', originalPrice: 359, price: 149, note: `Changes are free for ${freeChangeDays} days after delivery. After that, any further changes cost ₹${correctionPrice}.`, icon: 'monitor' },
    { title: 'Student & Fresher Portfolio', description: 'Turn coursework, projects and potential into a confident first impression.', originalPrice: 359, price: 149, note: `Changes are free for ${freeChangeDays} days after delivery. After that, any further changes cost ₹${correctionPrice}.`, icon: 'graduation' },
    { title: 'Resume Redesign & Improvement', description: 'Improve hierarchy, clarity and impact while keeping your story authentic.', originalPrice: 119, price: 49, icon: 'sparkles' },
    { title: 'Poster Design', description: 'Event, college or social posters that look sharp and get attention.', originalPrice: 99, price: 49, icon: 'image' },
    { title: 'Business Enquiry Website', description: 'A simple website so customers can reach your business — enquiry form, contact and key details.', originalPrice: 0, price: 0, note: 'Free for a limited time.', icon: 'globe' },
    { title: 'College & School Ad Posters', description: 'Advertisement posters for colleges and schools — events, admissions and campus promotions.', originalPrice: 99, price: 49, icon: 'school' }
  ]
}
