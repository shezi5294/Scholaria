// ============================================================================
// INITIAL SEED NOTIFICATIONS & MODERATION REPORTS
// ============================================================================

export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif_1",
    recipientId: "usr_vance",
    senderName: "Prof. Marcus Thorne",
    senderUsername: "m_thorne",
    senderAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    type: "reply",
    title: "Replied to your comment",
    message: "responded to your inquiry regarding discrete bottleneck phase transitions.",
    targetPostId: "post_1",
    timestamp: "1 hour ago",
    read: false,
  },
  {
    id: "notif_2",
    recipientId: "usr_vance",
    senderName: "Aria Chen",
    senderUsername: "aria_chen",
    senderAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
    type: "repost",
    title: "Reposted your article",
    message: "shared your book review on Newton's Principia with their followers.",
    targetPostId: "post_2",
    timestamp: "1 day ago",
    read: false,
  },
  {
    id: "notif_3",
    recipientId: "usr_vance",
    senderName: "Dr. Tariq Al-Mansoor",
    senderUsername: "tariq_edu",
    senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    type: "like",
    title: "Liked your publication",
    message: "liked your critical review on Newton's Principia.",
    targetPostId: "post_2",
    timestamp: "2 days ago",
    read: true,
  },
  {
    id: "notif_4",
    recipientId: "usr_vance",
    senderName: "Dr. Elena Rostova",
    senderUsername: "elena_rostova",
    senderAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80",
    type: "follow",
    title: "Started following you",
    message: "followed your research profile and updates.",
    targetUserId: "usr_rostova",
    timestamp: "3 days ago",
    read: true,
  }
];

export const INITIAL_REPORTS = [
  {
    id: "rep_1",
    postId: "post_suspicious_1",
    postTitle: "Guaranteed Rapid Publication in Scopus Journals with Paid Citations",
    postAuthor: "AcademicGhost_Services",
    reporterName: "Dr. Tariq Al-Mansoor",
    reporterUsername: "tariq_edu",
    reason: "spam",
    reasonLabel: "Spam or Commercial Promotion",
    details: "Commercial promotion offering unethical paid paper authorship and predatory citations.",
    timestamp: "4 hours ago",
    status: "pending" // pending, dismissed, actioned
  },
  {
    id: "rep_2",
    postId: "post_suspicious_2",
    postTitle: "Perpetual Motion Machine via Magnetic Harmonic Resonance",
    postAuthor: "PseudoSci_Lab",
    reporterName: "Dr. Evelyn Vance",
    reporterUsername: "evelyn_vance",
    reason: "misleading",
    reasonLabel: "Misleading Academic Claims as Fact",
    details: "Blatant thermodynamic violation presented as a peer-reviewed breakthrough without falsifiable data.",
    timestamp: "Yesterday",
    status: "pending"
  }
];
