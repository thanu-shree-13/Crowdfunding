import { tagType, thirdweb } from "../assets";
import { daysLeft } from "../utils";

type ParsedCampaign = {
  owner: string;
  title: string;
  description: string;
  target: string;
  deadline: number;
  amountCollected: string;
  image: string;
  pId: string;
  donators?: string[];
  isActive?: boolean;
};

type FundCardProps = ParsedCampaign & {
  handleClick: () => void;
  isLoading?: boolean;
};

export function FundCard({
  owner,
  title,
  description,
  target,
  deadline,
  amountCollected,
  image,
  handleClick,
  donators = [],
  isLoading = false,
  isActive = true,
}: FundCardProps) {

  const remainingDays = daysLeft(deadline);
  const totalDonators = donators.length;
  const isCampaignActive = isActive && remainingDays > 0;

  // ✅ FIXED: values already in ETH string → just convert
  const collectedInETH = Number(amountCollected);
  const targetInETH = Number(target);

  const progress =
    targetInETH > 0
      ? Math.min((collectedInETH / targetInETH) * 100, 100)
      : 0;

  const formatAmount = (value: string) => {
    const num = Number(value);
    if (!num) return "0";
    return num.toFixed(3);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "Unknown";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const recentDonors = donators.slice(0, 3);

  return (
    <div
      onClick={isCampaignActive ? handleClick : undefined}
      className={`group sm:w-[280px] w-full rounded-xl bg-[#1c1c24]
        ${isCampaignActive ? "cursor-pointer hover:scale-[1.03]" : "opacity-70 cursor-not-allowed"}
        transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden`}
    >
      {/* IMAGE */}
      <div className="relative w-full h-[160px] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

        {!isCampaignActive && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-semibold">
            {remainingDays <= 0 ? "Campaign Ended" : "Inactive"}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4 flex flex-col gap-2">

        {/* CATEGORY */}
        <div className="flex items-center gap-2 text-[#808191] text-xs">
          <img src={tagType} className="w-4 h-4" />
          Education
        </div>

        {/* TITLE */}
        <h3 className="text-white font-semibold text-sm line-clamp-2">
          {title}
        </h3>

        {/* DESCRIPTION */}
        <p className="text-[#808191] text-xs line-clamp-2">
          {description}
        </p>

        {/* PROGRESS */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-[#808191] mb-1">
            <span>Progress</span>
            <span className="text-[#1dc071] font-semibold">
              {progress.toFixed(1)}%
            </span>
          </div>

          <div className="w-full h-[6px] bg-[#2c2f32] rounded-full">
            <div
              className="h-full bg-[#1dc071] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* STATS */}
        <div className="flex justify-between mt-2">
          <div>
            <p className="text-white text-sm font-semibold">
              {formatAmount(amountCollected)} ETH
            </p>
            <p className="text-[#808191] text-xs">
              of {formatAmount(target)} ETH
            </p>
          </div>

          <div className="text-right">
            <p className={`text-sm font-semibold ${remainingDays <= 0 ? "text-red-500" : "text-white"}`}>
              {remainingDays <= 0 ? "Ended" : remainingDays}
            </p>
            <p className="text-[#808191] text-xs">
              {remainingDays <= 0 ? "Closed" : "Days Left"}
            </p>
          </div>
        </div>

        {/* DONATORS */}
        <div className="mt-2">
          <p className="text-[#808191] text-xs mb-1">
            Supporters ({totalDonators})
          </p>

          {isLoading ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : totalDonators > 0 ? (
            <div className="space-y-1">
              {recentDonors.map((d, i) => (
                <p key={i} className="text-xs text-[#b2b3bd]">
                  {formatAddress(d)}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#808191]">
              No supporters yet
            </p>
          )}
        </div>

        {/* OWNER */}
        <div className="flex items-center gap-2 mt-2">
          <img src={thirdweb} className="w-6 h-6 rounded-full" />
          <p className="text-xs text-white truncate">
            {formatAddress(owner)}
          </p>
        </div>

      </div>
    </div>
  );
}