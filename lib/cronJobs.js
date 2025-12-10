import { CronJob } from 'cron';
import connectDb from './connectDb';
import User from '../models/user';
import { sendTaskReminder } from './emailService';

let taskReminderJob = null;

export function initTaskReminderCron() {
  // Prevent duplicate cron jobs
  if (taskReminderJob) {
    console.log('[Cron] Task reminder job already running');
    return;
  }
  // Only run cron in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Cron] Skipping cron initialization in development');
    return;
  }
  taskReminderJob = new CronJob('0 9 * * *', async () => {
    console.log('[Cron] 🔔 Starting task reminder job...');

    try {
      await connectDb();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const today = new Date().toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Find users with tasks due today or tomorrow
      const users = await User.find({
        'academicProfile.tasks': {
          $elemMatch: {
            dueDate: {
              $gte: today,
              $lte: tomorrowStr,
            },
            completed: false,
          },
        },
      }).select('email academicProfile');

      console.log(`[Cron] Found ${users.length} users with upcoming tasks`);

      for (const user of users) {
        if (!user.email) continue;

        const upcomingTasks = user.academicProfile?.tasks?.filter(
          (task) =>
            !task.completed &&
            new Date(task.dueDate).toISOString().split('T')[0] >= today &&
            new Date(task.dueDate).toISOString().split('T')[0] <= tomorrowStr
        );

        if (upcomingTasks && upcomingTasks.length > 0) {
          console.log(`[Cron] Sending ${upcomingTasks.length} reminders to ${user.email}`);

          for (const task of upcomingTasks) {
            await sendTaskReminder(
              user.email,
              `Task Due Soon: ${task.title}`,
              task.title,
              task.dueDate
            );
          }
        }
      }

      console.log('[Cron] ✅ Task reminders job completed');
    } catch (error) {
      console.error('[Cron] ❌ Error:', error.message);
    }
  });

  taskReminderJob.start();
  console.log('[Cron] 🚀 Task reminder cron initialized (runs daily at 9 AM)');
}

export function stopTaskReminderCron() {
  if (taskReminderJob) {
    taskReminderJob.stop();
    taskReminderJob = null;
    console.log('[Cron] Task reminder cron stopped');
  }
}