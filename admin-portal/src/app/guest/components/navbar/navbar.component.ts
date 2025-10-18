import { Component, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isMobileMenuOpen = false;

  constructor(private elRef: ElementRef) { }


  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  scrollToSection(sectionId: string) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // close mobile menu after navigation
    this.isMobileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(evt: Event) {
    const clickedInside = this.elRef.nativeElement.contains(evt.target);
    if (!clickedInside && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event) {
    if (event instanceof KeyboardEvent && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

}
