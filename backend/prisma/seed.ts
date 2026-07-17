import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create folders
  const personalFolder = await prisma.folder.create({
    data: { name: 'Personal' },
  });

  const workFolder = await prisma.folder.create({
    data: { name: 'Work' },
  });

  // Create tags
  const importantTag = await prisma.tag.create({
    data: { name: 'important' },
  });

  const todoTag = await prisma.tag.create({
    data: { name: 'todo' },
  });

  // Create notes
  await prisma.note.create({
    data: {
      title: 'Welcome to Personal Manager',
      content: '# Welcome!\n\nThis is your first note. You can write in **Markdown**.',
      folderId: personalFolder.id,
      tags: { connect: [{ id: importantTag.id }] },
    },
  });

  await prisma.note.create({
    data: {
      title: 'Shopping List',
      content: '- Milk\n- Eggs\n- Bread\n- Butter',
      folderId: personalFolder.id,
      tags: { connect: [{ id: todoTag.id }] },
    },
  });

  // Create sample bills
  await prisma.bill.create({
    data: {
      vendor: 'Electric Company',
      amount: 125.50,
      currency: 'EUR',
      dueDate: new Date('2026-08-01'),
      category: 'utilities',
      source: 'gmail',
      isPaid: false,
    },
  });

  await prisma.bill.create({
    data: {
      vendor: 'Internet Provider',
      amount: 49.99,
      currency: 'EUR',
      dueDate: new Date('2026-07-25'),
      category: 'utilities',
      source: 'drive',
      isPaid: true,
    },
  });

  // Create sample calendar events
  await prisma.calendarEvent.create({
    data: {
      googleEventId: 'sample-event-1',
      title: 'Team Meeting',
      startTime: new Date('2026-07-20T10:00:00Z'),
      endTime: new Date('2026-07-20T11:00:00Z'),
      location: 'Conference Room A',
    },
  });

  // Create user settings
  await prisma.userSetting.create({
    data: {
      key: 'google_drive_folder_id',
      value: '',
    },
  });

  await prisma.userSetting.create({
    data: {
      key: 'gmail_filter_rules',
      value: JSON.stringify({
        senderContains: ['billing', 'invoice'],
        subjectContains: ['bill', 'invoice', 'payment'],
        hasAttachment: true,
      }),
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
