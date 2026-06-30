export interface Technology {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export interface Experience {
  company: string;
  position: string;
  location: string;
  image: string;
  description: string[];
  startDate: string;
  endDate: string;
  website: string;
  x?: string;
  linkedin?: string;
  github?: string;
  technologies: Technology[];
  isCurrent: boolean;
  isBlur?: boolean;
}

export const experiences: Experience[] = [
  {
    isCurrent: true,
    company: 'Deloitte USI',
    position: 'Consultant',
    location: 'India',
    image: '/assets/logo.png',
    description: [
      'Add a brief summary of your role and responsibilities here.',
      'Highlight a key project or achievement.',
      'Mention technologies, platforms, or domains you work with.',
    ],
    startDate: 'July 2023',
    endDate: 'Present',
    technologies: [],
    website: 'https://www.deloitte.com',
    linkedin: 'https://www.linkedin.com/company/deloitte',
  },
];
