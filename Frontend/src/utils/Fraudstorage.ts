interface FraudData {
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  reasons: string[];
  warningMessage?: string;
  canSubmit?: boolean;
}

// Save fraud data for a campaign
export const saveFraudData = (campaignId: number, fraudData: FraudData) => {
  try {
    const fraudMap = JSON.parse(localStorage.getItem("fraudData") || "{}");
    fraudMap[campaignId] = fraudData;
    localStorage.setItem("fraudData", JSON.stringify(fraudMap));
  } catch (error) {
    console.error("Error saving fraud data:", error);
  }
};

// Get fraud data for a campaign
export const getFraudData = (campaignId: number): FraudData | null => {
  try {
    const fraudMap = JSON.parse(localStorage.getItem("fraudData") || "{}");
    return fraudMap[campaignId] || null;
  } catch (error) {
    console.error("Error loading fraud data:", error);
    return null;
  }
};

// Get all fraud data
export const getAllFraudData = (): Record<number, FraudData> => {
  try {
    return JSON.parse(localStorage.getItem("fraudData") || "{}");
  } catch (error) {
    console.error("Error loading fraud data:", error);
    return {};
  }
};