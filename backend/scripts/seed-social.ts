
import AppDataSource from '../data-source';
import { UserActivity, ActivityType, ActivityTargetType } from '../src/social/entities/user-activity.entity';
import { Follow } from '../src/social/entities/follow.entity';
import { User } from '../src/users/user.entity';

async function seedSocial() {
  try {
    const ds = await AppDataSource.initialize();
    console.log('DataSource initialized for social seeding');

    const userRepository = ds.getRepository(User);
    const activityRepository = ds.getRepository(UserActivity);
    const followRepository = ds.getRepository(Follow);

    // Get erivanf10@gmail.com
    const erivan = await userRepository.findOneBy({ email: 'erivanf10@gmail.com' });
    if (!erivan) {
      console.error('User erivanf10@gmail.com not found. Please run seed:dev first.');
      await ds.destroy();
      return;
    }

    // Get some other users to follow/interact with
    const otherUsers = await userRepository.find({
      take: 5
    });
    const targetUsers = otherUsers.filter(u => u.id !== erivan.id);

    if (targetUsers.length === 0) {
      console.warn('No other users found to create social activity.');
    }

    console.log('Clearing existing social data for clean seed...');
    await activityRepository.query('DELETE FROM user_activity');
    await followRepository.query('DELETE FROM follows');

    console.log('Seeding follows for erivan...');
    for (const target of targetUsers) {
      const follow = new Follow();
      follow.followerId = erivan.id;
      follow.followingId = target.id;
      follow.createdAt = new Date();
      await followRepository.save(follow);
      console.log(`Erivan followed ${target.email}`);
    }

    console.log('Seeding global and personalized activity...');
    const now = new Date();
    
    // 1. Global Activities (from others)
    const activities = [
      {
        userId: targetUsers[0]?.id || 1,
        activityType: ActivityType.PREDICTION,
        targetType: ActivityTargetType.MATCH,
        targetId: 101,
        metadata: { matchName: 'Arsenal vs Man City', prediction: '2-1' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2) // 2 hours ago
      },
      {
        userId: targetUsers[1]?.id || 2,
        activityType: ActivityType.FOLLOW,
        targetType: ActivityTargetType.USER,
        targetId: targetUsers[0]?.id || 1,
        metadata: { targetUserName: targetUsers[0]?.email || 'User' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5) // 5 hours ago
      },
      {
        userId: targetUsers[2]?.id || 3,
        activityType: ActivityType.REACTION,
        targetType: ActivityTargetType.COMMENT,
        targetId: 50,
        metadata: { reactionType: 'like' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      // 2. Personalized Activities (from followed users)
      {
        userId: targetUsers[0]?.id || 1,
        activityType: ActivityType.COMMENT,
        targetType: ActivityTargetType.MATCH,
        targetId: 102,
        metadata: { commentText: 'What a game!', matchName: 'Liverpool vs Chelsea' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 30) // 30 mins ago
      },
      {
        userId: targetUsers[1]?.id || 2,
        activityType: ActivityType.PREDICTION,
        targetType: ActivityTargetType.MATCH,
        targetId: 103,
        metadata: { matchName: 'Real Madrid vs Barca', prediction: '1-3' },
        createdAt: new Date(now.getTime() - 1000 * 60 * 15) // 15 mins ago
      }
    ];

    for (const act of activities) {
      if (!act.userId) continue;
      const activity = new UserActivity();
      activity.userId = act.userId;
      activity.activityType = act.activityType;
      activity.targetType = act.targetType;
      activity.targetId = act.targetId;
      activity.metadata = act.metadata;
      activity.createdAt = act.createdAt;
      await activityRepository.save(activity);
    }

    console.log('Social seeding completed successfully.');
    await ds.destroy();
  } catch (error) {
    console.error('Error seeding social data:', error);
    process.exit(1);
  }
}

seedSocial();
