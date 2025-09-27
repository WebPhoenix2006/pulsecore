import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

  currentYear = new Date().getFullYear();

  footerLinks = {
    product: [
      { name: 'Features', link: '#features' },
      { name: 'Pricing', link: '#pricing' },
      { name: 'Integrations', link: '#' },
      { name: 'API', link: '#' },
      { name: 'Demo', link: '#' }
    ],
    company: [
      { name: 'About Us', link: '#about' },
      { name: 'Careers', link: '#' },
      { name: 'Blog', link: '#' },
      { name: 'Press', link: '#' },
      { name: 'Partners', link: '#' }
    ],
    support: [
      { name: 'Help Center', link: '#' },
      { name: 'Contact Us', link: '#contact' },
      { name: 'Status', link: '#' },
      { name: 'Documentation', link: '#' },
      { name: 'Community', link: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', link: '#' },
      { name: 'Terms of Service', link: '#' },
      { name: 'Security', link: '#' },
      { name: 'GDPR', link: '#' },
      { name: 'Compliance', link: '#' }
    ]
  };

  socialLinks = [
    { name: 'LinkedIn', icon: 'fab fa-linkedin', url: '#' },
    { name: 'Twitter', icon: 'fab fa-twitter', url: '#' },
    { name: 'Facebook', icon: 'fab fa-facebook', url: '#' },
    { name: 'GitHub', icon: 'fab fa-github', url: '#' },
    { name: 'YouTube', icon: 'fab fa-youtube', url: '#' }
  ];

  scrollToSection(sectionId: string) {
    if (sectionId.startsWith('#')) {
      const element = document.getElementById(sectionId.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
}