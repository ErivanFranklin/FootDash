import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonGrid, IonRow, IonCol, IonText, IonCard, IonCardContent, IonChip } from '@ionic/angular/standalone';
import { TranslocoPipe } from '@jsverse/transloco';
import { GamificationService, BadgeResponse, BadgeTier } from '../../../../services/gamification.service';
import { BadgeCardComponent } from '../../../../components/gamification/badge-card/badge-card.component';
import { PageHeaderComponent } from '../../../../shared/components';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-badges',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonSegment, IonSegmentButton, IonLabel, IonSpinner,
    IonGrid, IonRow, IonCol, IonText, IonCard, IonCardContent, IonChip,
    TranslocoPipe,
    BadgeCardComponent,
    PageHeaderComponent,
  ],
  templateUrl: './badges.page.html',
  styleUrls: ['./badges.page.scss'],
})
export class BadgesPage implements OnInit {
  allBadges: BadgeResponse[] = [];
  filteredBadges: BadgeResponse[] = [];
  isLoading = false;
  selectedFilter: 'all' | 'unlocked' | 'locked' = 'all';
  selectedTier: BadgeTier | 'all' = 'all';

  unlockedCount = 0;
  totalCount = 0;

  private gamificationService = inject(GamificationService);
  private logger = inject(LoggerService);

  ngOnInit() {
    this.loadBadges();
  }

  loadBadges() {
    this.isLoading = true;
    this.gamificationService.getAllBadges().subscribe({
      next: (badges) => {
        this.allBadges = badges;
        this.totalCount = badges.length;
        this.unlockedCount = badges.filter((b) => b.unlocked).length;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.logger.error('Error loading badges', err);
        this.isLoading = false;
      },
    });
  }

  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
    this.applyFilters();
  }

  onTierChange(tier: BadgeTier | 'all') {
    this.selectedTier = tier;
    this.applyFilters();
  }

  private applyFilters() {
    let badges = [...this.allBadges];

    if (this.selectedFilter === 'unlocked') {
      badges = badges.filter((b) => b.unlocked);
    } else if (this.selectedFilter === 'locked') {
      badges = badges.filter((b) => !b.unlocked);
    }

    if (this.selectedTier !== 'all') {
      badges = badges.filter((b) => b.tier === this.selectedTier);
    }

    this.filteredBadges = badges.sort((a, b) => a.sortOrder - b.sortOrder);
  }
}
