// ============================================================================
// SCHOLARIA AUTOMATED AUTHENTICATION, ADMIN RBAC & DEPLOYMENT TEST SUITE
// ============================================================================

const http = require('http');

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Scholaria Auth & Security Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // SCENARIO A: Fresh Visitor Experience & Static Assets
    // ------------------------------------------------------------------------
    console.log('--- SCENARIO A: Fresh Visitor & Public Endpoints ---');
    const homeRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/',
      method: 'GET'
    });
    assert(homeRes.statusCode === 200, 'Public homepage loads with status 200');
    assert(homeRes.data.includes('Scholaria'), 'Homepage content contains Scholaria title');

    // Fresh visitor without token tries /api/auth/me
    const meAnonRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET'
    });
    assert(meAnonRes.statusCode === 401, 'Unauthenticated /api/auth/me returns 401 Unauthorized');

    // Fresh visitor tries /api/admin/overview
    const adminAnonRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/overview',
      method: 'GET'
    });
    assert(adminAnonRes.statusCode === 401, 'Unauthenticated access to /api/admin/overview is blocked (401)');

    // ------------------------------------------------------------------------
    // SCENARIO B: New Student Registration & Role Enforcement
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO B: New Student Account Creation & Forced Student Role ---');
    const testStudentTimestamp = Date.now();
    const studentRegPayload = {
      name: `Test Scholar ${testStudentTimestamp}`,
      username: `student_${testStudentTimestamp}`,
      email: `student_${testStudentTimestamp}@university.edu`,
      password: 'SecurePassword123!',
      role: 'admin', // Malicious attempt to self-promote to admin!
      institution: 'Cambridge University',
      field: 'Philosophy of Science'
    };

    const regRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, studentRegPayload);

    assert(regRes.statusCode === 201, 'Student registration succeeded (201 Created)');
    assert(!!regRes.json?.token, 'Registration issued a valid session bearer token');
    assert(regRes.json?.user?.role === 'student', 'Server strictly forced role: "student" (preventing admin escalation)');

    const studentToken = regRes.json.token;
    const studentUser = regRes.json.user;

    // Student accesses /api/auth/me with their token
    const studentMeRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(studentMeRes.statusCode === 200, 'Student session verified with /api/auth/me');
    assert(studentMeRes.json?.user?.email === studentRegPayload.email, 'Student identity matches registered email');

    // Student tries to access Admin overview with student token
    const studentAdminRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/overview',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(studentAdminRes.statusCode === 403, 'Student access to /api/admin/overview strictly rejected with 403 Forbidden');

    // ------------------------------------------------------------------------
    // SCENARIO C: User Logout & Invalidation
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO C: Session Logout & Token Invalidation ---');
    const logoutRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(logoutRes.statusCode === 200, 'Logout succeeded with 200 OK');

    const studentMeAfterLogout = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(studentMeAfterLogout.statusCode === 401, 'Invalidated token is rejected with 401 Unauthorized');

    // ------------------------------------------------------------------------
    // SCENARIO D: Admin Authentication & Privileges
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO D: Administrator Authentication & Protected Tools ---');
    // Wrong password test
    const wrongAdminRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      identifier: 'evelyn.vance@oxford.edu',
      password: 'WrongPassword!'
    });
    assert(wrongAdminRes.statusCode === 401, 'Admin login with wrong password rejected with 401');

    // Correct password test
    const adminLoginRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      identifier: 'evelyn.vance@oxford.edu',
      password: process.env.ADMIN_PASSWORD || 'Scholaria@Admin2026!'
    });
    assert(adminLoginRes.statusCode === 200, 'Admin login succeeded with correct credentials (200 OK)');
    assert(adminLoginRes.json?.user?.role === 'admin', 'Admin user confirmed with role: "admin"');
    const adminToken = adminLoginRes.json.token;

    // Admin accesses /api/admin/overview
    const adminOverviewRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/overview',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminOverviewRes.statusCode === 200, 'Authorized admin accessed /api/admin/overview successfully (200 OK)');
    assert(typeof adminOverviewRes.json?.stats?.totalUsers === 'number', 'Admin overview returned valid platform statistics');

    // ------------------------------------------------------------------------
    // SCENARIO E: Multi-User Data Isolation
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO E: Multi-User Data Isolation & Interaction ---');
    // Register User A
    const userARes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'User Alpha',
      username: `alpha_${Date.now()}`,
      email: `alpha_${Date.now()}@ox.ac.uk`,
      password: 'AlphaPassword123!'
    });
    const tokenA = userARes.json.token;
    const userA = userARes.json.user;

    // Register User B
    const userBRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'User Beta',
      username: `beta_${Date.now()}`,
      email: `beta_${Date.now()}@mit.edu`,
      password: 'BetaPassword123!'
    });
    const tokenB = userBRes.json.token;
    const userB = userBRes.json.user;

    assert(userA.id !== userB.id, 'User Alpha and User Beta have completely distinct user IDs');

    // User A publishes a post
    const postRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/posts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      }
    }, {
      title: 'Quantum Epistemology Notes',
      content: 'Discussion on quantum measurement and observer theory in modern physics.',
      category: 'article'
    });
    assert(postRes.statusCode === 201, 'User Alpha successfully published an article');
    const postId = postRes.json.post.id;
    assert(postRes.json.post.authorId === userA.id, 'Post authorId correctly attributed to User Alpha');

    // User B likes User A's post
    const likeRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/social/like',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      }
    }, { postId });
    assert(likeRes.statusCode === 200, 'User Beta liked User Alpha post');
    assert(likeRes.json.isLiked === true, 'Like status registered as true');

    // User B tries to delete User A's post (must be rejected)
    const unauthorizedDeleteRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/posts/${postId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(unauthorizedDeleteRes.statusCode === 403, 'User Beta forbidden from deleting User Alpha post (403)');

    // ------------------------------------------------------------------------
    // SCENARIO F: Production & Hosting Readiness
    // ------------------------------------------------------------------------
    console.log('\n--- SCENARIO F: Render & Production Hosting Readiness ---');
    const spaRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/article/any-deep-link-route',
      method: 'GET'
    });
    assert(spaRes.statusCode === 200, 'Deep link SPA routing serves index.html (200 OK)');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
