
const RATING_STORAGE_KEY = 'vehicleRatings';

/**
 * Retrieves all vehicle ratings from localStorage.
 * @returns An object mapping vehicle IDs to an array of their ratings.
 */
export const getRatings = (): { [key: string]: number[] } => {
  try {
    const ratingsJson = localStorage.getItem(RATING_STORAGE_KEY);
    return ratingsJson ? JSON.parse(ratingsJson) : {};
  } catch (error) {
    console.error("Failed to parse ratings from localStorage", error);
    return {};
  }
};

/**
 * Adds a new rating for a vehicle and saves it to localStorage.
 * @param vehicleId The ID of the vehicle being rated.
 * @param rating The numerical rating (e.g., 1-5).
 */
export const addRating = (vehicleId: number, rating: number) => {
  if (rating < 1 || rating > 5) {
      console.error("Rating must be between 1 and 5.");
      return;
  }

  const allRatings = getRatings();
  const vehicleRatings = allRatings[vehicleId] || [];
  
  // For this implementation, we allow multiple ratings from the same user/session
  // A more advanced implementation might handle unique user ratings
  vehicleRatings.push(rating);
  allRatings[vehicleId] = vehicleRatings;

  try {
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(allRatings));
  } catch (error) {
    console.error("Failed to save ratings to localStorage", error);
  }
};
