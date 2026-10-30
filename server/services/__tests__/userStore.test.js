import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { userStore } from '../userStore.js';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from '../../config/seedDemoUser.js';

describe('userStore - Universal Registration, Login & Demo Access', () => {
  it('loads the pre-configured demo user with rich telemetry', async () => {
    const demoUser = await userStore.getDemoUser();
    expect(demoUser).toBeDefined();
    expect(demoUser.email).toBe(DEMO_USER_EMAIL.toLowerCase());
    expect(demoUser.inputs).toBeDefined();
    expect(demoUser.xp).toBeGreaterThan(0);
    expect(demoUser.badges.length).toBeGreaterThan(0);
  });

  it('allows any new user in the world to register an account', async () => {
    const testEmail = `newuser_${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('Secret123!', 10);

    const newUser = await userStore.createUser({
      name: 'Global Explorer',
      email: testEmail,
      password: hashedPassword,
      isNewUser: true
    });

    expect(newUser).toBeDefined();
    expect(newUser.email).toBe(testEmail.toLowerCase());
    expect(newUser.name).toBe('Global Explorer');

    // Retrieve by email
    const fetched = await userStore.findByEmail(testEmail);
    expect(fetched).toBeDefined();
    expect(fetched.email).toBe(testEmail.toLowerCase());

    // Password verification works
    const isMatch = await bcrypt.compare('Secret123!', fetched.password);
    expect(isMatch).toBe(true);
  });

  it('allows registered users to fetch and update their profile', async () => {
    const testEmail = `profileuser_${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash('Secret123!', 10);

    const newUser = await userStore.createUser({
      name: 'Profile Tester',
      email: testEmail,
      password: hashedPassword,
      isNewUser: true
    });

    const userId = newUser._id || newUser.id;

    // Update profile
    const updated = await userStore.updateUser(userId, {
      xp: 150,
      inputs: { commuteDistance: 15, transportType: 'ev' }
    });

    expect(updated).toBeDefined();
    expect(updated.xp).toBe(150);
    expect(updated.inputs.commuteDistance).toBe(15);

    // Fetch by ID
    const fetched = await userStore.findById(userId);
    expect(fetched).toBeDefined();
    expect(fetched.xp).toBe(150);
  });
});

