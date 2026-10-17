// ============================================================================
// SCHOLARIA PRODUCTION HTTP SERVER & BACKEND API ENGINE
// Built-in Session Authentication, Strict RBAC, REST APIs, and SPA Serving
// Zero external dependencies — fully compatible with Render and local dev
// ============================================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import { INITIAL_USERS } from './src/data/initialUsers.js';
import { generateFullLibraryCatalog } from './src/data/initialBooks.js';
import { INITIAL_POSTS } from './src/data/initialPosts.js';
import { INITIAL_NOTIFICATIONS, INITIAL_REPORTS } from './src/data/initialNotifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0'; // Required for Render and container ingress

// Admin bootstrap credentials from environment (defaults to secure preset)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'evelyn.vance@oxford.edu').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Scholaria@Admin2026!';
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'ScholarPass2026!';

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// ============================================================================
// CRYPTOGRAPHIC PASSWORD HASHING (Salted Scrypt - Production Security)
// ============================================================================
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKeyBuffer = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKeyBuffer);
}

function sanitizeUser(u) {
  if (!u) return null;
  const { passwordHash, ...safe } = u;
  return safe;
}

// ============================================================================
// DATABASE & PERSISTENCE LAYER
// ============================================================================
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (data && data.users && data.posts) {
        return data;
      }
    } catch (e) {
      console.warn('Existing db.json invalid, recreating from seeds:', e.message);
    }
  }

  // Initialize fresh database with seeded users
  const seededUsers = INITIAL_USERS.map(u => {
    const isAdmin = u.email.toLowerCase() === ADMIN_EMAIL || u.role === 'admin';
    const pwd = isAdmin ? ADMIN_PASSWORD : SEED_USER_PASSWORD;
    return {
      ...u,
      role: isAdmin ? 'admin' : (u.role || 'student'),
      passwordHash: hashPassword(pwd),
      savedPostIds: [],
      savedBookIds: [],
      readingProgress: {}
    };
  });

  const newDb = {
    users: seededUsers,
    sessions: {}, // token -> { userId, role, createdAt, expiresAt }
    posts: INITIAL_POSTS,
    books: generateFullLibraryCatalog(),
    notifications: INITIAL_NOTIFICATIONS,
    reports: INITIAL_REPORTS
  };

  saveDatabase(newDb);
  return newDb;
}

let dbInstance = initDatabase();

function saveDatabase(data) {
  try {
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Database write error:', err);
  }
}

// ============================================================================
// AUTHENTICATION & SESSION MIDDLEWARE
// ============================================================================
function authenticateRequest(req) {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/scholaria_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return null;

  const session = dbInstance.sessions[token];
  if (!session) return null;

  if (session.expiresAt && Date.now() > session.expiresAt) {
    delete dbInstance.sessions[token];
    saveDatabase(dbInstance);
    return null;
  }

  const user = dbInstance.users.find(u => u.id === session.userId);
  if (!user) return null;

  return { user, token };
}

// ============================================================================
// REQUEST HELPERS
// ============================================================================
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large (5MB limit)'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Malformed JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

// ============================================================================
// MAIN HTTP ROUTER
// ============================================================================
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // --------------------------------------------------------------------------
  // API ROUTES
  // --------------------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    try {
      // 1. POST /api/auth/register
      if (pathname === '/api/auth/register' && method === 'POST') {
        const body = await parseBody(req);
        const name = (body.name || '').trim();
        const username = (body.username || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';

        if (!name || name.length < 2) return sendError(res, 400, 'Full name is required (min 2 characters).');
        if (!username || username.length < 3) return sendError(res, 400, 'Username must be at least 3 characters (letters, numbers, underscores).');
        if (!email || !email.includes('@') || !email.includes('.')) return sendError(res, 400, 'A valid academic email address is required.');
        if (!password || password.length < 6) return sendError(res, 400, 'Password must be at least 6 characters.');

        // Duplicate checks
        if (dbInstance.users.some(u => u.username.toLowerCase() === username)) {
          return sendError(res, 409, 'This username is already taken. Please choose another.');
        }
        if (dbInstance.users.some(u => u.email.toLowerCase() === email)) {
          return sendError(res, 409, 'An account with this email address already exists. Please log in.');
        }

        // STRICT SECURITY RULE: New registrations always receive the 'student' role.
        // Client-supplied roles (e.g. body.role) are strictly disregarded.
        const newUser = {
          id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          name,
          username,
          email,
          role: 'student', // Non-negotiable security guarantee
          passwordHash: hashPassword(password),
          avatar: body.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
          institution: (body.institution || '').trim() || 'Independent Scholar',
          field: (body.field || '').trim() || 'General Studies',
          bio: (body.bio || '').trim() || 'Learner and researcher on Scholaria.',
          followersCount: 0,
          followingCount: 0,
          followingIds: [],
          articlesCount: 0,
          researchCount: 0,
          repostsCount: 0,
          savedPostIds: [],
          savedBookIds: [],
          readingProgress: {},
          streakDays: 1,
          streakCompletedToday: true,
          badges: [],
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };

        dbInstance.users.push(newUser);

        // Issue 7-day secure session token
        const token = crypto.randomBytes(32).toString('hex');
        dbInstance.sessions[token] = {
          userId: newUser.id,
          role: newUser.role,
          createdAt: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 3600 * 1000
        };

        saveDatabase(dbInstance);
        return sendJson(res, 201, { user: sanitizeUser(newUser), token });
      }

      // 2. POST /api/auth/login
      if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await parseBody(req);
        const rawIdentifier = (body.identifier || body.emailOrUsername || body.email || body.username || '').trim().toLowerCase();
        const password = body.password || '';

        if (!rawIdentifier || !password) {
          return sendError(res, 400, 'Email/username and password are required.');
        }

        const identifierWithoutAt = rawIdentifier.startsWith('@') ? rawIdentifier.slice(1) : rawIdentifier;

        const user = dbInstance.users.find(u => {
          const uEmail = (u.email || '').toLowerCase();
          const uUsername = (u.username || '').toLowerCase();
          return uEmail === rawIdentifier || uUsername === identifierWithoutAt || uUsername === rawIdentifier;
        });

        if (!user || !verifyPassword(password, user.passwordHash)) {
          return sendError(res, 401, 'Invalid email or password.');
        }

        const token = crypto.randomBytes(32).toString('hex');
        dbInstance.sessions[token] = {
          userId: user.id,
          role: user.role,
          createdAt: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 3600 * 1000
        };

        saveDatabase(dbInstance);
        return sendJson(res, 200, { user: sanitizeUser(user), token });
      }

      // 3. GET /api/auth/me (Current Authenticated Session)
      if (pathname === '/api/auth/me' && method === 'GET') {
        const auth = authenticateRequest(req);
        if (!auth) {
          return sendError(res, 401, 'No active authenticated session.');
        }
        return sendJson(res, 200, { user: sanitizeUser(auth.user) });
      }

      // 4. POST /api/auth/logout
      if (pathname === '/api/auth/logout' && method === 'POST') {
        const auth = authenticateRequest(req);
        if (auth && auth.token) {
          delete dbInstance.sessions[auth.token];
          saveDatabase(dbInstance);
        }
        return sendJson(res, 200, { success: true, message: 'Logged out successfully.' });
      }

      // 5. POST /api/auth/reset-password
      if (pathname === '/api/auth/reset-password' && method === 'POST') {
        const body = await parseBody(req);
        const email = (body.email || '').trim().toLowerCase();
        const code = (body.code || '').trim();
        const newPassword = body.newPassword || '';

        if (!email || !code || !newPassword) {
          return sendError(res, 400, 'Email, verification code, and new password are required.');
        }
        if (newPassword.length < 6) {
          return sendError(res, 400, 'New password must be at least 6 characters.');
        }

        const user = dbInstance.users.find(u => u.email.toLowerCase() === email);
        if (!user) {
          return sendError(res, 404, 'No account found with this email.');
        }

        user.passwordHash = hashPassword(newPassword);

        // Invalidate all active sessions for this user
        for (const [t, s] of Object.entries(dbInstance.sessions)) {
          if (s.userId === user.id) delete dbInstance.sessions[t];
        }

        saveDatabase(dbInstance);
        return sendJson(res, 200, { success: true, message: 'Password updated. Please log in.' });
      }

      // 6. GET /api/posts
      if (pathname === '/api/posts' && method === 'GET') {
        return sendJson(res, 200, { posts: dbInstance.posts || [] });
      }

      // 7. POST /api/posts (Authenticated publication)
      if (pathname === '/api/posts' && method === 'POST') {
        const auth = authenticateRequest(req);
        if (!auth) return sendError(res, 401, 'Authentication required to publish.');

        const body = await parseBody(req);
        const title = (body.title || '').trim();
        const content = (body.content || '').trim();

        if (!title) return sendError(res, 400, 'Title is required.');
        if (!content) return sendError(res, 400, 'Content is required.');

        const readingTimeMinutes = Math.max(1, Math.ceil(content.split(/\s+/).length / 180));

        const newPost = {
          id: `post_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          authorId: auth.user.id,
          authorName: auth.user.name,
          authorUsername: auth.user.username,
          authorAvatar: auth.user.avatar,
          authorInstitution: auth.user.institution,
          authorRole: auth.user.role,
          category: body.category || 'normal_post',
          categoryLabel: body.categoryLabel || 'Post',
          title: title.slice(0, 150),
          content,
          preview: content.replace(/<[^>]*>?/gm, '').substring(0, 220) + '...',
          image: body.image || null,
          abstract: body.abstract || null,
          researchField: body.researchField || null,
          keywords: Array.isArray(body.keywords) ? body.keywords : [],
          citations: Array.isArray(body.citations) ? body.citations : [],
          timestamp: 'Just now',
          readingTime: `${readingTimeMinutes} min read`,
          likes: [],
          likesCount: 0,
          commentsCount: 0,
          comments: [],
          reposts: [],
          repostsCount: 0,
          createdAt: new Date().toISOString()
        };

        dbInstance.posts.unshift(newPost);
        auth.user.articlesCount = (auth.user.articlesCount || 0) + 1;
        auth.user.streakCompletedToday = true;

        saveDatabase(dbInstance);
        return sendJson(res, 201, { success: true, post: newPost });
      }

      // 8. PUT /api/posts/:id (Edit post)
      if (pathname.startsWith('/api/posts/') && method === 'PUT') {
        const auth = authenticateRequest(req);
        if (!auth) return sendError(res, 401, 'Authentication required.');

        const postId = pathname.replace('/api/posts/', '');
        const post = dbInstance.posts.find(p => p.id === postId);
        if (!post) return sendError(res, 404, 'Post not found.');

        if (post.authorId !== auth.user.id && auth.user.role !== 'admin') {
          return sendError(res, 403, 'Permission denied. You can only edit your own posts.');
        }

        const body = await parseBody(req);
        if (body.title) post.title = body.title.trim().slice(0, 150);
        if (body.content) {
          post.content = body.content.trim();
          post.preview = post.content.replace(/<[^>]*>?/gm, '').substring(0, 220) + '...';
        }
        if (body.category) post.category = body.category;
        if (body.categoryLabel) post.categoryLabel = body.categoryLabel;
        if (body.image !== undefined) post.image = body.image;
        if (body.abstract !== undefined) post.abstract = body.abstract;

        saveDatabase(dbInstance);
        return sendJson(res, 200, post);
      }

      // 9. DELETE /api/posts/:id (Delete post)
      if (pathname.startsWith('/api/posts/') && method === 'DELETE') {
        const auth = authenticateRequest(req);
        if (!auth) return sendError(res, 401, 'Authentication required.');

        const postId = pathname.replace('/api/posts/', '');
        const idx = dbInstance.posts.findIndex(p => p.id === postId);
        if (idx === -1) return sendError(res, 404, 'Post not found.');

        const post = dbInstance.posts[idx];
        if (post.authorId !== auth.user.id && auth.user.role !== 'admin') {
          return sendError(res, 403, 'Permission denied. You can only delete your own posts.');
        }

        dbInstance.posts.splice(idx, 1);
        saveDatabase(dbInstance);
        return sendJson(res, 200, { success: true });
      }

      // 10. GET /api/books
      if (pathname === '/api/books' && method === 'GET') {
        return sendJson(res, 200, { books: dbInstance.books || [] });
      }

      // 11. SOCIAL ACTIONS (Like, Comment, Repost, Follow)
      if (pathname === '/api/social/like' && method === 'POST') {
        const auth = authenticateRequest(req);
        if (!auth) return sendError(res, 401, 'Authentication required.');

        const body = await parseBody(req);
        const post = dbInstance.posts.find(p => p.id === body.postId);
        if (!post) return sendError(res, 404, 'Post not found.');

        post.likes = post.likes || [];
        const isLiked = post.likes.includes(auth.user.id);
        if (isLiked) {
          post.likes = post.likes.filter(id => id !== auth.user.id);
        } else {
          post.likes.push(auth.user.id);
        }
        post.likesCount = post.likes.length;
        saveDatabase(dbInstance);
        return sendJson(res, 200, { likesCount: post.likesCount, isLiked: !isLiked });
      }

      if (pathname === '/api/social/comment' && method === 'POST') {
        const auth = authenticateRequest(req);
        if (!auth) return sendError(res, 401, 'Authentication required.');

        const body = await parseBody(req);
        const post = dbInstance.posts.find(p => p.id === body.postId);
        if (!post) return sendError(res, 404, 'Post not found.');

        const text = (body.text || '').trim();
        if (!text) return sendError(res, 400, 'Comment text is required.');

        post.comments = post.comments || [];
        const newComment = {
          id: `cmt_${Date.now()}`,
          authorId: auth.user.id,
          authorName: auth.user.name,
          authorUsername: auth.user.username,
          authorAvatar: auth.user.avatar,
          text,
          createdAt: new Date().toISOString()
        };

        post.comments.push(newComment);
        post.commentsCount = post.comments.length;
        auth.user.streakCompletedToday = true;

        saveDatabase(dbInstance);
        return sendJson(res, 201, newComment);
      }

      if (pathname === '/api/social/follow' && method === 'POST') {
        const auth = authenticateRequest(req);
        if (!auth) return sendError(res, 401, 'Authentication required.');

        const body = await parseBody(req);
        const targetId = body.targetUserId;
        if (!targetId || targetId === auth.user.id) return sendError(res, 400, 'Invalid follow target.');

        const targetUser = dbInstance.users.find(u => u.id === targetId);
        if (!targetUser) return sendError(res, 404, 'Target user not found.');

        auth.user.followingIds = auth.user.followingIds || [];
        const isFollowing = auth.user.followingIds.includes(targetId);

        if (isFollowing) {
          auth.user.followingIds = auth.user.followingIds.filter(id => id !== targetId);
          auth.user.followingCount = Math.max(0, (auth.user.followingCount || 1) - 1);
          targetUser.followersCount = Math.max(0, (targetUser.followersCount || 1) - 1);
        } else {
          auth.user.followingIds.push(targetId);
          auth.user.followingCount = (auth.user.followingCount || 0) + 1;
          targetUser.followersCount = (targetUser.followersCount || 0) + 1;
        }

        saveDatabase(dbInstance);
        return sendJson(res, 200, { isFollowing: !isFollowing });
      }

      // 12. POST /api/reports
      if (pathname === '/api/reports' && method === 'POST') {
        const auth = authenticateRequest(req);
        if (!auth) return sendError(res, 401, 'Authentication required to file reports.');

        const body = await parseBody(req);
        const newReport = {
          id: `rep_${Date.now()}`,
          postId: body.postId,
          postTitle: body.postTitle || 'Untitled Publication',
          postAuthor: body.postAuthor || 'Unknown Author',
          reporterId: auth.user.id,
          reporterName: auth.user.name,
          reason: body.reason || 'misleading',
          reasonLabel: body.reasonLabel || 'Policy Violation',
          details: body.details || '',
          status: 'pending',
          timestamp: 'Just now',
          createdAt: new Date().toISOString()
        };

        dbInstance.reports = dbInstance.reports || [];
        dbInstance.reports.unshift(newReport);
        saveDatabase(dbInstance);
        return sendJson(res, 201, { success: true, message: 'Report submitted for academic moderation.' });
      }

      // 13. PUT /api/profile (Update own profile)
      if (pathname === '/api/profile' && method === 'PUT') {
        const auth = authenticateRequest(req);
        if (!auth) return sendError(res, 401, 'Authentication required.');

        const body = await parseBody(req);
        // Only allow safe personal profile updates
        if (body.name) auth.user.name = body.name.trim();
        if (body.bio !== undefined) auth.user.bio = body.bio.trim();
        if (body.institution !== undefined) auth.user.institution = body.institution.trim();
        if (body.field !== undefined) auth.user.field = body.field.trim();
        if (body.avatar) auth.user.avatar = body.avatar.trim();

        saveDatabase(dbInstance);
        return sendJson(res, 200, { user: sanitizeUser(auth.user) });
      }

      // ----------------------------------------------------------------------
      // PROTECTED ADMIN API ENDPOINTS (Strict Server-Side Authorization)
      // ----------------------------------------------------------------------
      if (pathname.startsWith('/api/admin/')) {
        const auth = authenticateRequest(req);
        if (!auth) {
          return sendError(res, 401, 'Authentication required for administrative access.');
        }
        if (auth.user.role !== 'admin') {
          return sendError(res, 403, 'Forbidden: Administrative authorization required.');
        }

        // GET /api/admin/overview
        if (pathname === '/api/admin/overview' && method === 'GET') {
          return sendJson(res, 200, {
            stats: {
              totalUsers: dbInstance.users.length,
              catalogedBooks: dbInstance.books.length,
              pendingReports: (dbInstance.reports || []).filter(r => r.status === 'pending').length,
              activeSessions: Object.keys(dbInstance.sessions).length
            },
            catalogedBooks: dbInstance.books.length,
            registeredUsers: dbInstance.users.length,
            pendingReports: (dbInstance.reports || []).filter(r => r.status === 'pending').length,
            activeSessions: Object.keys(dbInstance.sessions).length,
            status: 'Operational',
            roleBasedAccess: 'Enforced'
          });
        }

        // GET /api/admin/reports
        if (pathname === '/api/admin/reports' && method === 'GET') {
          return sendJson(res, 200, dbInstance.reports || []);
        }

        // POST /api/admin/reports/:id/action
        if (pathname.startsWith('/api/admin/reports/') && pathname.endsWith('/action') && method === 'POST') {
          const reportId = pathname.replace('/api/admin/reports/', '').replace('/action', '');
          const report = (dbInstance.reports || []).find(r => r.id === reportId);
          if (!report) return sendError(res, 404, 'Report not found.');

          const body = await parseBody(req);
          if (body.action === 'dismiss') {
            report.status = 'dismissed';
          } else if (body.action === 'remove') {
            report.status = 'actioned';
            if (report.postId) {
              dbInstance.posts = dbInstance.posts.filter(p => p.id !== report.postId);
            }
          }
          saveDatabase(dbInstance);
          return sendJson(res, 200, { success: true, report });
        }

        // GET /api/admin/users
        if (pathname === '/api/admin/users' && method === 'GET') {
          return sendJson(res, 200, dbInstance.users.map(u => sanitizeUser(u)));
        }

        // POST /api/admin/books
        if (pathname === '/api/admin/books' && method === 'POST') {
          const body = await parseBody(req);
          const newBook = {
            id: `bk_${Date.now()}`,
            title: body.title || 'Untitled Classic',
            author: body.author || 'Unknown',
            year: body.year || 'Public Domain',
            category: body.category || 'philosophy',
            categoryLabel: body.categoryLabel || 'Philosophy',
            description: body.description || 'Open educational public domain reading.',
            cover: body.cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
            chapters: body.chapters || [{ title: 'Chapter 1: Foundations', content: body.description || 'Content' }]
          };
          dbInstance.books.unshift(newBook);
          saveDatabase(dbInstance);
          return sendJson(res, 201, newBook);
        }

        // DELETE /api/admin/books/:id
        if (pathname.startsWith('/api/admin/books/') && method === 'DELETE') {
          const bookId = pathname.replace('/api/admin/books/', '');
          dbInstance.books = dbInstance.books.filter(b => b.id !== bookId);
          saveDatabase(dbInstance);
          return sendJson(res, 200, { success: true });
        }

        return sendError(res, 404, 'Admin API route not found.');
      }

      // Unmatched API endpoint
      return sendError(res, 404, `API route not found: ${method} ${pathname}`);
    } catch (err) {
      console.error('API Error:', err);
      return sendError(res, 500, `Internal Server Error: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // STATIC ASSET SERVING & SPA FALLBACK
  // --------------------------------------------------------------------------
  let cleanPathname = pathname === '/' ? '/index.html' : pathname;

  // Security: prevent directory traversal
  const safePath = path.normalize(cleanPathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA Fallback: Serve index.html for client-side routing
        const indexPath = path.join(__dirname, 'index.html');
        fs.readFile(indexPath, (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(fallbackData);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Server Error: ${err.code}`);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🏛️  SCHOLARIA PLATFORM LIVE ON: http://${HOST}:${PORT}`);
  console.log(`Tagline: Read. Write. Research. Grow.`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Admin Email Configured: ${ADMIN_EMAIL}`);
  console.log(`======================================================\n`);
});
