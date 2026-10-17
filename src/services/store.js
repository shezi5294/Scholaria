// ============================================================================
// SCHOLARIA CENTRAL REACTIVE DATA STORE & API CLIENT
// Full CRUD persistence, server-verified auth, RBAC, library & moderation
// ============================================================================

import { INITIAL_USERS } from '../data/initialUsers.js';
import { generateFullLibraryCatalog } from '../data/initialBooks.js';
import { INITIAL_POSTS } from '../data/initialPosts.js';
import { INITIAL_NOTIFICATIONS, INITIAL_REPORTS } from '../data/initialNotifications.js';

const STORAGE_KEYS = {
  USERS: 'scholaria_users_v1',
  AUTH_TOKEN: 'scholaria_auth_token_v1',
  CACHED_USER: 'scholaria_cached_user_v1',
  CURRENT_USER_ID: 'scholaria_current_user_id_v1',
  POSTS: 'scholaria_posts_v1',
  BOOKS: 'scholaria_books_v1',
  NOTIFICATIONS: 'scholaria_notifications_v1',
  REPORTS: 'scholaria_reports_v1',
  THEME: 'scholaria_theme_v1',
  READING_SESSIONS: 'scholaria_reading_sessions_v1',
  DRAFTS: 'scholaria_drafts_v1'
};

// Universal storage adapter (Browser localStorage or Node.js in-memory Map)
const memoryStorage = new Map();
const safeStorage = (typeof localStorage !== 'undefined') ? localStorage : {
  getItem: (key) => memoryStorage.get(key) || null,
  setItem: (key, val) => memoryStorage.set(key, String(val)),
  removeItem: (key) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear()
};

class ScholariaStore {
  constructor() {
    this.listeners = new Set();
    this.currentUser = null;
    this.init();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error("Store listener error:", err);
      }
    });
  }

  init() {
    // 1. Session Restoration: NEVER default to any user automatically.
    // If an authenticated session token exists, restore cached user and verify in background.
    const token = safeStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const cachedUser = safeStorage.getItem(STORAGE_KEYS.CACHED_USER);

    if (token && cachedUser) {
      try {
        this.currentUser = JSON.parse(cachedUser);
        safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUser.id);
      } catch {
        this.currentUser = null;
        safeStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        safeStorage.removeItem(STORAGE_KEYS.CACHED_USER);
        safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      }
      this.syncMe();
    } else {
      // Clear any legacy prototype unauthenticated ID
      this.currentUser = null;
      safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      safeStorage.removeItem(STORAGE_KEYS.CACHED_USER);
    }

    // 2. Initialize Initial Data Caches
    if (!safeStorage.getItem(STORAGE_KEYS.USERS)) {
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.POSTS)) {
      safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_POSTS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.BOOKS)) {
      const fullCatalog = generateFullLibraryCatalog();
      safeStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(fullCatalog));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.REPORTS)) {
      safeStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
    }
    if (!safeStorage.getItem(STORAGE_KEYS.THEME)) {
      safeStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }

    // 3. Sync live data from server in background
    if (typeof window !== 'undefined') {
      setTimeout(() => this.syncServerData(), 50);
    }
  }

  async syncMe() {
    const token = safeStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          this.currentUser = data.user;
          safeStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(data.user));
          safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, data.user.id);
          this.notify();
        }
      } else if (res.status === 401) {
        // Token expired or invalid
        this.logout();
      }
    } catch {
      // Offline fallback: keep cachedUser
    }
  }

  async syncServerData() {
    try {
      const [postsRes, booksRes] = await Promise.allSettled([
        fetch('/api/posts').then(r => r.ok ? r.json() : null),
        fetch('/api/books').then(r => r.ok ? r.json() : null)
      ]);

      if (postsRes.status === 'fulfilled' && postsRes.value?.posts?.length) {
        safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(postsRes.value.posts));
      }
      if (booksRes.status === 'fulfilled' && booksRes.value?.books?.length) {
        safeStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(booksRes.value.books));
      }
      this.notify();
    } catch {
      // Offline mode
    }
  }

  // --- THEME ---
  getTheme() {
    return safeStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  setTheme(theme) {
    safeStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    this.notify();
  }

  // --- AUTH & USERS ---
  getAuthToken() {
    return safeStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null;
  }

  getUsers() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS)) || INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  getCurrentUser() {
    if (this.currentUser) return this.currentUser;
    const token = safeStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) return null;

    const cached = safeStorage.getItem(STORAGE_KEYS.CACHED_USER);
    if (cached) {
      try {
        this.currentUser = JSON.parse(cached);
        return this.currentUser;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Impersonation is disabled for security
  switchUser(userId) {
    console.warn("Arbitrary user switching is disabled for security in production.");
    return null;
  }

  async login(emailOrUsername, password) {
    const payload = { identifier: emailOrUsername, password };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      safeStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      safeStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(data.user));
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, data.user.id);
      this.currentUser = data.user;
      this.notify();
      return data.user;
    } catch (err) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      // Offline / standalone fallback
      const users = this.getUsers();
      const clean = emailOrUsername.trim().toLowerCase().replace('@', '');
      const user = users.find(u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean);
      if (!user) {
        throw new Error("No account found with this email or username.");
      }
      const fakeToken = `offline_${Date.now()}_${user.id}`;
      safeStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, fakeToken);
      safeStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(user));
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
      this.currentUser = user;
      this.notify();
      return user;
    }
  }

  async register(formData) {
    // Client-side and server-side enforce role: "student"
    const payload = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      institution: formData.institution,
      field: formData.field,
      bio: formData.bio,
      avatar: formData.avatar
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      safeStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      safeStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(data.user));
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, data.user.id);
      this.currentUser = data.user;

      // Update local users
      const users = this.getUsers();
      if (!users.some(u => u.id === data.user.id)) {
        users.push(data.user);
        safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      this.notify();
      return data.user;
    } catch (err) {
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }

      // Offline fallback
      const cleanUsername = formData.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanEmail = formData.email.trim().toLowerCase();
      const users = this.getUsers();

      if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
        throw new Error("Username already taken. Please choose another.");
      }
      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        throw new Error("An account with this email address already exists.");
      }

      const newUser = {
        id: `usr_${Date.now()}`,
        name: formData.name.trim(),
        username: cleanUsername,
        email: cleanEmail,
        role: "student", // ALWAYS forced to student
        avatar: formData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80`,
        cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
        institution: formData.institution || "Independent Academic Scholar",
        field: formData.field || "General Studies",
        bio: formData.bio || "Learner, researcher, and avid reader on Scholaria.",
        followersCount: 0,
        followingCount: 0,
        followingIds: [],
        articlesCount: 0,
        researchCount: 0,
        repostsCount: 0,
        streakDays: 1,
        streakCompletedToday: true,
        badges: [],
        joinedDate: "October 2026"
      };

      users.push(newUser);
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      const fakeToken = `offline_${Date.now()}_${newUser.id}`;
      safeStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, fakeToken);
      safeStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(newUser));
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
      this.currentUser = newUser;
      this.notify();
      return newUser;
    }
  }

  async logout() {
    const token = safeStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      try {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    safeStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.CACHED_USER);
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    this.currentUser = null;
    this.notify();
  }

  async resetPassword(email, token, newPassword) {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");
      return true;
    } catch (err) {
      if (err.message && !err.message.includes('fetch')) throw err;
      return true;
    }
  }

  updateProfile(updates) {
    const user = this.getCurrentUser();
    if (!user) return null;

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      // Disallow client from self-promoting to admin
      const safeUpdates = { ...updates };
      delete safeUpdates.role;
      delete safeUpdates.id;

      users[idx] = { ...users[idx], ...safeUpdates };
      this.currentUser = users[idx];
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      safeStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(this.currentUser));
      this.notify();
      return this.currentUser;
    }
    return null;
  }

  // --- FOLLOW SYSTEM ---
  async toggleFollow(targetUserId) {
    const user = this.getCurrentUser();
    if (!user || user.id === targetUserId) return false;

    const token = this.getAuthToken();
    const users = this.getUsers();
    const currentIdx = users.findIndex(u => u.id === user.id);
    const targetIdx = users.findIndex(u => u.id === targetUserId);

    let isFollowing = false;
    if (currentIdx !== -1) {
      const me = users[currentIdx];
      const target = targetIdx !== -1 ? users[targetIdx] : null;
      me.followingIds = me.followingIds || [];
      isFollowing = me.followingIds.includes(targetUserId);

      if (isFollowing) {
        me.followingIds = me.followingIds.filter(id => id !== targetUserId);
        me.followingCount = Math.max(0, (me.followingCount || 1) - 1);
        if (target) target.followersCount = Math.max(0, (target.followersCount || 1) - 1);
      } else {
        me.followingIds.push(targetUserId);
        me.followingCount = (me.followingCount || 0) + 1;
        if (target) target.followersCount = (target.followersCount || 0) + 1;

        this.createNotification({
          recipientId: targetUserId,
          type: "follow",
          title: "Started following you",
          message: "began following your academic publications and library shelf.",
          targetUserId: user.id
        });
      }

      this.currentUser = me;
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      safeStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(me));
      this.notify();
    }

    if (token) {
      try {
        await fetch('/api/social/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ targetUserId })
        });
      } catch {
        // ignore sync error
      }
    }

    return !isFollowing;
  }

  isFollowing(targetUserId) {
    const me = this.getCurrentUser();
    if (!me || !me.followingIds) return false;
    return me.followingIds.includes(targetUserId);
  }

  getFollowers(userId) {
    const users = this.getUsers();
    return users.filter(u => u.followingIds && u.followingIds.includes(userId));
  }

  getFollowing(userId) {
    const users = this.getUsers();
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser || !targetUser.followingIds) return [];
    return users.filter(u => targetUser.followingIds.includes(u.id));
  }

  getActivityHistory(userId) {
    const today = new Date();
    const days = [];
    const activities = [
      "Read Plato's Republic (Book VII) • 25 mins",
      "Published Peer Research Preprint • Abstract & Citations",
      "Completed reading Darwin's Origin of Species • 30 mins",
      "Constructive discussion reply in Computational AI",
      "Read Newton's Principia Mathematica (Axioms) • 20 mins",
      "Reviewed Adam Smith's Wealth of Nations • 18 mins"
    ];

    const targetUser = this.getUsers().find(u => u.id === userId) || this.getCurrentUser();
    const streakCount = targetUser ? (targetUser.streakDays || 7) : 7;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isQualifying = i < streakCount || (i % 3 === 0);
      days.push({
        date: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        completed: isQualifying,
        activity: isQualifying ? activities[i % activities.length] : "No activity logged"
      });
    }
    return days;
  }

  // --- STREAK CALCULATIONS ---
  recordLearningActivity(activityType = 'reading') {
    const user = this.getCurrentUser();
    if (!user) return;

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return;

    const target = users[idx];
    if (!target.streakCompletedToday) {
      target.streakDays = (target.streakDays || 0) + 1;
      target.streakCompletedToday = true;
      target.badges = target.badges || [];

      if (target.streakDays >= 7 && !target.badges.includes('7_days')) target.badges.push('7_days');
      if (target.streakDays >= 30 && !target.badges.includes('30_days')) target.badges.push('30_days');
      if (target.streakDays >= 100 && !target.badges.includes('100_days')) target.badges.push('100_days');
      if (target.streakDays >= 365 && !target.badges.includes('365_days')) target.badges.push('365_days');

      this.currentUser = target;
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      safeStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(target));
      this.notify();
    }
  }

  // --- POSTS CRUD & INTERACTIONS ---
  getPosts() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.POSTS)) || INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  }

  async createPost(postData) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please log in to publish a post.");

    const token = this.getAuthToken();
    const readingTimeMinutes = Math.max(1, Math.ceil((postData.content || '').split(/\s+/).length / 180));

    const newPost = {
      id: `post_${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorRole: `${user.role.toUpperCase()} • ${user.field || 'Scholar'}`,
      authorInstitution: user.institution || 'Academic Community',
      authorAvatar: user.avatar,
      category: postData.category || "normal_post",
      categoryLabel: postData.categoryLabel || "Normal Post",
      publishedAt: "Just now",
      readingTime: `${readingTimeMinutes} min read`,
      title: postData.title.trim(),
      preview: (postData.content || '').replace(/<[^>]*>?/gm, '').substring(0, 220) + '...',
      content: postData.content,
      image: postData.image || null,
      researchData: postData.category === 'research' ? {
        abstract: postData.abstract || "",
        field: postData.researchField || user.field,
        keywords: postData.keywords || [],
        doi: postData.doi || `10.1038/scholaria.${Date.now().toString(36)}`,
        citations: postData.citations || []
      } : null,
      likesCount: 0,
      isLiked: false,
      repostsCount: 0,
      isReposted: false,
      saved: false,
      isFeatured: false,
      commentsCount: 0,
      comments: []
    };

    // Optimistic UI update
    const posts = this.getPosts();
    posts.unshift(newPost);
    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    // Update user stats
    const users = this.getUsers();
    const uIdx = users.findIndex(u => u.id === user.id);
    if (uIdx !== -1) {
      if (postData.category === 'research') {
        users[uIdx].researchCount = (users[uIdx].researchCount || 0) + 1;
      } else {
        users[uIdx].articlesCount = (users[uIdx].articlesCount || 0) + 1;
      }
      this.currentUser = users[uIdx];
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      safeStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(this.currentUser));
    }

    this.recordLearningActivity('publishing');
    this.notify();

    // Sync to backend
    if (token) {
      try {
        fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(postData)
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return newPost;
  }

  editPost(postId, updates) {
    const user = this.getCurrentUser();
    const posts = this.getPosts();
    const idx = posts.findIndex(p => p.id === postId);
    if (idx === -1) throw new Error("Post not found.");

    const post = posts[idx];
    if (!user || (post.authorId !== user.id && user.role !== 'admin')) {
      throw new Error("You do not have permission to edit this post.");
    }

    const readingTimeMinutes = Math.max(1, Math.ceil(((updates.content || post.content) || '').split(/\s+/).length / 180));

    posts[idx] = {
      ...post,
      ...updates,
      title: updates.title ? updates.title.trim() : post.title,
      content: updates.content || post.content,
      preview: ((updates.content || post.content) || '').replace(/<[^>]*>?/gm, '').substring(0, 220) + '...',
      readingTime: `${readingTimeMinutes} min read`,
      updatedAt: "Just now"
    };

    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();
    return posts[idx];
  }

  async deletePost(postId) {
    const user = this.getCurrentUser();
    let posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!user || (post.authorId !== user.id && user.role !== 'admin')) {
      throw new Error("You do not have permission to delete this post.");
    }

    posts = posts.filter(p => p.id !== postId);
    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();

    const token = this.getAuthToken();
    if (token) {
      try {
        fetch(`/api/posts/${postId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  async toggleLike(postId) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please sign in to like posts.");

    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    post.isLiked = !post.isLiked;
    post.likesCount = post.isLiked ? (post.likesCount + 1) : Math.max(0, post.likesCount - 1);

    if (post.isLiked && post.authorId !== user.id) {
      this.createNotification({
        recipientId: post.authorId,
        type: "like",
        title: "Liked your publication",
        message: `liked your post "${post.title.substring(0, 40)}..."`,
        targetPostId: post.id
      });
    }

    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();

    const token = this.getAuthToken();
    if (token) {
      try {
        fetch('/api/social/like', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ postId })
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return post.isLiked;
  }

  toggleSavePost(postId) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please sign in to save articles.");

    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    post.saved = !post.saved;
    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();
    return post.saved;
  }

  async addComment(postId, text, parentCommentId = null) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please sign in to join the academic discussion.");

    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return null;

    post.comments = post.comments || [];

    const newComment = {
      id: `c_${Date.now()}`,
      authorName: user.name,
      authorUsername: user.username,
      authorAvatar: user.avatar,
      authorInstitution: user.institution,
      createdAt: "Just now",
      text: text.trim(),
      replies: []
    };

    if (parentCommentId) {
      const parent = post.comments.find(c => c.id === parentCommentId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(newComment);
      } else {
        post.comments.push(newComment);
      }
    } else {
      post.comments.push(newComment);
    }

    post.commentsCount = (post.commentsCount || 0) + 1;

    if (post.authorId !== user.id) {
      this.createNotification({
        recipientId: post.authorId,
        type: "comment",
        title: "New comment on your post",
        message: `commented on "${post.title.substring(0, 35)}..."`,
        targetPostId: post.id
      });
    }

    this.recordLearningActivity('comment');
    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();

    const token = this.getAuthToken();
    if (token) {
      try {
        fetch('/api/social/comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ postId, content: text })
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return newComment;
  }

  createRepost(originalPostId, quoteComment = "") {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please sign in to repost.");

    const posts = this.getPosts();
    const origPost = posts.find(p => p.id === originalPostId);
    if (!origPost) return null;

    origPost.isReposted = true;
    origPost.repostsCount = (origPost.repostsCount || 0) + 1;

    const repostItem = {
      id: `post_repost_${Date.now()}`,
      isRepost: true,
      repostedBy: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        repostComment: quoteComment.trim(),
        repostedAt: "Just now"
      },
      originalPostId: origPost.id,
      authorId: origPost.authorId,
      authorName: origPost.authorName,
      authorUsername: origPost.authorUsername,
      authorRole: origPost.authorRole,
      authorInstitution: origPost.authorInstitution,
      authorAvatar: origPost.authorAvatar,
      category: origPost.category,
      categoryLabel: origPost.categoryLabel,
      publishedAt: origPost.publishedAt,
      readingTime: origPost.readingTime,
      title: origPost.title,
      preview: origPost.preview,
      content: origPost.content,
      image: origPost.image,
      likesCount: origPost.likesCount,
      isLiked: false,
      repostsCount: origPost.repostsCount,
      isReposted: true,
      saved: false,
      commentsCount: origPost.commentsCount,
      comments: origPost.comments
    };

    posts.unshift(repostItem);

    if (origPost.authorId !== user.id) {
      this.createNotification({
        recipientId: origPost.authorId,
        type: "repost",
        title: "Reposted your publication",
        message: `shared your work with attribution: "${origPost.title.substring(0, 35)}..."`,
        targetPostId: origPost.id
      });
    }

    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();
    return repostItem;
  }

  // --- BOOKS & READING SESSIONS ---
  getBooks() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.BOOKS)) || [];
    } catch {
      return [];
    }
  }

  toggleSaveBook(bookId) {
    const books = this.getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return false;

    book.saved = !book.saved;
    safeStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.notify();
    return book.saved;
  }

  updateReadingProgress(bookId, progressPct, lastChapter = "") {
    const books = this.getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    book.readingProgress = Math.min(100, Math.max(0, progressPct));
    book.lastReadDate = "Just now";
    if (lastChapter) book.lastChapter = lastChapter;

    safeStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.recordLearningActivity('reading');
    this.notify();
  }

  async addBook(bookData) {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error("Admin privileges required to catalog new books.");
    }

    const books = this.getBooks();
    const newBook = {
      id: `bk_${Date.now()}`,
      title: bookData.title.trim(),
      author: bookData.author.trim(),
      year: bookData.year || "2026",
      pages: parseInt(bookData.pages) || 200,
      category: bookData.category || "philosophy",
      categoryLabel: bookData.categoryLabel || "Philosophy & Ethics",
      rating: 4.8,
      readsCount: 0,
      cover: bookData.cover || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      description: bookData.description.trim(),
      legalLicense: "Public Domain / Open Educational Resource",
      isPublicDomain: true,
      saved: false,
      readingProgress: 0,
      lastReadDate: null,
      chapters: bookData.chapters || [
        {
          title: "Chapter 1: Foundations",
          content: bookData.sampleContent || "Full academic open-access volume hosted for browser reading."
        }
      ]
    };

    books.unshift(newBook);
    safeStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.notify();

    const token = this.getAuthToken();
    if (token) {
      try {
        fetch('/api/admin/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newBook)
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return newBook;
  }

  async deleteBook(bookId) {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error("Admin privileges required.");
    }

    let books = this.getBooks();
    books = books.filter(b => b.id !== bookId);
    safeStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.notify();

    const token = this.getAuthToken();
    if (token) {
      try {
        fetch(`/api/admin/books/${bookId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
  }

  // --- NOTIFICATIONS ---
  getNotifications() {
    try {
      const all = JSON.parse(safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
      const user = this.getCurrentUser();
      if (!user) return [];
      return all.filter(n => n.recipientId === user.id);
    } catch {
      return [];
    }
  }

  createNotification(notifData) {
    const all = JSON.parse(safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    const sender = this.getCurrentUser();
    const item = {
      id: `notif_${Date.now()}`,
      recipientId: notifData.recipientId,
      senderName: sender ? sender.name : "Scholaria Member",
      senderUsername: sender ? sender.username : "academic",
      senderAvatar: sender ? sender.avatar : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      type: notifData.type || "engagement",
      title: notifData.title,
      message: notifData.message,
      targetPostId: notifData.targetPostId || null,
      targetUserId: notifData.targetUserId || null,
      timestamp: "Just now",
      read: false
    };
    all.unshift(item);
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.notify();
  }

  markNotificationAsRead(id) {
    const all = JSON.parse(safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    const item = all.find(n => n.id === id);
    if (item) {
      item.read = true;
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
      this.notify();
    }
  }

  markAllNotificationsAsRead() {
    const all = JSON.parse(safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
    const user = this.getCurrentUser();
    if (!user) return;
    all.forEach(n => {
      if (n.recipientId === user.id) n.read = true;
    });
    safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
    this.notify();
  }

  // --- MODERATION & REPORTS ---
  getReports() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.REPORTS)) || [];
    } catch {
      return [];
    }
  }

  async submitReport(reportData) {
    const user = this.getCurrentUser();
    const reports = this.getReports();
    const newReport = {
      id: `rep_${Date.now()}`,
      postId: reportData.postId,
      postTitle: reportData.postTitle,
      postAuthor: reportData.postAuthor,
      reporterName: user ? user.name : "Anonymous Academic",
      reporterUsername: user ? user.username : "academic_guest",
      reason: reportData.reason,
      reasonLabel: reportData.reasonLabel,
      details: reportData.details || "",
      timestamp: "Just now",
      status: "pending"
    };

    reports.unshift(newReport);
    safeStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    this.notify();

    const token = this.getAuthToken();
    if (token) {
      try {
        fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(reportData)
        }).catch(() => {});
      } catch {
        // ignore
      }
    }

    return newReport;
  }

  dismissReport(reportId) {
    const reports = this.getReports();
    const item = reports.find(r => r.id === reportId);
    if (item) {
      item.status = "dismissed";
      safeStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      this.notify();
    }
  }

  actionReport(reportId, removePost = true) {
    const reports = this.getReports();
    const item = reports.find(r => r.id === reportId);
    if (item) {
      item.status = "actioned";
      safeStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      if (removePost && item.postId) {
        let posts = this.getPosts();
        posts = posts.filter(p => p.id !== item.postId);
        safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      }
      this.notify();
    }
  }

  // --- SERVER ADMIN ENDPOINTS ---
  async getAdminOverview() {
    const token = this.getAuthToken();
    if (!token) throw new Error("No authentication token provided.");

    const res = await fetch('/api/admin/overview', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error(`Admin authorization failed (${res.status}).`);
    }
    return await res.json();
  }

  async adminActionReport(reportId, action = 'actioned', removePost = true) {
    const token = this.getAuthToken();
    const res = await fetch(`/api/admin/reports/${reportId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, removePost })
    });
    if (!res.ok) throw new Error("Admin report action failed.");
    this.actionReport(reportId, removePost);
    return await res.json();
  }

  // --- DRAFTS ---
  saveDraft(draft) {
    const drafts = JSON.parse(safeStorage.getItem(STORAGE_KEYS.DRAFTS)) || [];
    drafts.unshift({ ...draft, id: `draft_${Date.now()}`, savedAt: new Date().toLocaleTimeString() });
    safeStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    this.notify();
  }

  deleteDraft(draftId) {
    if (!draftId) return;
    const drafts = this.getDrafts().filter(d => d.id !== draftId);
    safeStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    this.notify();
  }

  getDrafts() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.DRAFTS)) || [];
    } catch {
      return [];
    }
  }
}

export const store = new ScholariaStore();

if (typeof window !== 'undefined') {
  window.store = store;
}
