import AppDataSource from '../data-source';

type DemoTeam = {
  externalId: number;
  name: string;
  shortCode: string;
};

type DemoMatch = {
  externalId: number;
  homeExternalId: number;
  awayExternalId: number;
  kickOff: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  season: string;
};

function currentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 8 ? `${year}` : `${year - 1}`;
}

async function upsertTeam(ds: any, team: DemoTeam): Promise<number> {
  const existing = await ds.query(
    'SELECT id FROM teams WHERE "externalId" = $1',
    [team.externalId],
  );

  if (existing.length > 0) {
    await ds.query(
      'UPDATE teams SET name = $1, "shortCode" = $2 WHERE "externalId" = $3',
      [team.name, team.shortCode, team.externalId],
    );
    return existing[0].id;
  }

  const inserted = await ds.query(
    'INSERT INTO teams ("externalId", name, "shortCode") VALUES ($1, $2, $3) RETURNING id',
    [team.externalId, team.name, team.shortCode],
  );

  return inserted[0].id;
}

async function upsertMatch(
  ds: any,
  match: DemoMatch,
  teamIdByExternalId: Map<number, number>,
): Promise<number> {
  const homeTeamId = teamIdByExternalId.get(match.homeExternalId);
  const awayTeamId = teamIdByExternalId.get(match.awayExternalId);

  if (!homeTeamId || !awayTeamId) {
    throw new Error(`Missing team mapping for match ${match.externalId}`);
  }

  const existing = await ds.query(
    'SELECT id FROM matches WHERE "externalId" = $1',
    [match.externalId],
  );

  if (existing.length > 0) {
    await ds.query(
      `UPDATE matches SET
        "homeTeamId" = $1,
        "awayTeamId" = $2,
        "kickOff" = $3,
        status = $4,
        "homeScore" = $5,
        "awayScore" = $6,
        season = $7,
        league = $8,
        venue = $9,
        referee = $10
      WHERE "externalId" = $11`,
      [
        homeTeamId,
        awayTeamId,
        match.kickOff,
        match.status,
        match.homeScore,
        match.awayScore,
        match.season,
        JSON.stringify({ id: 999, name: 'Demo League', country: 'Demo', season: Number(match.season) }),
        JSON.stringify({ name: 'Demo Stadium', city: 'Demo City' }),
        'Demo Ref',
        match.externalId,
      ],
    );
    return existing[0].id;
  }

  const inserted = await ds.query(
    `INSERT INTO matches
      ("externalId", "homeTeamId", "awayTeamId", "kickOff", status, "homeScore", "awayScore", season, league, venue, referee)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id`,
    [
      match.externalId,
      homeTeamId,
      awayTeamId,
      match.kickOff,
      match.status,
      match.homeScore,
      match.awayScore,
      match.season,
      JSON.stringify({ id: 999, name: 'Demo League', country: 'Demo', season: Number(match.season) }),
      JSON.stringify({ name: 'Demo Stadium', city: 'Demo City' }),
      'Demo Ref',
    ],
  );

  return inserted[0].id;
}

async function seedPredictionPerformance(ds: any, finishedMatchIds: number[]) {
  if (finishedMatchIds.length === 0) return;

  const modelTypes = ['statistical', 'ml', 'hybrid'];

  for (const matchId of finishedMatchIds) {
    for (const modelType of modelTypes) {
      const already = await ds.query(
        `SELECT id FROM prediction_performance
         WHERE match_id = $1 AND model_type = $2 AND evaluated_at IS NOT NULL
         LIMIT 1`,
        [matchId, modelType],
      );

      if (already.length > 0) {
        continue;
      }

      const homeWin = 38 + Math.random() * 30;
      const draw = 18 + Math.random() * 20;
      const awayWin = Math.max(5, 100 - (homeWin + draw));
      const confidence = Math.max(homeWin, draw, awayWin) / 100;

      const outcomes = ['HOME_WIN', 'DRAW', 'AWAY_WIN'];
      const actualOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const predictedOutcome =
        homeWin >= draw && homeWin >= awayWin
          ? 'HOME_WIN'
          : draw >= awayWin
            ? 'DRAW'
            : 'AWAY_WIN';

      await ds.query(
        `INSERT INTO prediction_performance
          (match_id, model_type, prediction_data, actual_outcome, was_correct, confidence_score, metadata, evaluated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          matchId,
          modelType,
          JSON.stringify({
            homeWin: Number(homeWin.toFixed(2)),
            draw: Number(draw.toFixed(2)),
            awayWin: Number(awayWin.toFixed(2)),
          }),
          actualOutcome,
          actualOutcome === predictedOutcome,
          Number(confidence.toFixed(4)),
          JSON.stringify({ demo_seed: true, strategy: modelType }),
        ],
      );
    }
  }
}

async function main() {
  const ds = await AppDataSource.initialize();

  try {
    const season = currentSeason();

    const teams: DemoTeam[] = [
      { externalId: 900001, name: 'FootDash United', shortCode: 'FDU' },
      { externalId: 900002, name: 'Dash City', shortCode: 'DSC' },
      { externalId: 900003, name: 'Analytics FC', shortCode: 'AFC' },
      { externalId: 900004, name: 'Insight Rovers', shortCode: 'IRV' },
    ];

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const finishedMatches: DemoMatch[] = [
      { externalId: 990001, homeExternalId: 900001, awayExternalId: 900002, kickOff: new Date(now.getTime() - 60 * day), status: 'FINISHED', homeScore: 2, awayScore: 1, season },
      { externalId: 990002, homeExternalId: 900003, awayExternalId: 900001, kickOff: new Date(now.getTime() - 56 * day), status: 'FINISHED', homeScore: 1, awayScore: 1, season },
      { externalId: 990003, homeExternalId: 900002, awayExternalId: 900004, kickOff: new Date(now.getTime() - 53 * day), status: 'FINISHED', homeScore: 0, awayScore: 2, season },
      { externalId: 990004, homeExternalId: 900004, awayExternalId: 900001, kickOff: new Date(now.getTime() - 49 * day), status: 'FINISHED', homeScore: 1, awayScore: 3, season },
      { externalId: 990005, homeExternalId: 900001, awayExternalId: 900003, kickOff: new Date(now.getTime() - 44 * day), status: 'FINISHED', homeScore: 2, awayScore: 2, season },
      { externalId: 990006, homeExternalId: 900002, awayExternalId: 900001, kickOff: new Date(now.getTime() - 39 * day), status: 'FINISHED', homeScore: 1, awayScore: 2, season },
      { externalId: 990007, homeExternalId: 900003, awayExternalId: 900004, kickOff: new Date(now.getTime() - 34 * day), status: 'FINISHED', homeScore: 3, awayScore: 1, season },
      { externalId: 990008, homeExternalId: 900004, awayExternalId: 900002, kickOff: new Date(now.getTime() - 30 * day), status: 'FINISHED', homeScore: 2, awayScore: 0, season },
      { externalId: 990009, homeExternalId: 900001, awayExternalId: 900004, kickOff: new Date(now.getTime() - 26 * day), status: 'FINISHED', homeScore: 1, awayScore: 0, season },
      { externalId: 990010, homeExternalId: 900003, awayExternalId: 900002, kickOff: new Date(now.getTime() - 21 * day), status: 'FINISHED', homeScore: 2, awayScore: 1, season },
      { externalId: 990011, homeExternalId: 900002, awayExternalId: 900003, kickOff: new Date(now.getTime() - 16 * day), status: 'FINISHED', homeScore: 1, awayScore: 1, season },
      { externalId: 990012, homeExternalId: 900004, awayExternalId: 900001, kickOff: new Date(now.getTime() - 12 * day), status: 'FINISHED', homeScore: 0, awayScore: 1, season },
    ];

    const upcomingMatches: DemoMatch[] = [
      { externalId: 990101, homeExternalId: 900001, awayExternalId: 900002, kickOff: new Date(now.getTime() + 1 * day), status: 'SCHEDULED', homeScore: null, awayScore: null, season },
      { externalId: 990102, homeExternalId: 900003, awayExternalId: 900004, kickOff: new Date(now.getTime() + 2 * day), status: 'SCHEDULED', homeScore: null, awayScore: null, season },
      { externalId: 990103, homeExternalId: 900001, awayExternalId: 900003, kickOff: new Date(now.getTime() + 4 * day), status: 'NS', homeScore: null, awayScore: null, season },
      { externalId: 990104, homeExternalId: 900004, awayExternalId: 900002, kickOff: new Date(now.getTime() + 6 * day), status: 'TIMED', homeScore: null, awayScore: null, season },
    ];

    const teamIdByExternalId = new Map<number, number>();
    for (const team of teams) {
      const id = await upsertTeam(ds, team);
      teamIdByExternalId.set(team.externalId, id);
    }

    const finishedMatchIds: number[] = [];
    for (const match of finishedMatches) {
      const id = await upsertMatch(ds, match, teamIdByExternalId);
      finishedMatchIds.push(id);
    }

    for (const match of upcomingMatches) {
      await upsertMatch(ds, match, teamIdByExternalId);
    }

    await seedPredictionPerformance(ds, finishedMatchIds);

    console.log('✅ Demo analytics seed complete');
    console.log(`   Teams seeded: ${teams.length}`);
    console.log(`   Finished matches seeded: ${finishedMatches.length}`);
    console.log(`   Upcoming matches seeded: ${upcomingMatches.length}`);
    console.log(`   Prediction performance seeded for ${finishedMatchIds.length} matches`);
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error('❌ Failed to seed demo analytics data:', error);
  process.exit(1);
});
