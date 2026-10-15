export const config = {
  brand: import.meta.env.VITE_BRAND_NAME || 'AP Creative Studio',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '919286034026',
  email: import.meta.env.VITE_CONTACT_EMAIL || 'apcreativestudio0@gmail.com',
  googleFormUrl: import.meta.env.VITE_GOOGLE_FORM_URL || 'https://forms.gle/giqJYaECf3upcc6Y7',
  services: [
    { title: 'Professional Resume Creation', description: 'A sharp, story-led resume that makes your strengths easy to see.', price: 799, icon: 'file' },
    { title: 'ATS-Friendly Resume Design', description: 'A clean, readable format built to work well with common ATS parsers.', price: 999, icon: 'scan' },
    { title: 'Personal Portfolio Website', description: 'A responsive home for your projects, skills, story and contact details.', price: 999, icon: 'monitor' },
    { title: 'Student & Fresher Portfolio', description: 'Turn coursework, projects and potential into a confident first impression.', price: 899, icon: 'graduation' },
    { title: 'Resume Redesign & Improvement', description: 'Improve hierarchy, clarity and impact while keeping your story authentic.', price: 599, icon: 'sparkles' }
  ],
  packages: [
    { id: 'starter', name: 'Starter', price: 699, description: 'A confident first impression.', features: ['Professional resume', 'Clean, modern layout', 'PDF delivery', 'One review round'], featured: false },
    { id: 'professional', name: 'Professional', price: 899, description: 'A complete personal brand foundation.', features: ['ATS-friendly resume', 'Customized personal portfolio', 'Mobile-responsive design', 'Two review rounds'], featured: true },
    { id: 'premium', name: 'Premium', price: 999, description: 'A polished presence across platforms.', features: ['Custom portfolio website', 'Professional resume', 'Profile improvement tips', 'Personalized branding', 'Three review rounds'], featured: false }
  ]
}
