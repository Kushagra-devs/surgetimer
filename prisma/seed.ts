import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@surgetimer.local' },
    update: {},
    create: {
      name: 'Demo Admin',
      email: 'admin@surgetimer.local',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$demo$demo',
      role: UserRole.SUPER_ADMIN,
    },
  });

  const event = await prisma.event.create({
    data: {
      name: 'Demo Grand Prix',
      venue: 'Surge Arena',
      startDate: new Date('2026-04-02T09:00:00.000Z'),
      endDate: new Date('2026-04-02T18:00:00.000Z'),
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      createdById: admin.id,
    },
  });

  const competitionClass = await prisma.competitionClass.create({
    data: {
      eventId: event.id,
      name: '1.40m Grand Prix',
      code: 'GP140',
      roundType: 'TABLE_A',
      warmupDurationSec: 45,
      maxRoundDurationSec: 300,
      sortOrder: 1,
      status: 'OPEN',
    },
  });

  const rider = await prisma.rider.create({
    data: {
      firstName: 'Aarav',
      lastName: 'Mehta',
      nationality: 'IND',
      club: 'Surge Equestrian Club',
      externalNumber: 'R-001',
    },
  });

  const horse = await prisma.horse.create({
    data: {
      name: 'Silver Comet',
      breed: 'Warmblood',
      age: 10,
      sex: 'Gelding',
      owner: 'Surge Stables',
      stable: 'Barn A',
    },
  });

  const entry = await prisma.competitorEntry.create({
    data: {
      eventId: event.id,
      classId: competitionClass.id,
      riderId: rider.id,
      horseId: horse.id,
      bibNumber: '101',
      startOrder: 1,
      status: 'QUEUED',
    },
  });

  await prisma.queueItem.create({
    data: {
      classId: competitionClass.id,
      competitorEntryId: entry.id,
      position: 1,
      status: 'READY',
    },
  });

  await prisma.overlayTheme.upsert({
    where: { name: 'default' },
    update: {},
    create: {
      name: 'default',
      configJson: {
        background: 'rgba(0,0,0,0.68)',
        foreground: '#f3efe2',
        accent: '#d4a017',
        fontFamily: '"IBM Plex Sans", sans-serif',
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
