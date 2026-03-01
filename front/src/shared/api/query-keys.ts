// Централизованные ключи TanStack Query.
// Используются во всех entities/<entity>/api.ts.

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    byId: (id: string) => ['users', id] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: (filters?: { direction?: string }) => ['groups', filters ?? {}] as const,
    byId: (id: string) => ['groups', id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    byId: (id: string) => ['tasks', id] as const,
  },
  submissions: {
    my: ['submissions', 'my'] as const,
    byTask: (taskId: string) => ['submissions', 'task', taskId] as const,
    byId: (id: string) => ['submissions', id] as const,
  },
  leaderboard: {
    list: (filters: { direction?: string; groupId?: string; limit?: number; offset?: number }) =>
      ['leaderboard', filters] as const,
  },
  rewards: {
    all: ['rewards'] as const,
    myOrders: ['rewards', 'my-orders'] as const,
  },
};
