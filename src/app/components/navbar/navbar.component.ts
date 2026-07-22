import { Component, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isExploreOpen = false;

  constructor(private elementRef: ElementRef) {}

  toggleExplore(): void {
    this.isExploreOpen = !this.isExploreOpen;
  }

  closeExplore(): void {
    this.isExploreOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isExploreOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isExploreOpen = false;
    }
  }
}

