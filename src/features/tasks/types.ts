import { Member } from "@/features/members/types";
import { Project } from "@/features/projects/types";

export enum TaskStatus {
  TODO = "TODO",
  DONE = "DONE",
  BACKLOG = "BACKLOG",
  IN_REVIEW = "IN_REVIEW",
  IN_PROGRESS = "IN_PROGRESS",
}

export type Task = {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  dueDate: string;
  position: number;
  projectId: string;
  assigneeId: string;
  workspaceId: string;
  status: TaskStatus;
  description: string;
  project: Project;
  assignee: Member;
};
