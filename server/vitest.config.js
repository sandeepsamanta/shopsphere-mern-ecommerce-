import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    hookTimeout: 120000,
    testTimeout: 30000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-test-secret-test-secret-123',
      RAZORPAY_KEY_ID: 'rzp_test_dummy',
      RAZORPAY_KEY_SECRET: 'dummy_secret',
    },
  },
});
