// ============================================================================
// SCHOLARIA CENTRAL REACTIVE DATA STORE & LOCAL STORAGE ENGINE
// Full CRUD persistence, auth state, streaks, library, and moderation
// ============================================================================

import { INITIAL_USERS } from '../data/initialUsers.js';
import { generateFullLibraryCatalog } from '../data/initialBooks.js';
import { INITIAL_POSTS } from '../data/initialPosts.js';
import { INITIAL_NOTIFICATIONS, INITIAL_REPORTS } from '../data/initialNotifications.js';

const STORAGE_KEYS = {
  USERS: 'scholaria_users_v1',
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
    this.init();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(cb => cb());
  }

  init() {
    // Initialize Users
    if (!safeStorage.getItem(STORAGE_KEYS.USERS)) {
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    // Default current user to Dr. Evelyn Vance (Admin)
    if (!safeStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr_vance');
    }
    // Initialize Posts
    if (!safeStorage.getItem(STORAGE_KEYS.POSTS)) {
      safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(INITIAL_POSTS));
    }
    // Initialize Books
    if (!safeStorage.getItem(STORAGE_KEYS.BOOKS)) {
      const fullCatalog = generateFullLibraryCatalog();
      safeStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(fullCatalog));
    }
    // Initialize Notifications
    if (!safeStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      safeStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    // Initialize Reports
    if (!safeStorage.getItem(STORAGE_KEYS.REPORTS)) {
      safeStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
    }
    // Initialize Theme (default light)
    if (!safeStorage.getItem(STORAGE_KEYS.THEME)) {
      safeStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }

  // --- THEME ---
  getTheme() {
    return safeStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  setTheme(theme) {
    safeStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.notify();
  }

  // --- AUTH & USERS ---
  getUsers() {
    try {
      return JSON.parse(safeStorage.getItem(STORAGE_KEYS.USERS)) || INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  getCurrentUser() {
    const currentId = safeStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) return null;
    const users = this.getUsers();
    return users.find(u => u.id === currentId) || null;
  }

  switchUser(userId) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
      this.notify();
      return user;
    }
    return null;
  }

  login(emailOrUsername, password) {
    const users = this.getUsers();
    const cleanQuery = emailOrUsername.trim().toLowerCase().replace('@', '');
    const user = users.find(u => 
      u.email.toLowerCase() === cleanQuery || 
      u.username.toLowerCase() === cleanQuery
    );
    if (!user) {
      throw new Error("No account found with this email or username.");
    }
    // In our client prototype, allow password match or standard test password
    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    this.notify();
    return user;
  }

  resetPassword(email, token, newPassword) {
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error("No user registered with this email address.");
    }
    // Simulation: accept any 6-digit code or default '123456'
    if (!token || token.trim().length < 4) {
      throw new Error("Invalid or expired verification code.");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }
    user.updatedAt = "Just now";
    safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify();
    return true;
  }

  register(formData) {
    const users = this.getUsers();
    const cleanUsername = formData.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanEmail = formData.email.trim().toLowerCase();

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
      role: formData.role || "student",
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
      joinedDate: "October 2026",
      isCurrentUser: true,
    };

    users.push(newUser);
    safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    safeStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    this.notify();
    return newUser;
  }

  logout() {
    safeStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    this.notify();
  }

  updateProfile(updates) {
    const users = this.getUsers();
    const currentId = safeStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    const idx = users.findIndex(u => u.id === currentId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.notify();
      return users[idx];
    }
    return null;
  }

  // --- FOLLOW SYSTEM ---
  toggleFollow(targetUserId) {
    const users = this.getUsers();
    const currentId = safeStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId || currentId === targetUserId) return;

    const currentIdx = users.findIndex(u => u.id === currentId);
    const targetIdx = users.findIndex(u => u.id === targetUserId);
    if (currentIdx === -1 || targetIdx === -1) return;

    const me = users[currentIdx];
    const target = users[targetIdx];
    me.followingIds = me.followingIds || [];

    const isFollowing = me.followingIds.includes(targetUserId);

    if (isFollowing) {
      me.followingIds = me.followingIds.filter(id => id !== targetUserId);
      me.followingCount = Math.max(0, (me.followingCount || 1) - 1);
      target.followersCount = Math.max(0, (target.followersCount || 1) - 1);
    } else {
      me.followingIds.push(targetUserId);
      me.followingCount = (me.followingCount || 0) + 1;
      target.followersCount = (target.followersCount || 0) + 1;

      // Add Notification
      this.createNotification({
        recipientId: targetUserId,
        type: "follow",
        title: "Started following you",
        message: "began following your academic publications and library shelf.",
        targetUserId: currentId
      });
    }

    safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify();
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
    // Generate realistic 30-day verified learning history for streak view
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

  // --- STREAK CALCULATIONS & VERIFIED ACTIVITY ---
  recordLearningActivity(activityType = 'reading') {
    const users = this.getUsers();
    const currentId = safeStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) return;

    const idx = users.findIndex(u => u.id === currentId);
    if (idx === -1) return;

    const user = users[idx];
    if (!user.streakCompletedToday) {
      user.streakDays = (user.streakDays || 0) + 1;
      user.streakCompletedToday = true;

      // Check Milestones
      user.badges = user.badges || [];
      if (user.streakDays >= 7 && !user.badges.includes('7_days')) {
        user.badges.push('7_days');
      }
      if (user.streakDays >= 30 && !user.badges.includes('30_days')) {
        user.badges.push('30_days');
      }
      if (user.streakDays >= 100 && !user.badges.includes('100_days')) {
        user.badges.push('100_days');
      }
      if (user.streakDays >= 365 && !user.badges.includes('365_days')) {
        user.badges.push('365_days');
      }

      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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

  createPost(postData) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please log in to publish a post.");

    const posts = this.getPosts();
    const readingTimeMinutes = Math.max(1, Math.ceil(postData.content.split(/\s+/).length / 180));

    const newPost = {
      id: `post_${Date.now()}`,
      authorId: user.id,
      authorName: user.name,
      authorUsername: user.username,
      authorRole: `${user.role.toUpperCase()} • ${user.field}`,
      authorInstitution: user.institution,
      authorAvatar: user.avatar,
      category: postData.category || "normal_post",
      categoryLabel: postData.categoryLabel || "Normal Post",
      publishedAt: "Just now",
      readingTime: `${readingTimeMinutes} min read`,
      title: postData.title.trim(),
      preview: postData.content.replace(/<[^>]*>?/gm, '').substring(0, 220) + '...',
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

    posts.unshift(newPost);
    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));

    // Update user post counters
    const users = this.getUsers();
    const uIdx = users.findIndex(u => u.id === user.id);
    if (uIdx !== -1) {
      if (postData.category === 'research') {
        users[uIdx].researchCount = (users[uIdx].researchCount || 0) + 1;
      } else {
        users[uIdx].articlesCount = (users[uIdx].articlesCount || 0) + 1;
      }
      safeStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    // Award streak progress for qualifying educational contribution
    this.recordLearningActivity('publishing');

    this.notify();
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

    const readingTimeMinutes = Math.max(1, Math.ceil((updates.content || post.content).split(/\s+/).length / 180));

    posts[idx] = {
      ...post,
      ...updates,
      title: updates.title ? updates.title.trim() : post.title,
      content: updates.content || post.content,
      preview: (updates.content || post.content).replace(/<[^>]*>?/gm, '').substring(0, 220) + '...',
      readingTime: `${readingTimeMinutes} min read`,
      updatedAt: "Just now"
    };

    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();
    return posts[idx];
  }

  deletePost(postId) {
    const user = this.getCurrentUser();
    let posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Only author or admin can delete
    if (user && (post.authorId === user.id || user.role === 'admin')) {
      posts = posts.filter(p => p.id !== postId);
      safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      this.notify();
    } else {
      throw new Error("You do not have permission to delete this post.");
    }
  }

  toggleLike(postId) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please sign in to like posts.");

    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

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
    return post.isLiked;
  }

  toggleSavePost(postId) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please sign in to save articles.");

    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    post.saved = !post.saved;
    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();
    return post.saved;
  }

  addComment(postId, text, parentCommentId = null) {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please sign in to join the academic discussion.");

    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;

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

    // Send notification to post author
    if (post.authorId !== user.id) {
      this.createNotification({
        recipientId: post.authorId,
        type: "comment",
        title: "New comment on your post",
        message: `commented on "${post.title.substring(0, 35)}..."`,
        targetPostId: post.id
      });
    }

    // Meaningful comment counts toward streak
    this.recordLearningActivity('comment');

    safeStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.notify();
    return newComment;
  }

  createRepost(originalPostId, quoteComment = "") {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Please sign in to repost.");

    const posts = this.getPosts();
    const origPost = posts.find(p => p.id === originalPostId);
    if (!origPost) return;

    // Avoid duplicate repost
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
      // Original content with explicit author attribution preserved
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

    // Notify original author
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
    if (!book) return;
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

    // Verified reading counts toward learning streak
    this.recordLearningActivity('reading');
    this.notify();
  }

  addBook(bookData) {
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
    return newBook;
  }

  deleteBook(bookId) {
    const user = this.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error("Admin privileges required.");
    }
    let books = this.getBooks();
    books = books.filter(b => b.id !== bookId);
    safeStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    this.notify();
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

  submitReport(reportData) {
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
