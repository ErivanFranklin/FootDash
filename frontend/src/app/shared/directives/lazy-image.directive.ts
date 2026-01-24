import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit {
  @Input() appLazyImage = ''; // The actual image URL
  @Input() placeholder = 'assets/placeholder.png'; // Placeholder image

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Set placeholder initially
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder);
    
    // Add loading class for styling
    this.renderer.addClass(this.el.nativeElement, 'lazy-loading');

    // Use IntersectionObserver for lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage();
          observer.unobserve(this.el.nativeElement);
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before image enters viewport
    });

    observer.observe(this.el.nativeElement);
  }

  private loadImage() {
    const img = new Image();
    
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.appLazyImage);
      this.renderer.removeClass(this.el.nativeElement, 'lazy-loading');
      this.renderer.addClass(this.el.nativeElement, 'lazy-loaded');
    };

    img.onerror = () => {
      // Keep placeholder on error
      this.renderer.removeClass(this.el.nativeElement, 'lazy-loading');
      this.renderer.addClass(this.el.nativeElement, 'lazy-error');
    };

    img.src = this.appLazyImage;
  }
}
