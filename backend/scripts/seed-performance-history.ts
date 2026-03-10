import AppDataSource from '../data-source';

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function run() {
  const ds = await AppDataSource.initialize();
  try {
    const finishedMatches = await ds.query(
      `SELECT id FROM matches
       WHERE status IN ('FINISHED','FT')
         AND "homeScore" IS NOT NULL
         AND "awayScore" IS NOT NULL
       ORDER BY "kickOff" DESC
       LIMIT 24`
    );

    if (!finishedMatches.length) {
      console.log('No finished matches found to seed performance history.');
      await ds.destroy();
      return;
    }

    const modelTypes = ['statistical', 'ml', 'hybrid'];
    let inserted = 0;

    // Build 10 weeks of history
    for (let week = 0; week < 10; week++) {
      for (const match of finishedMatches.slice(week % 2, 12 + (week % 2))) {
        for (const modelType of modelTypes) {
          const homeWin = round(rand(15, 65), 2);
          const draw = round(rand(15, 35), 2);
          const awayWin = round(Math.max(5, 100 - (homeWin + draw)), 2);

          const predictedOutcome =
            homeWin >= draw && homeWin >= awayWin
              ? 'HOME_WIN'
              : draw >= awayWin
                ? 'DRAW'
                : 'AWAY_WIN';

          const outcomes = ['HOME_WIN', 'DRAW', 'AWAY_WIN'];
          const actualOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
          const wasCorrect = predictedOutcome === actualOutcome;

          const predictedAt = daysAgo(week * 7 + Math.floor(rand(0, 6)));
          const evaluatedAt = new Date(predictedAt.getTime() + 2 * 60 * 60 * 1000);

          await ds.query(
            `INSERT INTO prediction_performance
             (match_id, model_type, prediction_data, actual_outcome, was_correct, confidence_score, metadata, predicted_at, evaluated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              match.id,
              modelType,
              JSON.stringify({ homeWin, draw, awayWin }),
              actualOutcome,
              wasCorrect,
              round(Math.max(homeWin, draw, awayWin) / 100, 4),
              JSON.stringify({ seeded: true, source: 'seed-performance-history', week }),
              predictedAt,
              evaluatedAt,
            ],
          );
          inserted += 1;
        }
      }
    }

    // Ensure existing rows can be included in stats endpoint filters.
    await ds.query(
      `UPDATE prediction_performance
       SET evaluated_at = COALESCE(evaluated_at, predicted_at, NOW())
       WHERE evaluated_at IS NULL`
    );

    console.log(`Seeded performance history rows: ${inserted}`);
  } finally {
    await ds.destroy();
  }
}

run().catch((err) => {
  console.error('seed-performance-history failed:', err);
  process.exit(1);
});
