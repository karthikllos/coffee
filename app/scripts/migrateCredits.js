// scripts/migrateCredits.js
// Run this ONCE to migrate existing users to new credit system

import mongoose from 'mongoose';
import User from '../../models/user.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function migrateCredits() {
  try {
    console.log('🔄 Starting credit migration...\n');
    console.log(`📡 Connecting to: ${MONGODB_URI}\n`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const updates = {};
        let needsUpdate = false;

        console.log(`\n👤 Processing: ${user.email}`);
        console.log(`   Plan: ${user.subscriptionPlan || 'Free'}`);
        console.log(`   Current aiCredits: ${user.aiCredits}`);
        console.log(`   Old credits field: ${user.credits || 0}`);
        console.log(`   Old creditsUsed: ${user.creditsUsed || 0}`);

        // MIGRATION LOGIC
        if (user.aiCredits === undefined || user.aiCredits === null) {
          needsUpdate = true;

          // Pro plan users get 50 monthly credits
          if (user.subscriptionPlan === 'Pro') {
            updates.aiCredits = 50;
            updates.creditMonthResetDate = new Date();
            console.log(`   ✅ Migrating to Pro: 50 credits`);
          }
          // Premium/Pro Max users don't need credits (unlimited)
          else if (user.subscriptionPlan === 'Pro Max' || user.subscriptionPlan === 'Premium') {
            updates.aiCredits = 999999; // Symbolic unlimited
            console.log(`   ✅ Migrating to ${user.subscriptionPlan}: Unlimited`);
          }
          // Free/Starter users: migrate old credits or set default
          else {
            // If they had purchased credits in old system
            if (user.credits && user.credits > 0) {
              const available = (user.credits || 0) - (user.creditsUsed || 0);
              updates.aiCredits = Math.max(0, available);
              console.log(`   ✅ Migrating purchased credits: ${available} available`);
            } 
            // New users get 5 free credits
            else {
              updates.aiCredits = 5;
              console.log(`   ✅ Setting default: 5 free credits`);
            }
          }

          // Apply updates
          if (needsUpdate) {
            await User.updateOne({ _id: user._id }, { $set: updates });
            migrated++;
            console.log(`   ✅ Migration complete for ${user.email}`);
          }
        } else {
          skipped++;
          console.log(`   ⏭️  Already migrated (aiCredits: ${user.aiCredits})`);
        }

      } catch (err) {
        errors++;
        console.error(`   ❌ Error migrating ${user.email}:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Migrated: ${migrated} users`);
    console.log(`⏭️  Skipped: ${skipped} users (already migrated)`);
    console.log(`❌ Errors: ${errors} users`);
    console.log('='.repeat(60) + '\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');
    const verifyUsers = await User.find({}).select('email subscriptionPlan aiCredits');
    
    console.log('Sample of migrated users:');
    verifyUsers.slice(0, 5).forEach(u => {
      console.log(`  ${u.email} (${u.subscriptionPlan || 'Free'}): ${u.aiCredits} credits`);
    });

    console.log('\n✅ Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateCredits();