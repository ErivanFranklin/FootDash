import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceBadgesAndUserBadges1770100000000 implements MigrationInterface {
  name = 'EnhanceBadgesAndUserBadges1770100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to badges table
    await queryRunner.query(`
      ALTER TABLE "badges"
        ADD COLUMN IF NOT EXISTS "tier" varchar(50) NOT NULL DEFAULT 'bronze',
        ADD COLUMN IF NOT EXISTS "criteria_type" varchar(50) NOT NULL DEFAULT 'predictions_correct',
        ADD COLUMN IF NOT EXISTS "threshold" int NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "sort_order" int NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP NOT NULL DEFAULT now()
    `);

    // Recreate user_badges as a proper entity table (drop old ManyToMany join table)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_badges"`);
    await queryRunner.query(`
      CREATE TABLE "user_badges" (
        "id" SERIAL PRIMARY KEY,
        "user_id" int NOT NULL,
        "badge_id" int NOT NULL,
        "unlocked_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_user_badges_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_badges_badge" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_user_badge" UNIQUE ("user_id", "badge_id")
      )
    `);

    // Seed default badges
    await queryRunner.query(`
      INSERT INTO "badges" ("name", "description", "icon_url", "slug", "tier", "criteria_type", "threshold", "sort_order")
      VALUES
        ('Crystal Ball', 'Get your first correct prediction', 'trophy-outline', 'crystal-ball', 'bronze', 'predictions_correct', 1, 1),
        ('Oracle', 'Get 10 correct predictions', 'eye-outline', 'oracle', 'silver', 'predictions_correct', 10, 2),
        ('Prophet', 'Get 50 correct predictions', 'star-outline', 'prophet', 'gold', 'predictions_correct', 50, 3),
        ('Psychic', 'Get 100 correct predictions', 'planet-outline', 'psychic', 'platinum', 'predictions_correct', 100, 4),
        ('Sharpshooter', 'Get your first exact score prediction', 'bullseye-outline', 'sharpshooter', 'bronze', 'predictions_exact', 1, 5),
        ('Sniper', 'Get 10 exact score predictions', 'locate-outline', 'sniper', 'gold', 'predictions_exact', 10, 6),
        ('Streak Master', '5 correct predictions in a row', 'flame-outline', 'streak-master', 'gold', 'predictions_streak', 5, 7),
        ('First Prediction', 'Submit your first prediction', 'hand-left-outline', 'first-prediction', 'bronze', 'first_prediction', 1, 8),
        ('First Comment', 'Post your first comment', 'chatbubble-outline', 'first-comment', 'bronze', 'first_comment', 1, 9),
        ('Commentator', 'Post 50 comments', 'chatbubbles-outline', 'commentator', 'silver', 'comments_total', 50, 10),
        ('Social Butterfly', 'Follow 10 users', 'people-outline', 'social-butterfly', 'silver', 'following_count', 10, 11),
        ('Popular', 'Get 10 followers', 'heart-outline', 'popular', 'silver', 'followers_count', 10, 12),
        ('Influencer', 'Get 50 followers', 'megaphone-outline', 'influencer', 'gold', 'followers_count', 50, 13),
        ('Pro Supporter', 'Subscribe to FootDash Pro', 'diamond-outline', 'pro-supporter', 'silver', 'pro_subscriber', 1, 14),
        ('Early Bird', 'Predict before match day', 'sunny-outline', 'early-bird', 'bronze', 'early_predictor', 1, 15),
        ('Devoted Fan', 'Log in 30 days in a row', 'calendar-outline', 'devoted-fan', 'gold', 'login_streak', 30, 16),
        ('Top 10 Weekly', 'Finish in weekly top 10', 'podium-outline', 'top-10-weekly', 'gold', 'leaderboard_top', 10, 17)
      ON CONFLICT ("slug") DO UPDATE SET
        "tier" = EXCLUDED."tier",
        "criteria_type" = EXCLUDED."criteria_type",
        "threshold" = EXCLUDED."threshold",
        "sort_order" = EXCLUDED."sort_order"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_badges"`);
    await queryRunner.query(`
      ALTER TABLE "badges"
        DROP COLUMN IF EXISTS "tier",
        DROP COLUMN IF EXISTS "criteria_type",
        DROP COLUMN IF EXISTS "threshold",
        DROP COLUMN IF EXISTS "is_active",
        DROP COLUMN IF EXISTS "sort_order",
        DROP COLUMN IF EXISTS "created_at"
    `);
  }
}
