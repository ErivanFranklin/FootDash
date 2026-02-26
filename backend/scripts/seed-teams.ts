/**
 * seed-teams.ts
 *
 * One-time script to populate the FootDash database with favorite teams
 * and sync their recent + upcoming fixtures from the Football API.
 *
 * Usage:
 *   cd backend && npx ts-node scripts/seed-teams.ts
 *
 * This script:
 * 1. Inserts favorite teams into the teams table (if not already present)
 * 2. Calls the Football API to fetch fixtures for each team
 * 3. Persists the fixtures into the matches table
 *
 * Rate limiting: 1.5 s delay between API calls (free plan = 10 req/min)
 */

import AppDataSource from '../data-source';

// ── Favorite teams ──────────────────────────────────────────────────────
const FAVORITE_TEAMS = [
  { externalId: 33,  name: 'Manchester United',  shortCode: 'MUN' },
  { externalId: 40,  name: 'Liverpool',          shortCode: 'LIV' },
  { externalId: 50,  name: 'Manchester City',    shortCode: 'MCI' },
  { externalId: 529, name: 'Barcelona',           shortCode: 'BAR' },
  { externalId: 541, name: 'Real Madrid',         shortCode: 'RMA' },
  { externalId: 157, name: 'Bayern Munich',       shortCode: 'BAY' },
  { externalId: 85,  name: 'Paris Saint-Germain', shortCode: 'PSG' },
  { externalId: 131, name: 'Corinthians',         shortCode: 'COR' },
];

// Football seasons span two calendar years. Before August → previous year.
// Free plan only has access to seasons 2022–2024, so cap at 2024.
function currentSeason(): number {
  const now = new Date();
  const season = now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
  // Free plan caps at 2024 – use the latest available season
  return Math.min(season, 2024);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🏟️  FootDash Team & Fixture Seeder');
  console.log('='.repeat(50));

  // ── 1. Connect to database ─────────────────────────────────────────
  const ds = await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  // ── 2. Upsert teams ────────────────────────────────────────────────
  console.log('📋 Inserting favorite teams...');
  for (const team of FAVORITE_TEAMS) {
    const existing = await ds.query(
      'SELECT id FROM teams WHERE "externalId" = $1',
      [team.externalId],
    );

    if (existing.length > 0) {
      // Update name/code in case they changed
      await ds.query(
        'UPDATE teams SET name = $1, "shortCode" = $2 WHERE "externalId" = $3',
        [team.name, team.shortCode, team.externalId],
      );
      console.log(`  ✓ ${team.name} (ext=${team.externalId}) – already exists, updated`);
    } else {
      await ds.query(
        'INSERT INTO teams ("externalId", name, "shortCode") VALUES ($1, $2, $3)',
        [team.externalId, team.name, team.shortCode],
      );
      console.log(`  + ${team.name} (ext=${team.externalId}) – inserted`);
    }
  }

  // ── 3. Fetch & persist fixtures via API ────────────────────────────
  const apiKey = process.env.FOOTBALL_API_KEY;
  const apiUrl = process.env.FOOTBALL_API_URL || 'https://v3.football.api-sports.io';
  const isMock = process.env.FOOTBALL_API_MOCK === 'true';

  if (!apiKey || isMock) {
    console.log('\n⚠️  FOOTBALL_API_KEY not set or mock mode active.');
    console.log('   Teams inserted but fixtures NOT synced from API.');
    console.log('   Set FOOTBALL_API_KEY and FOOTBALL_API_MOCK=false in .env to sync.');
    await ds.destroy();
    return;
  }

  console.log('\n⚽ Syncing fixtures from Football API...');
  const season = currentSeason();
  console.log(`   Season: ${season}`);

  // Check remaining API quota
  const statusResp = await fetch(`${apiUrl}/status`, {
    headers: { 'x-apisports-key': apiKey },
  });
  const statusData = await statusResp.json() as any;
  const remaining = (statusData?.response?.requests?.limit_day ?? 100)
    - (statusData?.response?.requests?.current ?? 0);
  console.log(`   API requests remaining today: ${remaining}`);

  // Each team = 1 API call. Make sure we have enough.
  if (remaining < FAVORITE_TEAMS.length) {
    console.log(`   ⚠️  Not enough API requests to sync all teams (need ${FAVORITE_TEAMS.length}).`);
    console.log('   Will sync as many as possible.');
  }

  let synced = 0;
  let errors = 0;

  for (const team of FAVORITE_TEAMS) {
    if (synced >= remaining) {
      console.log(`   ⚠️  API quota exhausted – stopping at ${synced} teams`);
      break;
    }

    try {
      console.log(`   🔄 ${team.name}...`);

      // Fetch fixtures from the API
      const resp = await fetch(
        `${apiUrl}/fixtures?team=${team.externalId}&season=${season}`,
        { headers: { 'x-apisports-key': apiKey } },
      );
      const data = await resp.json() as any;

      if (data.errors && Object.keys(data.errors).length > 0) {
        console.log(`   ❌ ${team.name}: API error –`, data.errors);
        errors++;
        await sleep(1500);
        continue;
      }

      const fixtures = data.response || [];
      let inserted = 0;
      let updated = 0;

      for (const f of fixtures) {
        const externalMatchId = f.fixture?.id;
        if (!externalMatchId) continue;

        const kickOff = f.fixture?.date ? new Date(f.fixture.date) : null;
        const status = f.fixture?.status?.short ?? null;
        const homeId = f.teams?.home?.id;
        const awayId = f.teams?.away?.id;
        const homeName = f.teams?.home?.name ?? 'Unknown';
        const awayName = f.teams?.away?.name ?? 'Unknown';
        const homeScore = f.goals?.home ?? null;
        const awayScore = f.goals?.away ?? null;
        const referee = f.fixture?.referee ?? null;
        const venue = f.fixture?.venue ? JSON.stringify(f.fixture.venue) : null;
        const league = f.league ? JSON.stringify({
          id: f.league.id,
          name: f.league.name,
          country: f.league.country,
          logo: f.league.logo,
          season: f.league.season,
        }) : null;

        // Upsert home team
        const homeExists = await ds.query(
          'SELECT id FROM teams WHERE "externalId" = $1', [homeId],
        );
        let homeTeamId: number;
        if (homeExists.length > 0) {
          homeTeamId = homeExists[0].id;
        } else {
          const res = await ds.query(
            'INSERT INTO teams ("externalId", name) VALUES ($1, $2) RETURNING id',
            [homeId, homeName],
          );
          homeTeamId = res[0].id;
        }

        // Upsert away team
        const awayExists = await ds.query(
          'SELECT id FROM teams WHERE "externalId" = $1', [awayId],
        );
        let awayTeamId: number;
        if (awayExists.length > 0) {
          awayTeamId = awayExists[0].id;
        } else {
          const res = await ds.query(
            'INSERT INTO teams ("externalId", name) VALUES ($1, $2) RETURNING id',
            [awayId, awayName],
          );
          awayTeamId = res[0].id;
        }

        // Upsert match
        const matchExists = await ds.query(
          'SELECT id FROM matches WHERE "externalId" = $1', [externalMatchId],
        );
        if (matchExists.length > 0) {
          await ds.query(
            `UPDATE matches SET
              "kickOff" = $1, status = $2, "homeScore" = $3, "awayScore" = $4,
              referee = $5, venue = $6, league = $7,
              "homeTeamId" = $8, "awayTeamId" = $9, season = $10
            WHERE "externalId" = $11`,
            [kickOff, status, homeScore, awayScore, referee, venue, league,
             homeTeamId, awayTeamId, String(season), externalMatchId],
          );
          updated++;
        } else {
          await ds.query(
            `INSERT INTO matches
              ("externalId", "kickOff", status, "homeScore", "awayScore",
               referee, venue, league, "homeTeamId", "awayTeamId", season)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [externalMatchId, kickOff, status, homeScore, awayScore,
             referee, venue, league, homeTeamId, awayTeamId, String(season)],
          );
          inserted++;
        }
      }

      console.log(`   ✅ ${team.name}: ${fixtures.length} fixtures (${inserted} new, ${updated} updated)`);
      synced++;

      // Rate limit: 1.5s between requests
      await sleep(1500);
    } catch (err: any) {
      console.log(`   ❌ ${team.name}: ${err.message}`);
      errors++;
      await sleep(1500);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Seeding complete: ${synced} teams synced, ${errors} errors`);

  await ds.destroy();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
