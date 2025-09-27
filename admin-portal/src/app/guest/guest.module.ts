import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { FeaturesComponent } from './components/features/features.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { ContactUsComponent } from './components/contact-us/contact-us.component';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';

import { GuestRoutingModule } from './guest-routing.module';
import { SharedModule } from '../shared/shared-module';

@NgModule({
  declarations: [
    LandingPageComponent,
    HeroSectionComponent,
    FeaturesComponent,
    PricingComponent,
    AboutUsComponent,
    ContactUsComponent,
    FooterComponent,
    NavbarComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    GuestRoutingModule,
    SharedModule,
  ],
})
export class GuestModule {}
