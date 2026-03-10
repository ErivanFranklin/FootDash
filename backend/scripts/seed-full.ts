/**
 * seed-full.ts
 *
 * Comprehensive seed script for FootDash local development.
 * Populates the database with realistic data for ALL features:
 *   - Users (erivanf10@gmail.com as admin, test01@test.com, demo users)
 *   - Teams and matches
 *   - User profiles and preferences
 *   - Leagues and standings
 *   - Fantasy leagues, teams, rosters, gameweeks, points
 *   - Highlights, odds
 *   - Gamification (badges, leaderboards, predictions)
 *   - Social (feed comments, follows)
 *   - Analytics (match predictions, team analytics)
 *   - Notifications
 *
 * Usage:
 *   cd backend && npx ts-node scripts/seed-full.ts
 */

import AppDataSource from '../data-source';
import * as bcrypt from 'bcryptjs';

// ── Helpers ──────────────────────────────────────────────────────────
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ── Data ─────────────────────────────────────────────────────────────

const USERS = [
  { email: 'erivanf10@gmail.com', password: 'Password123!', role: 'ADMIN', isPro: true },
  { email: 'test01@test.com', password: 'Password123!', role: 'USER', isPro: true },
  { email: 'local+test@example.com', password: 'Password123!', role: 'USER', isPro: false },
  { email: 'demo.pro@footdash.com', password: 'Password123!', role: 'USER', isPro: true },
  { email: 'demo.user@footdash.com', password: 'Password123!', role: 'USER', isPro: false },
];

const USER_CREATED_AT: Record<string, string> = {
  'erivanf10@gmail.com': '2024-02-15T10:30:00.000Z',
  'test01@test.com': '2024-06-10T14:15:00.000Z',
  'local+test@example.com': '2024-09-01T09:00:00.000Z',
  'demo.pro@footdash.com': '2025-01-20T18:45:00.000Z',
  'demo.user@footdash.com': '2025-03-05T12:00:00.000Z',
};

const TEAMS = [
  { externalId: 33, name: 'Manchester United', shortCode: 'MUN' },
  { externalId: 40, name: 'Liverpool', shortCode: 'LIV' },
  { externalId: 50, name: 'Manchester City', shortCode: 'MCI' },
  { externalId: 47, name: 'Tottenham', shortCode: 'TOT' },
  { externalId: 49, name: 'Chelsea', shortCode: 'CHE' },
  { externalId: 42, name: 'Arsenal', shortCode: 'ARS' },
  { externalId: 529, name: 'Barcelona', shortCode: 'BAR' },
  { externalId: 541, name: 'Real Madrid', shortCode: 'RMA' },
  { externalId: 157, name: 'Bayern Munich', shortCode: 'BAY' },
  { externalId: 85, name: 'Paris Saint-Germain', shortCode: 'PSG' },
  { externalId: 131, name: 'Corinthians', shortCode: 'COR' },
  { externalId: 66, name: 'Aston Villa', shortCode: 'AVL' },
];

const LEAGUES_DATA = [
  { externalId: 39, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png', season: '2025', type: 'League', isFeatured: true },
  { externalId: 140, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png', season: '2025', type: 'League', isFeatured: true },
  { externalId: 78, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png', season: '2025', type: 'League', isFeatured: true },
  { externalId: 61, name: 'Ligue 1', country: 'France', logo: 'https://media.api-sports.io/football/leagues/61.png', season: '2025', type: 'League', isFeatured: false },
  { externalId: 71, name: 'Brasileirão', country: 'Brazil', logo: 'https://media.api-sports.io/football/leagues/71.png', season: '2025', type: 'League', isFeatured: true },
  { externalId: 2, name: 'Champions League', country: 'World', logo: 'https://media.api-sports.io/football/leagues/2.png', season: '2025', type: 'Cup', isFeatured: true },
];

// Match fixtures: pairs of [homeIdx, awayIdx] into TEAMS array with scores
const MATCH_FIXTURES = [
  { homeIdx: 0, awayIdx: 1, homeScore: 2, awayScore: 3, status: 'FT', daysAgo: 28 },
  { homeIdx: 2, awayIdx: 5, homeScore: 1, awayScore: 1, status: 'FT', daysAgo: 25 },
  { homeIdx: 4, awayIdx: 3, homeScore: 0, awayScore: 2, status: 'FT', daysAgo: 21 },
  { homeIdx: 1, awayIdx: 2, homeScore: 4, awayScore: 1, status: 'FT', daysAgo: 18 },
  { homeIdx: 5, awayIdx: 0, homeScore: 3, awayScore: 0, status: 'FT', daysAgo: 14 },
  { homeIdx: 3, awayIdx: 4, homeScore: 1, awayScore: 1, status: 'FT', daysAgo: 10 },
  { homeIdx: 0, awayIdx: 2, homeScore: 2, awayScore: 2, status: 'FT', daysAgo: 7 },
  { homeIdx: 1, awayIdx: 5, homeScore: 3, awayScore: 2, status: 'FT', daysAgo: 3 },
  { homeIdx: 6, awayIdx: 7, homeScore: 2, awayScore: 2, status: 'FT', daysAgo: 5 },
  { homeIdx: 8, awayIdx: 9, homeScore: 3, awayScore: 1, status: 'FT', daysAgo: 4 },
  { homeIdx: 10, awayIdx: 11, homeScore: 1, awayScore: 0, status: 'FT', daysAgo: 2 },
  // Upcoming matches
  { homeIdx: 2, awayIdx: 0, homeScore: null, awayScore: null, status: 'NS', daysAgo: -2 },
  { homeIdx: 5, awayIdx: 1, homeScore: null, awayScore: null, status: 'NS', daysAgo: -3 },
  { homeIdx: 4, awayIdx: 0, homeScore: null, awayScore: null, status: 'NS', daysAgo: -7 },
  { homeIdx: 7, awayIdx: 6, homeScore: null, awayScore: null, status: 'NS', daysAgo: -5 },
  { homeIdx: 9, awayIdx: 8, homeScore: null, awayScore: null, status: 'NS', daysAgo: -10 },
];

const HIGHLIGHTS_DATA = [
  { title: 'Man Utd vs Liverpool - All Goals & Highlights', homeTeam: 'Manchester United', awayTeam: 'Liverpool', videoUrl: 'https://www.youtube.com/watch?v=example1', duration: 612, matchDaysAgo: 28 },
  { title: 'Arsenal 3-0 Man Utd - Gunners Dominate', homeTeam: 'Arsenal', awayTeam: 'Manchester United', videoUrl: 'https://www.youtube.com/watch?v=example2', duration: 480, matchDaysAgo: 14 },
  { title: 'Liverpool vs Man City - Anfield Classic', homeTeam: 'Liverpool', awayTeam: 'Manchester City', videoUrl: 'https://www.youtube.com/watch?v=example3', duration: 540, matchDaysAgo: 18 },
  { title: 'Barcelona vs Real Madrid - El Clasico', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', videoUrl: 'https://www.youtube.com/watch?v=example4', duration: 720, matchDaysAgo: 5 },
  { title: 'Bayern Munich vs PSG - Champions League', homeTeam: 'Bayern Munich', awayTeam: 'Paris Saint-Germain', videoUrl: 'https://www.youtube.com/watch?v=example5', duration: 590, matchDaysAgo: 4 },
  { title: 'Chelsea vs Tottenham - London Derby', homeTeam: 'Chelsea', awayTeam: 'Tottenham', videoUrl: 'https://www.youtube.com/watch?v=example6', duration: 430, matchDaysAgo: 21 },
  { title: 'Man City vs Man Utd - Derby Day', homeTeam: 'Manchester City', awayTeam: 'Manchester United', videoUrl: 'https://www.youtube.com/watch?v=example7', duration: 550, matchDaysAgo: 7 },
  { title: 'Corinthians vs Aston Villa - Friendly', homeTeam: 'Corinthians', awayTeam: 'Aston Villa', videoUrl: 'https://www.youtube.com/watch?v=example8', duration: 360, matchDaysAgo: 2 },
];

// ── Main ─────────────────────────────────────────────────────────────
async function seed() {
  console.log('🏟️  FootDash Full Seed Script');
  console.log('='.repeat(60));

  const ds = await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  try {
    // ── 1. Users ─────────────────────────────────────────────────
    console.log('👤 Seeding users...');
    const userIds: Map<string, number> = new Map();

    for (const u of USERS) {
      const email = u.email.toLowerCase();
      const createdAt = USER_CREATED_AT[email] || new Date().toISOString();
      const existing = await ds.query('SELECT id FROM users WHERE email = $1', [u.email.toLowerCase()]);
      if (existing.length > 0) {
        // Update role, isPro, and password for existing users
        const hash = await bcrypt.hash(u.password, 10);
        await ds.query('UPDATE users SET role = $1, is_pro = $2, password_hash = $3, created_at = $4 WHERE id = $5', [u.role, u.isPro, hash, createdAt, existing[0].id]);
        userIds.set(u.email, existing[0].id);
        console.log(`  ✓ ${u.email} (id=${existing[0].id}) – updated`);
      } else {
        const hash = await bcrypt.hash(u.password, 10);
        const res = await ds.query(
          'INSERT INTO users (email, password_hash, role, is_pro, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [email, hash, u.role, u.isPro, createdAt],
        );
        userIds.set(u.email, res[0].id);
        console.log(`  + ${u.email} (id=${res[0].id}) – created`);
      }
    }

    // ── 2. User Profiles ─────────────────────────────────────────
    console.log('\n📋 Seeding user profiles...');
    const profiles = [
      { email: 'erivanf10@gmail.com', displayName: 'Erivan Franklin', bio: 'Full-stack developer and football enthusiast. Admin of FootDash.' },
      { email: 'test01@test.com', displayName: 'Test User Pro', bio: 'Pro subscriber testing all features. Love EPL!' },
      { email: 'local+test@example.com', displayName: 'Local Dev', bio: 'Local development test account.' },
      { email: 'demo.pro@footdash.com', displayName: 'Demo Pro User', bio: 'Demo account with Pro features enabled.' },
      { email: 'demo.user@footdash.com', displayName: 'Demo Free User', bio: 'Free tier demo account.' },
    ];

    for (const p of profiles) {
      const userId = userIds.get(p.email);
      if (!userId) continue;
      const existing = await ds.query('SELECT id FROM user_profiles WHERE user_id = $1', [userId]);
      if (existing.length > 0) {
        await ds.query('UPDATE user_profiles SET display_name = $1, bio = $2 WHERE user_id = $3', [p.displayName, p.bio, userId]);
        console.log(`  ✓ ${p.email} profile – updated`);
      } else {
        await ds.query('INSERT INTO user_profiles (user_id, display_name, bio) VALUES ($1, $2, $3)', [userId, p.displayName, p.bio]);
        console.log(`  + ${p.email} profile – created`);
      }
    }

    // ── 3. User Preferences ──────────────────────────────────────
    console.log('\n⚙️  Seeding user preferences...');
    for (const u of USERS) {
      const userId = userIds.get(u.email);
      if (!userId) continue;
      const existing = await ds.query('SELECT id FROM user_preferences WHERE user_id = $1', [userId]);
      if (existing.length === 0) {
        await ds.query(
          `INSERT INTO user_preferences (user_id, theme, language, notification_enabled, email_notifications, push_notifications, favorite_team_ids, timezone)
           VALUES ($1, 'dark', 'en', true, true, true, $2, 'America/Sao_Paulo')`,
          [userId, JSON.stringify([33, 40, 42])],
        );
        console.log(`  + ${u.email} preferences – created`);
      } else {
        console.log(`  ✓ ${u.email} preferences – already exist`);
      }
    }

    // ── 4. Teams ─────────────────────────────────────────────────
    console.log('\n⚽ Seeding teams...');
    const teamIds: Map<number, number> = new Map(); // externalId → id

    for (const t of TEAMS) {
      const existing = await ds.query('SELECT id FROM teams WHERE "externalId" = $1', [t.externalId]);
      if (existing.length > 0) {
        await ds.query('UPDATE teams SET name = $1, "shortCode" = $2 WHERE "externalId" = $3', [t.name, t.shortCode, t.externalId]);
        teamIds.set(t.externalId, existing[0].id);
        console.log(`  ✓ ${t.name} (ext=${t.externalId}) – updated`);
      } else {
        const res = await ds.query(
          'INSERT INTO teams ("externalId", name, "shortCode") VALUES ($1, $2, $3) RETURNING id',
          [t.externalId, t.name, t.shortCode],
        );
        teamIds.set(t.externalId, res[0].id);
        console.log(`  + ${t.name} (ext=${t.externalId}) – inserted`);
      }
    }

    // ── 5. Leagues ───────────────────────────────────────────────
    console.log('\n🏆 Seeding leagues...');
    const leagueIds: Map<number, number> = new Map();

    for (const l of LEAGUES_DATA) {
      const existing = await ds.query('SELECT id FROM leagues WHERE external_id = $1', [l.externalId]);
      if (existing.length > 0) {
        await ds.query(
          'UPDATE leagues SET name = $1, country = $2, logo = $3, season = $4, type = $5, is_featured = $6 WHERE external_id = $7',
          [l.name, l.country, l.logo, l.season, l.type, l.isFeatured, l.externalId],
        );
        leagueIds.set(l.externalId, existing[0].id);
        console.log(`  ✓ ${l.name} – updated`);
      } else {
        const res = await ds.query(
          'INSERT INTO leagues (external_id, name, country, logo, season, type, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [l.externalId, l.name, l.country, l.logo, l.season, l.type, l.isFeatured],
        );
        leagueIds.set(l.externalId, res[0].id);
        console.log(`  + ${l.name} – inserted`);
      }
    }

    // ── 6. Matches ───────────────────────────────────────────────
    console.log('\n📅 Seeding matches...');
    const matchIds: number[] = [];
    const season = '2025';
    const leagueJson = JSON.stringify({ id: 39, name: 'Premier League', country: 'England', season: 2025 });
    const venueJson = JSON.stringify({ name: 'Stadium', city: 'London' });

    for (let i = 0; i < MATCH_FIXTURES.length; i++) {
      const f = MATCH_FIXTURES[i];
      const homeTeam = TEAMS[f.homeIdx];
      const awayTeam = TEAMS[f.awayIdx];
      const homeTeamId = teamIds.get(homeTeam.externalId);
      const awayTeamId = teamIds.get(awayTeam.externalId);
      const kickOff = f.daysAgo > 0 ? daysAgo(f.daysAgo) : daysFromNow(-f.daysAgo);
      const extId = 900000 + i;

      const existing = await ds.query('SELECT id FROM matches WHERE "externalId" = $1', [extId]);
      if (existing.length > 0) {
        await ds.query(
          `UPDATE matches SET "homeTeamId" = $1, "awayTeamId" = $2, "kickOff" = $3, status = $4, "homeScore" = $5, "awayScore" = $6, season = $7, league = $8, venue = $9
           WHERE "externalId" = $10`,
          [homeTeamId, awayTeamId, kickOff, f.status, f.homeScore, f.awayScore, season, leagueJson, venueJson, extId],
        );
        matchIds.push(existing[0].id);
      } else {
        const res = await ds.query(
          `INSERT INTO matches ("externalId", "homeTeamId", "awayTeamId", "kickOff", status, "homeScore", "awayScore", season, league, venue, referee)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
          [extId, homeTeamId, awayTeamId, kickOff, f.status, f.homeScore, f.awayScore, season, leagueJson, venueJson, 'Michael Oliver'],
        );
        matchIds.push(res[0].id);
      }
      console.log(`  ${f.status === 'FT' ? '✓' : '⏳'} ${homeTeam.name} vs ${awayTeam.name} (${f.status})`);
    }

    // ── 7. Highlights ────────────────────────────────────────────
    console.log('\n🎬 Seeding highlights...');
    for (let i = 0; i < HIGHLIGHTS_DATA.length; i++) {
      const h = HIGHLIGHTS_DATA[i];
      const extId = `seed-highlight-${i}`;
      const matchId = matchIds[i] || 0;
      const existing = await ds.query('SELECT id FROM highlights WHERE external_id = $1', [extId]);
      if (existing.length === 0) {
        await ds.query(
          `INSERT INTO highlights (match_id, title, description, thumbnail_url, video_url, source, external_id, duration, view_count, home_team, away_team, match_date)
           VALUES ($1, $2, $3, $4, $5, 'youtube', $6, $7, $8, $9, $10, $11)`,
          [matchId, h.title, `Full highlights of ${h.homeTeam} vs ${h.awayTeam}`, `https://img.youtube.com/vi/example${i}/0.jpg`, h.videoUrl, extId, h.duration, randomBetween(1000, 50000), h.homeTeam, h.awayTeam, daysAgo(h.matchDaysAgo)],
        );
        console.log(`  + ${h.title}`);
      } else {
        console.log(`  ✓ ${h.title} – exists`);
      }
    }

    // ── 8. Odds ──────────────────────────────────────────────────
    console.log('\n📊 Seeding odds...');
    const bookmakers = ['Bet365', 'William Hill', 'Betfair', 'Pinnacle'];
    for (let i = 0; i < MATCH_FIXTURES.length; i++) {
      const f = MATCH_FIXTURES[i];
      const homeTeam = TEAMS[f.homeIdx];
      const awayTeam = TEAMS[f.awayIdx];
      const matchId = matchIds[i] || 0;

      // Check if odds already exist for this match
      const existingOdds = await ds.query('SELECT id FROM odds WHERE match_id = $1 LIMIT 1', [matchId]);
      if (existingOdds.length > 0) {
        console.log(`  ✓ ${homeTeam.name} vs ${awayTeam.name} – odds exist`);
        continue;
      }

      for (const bk of bookmakers) {
        await ds.query(
          `INSERT INTO odds (match_id, home_team, away_team, match_date, bookmaker, home_win, draw, away_win, over25, under25, btts_yes, btts_no)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [matchId, homeTeam.name, awayTeam.name, f.daysAgo > 0 ? daysAgo(f.daysAgo) : daysFromNow(-f.daysAgo), bk,
            randomDecimal(1.2, 4.5), randomDecimal(2.5, 4.5), randomDecimal(1.2, 6.0),
            randomDecimal(1.5, 2.5), randomDecimal(1.5, 2.8),
            randomDecimal(1.5, 2.2), randomDecimal(1.5, 2.5)],
        );
      }
      console.log(`  + ${homeTeam.name} vs ${awayTeam.name} – 4 bookmaker odds`);
    }

    // ── 9. Match Predictions (Analytics) ─────────────────────────
    console.log('\n🔮 Seeding match predictions...');
    for (let i = 0; i < matchIds.length; i++) {
      const mId = matchIds[i];
      const existing = await ds.query('SELECT id FROM match_predictions WHERE match_id = $1', [mId]);
      if (existing.length > 0) {
        console.log(`  ✓ match ${mId} prediction – exists`);
        continue;
      }
      const homeWin = randomDecimal(15, 55);
      const awayWin = randomDecimal(15, 55);
      const draw = Math.max(0, 100 - homeWin - awayWin);
      const confidence = homeWin > 45 || awayWin > 45 ? 'high' : homeWin > 30 || awayWin > 30 ? 'medium' : 'low';
      const insights = JSON.stringify([
        { label: 'Home form', value: `${randomBetween(2, 5)} wins in last 5` },
        { label: 'H2H record', value: `${randomBetween(3, 7)} wins in last 10` },
        { label: 'Goals trend', value: `${randomDecimal(1.5, 3.5, 1)} avg goals` },
      ]);

      await ds.query(
        `INSERT INTO match_predictions (match_id, home_win_probability, draw_probability, away_win_probability, confidence, insights)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [mId, homeWin, draw, awayWin, confidence, insights],
      );
      console.log(`  + match ${mId} – ${homeWin}% / ${draw.toFixed(2)}% / ${awayWin}% (${confidence})`);
    }

    // ── 10. Team Analytics ───────────────────────────────────────
    console.log('\n📈 Seeding team analytics...');
    for (const t of TEAMS) {
      const tId = teamIds.get(t.externalId);
      if (!tId) continue;
      const existing = await ds.query('SELECT id FROM team_analytics WHERE team_id = $1 AND season = $2', [tId, '2025']);
      if (existing.length > 0) {
        console.log(`  ✓ ${t.name} analytics – exists`);
        continue;
      }
      const formRating = randomDecimal(40, 90);
      const homePerf = JSON.stringify({ wins: randomBetween(4, 12), draws: randomBetween(1, 5), losses: randomBetween(0, 6), goalsScored: randomBetween(15, 40), goalsConceded: randomBetween(5, 25) });
      const awayPerf = JSON.stringify({ wins: randomBetween(2, 8), draws: randomBetween(2, 6), losses: randomBetween(1, 8), goalsScored: randomBetween(10, 30), goalsConceded: randomBetween(8, 30) });
      const scoringTrend = JSON.stringify({ last5: [randomBetween(0, 4), randomBetween(0, 4), randomBetween(0, 4), randomBetween(0, 4), randomBetween(0, 4)], average: randomDecimal(1.0, 3.0, 1) });
      const defRating = randomDecimal(40, 90);
      const overallStats = JSON.stringify({ played: randomBetween(20, 36), wins: randomBetween(8, 24), draws: randomBetween(3, 10), losses: randomBetween(2, 12), points: randomBetween(30, 75) });

      await ds.query(
        `INSERT INTO team_analytics (team_id, season, form_rating, home_performance, away_performance, scoring_trend, defensive_rating, overall_stats, last_updated, calculated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [tId, '2025', formRating, homePerf, awayPerf, scoringTrend, defRating, overallStats],
      );
      console.log(`  + ${t.name} – form=${formRating}, defense=${defRating}`);
    }

    // ── 11. Fantasy League ───────────────────────────────────────
    console.log('\n🏆 Seeding fantasy leagues...');
    const adminId = userIds.get('erivanf10@gmail.com')!;
    const testId = userIds.get('test01@test.com')!;

    // Create fantasy league
    let fantasyLeagueId: number;
    const existingFL = await ds.query("SELECT id FROM fantasy_leagues WHERE invite_code = 'FOOTDASH1'");
    if (existingFL.length > 0) {
      fantasyLeagueId = existingFL[0].id;
      console.log(`  ✓ FootDash Premier League (id=${fantasyLeagueId}) – exists`);
    } else {
      const res = await ds.query(
        `INSERT INTO fantasy_leagues (name, invite_code, owner_id, max_members, status, scoring_rules, season)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        ['FootDash Premier League', 'FOOTDASH1', adminId, 20, 'active',
          JSON.stringify({ goal: 10, assist: 6, cleanSheet: 4, yellowCard: -1, redCard: -3, minutesPlayed: 2 }),
          '2025'],
      );
      fantasyLeagueId = res[0].id;
      console.log(`  + FootDash Premier League (id=${fantasyLeagueId}) – created`);
    }

    // Create a second fantasy league
    let fantasyLeague2Id: number;
    const existingFL2 = await ds.query("SELECT id FROM fantasy_leagues WHERE invite_code = 'TESTLG01'");
    if (existingFL2.length > 0) {
      fantasyLeague2Id = existingFL2[0].id;
      console.log(`  ✓ Test League (id=${fantasyLeague2Id}) – exists`);
    } else {
      const res = await ds.query(
        `INSERT INTO fantasy_leagues (name, invite_code, owner_id, max_members, status, scoring_rules, season)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        ['Test League', 'TESTLG01', testId, 10, 'active',
          JSON.stringify({ goal: 10, assist: 5, cleanSheet: 4, yellowCard: -1, redCard: -3 }),
          '2025'],
      );
      fantasyLeague2Id = res[0].id;
      console.log(`  + Test League (id=${fantasyLeague2Id}) – created`);
    }

    // ── 12. Fantasy Teams ────────────────────────────────────────
    console.log('\n👥 Seeding fantasy teams...');
    const fantasyTeamData = [
      { name: 'Erivan FC', userId: adminId, leagueId: fantasyLeagueId, budget: 85.5, totalPoints: 145, formation: '4-3-3' },
      { name: 'Test United', userId: testId, leagueId: fantasyLeagueId, budget: 78.2, totalPoints: 132, formation: '4-4-2' },
      { name: 'Erivan Reserve', userId: adminId, leagueId: fantasyLeague2Id, budget: 92.0, totalPoints: 98, formation: '3-5-2' },
      { name: 'Test Town', userId: testId, leagueId: fantasyLeague2Id, budget: 88.3, totalPoints: 110, formation: '4-3-3' },
    ];

    const fantasyTeamIds: number[] = [];
    for (const ft of fantasyTeamData) {
      const existing = await ds.query(
        'SELECT id FROM fantasy_teams WHERE user_id = $1 AND fantasy_league_id = $2',
        [ft.userId, ft.leagueId],
      );
      if (existing.length > 0) {
        await ds.query(
          'UPDATE fantasy_teams SET name = $1, budget = $2, total_points = $3, formation = $4 WHERE id = $5',
          [ft.name, ft.budget, ft.totalPoints, ft.formation, existing[0].id],
        );
        fantasyTeamIds.push(existing[0].id);
        console.log(`  ✓ ${ft.name} (id=${existing[0].id}) – updated`);
      } else {
        const res = await ds.query(
          `INSERT INTO fantasy_teams (name, user_id, fantasy_league_id, budget, total_points, formation, free_transfers_remaining)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [ft.name, ft.userId, ft.leagueId, ft.budget, ft.totalPoints, ft.formation, 2],
        );
        fantasyTeamIds.push(res[0].id);
        console.log(`  + ${ft.name} (id=${res[0].id}) – created`);
      }
    }

    // ── 13. Fantasy Rosters ──────────────────────────────────────
    console.log('\n📋 Seeding fantasy rosters...');
    // Get player IDs
    const players = await ds.query('SELECT id, external_id, name, position, price FROM players ORDER BY id');
    if (players.length > 0 && fantasyTeamIds.length > 0) {
      // Assign players to first 2 fantasy teams (11 starters each)
      const gks = players.filter((p: any) => p.position === 'GK');
      const defs = players.filter((p: any) => p.position === 'DEF');
      const mids = players.filter((p: any) => p.position === 'MID');
      const fwds = players.filter((p: any) => p.position === 'FWD');

      for (let ti = 0; ti < Math.min(2, fantasyTeamIds.length); ti++) {
        const ftId = fantasyTeamIds[ti];
        const existingRoster = await ds.query('SELECT id FROM fantasy_rosters WHERE fantasy_team_id = $1 LIMIT 1', [ftId]);
        if (existingRoster.length > 0) {
          console.log(`  ✓ Fantasy team ${ftId} roster – exists`);
          continue;
        }

        // 4-3-3 or 4-4-2 roster
        const squad = [
          { player: gks[ti % gks.length], pos: 'GK', captain: false, viceCaptain: false },
          { player: defs[0], pos: 'DEF', captain: false, viceCaptain: false },
          { player: defs[1], pos: 'DEF', captain: false, viceCaptain: false },
          { player: defs[2 + ti], pos: 'DEF', captain: false, viceCaptain: false },
          { player: defs[(3 + ti) % defs.length], pos: 'DEF', captain: false, viceCaptain: false },
          { player: mids[ti], pos: 'MID', captain: false, viceCaptain: false },
          { player: mids[ti + 1], pos: 'MID', captain: false, viceCaptain: true },
          { player: mids[(ti + 2) % mids.length], pos: 'MID', captain: false, viceCaptain: false },
          { player: fwds[ti], pos: 'FWD', captain: true, viceCaptain: false },
          { player: fwds[(ti + 1) % fwds.length], pos: 'FWD', captain: false, viceCaptain: false },
          { player: fwds[(ti + 2) % fwds.length], pos: 'FWD', captain: false, viceCaptain: false },
        ];

        for (const s of squad) {
          if (!s.player) continue;
          await ds.query(
            `INSERT INTO fantasy_rosters (fantasy_team_id, player_id, position, is_captain, is_vice_captain, purchase_price, is_starter)
             VALUES ($1, $2, $3, $4, $5, $6, true)`,
            [ftId, s.player.id, s.pos, s.captain, s.viceCaptain, Number(s.player.price)],
          );
        }
        console.log(`  + Fantasy team ${ftId} – 11 players assigned`);
      }
    } else {
      console.log('  ⚠️  No players found – run migrations first');
    }

    // ── 14. Fantasy Gameweeks ────────────────────────────────────
    console.log('\n📅 Seeding fantasy gameweeks...');
    for (const flId of [fantasyLeagueId, fantasyLeague2Id]) {
      const existingGW = await ds.query('SELECT id FROM fantasy_gameweeks WHERE league_id = $1 LIMIT 1', [flId]);
      if (existingGW.length > 0) {
        console.log(`  ✓ League ${flId} gameweeks – exist`);
        continue;
      }

      for (let w = 1; w <= 5; w++) {
        const startDate = daysAgo(35 - (w - 1) * 7);
        const endDate = daysAgo(35 - (w - 1) * 7 - 6);
        const status = w <= 3 ? 'completed' : w === 4 ? 'active' : 'upcoming';
        const processed = w <= 3;

        await ds.query(
          `INSERT INTO fantasy_gameweeks (league_id, week_number, start_date, end_date, status, processed)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [flId, w, startDate, endDate, status, processed],
        );
      }
      console.log(`  + League ${flId} – 5 gameweeks created`);
    }

    // ── 15. Fantasy Points ───────────────────────────────────────
    console.log('\n⭐ Seeding fantasy points...');
    const gameweeks = await ds.query(
      'SELECT id, league_id, week_number FROM fantasy_gameweeks WHERE status = $1 ORDER BY league_id, week_number',
      ['completed'],
    );

    for (const gw of gameweeks) {
      // Find fantasy teams in this league
      const teamsInLeague = await ds.query(
        'SELECT ft.id FROM fantasy_teams ft WHERE ft.fantasy_league_id = $1',
        [gw.league_id],
      );

      for (const ft of teamsInLeague) {
        const existingPts = await ds.query(
          'SELECT id FROM fantasy_points WHERE fantasy_team_id = $1 AND gameweek_id = $2 LIMIT 1',
          [ft.id, gw.id],
        );
        if (existingPts.length > 0) continue;

        // Get roster players
        const roster = await ds.query('SELECT player_id FROM fantasy_rosters WHERE fantasy_team_id = $1', [ft.id]);
        for (const rp of roster) {
          const pts = randomBetween(0, 15);
          const breakdown = JSON.stringify({
            minutes: pts > 0 ? 2 : 0,
            goals: randomBetween(0, 2) * 10,
            assists: randomBetween(0, 1) * 6,
            cleanSheet: randomBetween(0, 1) * 4,
          });
          await ds.query(
            `INSERT INTO fantasy_points (fantasy_team_id, player_id, gameweek_id, points, breakdown)
             VALUES ($1, $2, $3, $4, $5)`,
            [ft.id, rp.player_id, gw.id, pts, breakdown],
          );
        }
      }
      console.log(`  + GW${gw.week_number} (league ${gw.league_id}) – points assigned`);
    }

    // ── 16. Gamification: User Badges ────────────────────────────
    console.log('\n🏅 Seeding user badges...');
    const badges = await ds.query('SELECT id, name FROM badges ORDER BY id');
    if (badges.length > 0) {
      for (const u of USERS) {
        const userId = userIds.get(u.email)!;
        // Give admin/pro users more badges
        const badgeCount = u.isPro ? Math.min(badges.length, 8) : Math.min(badges.length, 3);
        for (let b = 0; b < badgeCount; b++) {
          const existing = await ds.query('SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2', [userId, badges[b].id]);
          if (existing.length === 0) {
            await ds.query(
              'INSERT INTO user_badges (user_id, badge_id, unlocked_at) VALUES ($1, $2, $3)',
              [userId, badges[b].id, daysAgo(randomBetween(1, 60))],
            );
          }
        }
        console.log(`  + ${u.email} – ${badgeCount} badges`);
      }
    }

    // ── 17. Gamification: User Predictions ───────────────────────
    console.log('\n🎯 Seeding user predictions...');
    const finishedMatches = matchIds.slice(0, 11); // Only finished matches
    for (const u of USERS) {
      const userId = userIds.get(u.email)!;
      for (const mId of finishedMatches) {
        const existing = await ds.query('SELECT id FROM user_predictions WHERE user_id = $1 AND match_id = $2', [userId, mId]);
        if (existing.length > 0) continue;
        const predictedHome = randomBetween(0, 4);
        const predictedAway = randomBetween(0, 3);
        const points = randomBetween(0, 10);
        await ds.query(
          `INSERT INTO user_predictions (user_id, match_id, home_score, away_score, points, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, mId, predictedHome, predictedAway, points, daysAgo(randomBetween(1, 30))],
        );
      }
      console.log(`  + ${u.email} – ${finishedMatches.length} predictions`);
    }

    // ── 18. Gamification: Leaderboard ────────────────────────────
    console.log('\n🏆 Seeding leaderboard...');
    for (const u of USERS) {
      const userId = userIds.get(u.email)!;
      const existing = await ds.query("SELECT id FROM leaderboards WHERE user_id = $1 AND period = 'season' AND period_identifier = '2025'", [userId]);
      if (existing.length > 0) {
        console.log(`  ✓ ${u.email} – leaderboard entry exists`);
        continue;
      }
      const totalPts = randomBetween(50, 300);
      await ds.query(
        `INSERT INTO leaderboards (user_id, points, rank, period, period_identifier)
         VALUES ($1, $2, $3, 'season', '2025')`,
        [userId, totalPts, 0],
      );
      console.log(`  + ${u.email} – ${totalPts} pts`);
    }

    // ── 19. Social: Follows ──────────────────────────────────────
    console.log('\n👥 Seeding social follows...');
    const allUserIds = Array.from(userIds.values());
    for (let i = 0; i < allUserIds.length; i++) {
      for (let j = i + 1; j < allUserIds.length; j++) {
        const existing = await ds.query('SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2', [allUserIds[i], allUserIds[j]]);
        if (existing.length === 0) {
          await ds.query('INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, NOW())', [allUserIds[i], allUserIds[j]]);
        }
      }
    }
    console.log(`  + Mutual follows created for ${allUserIds.length} users`);

    // ── 20. Social: Comments ─────────────────────────────────────
    console.log('\n💬 Seeding social comments...');
    const commentTexts = [
      'Great match! What a result!',
      'The referee was terrible today.',
      'Haaland is unstoppable this season!',
      'Liverpool defense was solid.',
      'I predicted this exact score!',
      'Fantasy points are going to be huge for this one.',
      'What a goal by Salah!',
      'Can\'t believe Chelsea lost again.',
    ];

    for (const mId of matchIds.slice(0, 8)) {
      const existingComments = await ds.query('SELECT id FROM comments WHERE match_id = $1 LIMIT 1', [mId]);
      if (existingComments.length > 0) continue;
      for (let c = 0; c < 3; c++) {
        const userId = allUserIds[c % allUserIds.length];
        await ds.query(
          'INSERT INTO comments (user_id, match_id, content, created_at) VALUES ($1, $2, $3, $4)',
          [userId, mId, commentTexts[(mId + c) % commentTexts.length], daysAgo(randomBetween(0, 25))],
        );
      }
      console.log(`  + Match ${mId} – 3 comments`);
    }

    // ── 21. User Favorites ───────────────────────────────────────
    console.log('\n⭐ Seeding user favorites...');
    const favoriteTeams = [
      { email: 'erivanf10@gmail.com', extIds: [33, 131, 42] },  // MUN, COR, ARS
      { email: 'test01@test.com', extIds: [40, 50, 529] },       // LIV, MCI, BAR
    ];
    for (const fav of favoriteTeams) {
      const userId = userIds.get(fav.email)!;
      for (const extId of fav.extIds) {
        const tId = teamIds.get(extId);
        if (!tId) continue;
        const existing = await ds.query(
          "SELECT id FROM user_favorites WHERE user_id = $1 AND entity_type = 'team' AND entity_id = $2",
          [userId, tId],
        );
        if (existing.length === 0) {
          await ds.query(
            "INSERT INTO user_favorites (user_id, entity_type, entity_id, created_at) VALUES ($1, 'team', $2, NOW())",
            [userId, tId],
          );
        }
      }
      console.log(`  + ${fav.email} – ${fav.extIds.length} favorite teams`);
    }

    // ── 22. Prediction Performance ───────────────────────────────
    console.log('\n📊 Seeding prediction performance...');
    const modelTypes = ['statistical', 'ml', 'hybrid'];
    for (const model of modelTypes) {
      for (let i = 0; i < 10; i++) {
        const mId = matchIds[i % matchIds.length];
        const existing = await ds.query(
          'SELECT id FROM prediction_performance WHERE match_id = $1 AND model_type = $2',
          [mId, model],
        );
        if (existing.length > 0) continue;
        const predicted = ['HOME_WIN', 'DRAW', 'AWAY_WIN'][randomBetween(0, 2)];
        const actual = ['HOME_WIN', 'DRAW', 'AWAY_WIN'][randomBetween(0, 2)];
        const conf = randomDecimal(0.3, 0.9500, 4);
        const predData = JSON.stringify({ outcome: predicted, homeWin: randomDecimal(0.1, 0.7), draw: randomDecimal(0.1, 0.4), awayWin: randomDecimal(0.1, 0.7) });
        await ds.query(
          `INSERT INTO prediction_performance (match_id, model_type, prediction_data, actual_outcome, was_correct, confidence_score, predicted_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [mId, model, predData, actual, predicted === actual, conf, daysAgo(randomBetween(1, 30))],
        );
      }
      console.log(`  + ${model} – 10 performance records`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Full seed completed successfully!');
    console.log(`   Users: ${USERS.length}`);
    console.log(`   Teams: ${TEAMS.length}`);
    console.log(`   Leagues: ${LEAGUES_DATA.length}`);
    console.log(`   Matches: ${MATCH_FIXTURES.length}`);
    console.log(`   Highlights: ${HIGHLIGHTS_DATA.length}`);
    console.log(`   Fantasy leagues: 2, teams: ${fantasyTeamData.length}`);
    console.log('='.repeat(60));

    await ds.destroy();
  } catch (err) {
    console.error('\n❌ Seed error:', err);
    await ds.destroy();
    process.exit(1);
  }
}

seed();
