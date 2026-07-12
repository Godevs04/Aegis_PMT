'use client';

import React from 'react';
import Link from 'next/link';
import { FolderKanban, Calendar, TrendingUp } from 'lucide-react';
import { Project, ProjectStatus } from '@/services/project-service';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planning', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-400/10' },
  paused: { label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  archived: { label: 'Archived', color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;

  return (
    <Link
      href={`/projects/${project._id}`}
      className="group block p-5 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <FolderKanban className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="text-[10px] font-mono text-muted-foreground">{project.prefix}</p>
          </div>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig.color} ${statusConfig.bg}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {project.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Progress
          </span>
          <span className="text-[10px] font-medium text-foreground">{project.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
        </div>
        {project.tags && project.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {project.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded bg-secondary text-[9px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 2 && (
              <span className="text-muted-foreground/60">+{project.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default ProjectCard;
