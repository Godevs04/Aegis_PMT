import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables
const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import User from '../modules/users/user.model';
import { Role } from '../modules/roles/role.model';
import { OrganizationMember } from '../modules/members/organization-member.model';
import { WorkspaceMember } from '../modules/members/workspace-member.model';
import { Organization } from '../modules/organizations/organization.model';
import { Workspace } from '../modules/workspaces/workspace.model';

const USAGE = `
Aegis PMT User Management CLI
Usage:
  npx ts-node src/scripts/manage-users.ts <command> [options]

Commands:
  list                                       List all users and their memberships
  create --email=<email> --name=<name>       Create a new user
         --password=<password>
  promote --email=<email> --role=<role_slug> Promote user to a role in their first org/workspace
         Roles: super_admin, org_owner, org_admin, workspace_admin, developer, viewer, etc.
  delete --email=<email>                     Delete a user by email
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || ['list', 'create', 'promote', 'delete'].indexOf(command) === -1) {
    console.log(USAGE);
    process.exit(0);
  }

  const parsedArgs: Record<string, string> = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const [key, val] = arg.slice(2).split('=');
        parsedArgs[key] = val;
      } else {
        const key = arg.slice(2);
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith('-')) {
          parsedArgs[key] = nextArg;
          i++;
        }
      }
    } else if (arg.includes('=')) {
      const [key, val] = arg.split('=');
      parsedArgs[key] = val;
    } else if (['email', 'name', 'password', 'role'].includes(arg)) {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        parsedArgs[arg] = nextArg;
        i++;
      }
    }
  }

  const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!mongoURI) {
    console.error('❌ MONGODB_URI or MONGODB_URL is not defined in environment.');
    process.exit(1);
  }

  await mongoose.connect(mongoURI);

  try {
    switch (command) {
      case 'list':
        await listUsers();
        break;
      case 'create':
        await createUser(parsedArgs);
        break;
      case 'promote':
        await promoteUser(parsedArgs);
        break;
      case 'delete':
        await deleteUser(parsedArgs);
        break;
    }
  } catch (error: any) {
    console.error('❌ Error executing command:', error.message || error);
  } finally {
    await mongoose.disconnect();
  }
}

async function listUsers() {
  const users = await User.find({ deletedAt: null });
  console.log(`\n👥 Total Active Users: ${users.length}\n`);

  for (const user of users) {
    console.log(`👤 ${user.name} (${user.email}) [ID: ${user._id}]`);
    
    // Org memberships
    const orgMembers = await OrganizationMember.find({ userId: user._id });
    for (const om of orgMembers) {
      const roleObj = await Role.findById(om.roleId);
      const orgObj = await Organization.findById(om.organizationId);
      console.log(`   🏢 Org: ${orgObj?.name || om.organizationId} | Role: ${roleObj?.name || om.roleId} (${om.status})`);
    }

    // Workspace memberships
    const wsMembers = await WorkspaceMember.find({ userId: user._id });
    for (const wm of wsMembers) {
      const roleObj = await Role.findById(wm.roleId);
      const wsObj = await Workspace.findById(wm.workspaceId);
      console.log(`   💼 Workspace: ${wsObj?.name || wm.workspaceId} | Role: ${roleObj?.name || wm.roleId} (${wm.status})`);
    }
    console.log('──────────────────────────────────────────────────');
  }
}

async function createUser(args: Record<string, string>) {
  const { email, name, password } = args;
  if (!email || !name || !password) {
    console.log('❌ Missing options. Required: --email, --name, --password');
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`❌ User with email ${email} already exists.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: true,
    isOnboardingComplete: true,
    onboardingStep: 2
  });

  console.log(`✅ Created user ${name} (${email}) [ID: ${user._id}]`);
}

async function promoteUser(args: Record<string, string>) {
  const { email, role } = args;
  if (!email || !role) {
    console.log('❌ Missing options. Required: --email, --role');
    return;
  }

  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    console.log(`❌ User with email ${email} not found.`);
    return;
  }

  const targetRole = await Role.findOne({ slug: role, isSystem: true });
  if (!targetRole) {
    console.log(`❌ Role with slug "${role}" not found in system roles.`);
    return;
  }

  // Check if role is org level or workspace level
  const isOrgLevel = ['super_admin', 'org_owner', 'org_admin'].indexOf(role) !== -1;

  if (isOrgLevel) {
    const orgMembership = await OrganizationMember.findOne({ userId: user._id, status: 'active' });
    if (!orgMembership) {
      console.log(`⚠️ User has no active organization membership. Creating one with a default org...`);
      const defaultOrg = await Organization.findOne({ deletedAt: null });
      if (!defaultOrg) {
        console.log(`❌ No organizations found in DB to link user.`);
        return;
      }
      await OrganizationMember.create({
        userId: user._id,
        organizationId: defaultOrg._id,
        roleId: targetRole._id,
        status: 'active',
        joinedAt: new Date()
      });
      console.log(`✅ Added user ${email} to org "${defaultOrg.name}" with role "${targetRole.name}"`);
    } else {
      orgMembership.roleId = targetRole._id as any;
      await orgMembership.save();
      console.log(`✅ Promoted user ${email} to "${targetRole.name}" in their organization.`);
    }
  } else {
    // Workspace level role
    const wsMembership = await WorkspaceMember.findOne({ userId: user._id, status: 'active' });
    if (!wsMembership) {
      console.log(`⚠️ User has no active workspace membership. Creating one with default workspace...`);
      const defaultWs = await Workspace.findOne({ deletedAt: null });
      if (!defaultWs) {
        console.log(`❌ No workspaces found in DB to link user.`);
        return;
      }
      await WorkspaceMember.create({
        userId: user._id,
        workspaceId: defaultWs._id,
        roleId: targetRole._id,
        status: 'active',
        joinedAt: new Date()
      });
      console.log(`✅ Added user ${email} to workspace "${defaultWs.name}" with role "${targetRole.name}"`);
    } else {
      wsMembership.roleId = targetRole._id as any;
      await wsMembership.save();
      console.log(`✅ Promoted user ${email} to "${targetRole.name}" in their workspace.`);
    }
  }
}

async function deleteUser(args: Record<string, string>) {
  const { email } = args;
  if (!email) {
    console.log('❌ Missing option: --email');
    return;
  }

  const user = await User.findOne({ email, deletedAt: null });
  if (!user) {
    console.log(`❌ User with email ${email} not found.`);
    return;
  }

  user.deletedAt = new Date();
  await user.save();

  // Deactivate memberships
  await OrganizationMember.updateMany({ userId: user._id }, { status: 'inactive' });
  await WorkspaceMember.updateMany({ userId: user._id }, { status: 'inactive' });

  console.log(`🗑️ Soft-deleted user ${email} and deactivated their memberships.`);
}

main();
