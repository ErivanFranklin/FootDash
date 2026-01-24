import { Directive, ElementRef, HostListener, Renderer2, OnInit } from '@angular/core';

/**
 * HideOnScrollDirective
 * 
 * Auto-hides header on scroll down, shows on scroll up.
 * Provides more content space on mobile devices.
 * 
 * Usage:
 * ```html
 * <ion-header appHideOnScroll>
 *   <ion-toolbar>...</ion-toolbar>
 * </ion-header>
 * ```
 */
@Directive({
  selector: '[appHideOnScroll]',
  standalone: true
})
export class HideOnScrollDirective implements OnInit {
  private lastScrollTop = 0;
  private scrollThreshold = 5; // Minimum scroll distance to trigger
  private isHidden = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.renderer.addClass(this.el.nativeElement, 'header-hide-on-scroll');
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Check if scroll distance exceeds threshold
    if (Math.abs(scrollTop - this.lastScrollTop) < this.scrollThreshold) {
      return;
    }

    if (scrollTop > this.lastScrollTop && scrollTop > 100) {
      // Scrolling down & past threshold
      this.hideHeader();
    } else {
      // Scrolling up
      this.showHeader();
    }

    this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }

  private hideHeader() {
    if (!this.isHidden) {
      this.renderer.addClass(this.el.nativeElement, 'header-hidden');
      this.renderer.removeClass(this.el.nativeElement, 'header-visible');
      this.isHidden = true;
    }
  }

  private showHeader() {
    if (this.isHidden) {
      this.renderer.removeClass(this.el.nativeElement, 'header-hidden');
      this.renderer.addClass(this.el.nativeElement, 'header-visible');
      this.isHidden = false;
    }
  }
}
