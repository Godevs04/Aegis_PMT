/**
 * Seed Script: System Roles
 *
 * Creates the default system roles with their permission sets.
 * Safe to run multiple times — uses upsert logic (finds by slug, updates permissions if needed).
 *
 * Usage:
 *   npx ts-node-dev src/scripts/seed-roles.ts
 *   OR
 *   npm run seed:roles
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Load environment variables
const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { Role } from '../modules/roles/role.model';
import {
  SystemRole,
  SYSTEM_ROLE_PERMISSIONS,
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_DESCRIPTIONS,
} from '../config/permissions';

async function seedSystemRoles(): Promise<void> {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!mongoURI) {
    console.error('❌ MONGODB_URI or MONGODB_URL is not defined in environment variables.');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📦 Seeding system roles...\n');

    const roleEntries = Object.values(SystemRole);
    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const slug of roleEntries) {
      const name = SYSTEM_ROLE_NAMES[slug];
      const description = SYSTEM_ROLE_DESCRIPTIONS[slug];
      const permissions = SYSTEM_ROLE_PERMISSIONS[slug];

      // Check if role already exists
      // Use direct query to bypass soft-delete middleware (in case it was soft-deleted)
      const existingRole = await Role.findOne({ slug, isSystem: true }).setOptions({
        strictQuery: false,
      });

      if (existingRole) {
        // Check if permissions need updating
        const existingPerms = existingRole.permissions.sort().join(',');
        const newPerms = [...permissions].sort().join(',');

        if (existingPerms !== newPerms || existingRole.name !== name || existingRole.description !== description) {
          // Direct update bypassing the pre-save guard for system roles
          await Role.updateOne(
            { _id: existingRole._id },
            {
              $set: {
                name,
                description,
                permissions,
                deletedAt: null, // Restore if soft-deleted
              },
            }
          );
          console.log(`  🔄 Updated: ${name} (${slug}) — ${permissions.length} permissions`);
          updated++;
        } else {
          console.log(`  ✓  Unchanged: ${name} (${slug})`);
          unchanged++;
        }
      } else {
        // Create new role
        await Role.create({
          name,
          slug,
          description,
          organizationId: null, // System roles have no org
          isSystem: true,
          permissions,
        });
        console.log(`  ✨ Created: ${name} (${slug}) — ${permissions.length} permissions`);
        created++;
      }
    }

    console.log(`\n────────────────────────────────────────────`);
    console.log(`📊 Summary:`);
    console.log(`   Created:   ${created}`);
    console.log(`   Updated:   ${updated}`);
    console.log(`   Unchanged: ${unchanged}`);
    console.log(`   Total:     ${roleEntries.length} system roles`);
    console.log(`────────────────────────────────────────────\n`);

    // Print role permission counts for verification
    console.log('📋 Permission counts per role:');
    for (const slug of roleEntries) {
      const name = SYSTEM_ROLE_NAMES[slug];
      const count = SYSTEM_ROLE_PERMISSIONS[slug].length;
      console.log(`   ${name.padEnd(22)} ${count} permissions`);
    }

    console.log('\n✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', (error as Error).message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Execute
seedSystemRoles();
