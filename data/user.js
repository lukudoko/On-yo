const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const testUser = await prisma.user.create({
      data: {
        id: 'test-user-12345', // Your placeholder hashed user ID
        // email and name are optional based on your schema
      }
    });
    
    console.log('Test user created:', testUser.id);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Test user already exists');
    } else {
      console.error('Error creating test user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();