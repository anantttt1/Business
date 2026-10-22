const correctionPrice = 59

export const config = {
  brand: import.meta.env.VITE_BRAND_NAME || 'AP Creative Studio',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '919286034026',
  email: import.meta.env.VITE_CONTACT_EMAIL || 'apcreativestudio0@gmail.com',
  googleFormUrl: import.meta.env.VITE_GOOGLE_FORM_URL || 'https://forms.gle/giqJYaECf3upcc6Y7',
  correctionPrice,
  services: [
    { title: 'Professional Resume Creation', description: 'A sharp, story-led resume that makes your strengths easy to see.', originalPrice: 249, price: 99, icon: 'file' },
    { title: 'ATS-Friendly Resume Design', description: 'A clean, readable format built to work well with common ATS parsers.', originalPrice: 249, price: 99, icon: 'scan' },
    { title: 'Personal Portfolio Website', description: 'A responsive home for your projects, skills, story and contact details.', originalPrice: 359, price: 149, note: `Any further changes after delivery will cost ₹${correctionPrice}.`, icon: 'monitor' },
    { title: 'Student & Fresher Portfolio', description: 'Turn coursework, projects and potential into a confident first impression.', originalPrice: 359, price: 149, note: `Any further changes after delivery will cost ₹${correctionPrice}.`, icon: 'graduation' },
    { title: 'Resume Redesign & Improvement', description: 'Improve hierarchy, clarity and impact while keeping your story authentic.', originalPrice: 119, price: 49, icon: 'sparkles' }
  ]
}
