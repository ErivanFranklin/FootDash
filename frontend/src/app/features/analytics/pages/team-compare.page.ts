import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonLabel,
  IonBadge, IonChip, IonNote, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { ApiService } from '../../../core/services/api.service';
import { AnalyticsService } from '../../../services/analytics.service';
import { FavoritesService, Favorite } from '../../../services/favorites.service';
import { TeamComparison, TeamAnalytics, HeadToHeadStats } from '../../../models/analytics.model';
import { Chart, registerables } from 'chart.js';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

Chart.register(...registerables);

interface TeamOption {
  id: number;
  name: string;
  logo?: string;
  isFavorite?: boolean;
}

@Component({
  selector: 'app-team-compare',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonLabel,
    IonBadge, IonChip, IonNote, IonRefresher, IonRefresherContent
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Team Compare</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="compare-container">
        <!-- Team Selection Section -->
        <div class="team-selection">
          <div class="team-picker" [class.selected]="homeTeam">
            @if (homeTeam) {
              <div class="selected-team" (click)="clearTeam('home')">
                <div class="team-avatar home">{{ homeTeam.name.charAt(0) }}</div>
                <span class="team-name">{{ homeTeam.name }}</span>
                <ion-icon name="close-circle" class="clear-btn"></ion-icon>
              </div>
            } @else {
              <div class="pick-prompt" (click)="openSearch('home')">
                <ion-icon name="add-circle-outline" class="pick-icon"></ion-icon>
                <span>Select Home</span>
              </div>
            }
          </div>

          <div class="vs-badge">
            <span>VS</span>
          </div>

          <div class="team-picker" [class.selected]="awayTeam">
            @if (awayTeam) {
              <div class="selected-team" (click)="clearTeam('away')">
                <div class="team-avatar away">{{ awayTeam.name.charAt(0) }}</div>
                <span class="team-name">{{ awayTeam.name }}</span>
                <ion-icon name="close-circle" class="clear-btn"></ion-icon>
              </div>
            } @else {
              <div class="pick-prompt" (click)="openSearch('away')">
                <ion-icon name="add-circle-outline" class="pick-icon"></ion-icon>
                <span>Select Away</span>
              </div>
            }
          </div>
        </div>

        <!-- Compare Button -->
        @if (homeTeam && awayTeam) {
          <ion-button expand="block" (click)="compare()" [disabled]="comparing" class="compare-btn">
            @if (comparing) {
              <ion-spinner name="dots"></ion-spinner>
            } @else {
              <ion-icon name="analytics-outline" slot="start"></ion-icon>
              Compare Teams
            }
          </ion-button>
        }

        <!-- Search Overlay -->
        @if (searchMode) {
          <div class="search-overlay">
            <div class="search-header">
              <ion-searchbar
                [debounce]="300"
                placeholder="Search teams..."
                (ionInput)="onSearchInput($event)"
                (ionCancel)="closeSearch()"
                [showCancelButton]="'always'"
                animated="true"
              ></ion-searchbar>
            </div>

            <!-- Favorite Teams -->
            @if (!searchQuery && favoriteTeams.length > 0) {
              <div class="section-header">
                <ion-icon name="star"></ion-icon>
                <span>Favorite Teams</span>
              </div>
              <ion-list>
                @for (team of favoriteTeams; track team.id) {
                  <ion-item button (click)="selectTeam(team)">
                    <div class="team-avatar-small" slot="start">{{ team.name.charAt(0) }}</div>
                    <ion-label>{{ team.name }}</ion-label>
                    <ion-badge color="warning" slot="end">★</ion-badge>
                  </ion-item>
                }
              </ion-list>
            }

            <!-- Search Results -->
            @if (searchQuery) {
              @if (searching) {
                <div class="search-loading">
                  <ion-spinner name="crescent"></ion-spinner>
                </div>
              } @else {
                <ion-list>
                  @for (team of searchResults; track team.id) {
                    <ion-item button (click)="selectTeam(team)">
                      <div class="team-avatar-small" slot="start">{{ team.name.charAt(0) }}</div>
                      <ion-label>{{ team.name }}</ion-label>
                      @if (team.isFavorite) {
                        <ion-badge color="warning" slot="end">★</ion-badge>
                      }
                    </ion-item>
                  } @empty {
                    <div class="no-results">
                      <p>No teams found for "{{ searchQuery }}"</p>
                    </div>
                  }
                </ion-list>
              }
            }
          </div>
        }

        <!-- Comparison Results -->
        @if (comparison && !searchMode) {
          <div class="results-section">
            <!-- Advantage Badge -->
            <div class="advantage-banner"
                 [class.home-advantage]="comparison.advantage === 'home'"
                 [class.away-advantage]="comparison.advantage === 'away'"
                 [class.neutral-advantage]="comparison.advantage === 'neutral'">
              @if (comparison.advantage === 'home') {
                <ion-icon name="arrow-back-outline"></ion-icon>
                <span>{{ comparison.homeTeam.teamName }} has the edge</span>
              } @else if (comparison.advantage === 'away') {
                <span>{{ comparison.awayTeam.teamName }} has the edge</span>
                <ion-icon name="arrow-forward-outline"></ion-icon>
              } @else {
                <span>Evenly matched</span>
              }
            </div>

            <!-- Radar Chart -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>Team Comparison</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <canvas #radarChart></canvas>
              </ion-card-content>
            </ion-card>

            <!-- Head-to-Head -->
            @if (comparison.headToHead) {
              <ion-card>
                <ion-card-header>
                  <ion-card-title>Head to Head</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <div class="h2h-summary">
                    <div class="h2h-stat">
                      <span class="h2h-value home">{{ comparison.headToHead.homeWins }}</span>
                      <span class="h2h-label">Home Wins</span>
                    </div>
                    <div class="h2h-stat">
                      <span class="h2h-value">{{ comparison.headToHead.draws }}</span>
                      <span class="h2h-label">Draws</span>
                    </div>
                    <div class="h2h-stat">
                      <span class="h2h-value away">{{ comparison.headToHead.awayWins }}</span>
                      <span class="h2h-label">Away Wins</span>
                    </div>
                  </div>

                  <div class="h2h-bar">
                    @if (comparison.headToHead.totalMeetings > 0) {
                      <div class="h2h-segment home"
                           [style.flex]="comparison.headToHead.homeWins">
                      </div>
                      <div class="h2h-segment draw"
                           [style.flex]="comparison.headToHead.draws">
                      </div>
                      <div class="h2h-segment away"
                           [style.flex]="comparison.headToHead.awayWins">
                      </div>
                    }
                  </div>

                  <p class="meetings-label">{{ comparison.headToHead.totalMeetings }} meetings total</p>

                  <!-- Last 5 meetings -->
                  @if (comparison.headToHead && comparison.headToHead.lastFiveMeetings && comparison.headToHead.lastFiveMeetings.length > 0) {
                    <div class="last-meetings">
                      <h4>Recent Meetings</h4>
                      @for (meeting of comparison.headToHead.lastFiveMeetings; track $index) {
                        <div class="meeting-row"
                             [class.home-win]="meeting.result === 'home'"
                             [class.away-win]="meeting.result === 'away'"
                             [class.draw-result]="meeting.result === 'draw'">
                          <span class="meeting-date">{{ meeting.date | date:'mediumDate' }}</span>
                          <span class="meeting-score">{{ meeting.homeScore }} - {{ meeting.awayScore }}</span>
                          <ion-badge [color]="meeting.result === 'home' ? 'primary' : meeting.result === 'away' ? 'danger' : 'warning'">
                            {{ meeting.result | uppercase }}
                          </ion-badge>
                        </div>
                      }
                    </div>
                  }
                </ion-card-content>
              </ion-card>
            }

            <!-- Stats Comparison -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>Performance Stats</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <canvas #statsChart></canvas>
              </ion-card-content>
            </ion-card>

            <!-- Key Insights -->
            @if (comparison.keyInsights && comparison.keyInsights.length > 0) {
              <ion-card>
                <ion-card-header>
                  <ion-card-title>Key Insights</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  @for (insight of comparison.keyInsights; track $index) {
                    <div class="insight-row">
                      <ion-icon name="bulb-outline" color="warning"></ion-icon>
                      <span>{{ insight }}</span>
                    </div>
                  }
                </ion-card-content>
              </ion-card>
            }

            <!-- Scoring Trend -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>Scoring Trend</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <canvas #scoringChart></canvas>
              </ion-card-content>
            </ion-card>
          </div>
        }

        <!-- Empty State -->
        @if (!comparison && !searchMode && (!homeTeam || !awayTeam)) {
          <div class="empty-state">
            <ion-icon name="git-compare-outline" class="empty-icon"></ion-icon>
            <h3>Compare Two Teams</h3>
            <p>Select teams above to see a detailed head-to-head comparison.</p>
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .compare-container {
      padding: 8px;
    }

    /* Team Selection */
    .team-selection {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 8px;
      gap: 8px;
    }

    .team-picker {
      flex: 1;
      background: var(--ion-card-background, #fff);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .team-picker:active {
      transform: scale(0.97);
    }

    .team-picker.selected {
      border: 2px solid var(--ion-color-primary);
    }

    .vs-badge {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--ion-color-dark);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .pick-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--ion-color-medium);
    }

    .pick-icon {
      font-size: 36px;
      color: var(--ion-color-primary);
    }

    .pick-prompt span {
      font-size: 0.85rem;
    }

    .selected-team {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      position: relative;
    }

    .team-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
    }

    .team-avatar.home { background: var(--ion-color-primary); }
    .team-avatar.away { background: var(--ion-color-danger); }

    .team-avatar-small {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      color: #fff;
    }

    .team-name {
      font-size: 0.85rem;
      font-weight: 600;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .clear-btn {
      position: absolute;
      top: -4px;
      right: -4px;
      font-size: 18px;
      color: var(--ion-color-medium);
    }

    .compare-btn {
      margin: 8px;
    }

    /* Search Overlay */
    .search-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--ion-background-color, #fff);
      z-index: 1000;
      overflow-y: auto;
    }

    .search-header {
      padding: 8px;
      padding-top: calc(env(safe-area-inset-top, 0px) + 8px);
      background: var(--ion-toolbar-background, #fff);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 4px;
      font-weight: 600;
      color: var(--ion-color-medium);
      font-size: 0.85rem;
    }

    .section-header ion-icon {
      color: var(--ion-color-warning);
    }

    .search-loading {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .no-results {
      text-align: center;
      padding: 40px;
      color: var(--ion-color-medium);
    }

    /* Advantage Banner */
    .advantage-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border-radius: 12px;
      font-weight: 600;
      margin: 8px 0;
    }

    .advantage-banner.home-advantage {
      background: rgba(56, 128, 255, 0.1);
      color: var(--ion-color-primary);
    }

    .advantage-banner.away-advantage {
      background: rgba(235, 68, 90, 0.1);
      color: var(--ion-color-danger);
    }

    .advantage-banner.neutral-advantage {
      background: rgba(146, 148, 156, 0.1);
      color: var(--ion-color-medium);
    }

    /* Head to Head */
    .h2h-summary {
      display: flex;
      justify-content: space-around;
      margin-bottom: 16px;
    }

    .h2h-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .h2h-value {
      font-size: 1.8rem;
      font-weight: 700;
    }

    .h2h-value.home { color: var(--ion-color-primary); }
    .h2h-value.away { color: var(--ion-color-danger); }

    .h2h-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }

    .h2h-bar {
      display: flex;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      background: var(--ion-color-light);
    }

    .h2h-segment.home { background: var(--ion-color-primary); }
    .h2h-segment.draw { background: var(--ion-color-warning); }
    .h2h-segment.away { background: var(--ion-color-danger); }

    .meetings-label {
      text-align: center;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      margin-top: 8px;
    }

    .last-meetings {
      margin-top: 16px;
    }

    .last-meetings h4 {
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .meeting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .meeting-row:last-child { border-bottom: none; }

    .meeting-date {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      flex: 1;
    }

    .meeting-score {
      font-weight: 700;
      font-size: 1rem;
      margin: 0 12px;
    }

    /* Insights */
    .insight-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--ion-color-light);
    }

    .insight-row:last-child { border-bottom: none; }

    .insight-row ion-icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .insight-row span {
      font-size: 0.9rem;
      line-height: 1.4;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 72px;
      color: var(--ion-color-medium);
      margin-bottom: 16px;
    }

    .empty-state h3 {
      color: var(--ion-color-dark);
      margin-bottom: 8px;
    }

    .empty-state p {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
    }
  `]
})
export class TeamComparePage implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private analyticsService = inject(AnalyticsService);
  private favoritesService = inject(FavoritesService);

  @ViewChild('radarChart') radarChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statsChart') statsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scoringChart') scoringChartRef!: ElementRef<HTMLCanvasElement>;

  homeTeam: TeamOption | null = null;
  awayTeam: TeamOption | null = null;
  comparison: TeamComparison | null = null;
  comparing = false;

  searchMode: 'home' | 'away' | null = null;
  searchQuery = '';
  searchResults: TeamOption[] = [];
  favoriteTeams: TeamOption[] = [];
  searching = false;

  private charts: Chart[] = [];
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.loadFavoriteTeams();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => this.performSearch(query));
  }

  ngOnDestroy() {
    this.destroyCharts();
    this.searchSubject.complete();
  }

  loadFavoriteTeams() {
    this.favoritesService.loadFavorites('team').subscribe({
      next: (favorites) => {
        // For each favorite, fetch team info
        const teamIds = favorites.map(f => f.entityId);
        teamIds.forEach(id => {
          this.apiService.getTeam(id).subscribe({
            next: (team: any) => {
              const t = Array.isArray(team) ? team[0] : team;
              if (t?.id && t?.name) {
                this.favoriteTeams.push({
                  id: t.id,
                  name: t.name,
                  logo: t.logo || t.logoUrl,
                  isFavorite: true
                });
              }
            }
          });
        });
      }
    });
  }

  openSearch(side: 'home' | 'away') {
    this.searchMode = side;
    this.searchQuery = '';
    this.searchResults = [];
  }

  closeSearch() {
    this.searchMode = null;
    this.searchQuery = '';
    this.searchResults = [];
  }

  onSearchInput(event: any) {
    const query = event.detail?.value || '';
    this.searchQuery = query;
    if (query.length >= 2) {
      this.searching = true;
      this.searchSubject.next(query);
    } else {
      this.searchResults = [];
    }
  }

  private performSearch(query: string) {
    this.apiService.getTeams({ search: query, limit: 20 }).subscribe({
      next: (result: any) => {
        const teams = Array.isArray(result) ? result : (result?.data || []);
        const favIds = new Set(this.favoriteTeams.map(f => f.id));
        this.searchResults = teams.map((t: any) => ({
          id: t.id,
          name: t.name,
          logo: t.logo || t.logoUrl,
          isFavorite: favIds.has(t.id)
        }));
        this.searching = false;
      },
      error: () => {
        this.searchResults = [];
        this.searching = false;
      }
    });
  }

  selectTeam(team: TeamOption) {
    if (this.searchMode === 'home') {
      this.homeTeam = team;
    } else if (this.searchMode === 'away') {
      this.awayTeam = team;
    }
    this.closeSearch();
    this.comparison = null; // Reset comparison
  }

  clearTeam(side: 'home' | 'away') {
    if (side === 'home') {
      this.homeTeam = null;
    } else {
      this.awayTeam = null;
    }
    this.comparison = null;
    this.destroyCharts();
  }

  compare() {
    if (!this.homeTeam || !this.awayTeam) return;
    this.comparing = true;
    this.comparison = null;
    this.destroyCharts();

    this.analyticsService.compareTeams(this.homeTeam.id, this.awayTeam.id).subscribe({
      next: (data) => {
        this.comparison = data;
        this.comparing = false;
        setTimeout(() => this.buildCharts(), 100);
      },
      error: () => {
        this.comparing = false;
      }
    });
  }

  doRefresh(event: any) {
    if (this.homeTeam && this.awayTeam && this.comparison) {
      this.compare();
    }
    event.target.complete();
  }

  private buildCharts() {
    if (!this.comparison) return;

    const home = this.comparison.homeTeam;
    const away = this.comparison.awayTeam;

    // Radar Chart — team attributes comparison
    if (this.radarChartRef?.nativeElement && home && away) {
      const chart = new Chart(this.radarChartRef.nativeElement, {
        type: 'radar',
        data: {
          labels: ['Attack', 'Defense', 'Home Form', 'Away Form', 'Form Rating', 'Win %'],
          datasets: [
            {
              label: home.teamName,
              data: [
                home.scoringTrend?.average || 0,
                home.defensiveRating || 0,
                home.homePerformance?.winPercentage || 0,
                home.awayPerformance?.winPercentage || 0,
                home.formRating || 0,
                home.overallStats?.winPercentage || 0
              ],
              borderColor: '#3880ff',
              backgroundColor: 'rgba(56, 128, 255, 0.2)',
              pointBackgroundColor: '#3880ff',
              borderWidth: 2
            },
            {
              label: away.teamName,
              data: [
                away.scoringTrend?.average || 0,
                away.defensiveRating || 0,
                away.homePerformance?.winPercentage || 0,
                away.awayPerformance?.winPercentage || 0,
                away.formRating || 0,
                away.overallStats?.winPercentage || 0
              ],
              borderColor: '#eb445a',
              backgroundColor: 'rgba(235, 68, 90, 0.2)',
              pointBackgroundColor: '#eb445a',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            r: {
              beginAtZero: true,
              ticks: { display: false }
            }
          }
        }
      });
      this.charts.push(chart);
    }

    // Stats Comparison Bar Chart
    if (this.statsChartRef?.nativeElement && home?.overallStats && away?.overallStats) {
      const chart = new Chart(this.statsChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Played', 'Won', 'Drawn', 'Lost', 'Goals For', 'Goals Against'],
          datasets: [
            {
              label: home.teamName,
              data: [
                home.overallStats.played,
                home.overallStats.won,
                home.overallStats.drawn,
                home.overallStats.lost,
                home.overallStats.goalsFor,
                home.overallStats.goalsAgainst
              ],
              backgroundColor: 'rgba(56, 128, 255, 0.7)',
              borderColor: '#3880ff',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: away.teamName,
              data: [
                away.overallStats.played,
                away.overallStats.won,
                away.overallStats.drawn,
                away.overallStats.lost,
                away.overallStats.goalsFor,
                away.overallStats.goalsAgainst
              ],
              backgroundColor: 'rgba(235, 68, 90, 0.7)',
              borderColor: '#eb445a',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
      this.charts.push(chart);
    }

    // Scoring Trend Line Chart
    if (this.scoringChartRef?.nativeElement &&
        home?.scoringTrend?.last5Matches?.length > 0) {
      const maxLen = Math.max(
        home.scoringTrend?.last5Matches?.length || 0,
        away?.scoringTrend?.last5Matches?.length || 0
      );
      const labels = Array.from({ length: maxLen }, (_, i) => `Match ${i + 1}`);

      const chart = new Chart(this.scoringChartRef.nativeElement, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: home.teamName,
              data: home.scoringTrend.last5Matches,
              borderColor: '#3880ff',
              backgroundColor: 'rgba(56, 128, 255, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 5,
              pointBackgroundColor: '#3880ff'
            },
            {
              label: away.teamName,
              data: away?.scoringTrend?.last5Matches || [],
              borderColor: '#eb445a',
              backgroundColor: 'rgba(235, 68, 90, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 5,
              pointBackgroundColor: '#eb445a'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Goals' }
            }
          }
        }
      });
      this.charts.push(chart);
    }
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }
}
