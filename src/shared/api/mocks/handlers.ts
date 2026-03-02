import type { User } from '../../../entities/user/model/types';
import type { Achievement } from '../../../entities/achievement/model/types';
import type { Submission } from '../../../entities/submission/model/types';
import type { LeaderboardEntry } from '../../../entities/leaderboard/model/types';
import type { Direction } from '../../config/api';
import {
  mockUsers,
  mockAchievements,
  mockSubmissions,
  mockLeaderboard,
  MOCK_CURRENT_USER_ID,
  MOCK_JWT_TOKEN,
} from './data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MOCK_DELAY = 500;

// Mutable copies for state changes
let users = [...mockUsers];
let achievements = [...mockAchievements];
let submissions = [...mockSubmissions];

function resetMockState() {
  users = [...mockUsers];
  achievements = [...mockAchievements];
  submissions = [...mockSubmissions];
}

// ─── Auth ───────────────────────────────────────────────────────────
export async function mockLogin(
  email: string,
  _password: string
): Promise<{ token: string; user: User }> {
  await delay(MOCK_DELAY);
  const user = users.find((u) => u.email === email);
  if (!user) {
    throw new Error('Пользователь не найден');
  }
  return { token: MOCK_JWT_TOKEN, user };
}

export async function mockRegister(
  email: string,
  _password: string
): Promise<{ message: string }> {
  await delay(MOCK_DELAY);
  const exists = users.some((u) => u.email === email);
  if (exists) {
    throw new Error('Пользователь с таким email уже существует');
  }
  return { message: 'OTP отправлен на почту' };
}

export async function mockVerifyOtp(
  email: string,
  _otp: string
): Promise<{ token: string; user: User }> {
  await delay(MOCK_DELAY);
  const newUser: User = {
    id: String(users.length + 1),
    email,
    firstName: '',
    lastName: '',
    avatar: null,
    direction: 'ПМИ',
    group: '01',
    role: 'student',
    totalPoints: 0,
  };
  users.push(newUser);
  return { token: MOCK_JWT_TOKEN, user: newUser };
}

export async function mockSetupProfile(
  userId: string,
  data: { firstName: string; lastName: string; direction: Direction; group: string }
): Promise<User> {
  await delay(MOCK_DELAY);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('Пользователь не найден');
  users[idx] = { ...users[idx], ...data };
  return users[idx];
}

// ─── User ───────────────────────────────────────────────────────────
export async function mockGetCurrentUser(): Promise<User> {
  await delay(MOCK_DELAY);
  const user = users.find((u) => u.id === MOCK_CURRENT_USER_ID);
  if (!user) throw new Error('Пользователь не найден');
  return user;
}

export async function mockUpdateAvatar(
  userId: string,
  avatarUri: string
): Promise<User> {
  await delay(MOCK_DELAY);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('Пользователь не найден');
  users[idx] = { ...users[idx], avatar: avatarUri };
  return users[idx];
}

export async function mockGetUsers(): Promise<User[]> {
  await delay(MOCK_DELAY);
  return users;
}

export async function mockSearchUsers(query: string): Promise<User[]> {
  await delay(MOCK_DELAY);
  const q = query.toLowerCase();
  return users.filter(
    (u) =>
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
  );
}

export async function mockUpdateUserRole(
  userId: string,
  role: User['role']
): Promise<User> {
  await delay(MOCK_DELAY);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('Пользователь не найден');
  users[idx] = { ...users[idx], role };
  return users[idx];
}

// ─── Achievements ───────────────────────────────────────────────────
export async function mockGetAchievements(): Promise<Achievement[]> {
  await delay(MOCK_DELAY);
  return achievements;
}

export async function mockCreateAchievement(
  data: Omit<Achievement, 'id'>
): Promise<Achievement> {
  await delay(MOCK_DELAY);
  const newAchievement: Achievement = {
    ...data,
    id: String(achievements.length + 1),
  };
  achievements.push(newAchievement);
  return newAchievement;
}

// ─── Submissions ────────────────────────────────────────────────────
export async function mockGetUserSubmissions(
  userId: string
): Promise<Submission[]> {
  await delay(MOCK_DELAY);
  return submissions.filter((s) => s.userId === userId);
}

export async function mockGetAllSubmissions(): Promise<Submission[]> {
  await delay(MOCK_DELAY);
  return submissions;
}

export async function mockGetGroupSubmissions(
  group: string
): Promise<Submission[]> {
  await delay(MOCK_DELAY);
  const groupUserIds = users
    .filter((u) => u.group === group)
    .map((u) => u.id);
  return submissions.filter((s) => groupUserIds.includes(s.userId));
}

export async function mockCreateSubmission(
  data: Omit<Submission, 'id' | 'status' | 'createdAt'>
): Promise<Submission> {
  await delay(MOCK_DELAY);
  const newSubmission: Submission = {
    ...data,
    id: String(submissions.length + 1),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  submissions.push(newSubmission);
  return newSubmission;
}

export async function mockReviewSubmission(
  submissionId: string,
  status: 'approved' | 'rejected'
): Promise<Submission> {
  await delay(MOCK_DELAY);
  const idx = submissions.findIndex((s) => s.id === submissionId);
  if (idx === -1) throw new Error('Заявка не найдена');
  submissions[idx] = { ...submissions[idx], status };

  // If approved, add points to the user
  if (status === 'approved') {
    const sub = submissions[idx];
    const achievement = achievements.find((a) => a.id === sub.achievementId);
    const userIdx = users.findIndex((u) => u.id === sub.userId);
    if (achievement && userIdx !== -1) {
      users[userIdx] = {
        ...users[userIdx],
        totalPoints: users[userIdx].totalPoints + achievement.points,
      };
    }
  }

  return submissions[idx];
}

// ─── Leaderboard ────────────────────────────────────────────────────
export async function mockGetLeaderboard(filters?: {
  direction?: Direction;
  group?: string;
}): Promise<LeaderboardEntry[]> {
  await delay(MOCK_DELAY);
  let filtered = users;
  if (filters?.direction) {
    filtered = filtered.filter((u) => u.direction === filters.direction);
  }
  if (filters?.group) {
    filtered = filtered.filter((u) => u.group === filters.group);
  }
  return filtered
    .map((u) => ({
      userId: u.id,
      userName: `${u.firstName} ${u.lastName}`,
      direction: u.direction,
      group: u.group,
      totalPoints: u.totalPoints,
      rank: 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

export { resetMockState };

