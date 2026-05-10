import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeys } from '@shared/api';
import { filesApi } from '@shared/api/files';
import {
  submissionsApi,
  type SubmissionStatus,
} from '@shared/api/submissions';
import { toMySubmissionDomain, toSubmissionDomain } from './mappers';
import type { MySubmission, Submission } from './types';

export function useMySubmissions(enabled = true): UseQueryResult<MySubmission[]> {
  return useQuery({
    queryKey: queryKeys.submissions.my,
    queryFn: submissionsApi.getMy,
    select: (dtos) => dtos.map(toMySubmissionDomain),
    enabled,
  });
}

export function useSubmissionsByStudent(
  studentId: string | undefined,
): UseQueryResult<Submission[]> {
  return useQuery({
    queryKey: studentId
      ? (['submissions', 'student', studentId] as const)
      : (['submissions', 'noop-student'] as const),
    queryFn: () => submissionsApi.getByStudent(studentId as string),
    select: (dtos) => dtos.map(toSubmissionDomain),
    enabled: !!studentId,
  });
}

export function useSubmissionsByTask(
  taskId: string | undefined,
): UseQueryResult<Submission[]> {
  return useQuery({
    queryKey: taskId ? queryKeys.submissions.byTask(taskId) : ['submissions', 'noop'],
    queryFn: () => submissionsApi.getByTask(taskId as string),
    select: (dtos) => dtos.map(toSubmissionDomain),
    enabled: !!taskId,
  });
}

export function useSubmission(id: string | undefined): UseQueryResult<Submission> {
  return useQuery({
    queryKey: id ? queryKeys.submissions.byId(id) : ['submissions', 'noop-single'],
    queryFn: () => submissionsApi.getById(id as string),
    select: toSubmissionDomain,
    enabled: !!id,
  });
}

interface CreateSubmissionInput {
  taskId: string;
  fileUri: string;
  fileName?: string;
  mimeType?: string;
}

/**
 * Композитный хук: ресабмит — загружаем новое фото и патчим существующую сдачу.
 */
export function useReplaceMySubmissionFile(): UseMutationResult<
  Submission,
  unknown,
  { id: string; fileUri: string; fileName?: string; mimeType?: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileUri, fileName, mimeType }) => {
      const inferredName = fileName ?? fileUri.split('/').pop() ?? 'upload.jpg';
      const inferredMime = mimeType ?? guessMimeFromName(inferredName);
      const file = await filesApi.upload({
        uri: fileUri,
        name: inferredName,
        mimeType: inferredMime,
        type: 'submission',
      });
      const dto = await submissionsApi.update(id, {
        submissionFileId: file.id,
      });
      return toSubmissionDomain(dto);
    },
    onSuccess: (submission) => {
      qc.invalidateQueries({ queryKey: queryKeys.submissions.my });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
      // Адаптерская сторона: список сабмитов студента и счётчики групп
      qc.invalidateQueries({
        queryKey: ['submissions', 'student', submission.studentId],
      });
      qc.invalidateQueries({
        queryKey: queryKeys.submissions.byTask(submission.taskId),
      });
      qc.invalidateQueries({
        queryKey: queryKeys.submissions.byId(submission.id),
      });
      qc.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'groups' &&
          query.queryKey[2] === 'students-progress',
      });
      // Если бывший статус был approved — баллы списались, лидерборд тоже
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

/**
 * Композитный хук: сначала загружает файл-доказательство в S3 как submission,
 * затем создаёт сабмит с полученным fileId.
 */
export function useCreateSubmission(): UseMutationResult<
  Submission,
  unknown,
  CreateSubmissionInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, fileUri, fileName, mimeType }) => {
      const inferredName = fileName ?? fileUri.split('/').pop() ?? 'upload.jpg';
      const inferredMime = mimeType ?? guessMimeFromName(inferredName);

      const file = await filesApi.upload({
        uri: fileUri,
        name: inferredName,
        mimeType: inferredMime,
        type: 'submission',
      });

      const dto = await submissionsApi.create({
        taskId,
        submissionFileId: file.id,
      });
      return toSubmissionDomain(dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.submissions.my });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

export function useDeleteMySubmission(): UseMutationResult<void, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submissionsApi.deleteMine(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.submissions.my });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all });
      // Адаптерские списки тоже могли отображать эту сдачу
      qc.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'submissions' &&
          (query.queryKey[1] === 'student' || query.queryKey[1] === 'task'),
      });
      qc.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'groups' &&
          query.queryKey[2] === 'students-progress',
      });
      // Если удаляемая сдача была в статусе approved, бэк откатывает
      // ratingTotal — обновляем баланс и лидерборд.
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export function useChangeSubmissionStatus(): UseMutationResult<
  Submission,
  unknown,
  { id: string; status: SubmissionStatus }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) =>
      submissionsApi.changeStatus(id, { status }).then(toSubmissionDomain),
    onSuccess: (submission) => {
      qc.invalidateQueries({
        queryKey: queryKeys.submissions.byTask(submission.taskId),
      });
      qc.invalidateQueries({
        queryKey: ['submissions', 'student', submission.studentId],
      });
      qc.invalidateQueries({ queryKey: queryKeys.submissions.byId(submission.id) });
      // У студента в /my тоже статус поменялся
      qc.invalidateQueries({ queryKey: queryKeys.submissions.my });
      // Счётчики прогресса всех групп — мы не знаем, в какой группе студент,
      // поэтому инвалидируем все запросы students-progress.
      qc.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey[0] === 'groups' &&
          query.queryKey[2] === 'students-progress',
      });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      // Approve/reject меняет ratingTotal автора сабмита. На бэке это атомарная
      // операция; на фронте мы не знаем, чей баланс отображается в текущей
      // сессии (одобряющий админ или оцениваемый студент могут совпасть, если
      // юзер тестит как оба). Поэтому всегда инвалидируем auth.me — на проде
      // это no-op (304 от бэка благодаря ETag), а в dev-сценарии «один юзер»
      // заставляет профиль и магазин обновить отображаемый баланс.
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

function guessMimeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'pdf':
      return 'application/pdf';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}
