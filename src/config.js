// ============================================================================
// SCHOLARIA PLATFORM CONFIGURATION & BRANDING
// "Read. Write. Research. Grow."
// ============================================================================

export const BRAND_CONFIG = {
  name: "Scholaria",
  tagline: "Read. Write. Research. Grow.",
  subTagline: "The open educational library & academic social platform for students, educators, and researchers worldwide.",
  version: "1.0.0",
  copyrightYear: 2026,
  
  // Theme Color Presets
  colors: {
    primary: "#0F172A",       // Deep Slate / Navy
    primaryDark: "#020617",
    brandBlue: "#2563EB",     // Academic Royal Blue
    accentGold: "#F59E0B",    // Amber Streak Accent
    accentEmerald: "#10B981", // Learning Growth Accent
    bgLight: "#F8FAFC",
    bgDark: "#0B0F19",
  },
  
  // Post Categories as defined in Master Specification
  postCategories: [
    { id: "normal_post", label: "Normal Post", icon: "💬", color: "blue", desc: "Short academic reflections and questions" },
    { id: "article", label: "Article", icon: "📝", color: "indigo", desc: "Long-form educational analysis & thought pieces" },
    { id: "research", label: "Research", icon: "🔬", color: "violet", desc: "Preprints, empirical studies, abstracts & citations" },
    { id: "study_notes", label: "Study Notes", icon: "📒", color: "amber", desc: "Clean lecture summaries & study guides" },
    { id: "book_review", label: "Book Review", icon: "📖", color: "emerald", desc: "Critical reviews of academic & classic literature" },
    { id: "educational_issue", label: "Educational Issue", icon: "⚖️", color: "rose", desc: "Systemic challenges and pedagogy debates" },
    { id: "university_issue", label: "University Issue", icon: "🏛️", color: "cyan", desc: "Higher education administration & campus topics" },
    { id: "youth_issue", label: "Youth Issue", icon: "🌱", color: "teal", desc: "Student welfare, mental health, and early careers" },
    { id: "educational_idea", label: "Educational Idea", icon: "💡", color: "yellow", desc: "Innovative teaching methods & experiments" },
    { id: "academic_news", label: "Academic News", icon: "📰", color: "sky", desc: "Grants, journals, breakthroughs, and policy" },
  ],

  // Book Library Categories
  bookCategories: [
    { id: "all", label: "All Subjects", icon: "📚" },
    { id: "philosophy", label: "Philosophy & Ethics", icon: "🏛️" },
    { id: "computer_science", label: "Computer Science & Logic", icon: "💻" },
    { id: "natural_sciences", label: "Natural Sciences & Physics", icon: "🔬" },
    { id: "social_sciences", label: "Social Sciences & Economics", icon: "📊" },
    { id: "literature", label: "Classic Literature & Drama", icon: "📜" },
    { id: "mathematics", label: "Mathematics & Statistics", icon: "📐" },
    { id: "history", label: "History & Civilization", icon: "⏳" },
  ],

  // Daily Learning Streak Milestones
  streakMilestones: [
    { days: 7, title: "Consistent Learner", icon: "🥉", desc: "Maintained a 7-day verified learning streak" },
    { days: 30, title: "Knowledge Explorer", icon: "🥈", desc: "Completed 30 consecutive days of academic growth" },
    { days: 100, title: "Dedicated Scholar", icon: "🥇", desc: "100 continuous days of reading or research contributions" },
    { days: 365, title: "Lifelong Learner", icon: "🏆", desc: "One full year of relentless intellectual dedication" },
  ],

  // Post title limit
  maxTitleLength: 150,

  // Community Guidelines Violations
  reportReasons: [
    { id: "spam", label: "Spam or Commercial Promotion", desc: "Repetitive, deceptive, or unsolicited advertising content" },
    { id: "harassment", label: "Harassment, Hate Speech, or Abuse", desc: "Targeting individuals, toxic speech, or intimidation" },
    { id: "plagiarism", label: "Plagiarism or Uncredited Work", desc: "Passing off others' research or writings without attribution" },
    { id: "copyright", label: "Unauthorized Copyrighted Upload", desc: "Uploading non-authorized books or pirated proprietary materials" },
    { id: "misleading", label: "Misleading Academic Claims as Fact", desc: "Fabricated data, pseudoscience, or deceptive academic credentials" },
  ],
};

if (typeof window !== 'undefined') {
  window.BRAND_CONFIG = BRAND_CONFIG;
}
