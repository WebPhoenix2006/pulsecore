import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  standalone: false,
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit, OnDestroy {

  constructor() { }

  ngOnInit(): void {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Add scroll listener for navbar effect
    window.addEventListener('scroll', this.handleScroll);
  }

  ngOnDestroy(): void {
    // Clean up scroll listener
    window.removeEventListener('scroll', this.handleScroll);
  }

  private handleScroll = (): void => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }
}