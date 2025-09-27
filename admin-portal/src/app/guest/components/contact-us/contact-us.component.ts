import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-us',
  standalone: false,
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent {

  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;

  contactInfo = [
    {
      icon: 'fas fa-envelope',
      title: 'Email Us',
      content: 'support@pulsecore.com',
      subtitle: 'We respond within 24 hours'
    },
    {
      icon: 'fas fa-phone',
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      subtitle: 'Mon-Fri 9AM-6PM EST'
    },
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Visit Us',
      content: '123 Business Ave, Suite 100',
      subtitle: 'New York, NY 10001'
    },
    {
      icon: 'fas fa-comments',
      title: 'Live Chat',
      content: 'Available 24/7',
      subtitle: 'Instant support on our website'
    }
  ];

  faqs = [
    {
      question: 'How quickly can I get started?',
      answer: 'You can sign up and start using PulseCore immediately. Our setup wizard guides you through the initial configuration in under 10 minutes.',
      isOpen: false
    },
    {
      question: 'Do you offer data migration services?',
      answer: 'Yes, we provide free data migration for new customers. Our team will help you import your existing inventory, suppliers, and customer data.',
      isOpen: false
    },
    {
      question: 'What kind of support do you provide?',
      answer: 'We offer email support for all plans, priority support for Professional plans, and dedicated support for Enterprise customers. Plus 24/7 live chat.',
      isOpen: false
    },
    {
      question: 'Can I integrate with my existing systems?',
      answer: 'PulseCore offers APIs and webhooks for custom integrations. We also have pre-built integrations with popular e-commerce platforms and accounting software.',
      isOpen: false
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use enterprise-grade security with SSL encryption, regular backups, and SOC 2 compliance. Your data is hosted on secure AWS servers.',
      isOpen: false
    }
  ];

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      company: [''],
      phone: [''],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit() {
    if (this.contactForm.valid) {
      this.isSubmitting = true;

      // Simulate form submission
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset();

        // Reset success message after 5 seconds
        setTimeout(() => {
          this.submitSuccess = false;
        }, 5000);
      }, 2000);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `${fieldName} is too short`;
    }
    return '';
  }

  toggleFaq(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }
}