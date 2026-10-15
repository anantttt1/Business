export const config = {
  brand: import.meta.env.VITE_BRAND_NAME || 'AP Creative Studio',
  whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER || '910000000000',
  email: import.meta.env.VITE_CONTACT_EMAIL || 'hello@example.com',
  apiBase: import.meta.env.VITE_API_BASE_URL || '',
  // Central editable pricing: update these values before launch.
  services: [
    { title: 'Professional Resume Creation', description: 'A sharp, story-led resume that makes your strengths easy to see.', price: 799, icon: 'file' },
    { title: 'ATS-Friendly Resume Design', description: 'A clean, readable format built to work well with common ATS parsers.', price: 999, icon: 'scan' },
    { title: 'Personal Portfolio Website', description: 'A responsive home for your projects, skills, story and contact details.', price: 3999, icon: 'monitor' },
    { title: 'Student & Fresher Portfolio', description: 'Turn coursework, projects and potential into a confident first impression.', price: 2499, icon: 'graduation' },
    { title: 'LinkedIn Profile Optimization', description: 'Bring clarity to your headline, About section, experience and skills.', price: 999, icon: 'linkedin' },
    { title: 'Resume Redesign & Improvement', description: 'Improve hierarchy, clarity and impact while keeping your story authentic.', price: 599, icon: 'sparkles' },
    { title: 'Custom Branding Package', description: 'A cohesive visual identity across your resume, portfolio and profile.', price: 5999, icon: 'layers' }
  ],
  packages: [
    { id: 'starter', name: 'Starter', price: 799, description: 'A confident first impression.', features: ['Professional resume', 'Clean, modern layout', 'PDF delivery', 'One review round'], featured: false },
    { id: 'professional', name: 'Professional', price: 3499, description: 'A complete personal brand foundation.', features: ['ATS-friendly resume', 'Customized personal portfolio', 'Mobile-responsive design', 'Two review rounds'], featured: true },
    { id: 'premium', name: 'Premium', price: 6999, description: 'A polished presence across platforms.', features: ['Custom portfolio website', 'Professional resume', 'LinkedIn profile improvement', 'Personalized branding', 'Three review rounds'], featured: false }
  ]
}
