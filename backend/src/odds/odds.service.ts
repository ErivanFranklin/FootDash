import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Odds } from './entities/odds.entity';
import { firstValueFrom } from 'rxjs';

export interface ValueBet {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  market: string;
  bookmakerOdds: number;
  impliedProbability: number;
  modelProbability: number;
  edge: number;
  bookmaker: string;
  rating: 'high' | 'medium' | 'low';
}

@Injectable()
export class OddsService {
  private readonly logger = new Logger(OddsService.name);
  private readonly apiKey: string | undefined;
  private readonly useMock: boolean;

  constructor(
    @InjectRepository(Odds) private readonly repo: Repository<Odds>,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('ODDS_API_KEY');
    this.useMock = !this.apiKey;
    if (this.useMock) {
      this.logger.warn('ODDS_API_KEY not set — using mock odds');
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  async findByMatch(matchId: number): Promise<Odds[]> {
    return this.repo.find({ where: { matchId }, order: { bookmaker: 'ASC' } });
  }

  async findUpcoming(limit = 30): Promise<Odds[]> {
    return this.repo.find({
      order: { matchDate: 'ASC', createdAt: 'DESC' },
      take: limit,
    });
  }

  async getValueBets(minEdge = 5): Promise<ValueBet[]> {
    const upcoming = await this.findUpcoming(100);
    const valueBets: ValueBet[] = [];

    for (const odd of upcoming) {
      // Simple model: use average implied probability as "fair" market odds
      // Then detect when individual bookmaker drifts from it
      const markets = this.extractMarkets(odd);
      for (const m of markets) {
        if (m.edge >= minEdge) {
          valueBets.push({
            matchId: odd.matchId,
            homeTeam: odd.homeTeam,
            awayTeam: odd.awayTeam,
            matchDate: odd.matchDate,
            market: m.market,
            bookmakerOdds: m.odds,
            impliedProbability: m.impliedProb,
            modelProbability: m.modelProb,
            edge: m.edge,
            bookmaker: odd.bookmaker,
            rating: m.edge >= 15 ? 'high' : m.edge >= 10 ? 'medium' : 'low',
          });
        }
      }
    }

    return valueBets.sort((a, b) => b.edge - a.edge);
  }

  private extractMarkets(odds: Odds): { market: string; odds: number; impliedProb: number; modelProb: number; edge: number }[] {
    const results: any[] = [];
    const total1x2 = 1 / Number(odds.homeWin) + 1 / Number(odds.draw) + 1 / Number(odds.awayWin);
    const margin = total1x2 - 1;

    // Home win value
    const homeImplied = (1 / Number(odds.homeWin)) * 100;
    const homeFair = (homeImplied / (1 + margin)) ;
    results.push({
      market: 'Home Win',
      odds: Number(odds.homeWin),
      impliedProb: homeImplied,
      modelProb: homeFair,
      edge: homeFair - homeImplied,
    });

    // Draw value
    const drawImplied = (1 / Number(odds.draw)) * 100;
    const drawFair = (drawImplied / (1 + margin));
    results.push({
      market: 'Draw',
      odds: Number(odds.draw),
      impliedProb: drawImplied,
      modelProb: drawFair,
      edge: drawFair - drawImplied,
    });

    // Away win value
    const awayImplied = (1 / Number(odds.awayWin)) * 100;
    const awayFair = (awayImplied / (1 + margin));
    results.push({
      market: 'Away Win',
      odds: Number(odds.awayWin),
      impliedProb: awayImplied,
      modelProb: awayFair,
      edge: awayFair - awayImplied,
    });

    // Over 2.5
    if (odds.over25) {
      const overImplied = (1 / Number(odds.over25)) * 100;
      results.push({
        market: 'Over 2.5',
        odds: Number(odds.over25),
        impliedProb: overImplied,
        modelProb: 55, // placeholder model probability
        edge: 55 - overImplied,
      });
    }

    // BTTS Yes
    if (odds.bttsYes) {
      const bttsImplied = (1 / Number(odds.bttsYes)) * 100;
      results.push({
        market: 'BTTS Yes',
        odds: Number(odds.bttsYes),
        impliedProb: bttsImplied,
        modelProb: 52,
        edge: 52 - bttsImplied,
      });
    }

    return results;
  }

  // ── Sync Odds from The Odds API ──────────────────────────────────────────

  @Cron(CronExpression.EVERY_4_HOURS)
  async syncOdds(): Promise<void> {
    if (this.useMock) {
      await this.seedMockIfEmpty();
      return;
    }
    this.logger.log('Syncing odds from The Odds API...');
    try {
      const { data } = await firstValueFrom(
        this.http.get('https://api.the-odds-api.com/v4/sports/soccer_epl/odds', {
          params: {
            apiKey: this.apiKey,
            regions: 'uk,eu',
            markets: 'h2h,totals',
            oddsFormat: 'decimal',
          },
        }),
      );

      let saved = 0;
      for (const event of data || []) {
        for (const bm of event.bookmakers || []) {
          const h2h = bm.markets?.find((m: any) => m.key === 'h2h');
          if (!h2h) continue;

          const outcomes = h2h.outcomes || [];
          const home = outcomes.find((o: any) => o.name === event.home_team);
          const draw = outcomes.find((o: any) => o.name === 'Draw');
          const away = outcomes.find((o: any) => o.name === event.away_team);

          if (!home || !draw || !away) continue;

          const odds = this.repo.create({
            matchId: 0,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            matchDate: event.commence_time?.split('T')[0],
            bookmaker: bm.title,
            homeWin: home.price,
            draw: draw.price,
            awayWin: away.price,
          });
          await this.repo.save(odds);
          saved++;
        }
      }
      this.logger.log(`Saved ${saved} odds entries`);
    } catch (err) {
      this.logger.error('Failed to sync odds', (err as Error).message);
    }
  }

  // ── Mock Seed ────────────────────────────────────────────────────────────

  private async seedMockIfEmpty(): Promise<void> {
    const count = await this.repo.count();
    if (count > 0) return;

    const mocks: Partial<Odds>[] = [
      { matchId: 1, homeTeam: 'Arsenal', awayTeam: 'Chelsea', matchDate: '2025-02-01', bookmaker: 'Bet365', homeWin: 1.90, draw: 3.40, awayWin: 4.20, over25: 1.80, under25: 2.00, bttsYes: 1.75, bttsNo: 2.05 },
      { matchId: 1, homeTeam: 'Arsenal', awayTeam: 'Chelsea', matchDate: '2025-02-01', bookmaker: 'William Hill', homeWin: 1.85, draw: 3.50, awayWin: 4.33, over25: 1.83, under25: 1.97, bttsYes: 1.80, bttsNo: 2.00 },
      { matchId: 2, homeTeam: 'Liverpool', awayTeam: 'Man City', matchDate: '2025-02-02', bookmaker: 'Bet365', homeWin: 2.10, draw: 3.30, awayWin: 3.50, over25: 1.60, under25: 2.30, bttsYes: 1.65, bttsNo: 2.20 },
      { matchId: 3, homeTeam: 'Real Madrid', awayTeam: 'Barcelona', matchDate: '2025-02-05', bookmaker: 'Betfair', homeWin: 2.30, draw: 3.20, awayWin: 3.10, over25: 1.70, under25: 2.10, bttsYes: 1.70, bttsNo: 2.10 },
      { matchId: 4, homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', matchDate: '2025-02-08', bookmaker: 'Bet365', homeWin: 1.60, draw: 4.00, awayWin: 5.50, over25: 1.55, under25: 2.40, bttsYes: 1.72, bttsNo: 2.08 },
    ];

    for (const mock of mocks) {
      await this.repo.save(this.repo.create(mock));
    }
    this.logger.log('Seeded 5 mock odds entries');
  }
}
