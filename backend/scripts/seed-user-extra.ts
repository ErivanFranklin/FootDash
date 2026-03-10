import AppDataSource from '../data-source';
import { randomInt } from 'crypto';

async function run() {
  const ds = await AppDataSource.initialize();
  console.log('Connected to DB for extra user seeding');

  // Find user id for email
  const email = 'erivanf10@gmail.com'.toLowerCase();
  const users = await ds.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!users || users.length === 0) {
    console.error('User not found:', email);
    await ds.destroy();
    process.exit(1);
  }
  const userId = users[0].id;
  console.log('Found user id=', userId);

  // 1) Add extra predictions
  try {
    const existingPreds = await ds.query('SELECT COUNT(*) FROM user_predictions WHERE user_id = $1', [userId]);
    const existingCount = Number(existingPreds[0]?.count || 0);
    const toInsert = 10;
    console.log(`Existing predictions: ${existingCount}, adding ${toInsert}`);

    // Find some match ids to use
    const matches = await ds.query('SELECT id FROM matches ORDER BY id DESC LIMIT $1', [toInsert]);
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const homeGoals = randomInt(0, 5);
      const awayGoals = randomInt(0, 5);
      await ds.query(
        `INSERT INTO user_predictions (user_id, match_id, home_score, away_score, created_at)
         VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT DO NOTHING`,
        [userId, m.id, homeGoals, awayGoals],
      );
    }
    console.log('Inserted predictions');
  } catch (e: any) {
    console.warn('Predictions insert failed (maybe table name differs):', e.message || e);
  }

  // 2) Add comments on matches (discussion)
  try {
    const toComment = 6;
    const matches = await ds.query('SELECT id FROM matches ORDER BY id DESC LIMIT $1', [toComment]);
    for (let i = 0; i < matches.length; i++) {
      await ds.query(
        `INSERT INTO comments (user_id, match_id, content, created_at)
          VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING`,
        [userId, matches[i].id, `Auto-seed comment #${i + 1} for UI testing`],
      );
    }
    console.log('Inserted comments');
  } catch (e: any) {
    console.warn('Comments insert failed (table may be named different):', e.message || e);
  }

  // 3) Add favorites (teams)
  try {
    const teams = await ds.query('SELECT id FROM teams LIMIT 6');
    for (let i = 0; i < teams.length; i++) {
      await ds.query(
        `INSERT INTO user_favorites (user_id, entity_type, entity_id, created_at) VALUES ($1, 'team', $2, NOW()) ON CONFLICT DO NOTHING`,
        [userId, teams[i].id],
      );
    }
    console.log('Inserted favorite teams');
  } catch (e: any) {
    console.warn('Favorites insert failed (table name may differ):', e.message || e);
  }

  // 4) Add activity entries
  try {
    const acts = ['prediction', 'comment', 'follow'];
    const targets = ['match', 'comment', 'user'];
    // Prepare sample target ids
    const sampleMatch = await ds.query('SELECT id FROM matches ORDER BY id DESC LIMIT 1');
    const sampleMatchId = sampleMatch[0]?.id || null;
    const sampleComment = await ds.query('SELECT id FROM comments WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
    const sampleCommentId = sampleComment[0]?.id || null;
    const sampleTeam = await ds.query('SELECT id FROM teams LIMIT 1');
    const sampleTeamId = sampleTeam[0]?.id || null;

    for (let i = 0; i < 8; i++) {
      const act = acts[i % acts.length];
      const target = targets[i % targets.length];
      let targetId = null;
      if (target === 'match') targetId = sampleMatchId;
      if (target === 'comment') targetId = sampleCommentId;
      if (target === 'team') targetId = sampleTeamId;
      if (!targetId) targetId = sampleMatchId || sampleCommentId || sampleTeamId;
      await ds.query(
        `INSERT INTO user_activity (user_id, activity_type, target_type, target_id, metadata, created_at) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [userId, act, target, targetId, JSON.stringify({ note: `Auto event ${i + 1}` })],
      );
    }
    console.log('Inserted activities');
  } catch (e: any) {
    console.warn('Activities insert failed (table may differ):', e.message || e);
  }

  // 5) Add social follows (follow some demo users)
  try {
    const others = await ds.query("SELECT id FROM users WHERE email <> $1 LIMIT 5", [email]);
    for (let i = 0; i < others.length; i++) {
      await ds.query(
        `INSERT INTO follows (follower_id, following_id, created_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
        [userId, others[i].id],
      );
    }
    console.log('Inserted follows');
  } catch (e: any) {
    console.warn('Follows insert failed (table may differ):', e.message || e);
  }

  // 6) Add badges
  try {
    const badges = await ds.query('SELECT id FROM badges LIMIT 5');
    for (let i = 0; i < badges.length; i++) {
      await ds.query(
        `INSERT INTO user_badges (user_id, badge_id, unlocked_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
        [userId, badges[i].id],
      );
    }
    console.log('Inserted badges');
  } catch (e: any) {
    console.warn('Badges insert failed (table may differ):', e.message || e);
  }

  await ds.destroy();
  console.log('Extra user seeding complete');
}

run().catch(err => { console.error(err); process.exit(1); });
