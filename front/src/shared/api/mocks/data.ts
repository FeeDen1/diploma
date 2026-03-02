import type { User } from '../../../entities/user/model/types';
import type { Achievement } from '../../../entities/achievement/model/types';
import type { Submission } from '../../../entities/submission/model/types';
import type { LeaderboardEntry } from '../../../entities/leaderboard/model/types';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'st000001@student.spbu.ru',
    firstName: 'Иван',
    lastName: 'Петров',
    avatar: null,
    direction: 'ПМИ',
    group: '01',
    role: 'student',
    totalPoints: 350,
  },
  {
    id: '2',
    email: 'st000002@student.spbu.ru',
    firstName: 'Мария',
    lastName: 'Сидорова',
    avatar: null,
    direction: 'ПМИ',
    group: '02',
    role: 'adapter',
    totalPoints: 420,
  },
  {
    id: '3',
    email: 'st000003@student.spbu.ru',
    firstName: 'Алексей',
    lastName: 'Козлов',
    avatar: null,
    direction: 'ПИИТ',
    group: '11',
    role: 'student',
    totalPoints: 280,
  },
  {
    id: '4',
    email: 'st000004@student.spbu.ru',
    firstName: 'Елена',
    lastName: 'Новикова',
    avatar: null,
    direction: 'БД',
    group: '15',
    role: 'student',
    totalPoints: 510,
  },
  {
    id: '5',
    email: 'st000005@student.spbu.ru',
    firstName: 'Дмитрий',
    lastName: 'Волков',
    avatar: null,
    direction: 'ПКТ',
    group: '14',
    role: 'admin',
    totalPoints: 190,
  },
  {
    id: '6',
    email: 'st000006@student.spbu.ru',
    firstName: 'Анна',
    lastName: 'Морозова',
    avatar: null,
    direction: 'ПМИ',
    group: '03',
    role: 'student',
    totalPoints: 600,
  },
  {
    id: '7',
    email: 'st000007@student.spbu.ru',
    firstName: 'Сергей',
    lastName: 'Лебедев',
    avatar: null,
    direction: 'ПИИТ',
    group: '12',
    role: 'student',
    totalPoints: 445,
  },
  {
    id: '8',
    email: 'st000008@student.spbu.ru',
    firstName: 'Ольга',
    lastName: 'Кузнецова',
    avatar: null,
    direction: 'БД',
    group: '16',
    role: 'student',
    totalPoints: 370,
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Первый шаг',
    description: 'Посетить первую лекцию в университете',
    type: 'Учёба',
    points: 50,
    imageUrl: null,
  },
  {
    id: '2',
    title: 'Спортсмен',
    description: 'Принять участие в спортивном мероприятии факультета',
    type: 'Спорт',
    points: 100,
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Творческая натура',
    description: 'Выступить на творческом вечере или конкурсе',
    type: 'Творчество',
    points: 75,
    imageUrl: null,
  },
  {
    id: '4',
    title: 'Помощник',
    description: 'Принять участие в волонтёрской акции',
    type: 'Волонтёрство',
    points: 80,
    imageUrl: null,
  },
  {
    id: '5',
    title: 'Библиотечный червь',
    description: 'Посетить университетскую библиотеку 5 раз',
    type: 'Учёба',
    points: 60,
    imageUrl: null,
  },
  {
    id: '6',
    title: 'Командный игрок',
    description: 'Принять участие в командной игре (квиз, что-где-когда)',
    type: 'Другое',
    points: 90,
    imageUrl: null,
  },
  {
    id: '7',
    title: 'Марафонец',
    description: 'Пробежать университетский забег',
    type: 'Спорт',
    points: 120,
    imageUrl: null,
  },
  {
    id: '8',
    title: 'Активист',
    description: 'Стать участником студенческого совета',
    type: 'Другое',
    points: 150,
    imageUrl: null,
  },
];

export const mockSubmissions: Submission[] = [
  {
    id: '1',
    achievementId: '1',
    userId: '1',
    photoUri: 'https://picsum.photos/200',
    status: 'pending',
    createdAt: '2026-02-28T10:00:00Z',
  },
  {
    id: '2',
    achievementId: '2',
    userId: '3',
    photoUri: 'https://picsum.photos/201',
    status: 'approved',
    createdAt: '2026-02-27T14:30:00Z',
  },
  {
    id: '3',
    achievementId: '3',
    userId: '1',
    photoUri: 'https://picsum.photos/202',
    status: 'rejected',
    createdAt: '2026-02-26T09:15:00Z',
  },
  {
    id: '4',
    achievementId: '4',
    userId: '4',
    photoUri: 'https://picsum.photos/203',
    status: 'pending',
    createdAt: '2026-03-01T16:00:00Z',
  },
];

export const mockLeaderboard: LeaderboardEntry[] = mockUsers
  .map((user) => ({
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`,
    direction: user.direction,
    group: user.group,
    totalPoints: user.totalPoints,
    rank: 0,
  }))
  .sort((a, b) => b.totalPoints - a.totalPoints)
  .map((entry, index) => ({ ...entry, rank: index + 1 }));

/** The "currently logged in" user for mocking purposes */
export const MOCK_CURRENT_USER_ID = '1';

export const MOCK_JWT_TOKEN = 'mock-jwt-token-for-development';

