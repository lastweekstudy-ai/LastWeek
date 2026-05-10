// Simple SM-2 inspired spaced repetition algorithm
export const getNextReviewDate = (confidence) => {
  const now = new Date();
  let daysToAdd;

  switch (confidence) {
    case 1: // Hard
      daysToAdd = 1;
      break;
    case 2: // Okay
      daysToAdd = 3;
      break;
    case 3: // Easy
      daysToAdd = 7;
      break;
    default:
      daysToAdd = 1;
  }

  const nextReview = new Date(now);
  nextReview.setDate(now.getDate() + daysToAdd);
  return nextReview;
};

// Check if a flashcard is due for review
export const isFlashcardDue = (nextReviewAt) => {
  const now = new Date();
  const reviewDate = new Date(nextReviewAt);
  return reviewDate <= now;
};

// Get confidence level text
export const getConfidenceText = (confidence) => {
  switch (confidence) {
    case 0:
      return 'Unseen';
    case 1:
      return 'Hard';
    case 2:
      return 'Okay';
    case 3:
      return 'Easy';
    default:
      return 'Unknown';
  }
};

// Calculate next review interval based on previous performance
export const calculateInterval = (confidence, previousInterval = 1) => {
  switch (confidence) {
    case 1: // Hard - reset to 1 day
      return 1;
    case 2: // Okay - slight increase
      return Math.max(1, Math.floor(previousInterval * 1.3));
    case 3: // Easy - significant increase
      return Math.max(1, Math.floor(previousInterval * 2.5));
    default:
      return 1;
  }
};