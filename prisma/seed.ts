// Seed file for Paid - Bill Splitting Application
import { PrismaClient, SessionStatus, ParticipantRole, ObligationStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log('🌱 Starting seed for Paid bill-splitting app...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.paymentProof.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.obligation.deleteMany();
  await prisma.faceConfirmation.deleteMany();
  await prisma.faceMatchSuggestion.deleteMany();
  await prisma.detectedFace.deleteMany();
  await prisma.expenseItem.deleteMany();
  await prisma.sessionParticipant.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.session.deleteMany();
  await prisma.playerFaceEmbedding.deleteMany();
  await prisma.magicLinkToken.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();

  // =====================================
  // Create Users (Hosts)
  // =====================================
  console.log('👤 Creating users...');

  const felly = await prisma.user.create({
    data: {
      email: 'felly@example.com',
      passwordHash: await hashPassword('password123'),
      name: 'Felly',
      phone: '+62811111111',
    },
  });

  const james = await prisma.user.create({
    data: {
      email: 'james@example.com',
      passwordHash: await hashPassword('password123'),
      name: 'James',
      phone: '+62822222222',
    },
  });

  // =====================================
  // Create Players
  // =====================================
  console.log('🎮 Creating players...');

  // Host players (linked to users)
  const fellyPlayer = await prisma.player.create({
    data: {
      userId: felly.id,
      email: felly.email,
      name: felly.name,
      phone: felly.phone,
    },
  });

  const jamesPlayer = await prisma.player.create({
    data: {
      userId: james.id,
      email: james.email,
      name: james.name,
      phone: james.phone,
    },
  });

  // Other players (not linked to users)
  const jessica = await prisma.player.create({
    data: {
      email: 'jessica@example.com',
      name: 'Jessica',
      phone: '+62833333333',
    },
  });

  const michael = await prisma.player.create({
    data: {
      email: 'michael@example.com',
      name: 'Michael',
      phone: '+62844444444',
    },
  });

  const sarah = await prisma.player.create({
    data: {
      name: 'Sarah', // No email
      phone: '+62855555555',
    },
  });

  const david = await prisma.player.create({
    data: {
      name: 'David', // No email
    },
  });

  // =====================================
  // Create Session 1: Completed Session
  // =====================================
  console.log('📅 Creating Session 1 (Closed)...');

  const session1 = await prisma.session.create({
    data: {
      hostId: felly.id,
      name: 'Badminton Pemogan',
      description: 'Sunday morning badminton session',
      status: SessionStatus.CLOSED,
      sessionDate: new Date('2025-07-20T08:00:00Z'),
      totalAmount: new Decimal(135000),
    },
  });

  // Add participants
  await prisma.sessionParticipant.createMany({
    data: [
      { sessionId: session1.id, playerId: fellyPlayer.id, role: ParticipantRole.HOST },
      { sessionId: session1.id, playerId: jessica.id, role: ParticipantRole.PLAYER },
      { sessionId: session1.id, playerId: michael.id, role: ParticipantRole.PLAYER },
      { sessionId: session1.id, playerId: sarah.id, role: ParticipantRole.PLAYER },
      { sessionId: session1.id, playerId: david.id, role: ParticipantRole.PLAYER },
    ],
  });

  // Add expenses
  await prisma.expenseItem.createMany({
    data: [
      { sessionId: session1.id, description: 'Court Rental', amount: new Decimal(60000), quantity: 2 },
      { sessionId: session1.id, description: 'Shuttlecock', amount: new Decimal(15000), quantity: 1 },
    ],
  });

  // Create obligations (all verified)
  const perPerson1 = 27000;
  const obligations1 = await Promise.all([
    prisma.obligation.create({
      data: {
        sessionId: session1.id,
        payerId: jessica.id,
        payeeId: fellyPlayer.id,
        amount: new Decimal(perPerson1),
        status: ObligationStatus.VERIFIED,
        idempotencyKey: `${session1.id}:${jessica.id}`,
      },
    }),
    prisma.obligation.create({
      data: {
        sessionId: session1.id,
        payerId: michael.id,
        payeeId: fellyPlayer.id,
        amount: new Decimal(perPerson1),
        status: ObligationStatus.VERIFIED,
        idempotencyKey: `${session1.id}:${michael.id}`,
      },
    }),
    prisma.obligation.create({
      data: {
        sessionId: session1.id,
        payerId: sarah.id,
        payeeId: fellyPlayer.id,
        amount: new Decimal(perPerson1),
        status: ObligationStatus.VERIFIED,
        idempotencyKey: `${session1.id}:${sarah.id}`,
      },
    }),
    prisma.obligation.create({
      data: {
        sessionId: session1.id,
        payerId: david.id,
        payeeId: fellyPlayer.id,
        amount: new Decimal(perPerson1),
        status: ObligationStatus.VERIFIED,
        idempotencyKey: `${session1.id}:${david.id}`,
      },
    }),
  ]);

  // Create payments for verified obligations
  for (const obligation of obligations1) {
    await prisma.payment.create({
      data: {
        obligationId: obligation.id,
        method: PaymentMethod.TRANSFER,
        amount: obligation.amount,
        referenceNumber: `TRX${Date.now()}`,
      },
    });
  }

  // =====================================
  // Create Session 2: Active Session (Split Confirmed)
  // =====================================
  console.log('📅 Creating Session 2 (Split Confirmed)...');

  const session2 = await prisma.session.create({
    data: {
      hostId: felly.id,
      name: 'Badminton GOR Tabanan',
      description: 'Weekly Wednesday session',
      status: SessionStatus.SPLIT_CONFIRMED,
      sessionDate: new Date('2025-07-23T17:00:00Z'),
      totalAmount: new Decimal(200000),
    },
  });

  // Add participants
  await prisma.sessionParticipant.createMany({
    data: [
      { sessionId: session2.id, playerId: fellyPlayer.id, role: ParticipantRole.HOST },
      { sessionId: session2.id, playerId: jamesPlayer.id, role: ParticipantRole.PLAYER },
      { sessionId: session2.id, playerId: jessica.id, role: ParticipantRole.PLAYER },
      { sessionId: session2.id, playerId: michael.id, role: ParticipantRole.PLAYER },
    ],
  });

  // Add expenses
  await prisma.expenseItem.createMany({
    data: [
      { sessionId: session2.id, description: 'Court Rental', amount: new Decimal(80000), quantity: 2 },
      { sessionId: session2.id, description: 'Shuttlecock', amount: new Decimal(20000), quantity: 2 },
    ],
  });

  // Create obligations (mixed statuses)
  const perPerson2 = 50000;
  await prisma.obligation.create({
    data: {
      sessionId: session2.id,
      payerId: jamesPlayer.id,
      payeeId: fellyPlayer.id,
      amount: new Decimal(perPerson2),
      status: ObligationStatus.VERIFIED, // James already paid
      idempotencyKey: `${session2.id}:${jamesPlayer.id}`,
    },
  });

  await prisma.obligation.create({
    data: {
      sessionId: session2.id,
      payerId: jessica.id,
      payeeId: fellyPlayer.id,
      amount: new Decimal(perPerson2),
      status: ObligationStatus.MARKED_PAID, // Jessica marked paid, awaiting verification
      idempotencyKey: `${session2.id}:${jessica.id}`,
    },
  });

  await prisma.obligation.create({
    data: {
      sessionId: session2.id,
      payerId: michael.id,
      payeeId: fellyPlayer.id,
      amount: new Decimal(perPerson2),
      status: ObligationStatus.PENDING, // Michael hasn't paid
      idempotencyKey: `${session2.id}:${michael.id}`,
    },
  });

  // =====================================
  // Create Session 3: Draft Session
  // =====================================
  console.log('📅 Creating Session 3 (Draft)...');

  const session3 = await prisma.session.create({
    data: {
      hostId: james.id,
      name: 'Dinner at Restaurant',
      description: 'Team dinner after badminton',
      status: SessionStatus.DRAFT,
      sessionDate: new Date('2025-07-26T19:00:00Z'),
    },
  });

  // Add participants
  await prisma.sessionParticipant.createMany({
    data: [
      { sessionId: session3.id, playerId: jamesPlayer.id, role: ParticipantRole.HOST },
      { sessionId: session3.id, playerId: fellyPlayer.id, role: ParticipantRole.PLAYER },
      { sessionId: session3.id, playerId: jessica.id, role: ParticipantRole.PLAYER },
    ],
  });

  // Add some expenses
  await prisma.expenseItem.createMany({
    data: [
      { sessionId: session3.id, description: 'Food', amount: new Decimal(150000), quantity: 1 },
      { sessionId: session3.id, description: 'Drinks', amount: new Decimal(75000), quantity: 1 },
    ],
  });

  // =====================================
  // Summary
  // =====================================
  console.log('');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Users: 2 (felly@example.com, james@example.com)`);
  console.log(`   Players: 6`);
  console.log(`   Sessions: 3`);
  console.log(`     - Session 1: CLOSED (all payments verified)`);
  console.log(`     - Session 2: SPLIT_CONFIRMED (mixed payment statuses)`);
  console.log(`     - Session 3: DRAFT (no obligations yet)`);
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('   Email: felly@example.com');
  console.log('   Password: password123');
  console.log('   ---');
  console.log('   Email: james@example.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });