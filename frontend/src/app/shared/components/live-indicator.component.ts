import { Component, Input, OnInit, OnChanges, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonBadge } from '@ionic/angular/standalone';

@Component({
  selector: 'app-live-indicator',
  standalone: true,
  template: `
    <div class="live-indicator" [class.live]="isLive" [class.pulsing]="isLive && animate">
      <span class="live-dot" *ngIf="isLive"></span>
      <ion-badge [color]="badgeColor" [class.live-badge]="isLive">
        {{ displayText }}
      </ion-badge>
      <span class="minute" *ngIf="isLive && minute !== undefined">'{{ minute }}</span>
    </div>
  `,
  styles: [`
    .live-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--ion-color-danger);
      display: inline-block;
    }

    .live-indicator.pulsing .live-dot {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.3;
      }
    }

    .live-badge {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .minute {
      color: var(--ion-color-medium);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .live-indicator.live .minute {
      color: var(--ion-color-danger);
      font-weight: 600;
    }
  `],
  imports: [CommonModule, IonBadge]
})
export class LiveIndicatorComponent implements OnInit, OnChanges {
  @Input() status: string = '';
  @Input() minute?: number;
  @Input() animate: boolean = true;

  isLive: boolean = false;
  badgeColor: string = 'medium';
  displayText: string = '';

  ngOnInit(): void {
    this.updateDisplay();
  }

  ngOnChanges(): void {
    this.updateDisplay();
  }

  private updateDisplay(): void {
    const normalizedStatus = (this.status || '').toUpperCase();
    
    // Check if match is live
    this.isLive = ['IN_PLAY', 'LIVE', 'HALFTIME', 'PAUSED', 'IN PLAY'].some(
      s => normalizedStatus.includes(s)
    );

    // Set badge color and text based on status
    if (this.isLive) {
      this.badgeColor = 'danger';
      if (normalizedStatus.includes('HALFTIME') || normalizedStatus.includes('HALF')) {
        this.displayText = 'HT';
      } else if (normalizedStatus.includes('PAUSED')) {
        this.displayText = 'Paused';
      } else {
        this.displayText = 'Live';
      }
    } else if (normalizedStatus.includes('FINISHED') || normalizedStatus.includes('FT') || normalizedStatus.includes('FULL')) {
      this.badgeColor = 'medium';
      this.displayText = 'FT';
    } else if (normalizedStatus.includes('SCHEDULED') || normalizedStatus.includes('TIMED') || normalizedStatus.includes('NS')) {
      this.badgeColor = 'primary';
      this.displayText = 'Scheduled';
    } else if (normalizedStatus.includes('POSTPONED')) {
      this.badgeColor = 'warning';
      this.displayText = 'Postponed';
    } else if (normalizedStatus.includes('CANCELLED')) {
      this.badgeColor = 'danger';
      this.displayText = 'Cancelled';
    } else {
      this.badgeColor = 'medium';
      this.displayText = this.status || 'Unknown';
    }
  }
}

@Injectable()
export class LiveMatchService {
  // ...existing code...
}
