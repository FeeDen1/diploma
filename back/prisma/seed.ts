import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Direction, PrismaClient } from '../generated/prisma/client';

interface GroupSeed {
  name: string;
  number: string;
  direction: Direction;
}

const ENROLLMENT_YEAR = 2026;
const SHORT_YEAR = String(ENROLLMENT_YEAR % 100).padStart(2, '0');

const NUMBER_TO_DIRECTION: Record<string, Direction> = {
  '01': 'pmi',
  '02': 'pmi',
  '03': 'pmi',
  '04': 'pmi',
  '05': 'pmi',
  '06': 'pmi',
  '07': 'pmi',
  '08': 'pmi',
  '09': 'pmi',
  '10': 'pmi',
  '11': 'piit',
  '12': 'piit',
  '13': 'piit',
  '14': 'pkt',
  '15': 'bd',
  '16': 'bd',
  '17': 'bd',
  '18': 'bd',
  '21': 'piit',
  '24': 'pkt',
};

const GROUPS: GroupSeed[] = Object.entries(NUMBER_TO_DIRECTION).map(
  ([number, direction]) => ({
    name: `${SHORT_YEAR}.Б${number}-ПУ`,
    number,
    direction,
  }),
);

/**
 * Служебная группа «Куратор»: в неё записываются кураторы. Скрыта из
 * пользовательских фильтров и рейтинга (см. HIDDEN_GROUP_NAMES на фронте и
 * исключение в leaderboard.repository), но доступна при регистрации. Лежит на
 * ПМИ — направление роли не играет, т.к. группа всё равно скрыта.
 */
const SERVICE_GROUPS: GroupSeed[] = [
  { name: 'Куратор', number: 'curator', direction: 'pmi' },
];

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    for (const group of [...GROUPS, ...SERVICE_GROUPS]) {
      await prisma.group.upsert({
        where: { name: group.name },
        update: { direction: group.direction, year: ENROLLMENT_YEAR },
        create: {
          name: group.name,
          year: ENROLLMENT_YEAR,
          direction: group.direction,
        },
      });
    }

    const count = await prisma.group.count();
    console.log(`Seed groups completed. Total groups: ${count}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
