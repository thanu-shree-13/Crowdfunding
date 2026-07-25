import { ChangeEvent, FormEvent, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../components/formField";
import { CustomButton } from "../components/customButton";
import { checkIfImage } from "../utils";
import { toast } from "sonner";
import { StateContext } from "../contexts";
import { Loader } from "../components/loader";

// Fraud interface
interface FraudResult {
  score: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  reasons: string[];
}

export function CreateCampaign() {
  const { createCampaign } = useContext(StateContext);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [idea, setIdea] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [fraud, setFraud] = useState<FraudResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
  });

  const handleFormFieldChange = (
    fieldName: string,
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setForm({ ...form, [fieldName]: value });
    
    // Update image preview when image URL changes
    if (fieldName === "image") {
      setImagePreview(value);
    }
  };

  const generateAI = async () => {
    if (!idea) {
      toast.error("Please enter a campaign idea first");
      return;
    }

    try {
      setLoadingAI(true);
      toast.info("Analyzing campaign...");

      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });

      const data = await res.json();

      if (data.fraud) {
        setFraud(data.fraud);

        if (data.fraud.riskLevel === "HIGH") {
          toast.warning("High risk campaign detected");
        }
      }

      setForm((prev) => ({
        ...prev,
        title: data.title || "",
        description: data.description || "",
      }));

      toast.success("Campaign generated successfully");

    } catch (err) {
      console.error(err);
      toast.error("AI generation failed");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (fraud?.riskLevel === "HIGH") {
      toast.error("Cannot submit high-risk campaign");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Please enter campaign title");
      return;
    }

    if (!form.description.trim()) {
      toast.error("Please enter campaign description");
      return;
    }

    if (!form.target || isNaN(Number(form.target))) {
      toast.error("Enter valid ETH amount");
      return;
    }

    if (Number(form.target) <= 0) {
      toast.error("Goal must be greater than 0");
      return;
    }

    if (!form.deadline) {
      toast.error("Please select a deadline");
      return;
    }

    const deadlineDate = new Date(form.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (deadlineDate <= today) {
      toast.error("Deadline must be in the future");
      return;
    }

    if (!form.image.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    checkIfImage(form.image, async (exists) => {
      if (!exists) {
        toast.error("Invalid image URL. Please provide a valid image link");
        setForm({ ...form, image: "" });
        setImagePreview("");
        return;
      }

      try {
        setIsLoading(true);
        await createCampaign({
          name: form.name,
          title: form.title,
          description: form.description,
          target: form.target,
          deadline: form.deadline,
          image: form.image,
        });

        toast.success("Campaign created successfully!");
        navigate("/");
      } catch (err: any) {
        console.error(err);

        if (err.message?.includes("user rejected")) {
          toast.error("Transaction rejected");
        } else if (err.message?.includes("insufficient funds")) {
          toast.error("Insufficient funds for gas fees");
        } else {
          toast.error("Transaction failed. Please try again");
        }
      } finally {
        setIsLoading(false);
      }
    });
  };

  const getFraudConfig = (riskLevel: string, score: number) => {
    switch (riskLevel) {
      case "HIGH":
        return {
          label: "High Fraud Risk",
          color: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          barColor: "bg-red-500",
          indicator: "bg-red-500"
        };
      case "MEDIUM":
        return {
          label: "Medium Fraud Risk",
          color: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          barColor: "bg-yellow-500",
          indicator: "bg-yellow-500"
        };
      case "LOW":
        return {
          label: "Low Fraud Risk",
          color: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          barColor: "bg-green-500",
          indicator: "bg-green-500"
        };
      default:
        return {
          label: "Unknown",
          color: "text-gray-400",
          bg: "bg-gray-500/10",
          border: "border-gray-500/30",
          barColor: "bg-gray-500",
          indicator: "bg-gray-500"
        };
    }
  };

  const fraudConfig = fraud ? getFraudConfig(fraud.riskLevel, fraud.score) : null;

  // Calculate days until deadline
  const getDeadlineWarning = () => {
    if (!form.deadline) return null;
    const deadlineDate = new Date(form.deadline);
    const today = new Date();
    const daysDiff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return { message: "Deadline has passed", type: "error" };
    if (daysDiff <= 3) return { message: `Deadline in ${daysDiff} days`, type: "warning" };
    if (daysDiff <= 7) return { message: `Deadline in ${daysDiff} days`, type: "info" };
    return null;
  };

  const deadlineWarning = getDeadlineWarning();

  return (
    <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
      {isLoading && <Loader />}

      <div className="flex justify-between items-center w-full mb-6 pb-2 border-b border-[#3a3a43]">
        <h1 className="text-white text-xl font-bold">Start a Campaign</h1>
        <div className="text-gray-500 text-sm">Step 1 of 1</div>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        
        {/* AI Generation Section */}
        <div className="flex flex-col gap-3 p-4 bg-[#13131a] rounded-[10px] border border-[#3a3a43]">
          <div className="flex items-center justify-between">
            <label className="text-gray-400 text-sm font-medium">AI Campaign Assistant</label>
            <span className="text-gray-600 text-xs">Optional</span>
          </div>
          <div className="flex gap-3">
            <textarea
              placeholder="Describe your campaign idea... AI will help generate title & description"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={2}
              className="flex-1 p-3 rounded-lg bg-[#2c2c34] text-white placeholder-gray-500 border border-[#3a3a43] focus:outline-none focus:border-[#8c6dfd] focus:ring-1 focus:ring-[#8c6dfd] transition-all resize-none"
            />
            <button
              type="button"
              onClick={generateAI}
              disabled={loadingAI}
              className="px-6 bg-[#8c6dfd] hover:bg-[#7a5ce8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg text-white font-medium min-w-[120px]"
            >
              {loadingAI ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Generating
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>
          <p className="text-gray-600 text-xs">Generate title and description from your idea. AI will also analyze fraud risk.</p>
        </div>

        {/* Fraud Score Display */}
        {fraud && (
          <div className={`p-4 rounded-[10px] border ${fraudConfig.border} ${fraudConfig.bg} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${fraudConfig.indicator} animate-pulse`}></div>
                <span className={`text-sm font-semibold ${fraudConfig.color}`}>
                  Fraud Score
                </span>
                <span className={`text-xl font-bold ${fraudConfig.color}`}>
                  {fraud.score}
                </span>
                <span className="text-gray-500 text-sm">/ 100</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${fraudConfig.bg} ${fraudConfig.color} border ${fraudConfig.border}`}>
                {fraudConfig.label}
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-[#3a3a43] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${fraudConfig.barColor} transition-all duration-700 ease-out`}
                style={{ width: `${fraud.score}%` }}
              />
            </div>

            {fraud.reasons && fraud.reasons.length > 0 && (
              <div className="mt-3 pt-2">
                <p className="text-gray-500 text-xs mb-1">Risk factors:</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {fraud.reasons.slice(0, 3).map((reason, idx) => (
                    <span key={idx} className="text-gray-400 text-xs">• {reason}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-5">
          <FormField 
            labelName="Your Name *" 
            inputType="text" 
            value={form.name}
            placeholder="John Doe"
            handleChange={(e) => handleFormFieldChange("name", e)} 
          />

          <FormField 
            labelName="Campaign Title *" 
            inputType="text" 
            value={form.title}
            placeholder="Help me build a school in Africa"
            handleChange={(e) => handleFormFieldChange("title", e)} 
          />

          <FormField 
            labelName="Description *" 
            isTextArea 
            value={form.description}
            placeholder="Tell your story and explain why this campaign matters..."
            handleChange={(e) => handleFormFieldChange("description", e)} 
          />

          <div className="flex gap-4">
            <div className="flex-1">
              <FormField 
                labelName="Target (ETH) *" 
                inputType="number" 
                value={form.target}
                placeholder="10"
                handleChange={(e) => handleFormFieldChange("target", e)} 
              />
            </div>
            <div className="flex-1">
              <FormField 
                labelName="Deadline *" 
                inputType="date" 
                value={form.deadline}
                handleChange={(e) => handleFormFieldChange("deadline", e)} 
              />
              {deadlineWarning && (
                <p className={`text-xs mt-1 ${
                  deadlineWarning.type === "error" ? "text-red-400" :
                  deadlineWarning.type === "warning" ? "text-yellow-400" : "text-gray-500"
                }`}>
                  {deadlineWarning.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-[2]">
              <FormField 
                labelName="Image URL *" 
                inputType="url" 
                value={form.image}
                placeholder="https://example.com/image.jpg"
                handleChange={(e) => handleFormFieldChange("image", e)} 
              />
              <p className="text-gray-600 text-xs mt-1">Provide a valid image URL for your campaign cover</p>
            </div>
            {imagePreview && (
              <div className="flex-1">
                <label className="text-gray-400 text-sm mb-1 block">Preview</label>
                <div className="w-full h-[72px] rounded-lg overflow-hidden bg-[#2c2c34] border border-[#3a3a43]">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={() => setImagePreview("")}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        {form.title && form.target && (
          <div className="p-4 bg-[#13131a] rounded-[10px] border border-[#3a3a43]">
            <p className="text-gray-400 text-sm mb-2">Campaign Summary</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white font-medium">{form.title || "Untitled"}</p>
                <p className="text-gray-500 text-xs">by {form.name || "Anonymous"}</p>
              </div>
              <div className="text-right">
                <p className="text-[#8c6dfd] font-bold">{form.target || "0"} ETH</p>
                <p className="text-gray-500 text-xs">target</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col gap-2 pt-2">
          <CustomButton
            btnType="submit"
            title={
              fraud?.riskLevel === "HIGH"
                ? "Cannot Submit - High Risk Detected"
                : "Submit Campaign"
            }
            styles={`w-full py-3 font-semibold rounded-[10px] transition-all ${
              fraud?.riskLevel === "HIGH"
                ? "bg-gray-600 cursor-not-allowed opacity-50"
                : "bg-[#8c6dfd] hover:bg-[#7a5ce8] active:scale-[0.98]"
            }`}
            disabled={fraud?.riskLevel === "HIGH"}
          />

          {fraud?.riskLevel === "MEDIUM" && (
            <p className="text-yellow-500/70 text-xs text-center">
              This campaign has medium fraud risk. Please review the risk factors above before submitting.
            </p>
          )}

          {fraud?.riskLevel === "LOW" && (
            <p className="text-green-500/70 text-xs text-center">
              Low fraud risk detected. You can proceed with submission.
            </p>
          )}

          {!fraud && form.title && (
            <p className="text-gray-600 text-xs text-center">
              Use AI assistant above to analyze fraud risk before submitting.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}