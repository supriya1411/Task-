/**
 * TaskFlow Automated Test Suite (Tasks 1–8 Verification)
 */

import { AuthService } from '../services/authService.ts';
import { TaskService } from '../services/taskService.ts';
import { WeatherService } from '../services/weatherService.ts';
import { cacheService } from '../services/cacheService.ts';
import { TaskQueueService } from '../jobs/taskQueue.ts';

async function runTests() {
  console.log('🧪 Starting TaskFlow Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: User Registration with bcrypt and JWT (Task 1 & Task 6)
    const testEmail = `test_${Date.now()}@taskflow.dev`;
    const regResult = await AuthService.register({
      name: 'Test Engineer',
      email: testEmail,
      password: 'Password123!',
      phone: '+1 555-0100',
    });
    assert(Boolean(regResult.token && regResult.user.id), 'Task 1 & 6: Registration creates user with JWT token');

    // Test 2: Login authentication (Task 6)
    const loginResult = await AuthService.login({
      email: testEmail,
      password: 'Password123!',
    });
    assert(loginResult.user.email === testEmail, 'Task 6: Login succeeds with correct credentials');

    // Test 3: JWT Verification (Task 6)
    const payload = AuthService.verifyToken(loginResult.token);
    assert(payload.userId === regResult.user.id, 'Task 6: JWT verifies payload matches user ID');

    // Test 4: Task Creation (Task 5 & Task 8 Cache Invalidation)
    const userId = regResult.user.id;
    const task = await TaskService.createTask(
      {
        title: 'Automated Test Task 1',
        description: 'Verify task creation and caching logic',
        priority: 'High',
        status: 'Pending',
        category: 'Work',
      },
      userId
    );
    assert(task && task.title === 'Automated Test Task 1', 'Task 5: Task created with valid ID');

    // Test 5: Cache-Aside Task Query (Task 8)
    const firstQuery = await TaskService.getTasksForUser(userId);
    assert(firstQuery.fromCache === false, 'Task 8: First query queries database (Cache MISS)');

    const secondQuery = await TaskService.getTasksForUser(userId);
    assert(secondQuery.fromCache === true, 'Task 8: Subsequent query returns from Redis Cache (Cache HIT)');

    // Test 6: Task Update and Cache Invalidation (Task 5 & Task 8)
    await TaskService.updateTask(task._id, { status: 'Completed' }, userId);
    const afterUpdateQuery = await TaskService.getTasksForUser(userId);
    assert(afterUpdateQuery.fromCache === false, 'Task 8: Cache invalidated on update (next query is MISS)');

    // Test 7: Weather Service with Fallback / Timeout Guard (Task 7)
    const weather = await WeatherService.getWeatherByCity('London');
    assert(typeof weather.temperature === 'number' && weather.city.length > 0, 'Task 7: Weather API returns structured meteorological metrics');

    // Test 8: Background Job Processing (Task 8)
    const job = await TaskQueueService.addJob('GENERATE_SUMMARY_REPORT', userId, {
      tasks: [task],
      userName: 'Test Engineer',
    });
    assert(job && job.id.startsWith('job_'), 'Task 8: BullMQ / Async background job queued');

    // Summary
    console.log('\n========================================');
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  }
}

runTests();
