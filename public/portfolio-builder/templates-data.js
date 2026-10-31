/* Production templates */
window.PB_TEMPLATES = [
  {
    id: 'color-pop',
    name: 'Color Pop',
    priceInr: 19,
    category: 'creative',
    tagline: 'Colourful paper-style portfolio with live LeetCode heatmap, projects, skills, journey and certificates.',
    accent: '#5948ff',
    theme: 'light',
    features: ['LeetCode', 'Heatmap', 'Projects', 'Theme Toggle', 'Certificates'],
    preview: '/portfolio-builder/templates/color-pop/'
  },
  {
    id: 'ideas-impact',
    name: 'Ideas Impact',
    priceInr: 29,
    category: 'developer',
    tagline: 'Neon dark portfolio with 3D profile card, projects, skills, education, certificates and light/dark toggle.',
    accent: '#caff42',
    theme: 'dark',
    features: ['3D Card', 'Projects', 'Theme Toggle', 'Certificates', 'Responsive'],
    preview: '/portfolio-builder/templates/ideas-impact/'
  },
  {
    id: 'paper-atelier',
    name: 'Paper Atelier',
    priceInr: 29,
    category: 'creative',
    tagline: 'Classy cream-paper portfolio with red & yellow accents, projects, skills, journey and certificates.',
    accent: '#ae2530',
    theme: 'light',
    features: ['Light Theme', 'Projects', 'Skills', 'Journey', 'Certificates'],
    preview: '/portfolio-builder/templates/paper-atelier/'
  },
  {
    id: 'ember-editorial',
    name: 'Ember Editorial',
    priceInr: 39,
    category: 'developer',
    tagline: 'Warm amber editorial portfolio with Playfair accents, projects, coding profiles and certificates.',
    accent: '#ff641e',
    theme: 'dark',
    features: ['Editorial', 'Projects', 'Profiles', 'Certificates', 'Responsive'],
    preview: '/portfolio-builder/templates/ember-editorial/'
  },
  {
    id: 'signature-orange',
    name: 'Signature Orange',
    priceInr: 39,
    category: 'developer',
    tagline: 'Bold orange-accent portfolio with LeetCode stats, activity heatmap, projects, skills and certificates.',
    accent: '#ff8a32',
    theme: 'dark',
    features: ['Heatmap', 'LeetCode', 'Projects', 'Certificates', 'Skills'],
    preview: '/portfolio-builder/templates/signature-orange/'
  },
  {
    id: 'modern-dark-3d',
    name: 'Modern Dark 3D',
    priceInr: 29,
    category: 'developer',
    tagline: 'Premium dark developer portfolio with 3D hover effects, projects, skills, and contact.',
    accent: '#7190ff',
    theme: 'dark',
    features: ['3D Effects', 'Projects', 'Skills', 'Education', 'Contact'],
    preview: '/portfolio-builder/templates/modern-dark-3d/'
  },
  {
    id: 'student-bold',
    name: 'Student Bold',
    priceInr: 19,
    thumb: '/portfolio-builder/previews/student-bold.svg',
    category: 'developer',
    tagline: 'Bold student portfolio with LeetCode & GitHub trackers, projects, skills and contact. Perfect for CSE students.',
    accent: '#ff3b5c',
    theme: 'dark',
    features: ['LeetCode', 'GitHub Tracker', 'Projects', 'Skills', 'Streak'],
    preview: '/portfolio-builder/templates/student-bold/'
  },
  {
    id: 'student-elegant',
    name: 'Student Elegant',
    priceInr: 19,
    thumb: '/portfolio-builder/previews/student-elegant.svg',
    category: 'developer',
    tagline: 'Elegant serif + script student portfolio with coding trackers, projects and clean typography.',
    accent: '#1a1a2e',
    theme: 'light',
    features: ['LeetCode', 'GitHub', 'Projects', 'Elegant Type', 'Responsive'],
    preview: '/portfolio-builder/templates/student-elegant/'
  },
  {
    id: 'student-modern',
    name: 'Student Modern',
    priceInr: 19,
    thumb: '/portfolio-builder/previews/student-modern.svg',
    category: 'developer',
    tagline: 'Modern glow student portfolio with coding stats, skills, projects and polished dark UI.',
    accent: '#7c5cff',
    theme: 'dark',
    features: ['Coding Stats', 'Projects', 'Skills', 'Modern UI', 'Responsive'],
    preview: '/portfolio-builder/templates/student-modern/'
  },
  {
    id: 'student-portfolio',
    name: 'Student Portfolio',
    priceInr: 19,
    thumb: '/portfolio-builder/previews/student-portfolio.svg',
    category: 'developer',
    tagline: 'Striking full-bleed PORTFOLIO header student template with trackers and project cards.',
    accent: '#e63946',
    theme: 'dark',
    features: ['LeetCode', 'GitHub', 'Projects', 'Bold Header', 'Contact'],
    preview: '/portfolio-builder/templates/student-portfolio/'
  }
];

window.PB_DEMO = {
  fullName: 'Aarav Sharma',
  title: 'Full-Stack Developer',
  tagline: 'Building clean web products with React, Node.js and thoughtful UX.',
  about: 'I am a developer focused on shipping reliable, accessible interfaces and pragmatic backend services. I enjoy turning complex requirements into simple, maintainable systems.',
  location: 'Bengaluru, India',
  email: 'aarav.sharma@example.com',
  phone: '',
  resumeUrl: '',
  github: 'https://github.com/example',
  linkedin: 'https://linkedin.com/in/example',
  website: '',
  leetcode: '',
  hackerrank: '',
  leetcodeEndpoint: '',
  leetcodeUsername: '',
  otherLinks: [],
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'HTML', 'CSS', 'SQL', 'Git'],
  education: [
    {
      institution: 'Example Institute of Technology',
      degree: 'B.Tech',
      field: 'Computer Science',
      start: '2020',
      end: '2024',
      description: 'Relevant coursework: Data Structures, Web Development, Databases.'
    }
  ],
  experience: [
    {
      company: 'Example Labs',
      role: 'Software Engineering Intern',
      start: 'Jun 2023',
      end: 'Aug 2023',
      url: '',
      description: 'Built internal dashboards with React and improved API response times by caching frequent queries.'
    }
  ],
  projects: [
    {
      name: 'Campus Connect',
      description: 'A student community platform for sharing notes, events and project ideas.',
      tech: 'React, Node.js, MongoDB',
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com/example/campus-connect',
      imageData: ''
    },
    {
      name: 'TaskFlow CLI',
      description: 'Lightweight command-line task manager with local storage and tags.',
      tech: 'Node.js, TypeScript',
      liveUrl: '',
      githubUrl: 'https://github.com/example/taskflow',
      imageData: ''
    }
  ],
  certifications: [
    { name: 'Web Development Fundamentals', org: 'Example Academy', year: '2024', url: '' }
  ]
};
