// DROP Product Constants (v1)

// Temporal System
export const DROP_LIFESPAN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const DROP_ACTIVE_WINDOW = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
export const POST_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Next Drop System (Fixed times: 12am, 6am, 12pm, 6pm)
export const NEXT_DROP_TIMES = [0, 6, 12, 18]; // Hours in 24h format

// Safety & Moderation
export const CRISIS_KEYWORDS = [
    'suicide',
    'kill myself',
    'end my life',
    'want to die',
    'self harm',
    'cut myself',
    'overdose'
];

export const HELPLINE_NUMBERS = {
    india: '9152987821', // AASRA
    us: '988', // Suicide & Crisis Lifeline
    uk: '116123' // Samaritans
};

// Draft System
export const DRAFT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_DRAFT_LENGTH = 280;

// Feedback
export const MAX_FEEDBACK_LENGTH = 1000;
