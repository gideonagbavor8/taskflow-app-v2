import { z } from 'zod'

export const taskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE'])
export const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH'])

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional().default(''),
  status: taskStatusEnum.optional().default('TODO'),
  priority: taskPriorityEnum.optional().default('MEDIUM'),
  dueDate: z.string().optional().nullable(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: z.string().optional().nullable(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

