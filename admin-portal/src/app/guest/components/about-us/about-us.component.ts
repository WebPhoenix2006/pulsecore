import { Component } from '@angular/core';

@Component({
  selector: 'app-about-us',
  standalone: false,
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent {

  stats = [
    {
      value: '10K+',
      label: 'Happy Customers',
      icon: 'fas fa-users'
    },
    {
      value: '99.9%',
      label: 'Uptime',
      icon: 'fas fa-server'
    },
    {
      value: '50M+',
      label: 'Transactions Processed',
      icon: 'fas fa-chart-line'
    },
    {
      value: '24/7',
      label: 'Customer Support',
      icon: 'fas fa-headset'
    }
  ];

  team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: '/assets/images/team/sarah.jpg',
      bio: 'Former tech executive with 15+ years in enterprise software. Passionate about helping businesses streamline operations.',
      social: {
        linkedin: '#',
        twitter: '#'
      }
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: '/assets/images/team/michael.jpg',
      bio: 'Full-stack engineer and system architect. Expert in scalable cloud infrastructure and modern web technologies.',
      social: {
        linkedin: '#',
        github: '#'
      }
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Product',
      image: '/assets/images/team/emily.jpg',
      bio: 'UX design expert with a background in supply chain management. Focused on creating intuitive user experiences.',
      social: {
        linkedin: '#',
        dribbble: '#'
      }
    },
    {
      name: 'David Thompson',
      role: 'VP of Sales',
      image: '/assets/images/team/david.jpg',
      bio: 'Sales leader with deep knowledge of retail and e-commerce. Helps businesses find the right solutions.',
      social: {
        linkedin: '#',
        twitter: '#'
      }
    }
  ];

  values = [
    {
      icon: 'fas fa-rocket',
      title: 'Innovation',
      description: 'We continuously innovate to stay ahead of industry trends and provide cutting-edge solutions.'
    },
    {
      icon: 'fas fa-handshake',
      title: 'Reliability',
      description: 'Our platform is built for 99.9% uptime with enterprise-grade security and data protection.'
    },
    {
      icon: 'fas fa-heart',
      title: 'Customer Success',
      description: 'Your success is our success. We provide dedicated support to help you achieve your goals.'
    },
    {
      icon: 'fas fa-lock',
      title: 'Security',
      description: 'We implement the highest security standards to protect your business data and transactions.'
    }
  ];

  scrollToContact() {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}