import { Component, input, output } from '@angular/core';
import { SidebarRoute } from '../../../interfaces/sidebar-route.interface';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  isLeftSidebarCollapsed = input.required<boolean>();
  links = input<SidebarRoute[]>();
  toggleState = output<boolean>();

  items = [
    { routeLink: '/', icon: 'fa fa-home', label: 'Home' },
    { routeLink: '/pages', icon: 'fa fa-file', label: 'Pages' },
    { routeLink: '/products', icon: 'fa fa-box-open', label: 'Products' },
  ];
}
