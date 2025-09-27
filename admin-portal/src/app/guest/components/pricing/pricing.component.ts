import { Component } from '@angular/core';

@Component({
  selector: 'app-pricing',
  standalone: false,
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent {

  billingCycle: 'monthly' | 'yearly' = 'monthly';

  plans = [
    {
      name: 'Starter',
      description: 'Perfect for small businesses just getting started',
      monthlyPrice: 29,
      yearlyPrice: 290,
      popular: false,
      features: [
        'Up to 100 products',
        'Basic inventory tracking',
        '5 suppliers',
        '50 orders per month',
        'Email support',
        'Basic reporting',
        '1 user account'
      ]
    },
    {
      name: 'Professional',
      description: 'Ideal for growing businesses with advanced needs',
      monthlyPrice: 79,
      yearlyPrice: 790,
      popular: true,
      features: [
        'Up to 1,000 products',
        'Advanced inventory management',
        'Unlimited suppliers',
        '500 orders per month',
        'Batch tracking & expiry alerts',
        'Advanced reporting & analytics',
        'Up to 5 user accounts',
        'Priority support',
        'API access'
      ]
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with complex requirements',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      popular: false,
      features: [
        'Unlimited products',
        'Complete inventory suite',
        'Unlimited suppliers & riders',
        'Unlimited orders',
        'Advanced batch management',
        'Custom reporting',
        'Unlimited user accounts',
        'Dedicated support',
        'Full API access',
        'Custom integrations',
        'Advanced security features'
      ]
    }
  ];

  getPrice(plan: any): number {
    return this.billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  }

  getSavings(plan: any): number {
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    return Math.round((savings / monthlyTotal) * 100);
  }

  setBillingCycle(cycle: 'monthly' | 'yearly') {
    this.billingCycle = cycle;
  }

  trackByPlan(index: number, plan: any) {
    return plan.name;
  }

  trackByFeature(index: number, feature: string) {
    return feature;
  }

  scrollToContact() {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}