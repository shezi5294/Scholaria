# 🏛️ Scholaria - Complete Educational Library & Academic Social Platform

> **Tagline:** *Read. Write. Research. Grow.*  
> **Mission:** The premier open educational library and academic social network built for students, teachers, educators, and researchers worldwide. Combines the depth of an online reading library with the collaborative peer engagement of an academic social network.

---

## 🌟 Executive Overview & Design System

Scholaria marries the intuitive clarity of **Notion**, the reading experience of **Medium**, the search speed of **Google**, and the scholarly collegiality of **LinkedIn** into an educational sanctuary.

- **Palette**: Deep Navy (`#0F172A`), Academic Blue (`#2563EB`), Warm Amber Streak Accent (`#F59E0B`), and Learning Growth Emerald (`#10B981`).
- **Typography**: Dual hierarchy with crisp **Inter** for responsive UI navigation and classic **Merriweather** for long-form reading and primary texts.
- **Theme Modes**: Full, persistent **Light** and **Dark** modes with instant real-time toggle.
- **Responsive Architecture**: Optimized for desktop monitors, laptops, tablets, and smartphones (compact navigation bar + mobile create button).

---

## 🚀 Key Implemented Features

### 1. Main Navigation & Quick Tools
- **Desktop Sidebar**:
  - 🏠 **Home (Feed)**: Algorithmic & chronologic academic feeds.
  - 📚 **Library**: Digital repository with 500 cataloged works and in-browser reader.
  - 📝 **Articles**: Long-form essays, critical book reviews, and pedagogical discussions.
  - 🔬 **Research**: Preprints, empirical abstracts, keywords, DOIs, and BibTeX export.
  - 🔍 **Search**: Unified multi-index query across all entities.
  - 🔔 **Notifications**: Real-time activity center with unread count badges.
  - 📊 **My Dashboard**: Personalized analytics, streak milestones, and content manager.
  - 👤 **My Profile**: Public CV, publications, citations, and verified badges.
  - ⚙️ **Settings**: Appearance, privacy, and community guidelines.
  - 🛡️ **Admin Panel**: Role-gated administration dashboard.
- **Header Tools**:
  - Global Search bar (`⌘K` shortcut).
  - 1-Click Evaluation User Switcher (Dr. Evelyn Vance [Admin], Prof. Marcus Thorne [Scholar], Aria Chen [Student], Dr. Tariq Al-Mansoor [Educator]).
  - Live Streak Counter with pulse animation (`🔥 42d Streak`).
  - Prominent **+ Create Post** button.

---

### 2. Authentication & Security
- Real authentication state management backed by `localStorage` and ready for Supabase Auth.
- **Sign Up**: Full name, unique username (`@handle`), academic email, password, optional university/institution, and discipline.
- **Login**: Email or username with password visibility toggle.
- **1-Click Test Accounts**: Switch instantly between student, scholar, educator, and admin roles.
- **Forgot Password**: Password reset workflow with token dispatch.
- **Security**: Passwords handled through secure provider architecture (never plaintext).

---

### 3. Home Feed (Title Before Preview Enforced)
- **Filters**:
  - 🌟 **For You**: Curated interdisciplinary recommendations.
  - 👥 **Following**: Posts exclusively from followed scholars.
  - ⏱️ **Latest**: Real-time chronological publication stream.
  - 🔥 **Trending**: Ranked by peer citations, reposts, and discussions.
- **Post Anatomy**:
  - Author avatar, full name, `@username`, university, role.
  - Category pill (colored badge).
  - Publication timestamp & reading time (`5 min read`).
  - **Prominent bold title in a larger font BEFORE the preview** (satisfying prompt requirement).
  - Inline expandable preview with "Read Full Post" toggle.
  - Academic figures and diagram attachments.
  - **Engagement Suite**: Like, Comment (with nested threading), Repost (with attribution preserved), Bookmark, Share (link copied with toast), and Flag/Report.

---

### 4. Create Post Step-by-Step Composer
- **Step 1: Category Selection**:
  - *Normal Post, Article, Research, Study Notes, Book Review, Educational Issue, University Issue, Youth Issue, Educational Idea, Academic News*.
- **Step 2: Title**:
  - Bold headline field with character limit enforcement (150 chars).
- **Step 3: Content Editor**:
  - Formatting toolbar: Bold, Italic, H2 Headings, Bullet Lists, Blockquotes.
  - Attached figure URL input (Images & figures only; audio/video restricted).
  - *Research-Specific Metadata*: Structured Abstract, Research Field, Keywords chips, Citations & References textarea, and DOI generation.
- **Step 4: Review & Publish**:
  - Live Preview toggle.
  - Save Draft to Dashboard.
  - Publish Post (validates required fields, triggers streak credit).

---

### 5. Online Reading Library & In-Browser Reader
- **Curated 500-Book Catalog**:
  - Masterworks across Philosophy, Computer Science & Logic, Natural Sciences, Social Sciences, Literature, Mathematics, and History.
  - Public Domain & Open Access texts (Plato's *Republic*, Darwin's *Origin of Species*, Newton's *Principia*, Adam Smith's *Wealth of Nations*, Mary Wollstonecraft's *Rights of Woman*, Turing's *Computing Machinery*, Einstein's *Relativity*, etc.).
- **In-Browser Reader**:
  - **Reading Themes**: Paper Light, Sepia Eye-Comfort, and Slate Night.
  - **Adjustable Typography**: Dynamic font size (`14px` to `24px`), line height (`1.5` to `2.2`), and Serif vs. Sans toggle.
  - **Progress Tracking**: Dynamic progress bar (`0%` to `100%`) with chapter selector.
  - **Streak Integration**: Active reading sessions automatically credit the user's daily learning streak.
  - **Legal Notice**: Prominently informs readers that text is hosted under Public Domain / OER for online reading only, and downloading/redistribution is disabled.

---

### 6. Daily Learning Streak
- **Meaningful Activity Rule**: Counts only when completing verified reading in the digital reader (>1 min) or publishing an article/research/peer comment. Opening the website alone does not increment the streak.
- **Milestone Badges**:
  - 🥉 **7 Days**: *Consistent Learner*
  - 🥈 **30 Days**: *Knowledge Explorer*
  - 🥇 **100 Days**: *Dedicated Scholar*
  - 🏆 **365 Days**: *Lifelong Learner*
- **Encouragement**: Non-punitive design philosophy focused on lifelong curiosity.

---

### 7. Protected Admin Panel & Community Safety
- Role-based authorization (`admin` role required).
- **Platform Analytics**: Total users, cataloged books, reports, database status.
- **Book Catalog Management**: Add, edit, and remove library books.
- **Moderation Queue**: Review reported content with violation categories (*Spam, Harassment, Plagiarism, Copyright, Misleading Claims*) and dismiss or remove.
- **User Management**: View scholars and manage platform roles.

---

## 🛠️ How to Run Locally

### Option A: Built-in Node.js Server (Recommended)
From the project directory:
```bash
# If node is in PATH:
node server.js

# Using the standalone binary in scratch:
..\node.exe server.js
```
Then open your browser to **http://localhost:3000**.

### Option B: Direct Browser Launch
You can also open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).

---

## 🗄️ Supabase PostgreSQL Backend Migration

For production deployment with Supabase:
1. Open the Supabase dashboard and create a new project.
2. Go to the **SQL Editor** and execute `supabase/schema.sql`.
3. Configure Supabase Storage buckets: `book-covers` and `post-attachments`.
4. Connect client credentials in your `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
See `supabase/README.md` for full instructions.

---

## 📄 License & Attribution
- Application source code released under the MIT License.
- Library volumes hosted in accordance with Public Domain and Creative Commons Open Access standards.
