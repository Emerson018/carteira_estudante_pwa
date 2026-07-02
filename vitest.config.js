import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.js', 'tests/**/*.property.test.js'],
    coverage: {
      provider: 'v8',
      include: ['js/**/*.js'],
      exclude: ['js/app.js'],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage'
    }
  }
});
