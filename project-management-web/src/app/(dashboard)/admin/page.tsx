'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Server,
  Users,
  FolderKanban,
  CheckSquare,
  Building2,
  Layers,
  TrendingUp,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/services/api-client';

interface SystemHealth {
  status: string;
  uptime: number;
  counts: { users: number; organizations: number; workspaces: number; projects: number; tasks: number; teams: number };
  memory: { rss: number; heapUsed: number; heapTotal: number };
}

interface PlatformAnalytics {
  users: { total: number; newLast30d: number; newLast7d: number };
  tasks: { total: number; createdLast7d: number; completedLast7d: number };
  activityLast7d: number;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isVerified: boolean;
  isOnboardingComplete: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersMeta, setUsersMeta] = useState<{ page: number; total: number; totalPages: number }>({ page: 1, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch health + analytics
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const [healthRes, analyticsRes] = await Promise.all([
          apiClient.get('/admin/health'),
          apiClient.get('/admin/analytics'),
        ]);
        setHealth(healthRes.data.data);
        setAnalytics(analyticsRes.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load admin data. You may not have admin access.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const params = new URLSearchParams({ page: String(currentPage), limit: '15' });
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        const response = await apiClient.get(`/admin/users?${params.toString()}`);
        setUsers(response.data.data);
        setUsersMeta(response.data.meta);
      } catch {
        // Silently fail user list if no permission
      }
    };
    fetchUsers();
  }, [currentPage, searchQuery]);

  const handleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;
    try {
      await apiClient.post(`/admin/users/${userId}/suspend`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to suspend user.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">System health, analytics, and user management.</p>
        </div>
      </div>

      {/* System Health */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniStat icon={Users} label="Users" value={health.counts.users} color="text-blue-400" />
          <MiniStat icon={Building2} label="Orgs" value={health.counts.organizations} color="text-purple-400" />
          <MiniStat icon={Layers} label="Workspaces" value={health.counts.workspaces} color="text-indigo-400" />
          <MiniStat icon={FolderKanban} label="Projects" value={health.counts.projects} color="text-green-400" />
          <MiniStat icon={CheckSquare} label="Tasks" value={health.counts.tasks} color="text-amber-400" />
          <MiniStat icon={Server} label="Memory (MB)" value={health.memory.heapUsed} color="text-red-400" />
        </div>
      )}

      {/* Platform Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-border bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Growth</h3>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{analytics.users.total}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              +{analytics.users.newLast7d} this week · +{analytics.users.newLast30d} this month
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task Activity (7d)</h3>
              <CheckSquare className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{analytics.tasks.createdLast7d}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Created · {analytics.tasks.completedLast7d} completed
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activities (7d)</h3>
              <Server className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{analytics.activityLast7d}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Total platform actions</p>
          </div>
        </div>
      )}

      {/* User Management */}
      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">User Management</h2>
          <div className="relative w-56">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2.5 text-left">User</th>
                <th className="px-5 py-2.5 text-left">Email</th>
                <th className="px-5 py-2.5 text-center">Verified</th>
                <th className="px-5 py-2.5 text-center">Onboarded</th>
                <th className="px-5 py-2.5 text-left">Joined</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-border/50 hover:bg-secondary/10">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-[10px] font-medium ${u.isVerified ? 'text-green-400' : 'text-red-400'}`}>
                      {u.isVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-[10px] font-medium ${u.isOnboardingComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                      {u.isOnboardingComplete ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleSuspend(u._id)}
                      className="text-[10px] text-destructive hover:underline inline-flex items-center gap-1"
                    >
                      <UserX className="h-3 w-3" />
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-muted-foreground">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{usersMeta.total} users total</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground">Page {currentPage} of {usersMeta.totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setCurrentPage((p) => Math.min(usersMeta.totalPages, p + 1))} disabled={currentPage >= usersMeta.totalPages}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mini Stat ───────────────────────────────────────────────────────────────

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card/50 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
