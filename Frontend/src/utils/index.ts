export const daysLeft = (deadline: number) => {
  try {
    const deadlineTime =
      deadline.toString().length === 10 ? deadline * 1000 : deadline;

    const difference = deadlineTime - Date.now();

    if (difference <= 0) return 0;

    return Math.ceil(difference / (1000 * 60 * 60 * 24)); // ✅ FIX HERE
  } catch (error) {
    console.error("Error in daysLeft:", error);
    return 0;
  }
};

// Safe progress percentage calculation
export const calculateBarPercentage = (
  goal: number,
  raisedAmount: number
) => {
  try {
    if (!goal || goal <= 0) return 0;

    const percentage = (raisedAmount * 100) / goal;

    return Math.min(Math.max(Math.round(percentage), 0), 100);
  } catch (error) {
    console.error("Error in calculateBarPercentage:", error);
    return 0;
  }
};

// Proper image validation
export const checkIfImage = (
  url: string,
  callback: (isValid: boolean) => void
) => {
  if (!url) {
    callback(false);
    return;
  }

  const img = new Image();

  img.onload = () => callback(true);
  img.onerror = () => callback(false);

  img.src = url;
};