'use client';

import React, { useState } from 'react';
import { X, Trash2, Calendar, CheckSquare, Plus, MessageSquare, Send } from 'lucide-react';
import { useUpdateTaskMutation, useDeleteTaskMutation, useAddCommentMutation } from '@/hooks/use-tasks';
import { useWorkspaceMembersQuery } from '@/hooks/use-workspaces';
import { Task } from '@/services/task-service';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  workspaceId: string | null;
}

export function TaskDetailModal({ isOpen, onClose, task, workspaceId }: TaskDetailModalProps) {
  const { data: members } = useWorkspaceMembersQuery(workspaceId);
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation(workspaceId);
  const addCommentMutation = useAddCommentMutation();

  const [commentContent, setCommentContent] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');

  if (!isOpen || !task) return null;

  // Handlers for immediate dropdown edits
  const handleStatusChange = (newStatus: string) => {
    updateTaskMutation.mutate({
      taskId: task._id,
      updateData: { status: newStatus as any },
    });
  };

  const handlePriorityChange = (newPriority: string) => {
    updateTaskMutation.mutate({
      taskId: task._id,
      updateData: { priority: newPriority as any },
    });
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateTaskMutation.mutate({
      taskId: task._id,
      updateData: { assigneeId: assigneeId === 'unassigned' ? null : assigneeId },
    });
  };

  // Checklist updates
  const handleToggleChecklist = (itemId: string, isCompleted: boolean) => {
    const nextChecklist = task.checklist.map((item) =>
      item._id === itemId ? { ...item, isCompleted } : item
    );
    updateTaskMutation.mutate({
      taskId: task._id,
      updateData: { checklist: nextChecklist },
    });
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;

    const nextChecklist = [...task.checklist, { title: newChecklistItem.trim(), isCompleted: false }];
    updateTaskMutation.mutate(
      {
        taskId: task._id,
        updateData: { checklist: nextChecklist },
      },
      {
        onSuccess: () => setNewChecklistItem(''),
      }
    );
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    addCommentMutation.mutate(
      {
        taskId: task._id,
        content: commentContent.trim(),
      },
      {
        onSuccess: () => setCommentContent(''),
      }
    );
  };

  // Delete Task
  const handleDeleteTask = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(task._id, {
        onSuccess: () => onClose(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-xl h-full bg-zinc-950 border-l border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-muted-foreground font-mono bg-zinc-900 border border-border px-2 py-0.5 rounded">
              TASK-{task._id.slice(-4).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDeleteTask}
              className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete Task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Desc */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white tracking-tight">{task.title}</h2>
            {task.description && (
              <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-border/40">
                {task.description}
              </p>
            )}
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-border bg-zinc-900/20">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full text-xs bg-zinc-900 border border-border rounded-lg p-2 text-white outline-none focus:border-primary"
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="w-full text-xs bg-zinc-900 border border-border rounded-lg p-2 text-white outline-none focus:border-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1 col-span-2">
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">
                Assignee
              </label>
              <select
                value={task.assigneeId?._id || 'unassigned'}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full text-xs bg-zinc-900 border border-border rounded-lg p-2 text-white outline-none focus:border-primary"
              >
                <option value="unassigned">Unassigned</option>
                {members?.map((member) => (
                  <option key={member.userId._id} value={member.userId._id}>
                    {member.userId.name} ({member.userId.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white flex items-center space-x-1.5">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>Checklist</span>
            </h3>
            <div className="space-y-2">
              {task.checklist?.map((item) => (
                <div key={item._id} className="flex items-center space-x-2 text-xs">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={(e) => handleToggleChecklist(item._id!, e.target.checked)}
                    className="h-4 w-4 accent-primary rounded border-zinc-700 bg-zinc-900"
                  />
                  <span className={item.isCompleted ? 'line-through text-muted-foreground' : 'text-zinc-300'}>
                    {item.title}
                  </span>
                </div>
              ))}
              <form onSubmit={handleAddChecklistItem} className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  placeholder="Add a checklist item..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="flex-1 text-xs bg-zinc-900 border border-border rounded-lg px-3 py-1.5 text-white outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-zinc-900 border border-border hover:bg-zinc-800 rounded-lg text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 border-t border-border/60 pt-6">
            <h3 className="text-xs font-semibold text-white flex items-center space-x-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Comments</span>
            </h3>
            
            <div className="space-y-3">
              {task.comments?.map((comment) => (
                <div key={comment._id} className="bg-zinc-900/40 p-3 rounded-lg border border-border/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{comment.userId?.name}</span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-zinc-300">{comment.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 text-xs bg-zinc-900 border border-border rounded-lg px-3 py-2 text-white outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="p-2 bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
