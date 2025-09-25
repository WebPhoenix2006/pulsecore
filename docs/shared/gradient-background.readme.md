# 🌈 GradientBackground Component

A visually appealing gradient background component that displays content with a centered layout over a gradient background. Perfect for hero sections, feature highlights, and promotional content areas.

## ✨ Features

- **Gradient Background** - Beautiful gradient background styling
- **Centered Content** - Automatically centers content both vertically and horizontally
- **Customizable Text** - Dynamic title and body text via Angular signals
- **Responsive Design** - Adapts to different screen sizes
- **Themed Styling** - Uses CSS custom properties for consistent theming
- **Flexible Layout** - Can expand to fill available space

## 🚀 Installation & Setup

### Component Declaration
```typescript
import { GradientBackground } from './shared/ui/gradient-background/gradient-background';

@NgModule({
  declarations: [
    GradientBackground,
    // ... other components
  ]
})
export class SharedModule {}
```

## 📦 Basic Usage

### Simple Usage
```html
<!-- Default content -->
<app-gradient-background></app-gradient-background>

<!-- Custom title only -->
<app-gradient-background [title]="'Welcome to PulseCore'"></app-gradient-background>

<!-- Custom title and body -->
<app-gradient-background
  [title]="'Get Started Today'"
  [body]="'Join thousands of users already using our platform'">
</app-gradient-background>
```

### Dynamic Content
```html
<!-- With dynamic content -->
<app-gradient-background
  [title]="heroTitle()"
  [body]="heroDescription()">
</app-gradient-background>
```

### Component Integration
```typescript
import { Component, signal } from '@angular/core';

@Component({
  template: `
    <section class="hero-section">
      <app-gradient-background
        [title]="welcomeTitle()"
        [body]="welcomeMessage()">
      </app-gradient-background>
    </section>

    <main class="main-content">
      <!-- Your main content -->
    </main>
  `
})
export class LandingPageComponent {
  welcomeTitle = signal('Transform Your Workflow');
  welcomeMessage = signal('Experience the power of modern tools designed to streamline your daily tasks and boost productivity.');

  updateHeroContent(title: string, message: string) {
    this.welcomeTitle.set(title);
    this.welcomeMessage.set(message);
  }
}
```

## ⚙️ Component API

### Inputs
| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `title` | `string` | ❌ Optional | `'Default Title'` | The main heading text displayed |
| `body` | `string` | ❌ Optional | Lorem ipsum text | The body/description text |

### Component Structure
```typescript
@Component({
  selector: 'app-gradient-background',
  standalone: false,
  templateUrl: './gradient-background.html',
  styleUrl: './gradient-background.scss',
})
export class GradientBackground {
  title = input<string>('Default Title');
  body = input<string>(
    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque odio modi amet quidem obcaecati hic corporis quaerat, repellat nihil unde.'
  );
}
```

## 🎨 Styling & Theming

### Default Appearance
The component features:
- **Background**: Gradient background (via `.gradient-bg` class)
- **Text Color**: White text (`var(--white)`)
- **Layout**: Flexbox centered content
- **Typography**: Bold title (2rem) with regular body text (1rem)
- **Spacing**: 40px padding with max-width constraint

### CSS Structure
```scss
.gradient-con {
  flex: 1;
  width: 100%;
  height: 100%;
  color: var(--white);
  text-align: center;
  padding: 40px;

  .gradient-content {
    max-width: 300px;
  }

  .gradient-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 15px;
  }

  .gradient-body {
    font-size: 1rem;
    line-height: 1.5;
  }
}
```

### Customization Examples

#### Full-Screen Hero
```scss
.hero-section {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  app-gradient-background {
    width: 100%;
    height: 100%;
  }
}
```

#### Custom Gradients
```scss
.custom-gradient {
  .gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

.sunset-gradient {
  .gradient-bg {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
  }
}
```

#### Responsive Typography
```scss
.gradient-con {
  .gradient-title {
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }

    @media (max-width: 480px) {
      font-size: 1.25rem;
    }
  }

  .gradient-body {
    @media (max-width: 768px) {
      font-size: 0.9rem;
    }
  }
}
```

#### Extended Content Width
```scss
.wide-content {
  .gradient-content {
    max-width: 600px;
  }
}
```

## 💡 Usage Examples

### Landing Page Hero
```html
<section class="hero">
  <app-gradient-background
    [title]="'Welcome to Our Platform'"
    [body]="'Discover amazing features that will transform how you work and collaborate with your team.'">
  </app-gradient-background>
</section>
```

### Feature Highlight
```html
<section class="feature-highlight">
  <app-gradient-background
    [title]="'Advanced Analytics'"
    [body]="'Get deep insights into your data with our powerful analytics dashboard and reporting tools.'">
  </app-gradient-background>
</section>
```

### Call-to-Action Section
```html
<section class="cta-section">
  <app-gradient-background
    [title]="'Ready to Get Started?'"
    [body]="'Join over 10,000 satisfied customers who have already transformed their workflow.'">
  </app-gradient-background>

  <div class="cta-buttons">
    <cus-btn [buttonText]="'Start Free Trial'" [size]="'large'"></cus-btn>
    <cus-btn [buttonText]="'Learn More'" [isOutlined]="true" [size]="'large'"></cus-btn>
  </div>
</section>
```

### Error/Empty States
```html
<!-- 404 Page -->
<app-gradient-background
  [title]="'Page Not Found'"
  [body]="'The page you are looking for might have been removed or is temporarily unavailable.'">
</app-gradient-background>

<!-- Empty Data State -->
<app-gradient-background
  [title]="'No Data Available'"
  [body]="'There are no records to display at this time. Try adjusting your filters or create new content.'">
</app-gradient-background>
```

### Dynamic Content Based on User State
```typescript
export class DashboardComponent {
  userTitle = computed(() => {
    const user = this.authService.currentUser();
    return user ? `Welcome back, ${user.name}!` : 'Welcome to Dashboard';
  });

  userMessage = computed(() => {
    const user = this.authService.currentUser();
    return user
      ? 'Here\'s what\'s new since your last visit.'
      : 'Please sign in to access your personalized dashboard.';
  });
}
```

```html
<app-gradient-background
  [title]="userTitle()"
  [body]="userMessage()">
</app-gradient-background>
```

## 🎯 Best Practices

### 1. Content Guidelines
```html
<!-- Good: Clear, concise messaging -->
<app-gradient-background
  [title]="'Boost Your Productivity'"
  [body]="'Streamline your workflow with our intuitive tools designed for modern teams.'">
</app-gradient-background>

<!-- Avoid: Overly long or complex text -->
<app-gradient-background
  [title]="'This is a very long title that might not fit well and could wrap awkwardly'"
  [body]="'This is an extremely long body text that goes on and on with too much information...'">
</app-gradient-background>
```

### 2. Accessibility Considerations
```html
<!-- Ensure sufficient color contrast -->
<div class="gradient-section" role="banner" aria-labelledby="hero-title">
  <app-gradient-background
    [title]="'Our Mission'"
    [body]="'Making technology accessible to everyone.'">
  </app-gradient-background>
</div>
```

### 3. Responsive Design
```scss
.gradient-section {
  height: 60vh;
  min-height: 400px;

  @media (max-width: 768px) {
    height: 50vh;
    min-height: 300px;
  }

  .gradient-con {
    padding: 20px;

    @media (min-width: 768px) {
      padding: 60px;
    }
  }
}
```

## 🔧 Advanced Usage

### With Background Overlay
```html
<div class="hero-section">
  <div class="background-overlay"></div>
  <app-gradient-background
    [title]="'Premium Features'"
    [body]="'Unlock advanced capabilities with our pro subscription.'">
  </app-gradient-background>
</div>
```

```scss
.hero-section {
  position: relative;

  .background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1;
  }

  app-gradient-background {
    position: relative;
    z-index: 2;
  }
}
```

### With Animation
```scss
.gradient-con {
  .gradient-content {
    animation: fadeInUp 0.8s ease-out;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Multiple Sections Layout
```html
<div class="page-layout">
  <!-- Hero Section -->
  <section class="hero">
    <app-gradient-background
      [title]="'Welcome'"
      [body]="'Your journey starts here'">
    </app-gradient-background>
  </section>

  <!-- Content Section -->
  <section class="content">
    <!-- Regular content -->
  </section>

  <!-- CTA Section -->
  <section class="cta">
    <app-gradient-background
      [title]="'Ready to Begin?'"
      [body]="'Take the first step today'">
    </app-gradient-background>
  </section>
</div>
```

## 📱 Responsive Behavior

The component automatically adapts to different screen sizes:
- **Desktop**: Full padding (40px) and larger typography
- **Tablet**: Maintained spacing with adjusted content width
- **Mobile**: Reduced padding and smaller typography for readability

## 🧪 Testing

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GradientBackground } from './gradient-background';

describe('GradientBackground', () => {
  let component: GradientBackground;
  let fixture: ComponentFixture<GradientBackground>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GradientBackground]
    });
    fixture = TestBed.createComponent(GradientBackground);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display custom title', () => {
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('.gradient-title');
    expect(titleElement.textContent).toBe('Test Title');
  });

  it('should display custom body text', () => {
    const customBody = 'This is a test message.';
    fixture.componentRef.setInput('body', customBody);
    fixture.detectChanges();

    const bodyElement = fixture.nativeElement.querySelector('.gradient-body');
    expect(bodyElement.textContent).toBe(customBody);
  });

  it('should use default values when inputs are not provided', () => {
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('.gradient-title');
    const bodyElement = fixture.nativeElement.querySelector('.gradient-body');

    expect(titleElement.textContent).toBe('Default Title');
    expect(bodyElement.textContent).toContain('Lorem ipsum');
  });
});
```

## 🎨 Design Variations

### Card-style Layout
```scss
.card-gradient {
  .gradient-con {
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    margin: 2rem;
    max-width: 500px;
  }
}
```

### Minimal Style
```scss
.minimal-gradient {
  .gradient-title {
    font-weight: 300;
    font-size: 1.5rem;
  }

  .gradient-body {
    font-weight: 300;
    opacity: 0.9;
  }
}
```

## 🔄 Performance Considerations

- **Lightweight** - Minimal DOM structure and CSS
- **CSS Variables** - Uses efficient CSS custom properties
- **No JavaScript Animations** - Relies on CSS for performance
- **Signal-based** - Efficient change detection with Angular signals

## 📄 Related Components

- [`SpecialH1`](./special-h1.readme.md) - For other heading styles
- [`Button`](./button.readme.md) - Often used together for CTAs
- [`Loader`](./loader.readme.md) - Can be overlaid during loading states

## 📝 Notes

- **CSS Classes**: Uses `.gradient-bg` class which should be defined globally
- **Flexbox**: Container uses flexbox for centering (requires flex parent)
- **White Text**: Designed for dark/gradient backgrounds with white text
- **Content Width**: Limited to 300px max-width for optimal readability

## 🎯 Future Enhancements

Potential improvements could include:
- Multiple gradient presets
- Animation options
- Button integration
- Icon support
- Custom content projection via `<ng-content>`

## 📄 License

This component is part of the PulseCore project and follows the project's licensing terms.