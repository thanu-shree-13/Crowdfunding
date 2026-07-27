import { useState, useContext, useEffect } from "react";
import { DisplayCampaigns } from "../components/displayCampaigns";
import { StateContext } from "../contexts";
import { Loader } from "../components/loader";
import { thirdweb } from "../assets";
import { ethers } from "ethers";
import Crowdfunding from "../abi/Crowdfunding.json";

export function Profile() {
  const { address, contract, getCampaigns, searchCampaign } =
    useContext(StateContext);

  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalRaised: "0",
    activeCampaigns: 0,
    completedCampaigns: 0,
  });

  // ✅ FETCH CAMPAIGNS
  const fetchCampaigns = async () => {
    if (!address) return;

    try {
      setIsLoading(true);

      const data = await getCampaigns();

      const myCampaigns = data.filter(
        (c: any) =>
          c.owner?.toLowerCase() === address.toLowerCase()
      );

      const filtered = myCampaigns.filter((c: any) =>
        c.title.toLowerCase().includes(searchCampaign.toLowerCase())
      );

      setCampaigns(filtered);

      const totalRaised = filtered.reduce(
        (sum: number, c: any) => sum + Number(c.amountCollected),
        0
      );

      const now = Date.now();

      setStats({
        totalCampaigns: filtered.length,
        totalRaised: totalRaised.toFixed(3),
        activeCampaigns: filtered.filter(
          (c: any) => c.deadline * 1000 > now
        ).length,
        completedCampaigns: filtered.filter(
          (c: any) => c.deadline * 1000 <= now
        ).length,
      });
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 FETCH ACTIVITY (now covers all contract events, chunked to respect the RPC 10,000-block range limit)

  // Set this to the block number your contract was actually deployed at.
  // (Check the deployment tx on https://sepolia.etherscan.io0xf2B9A77491e6B47fe2265FEAC130BF78513A4402)
  const DEPLOYMENT_BLOCK = 11352580;

  const MAX_RANGE = 9000; // stay safely under the 10,000-block RPC cap

  // Queries a filter in chunks of MAX_RANGE blocks from fromBlock to toBlock,
  // so a single call never exceeds the provider's range limit.
  const queryFilterChunked = async (
    ethContract: ethers.Contract,
    filter: any,
    fromBlock: number,
    toBlock: number
  ) => {
    const allLogs: any[] = [];
    let start = fromBlock;

    while (start <= toBlock) {
      const end = Math.min(start + MAX_RANGE - 1, toBlock);
      const logs = await ethContract.queryFilter(filter, start, end);
      allLogs.push(...logs);
      start = end + 1;
    }

    return allLogs;
  };

  const fetchActivity = async () => {
    if (!contract || !address) return;

    try {
      const campaigns = await getCampaigns();

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Some ABI JSON files export the ABI directly as an array, others
      // wrap it as { abi: [...] } (e.g. Hardhat/Truffle artifacts).
      // This handles both shapes so it works regardless of your file's format.
      const abi = Array.isArray(Crowdfunding)
        ? Crowdfunding
        : (Crowdfunding as any).abi;

      const resolvedAddress = await contract.getAddress();
      console.log("Contract address in use:", resolvedAddress);

      const ethContract = new ethers.Contract(
        resolvedAddress,
        abi,
        provider
      );

      const latestBlock = await provider.getBlockNumber();
      console.log("Latest Block:", latestBlock);
      console.log("ABI:", abi);

      const fromBlock = DEPLOYMENT_BLOCK;

      // Fetch all event logs, chunked so no single request exceeds MAX_RANGE blocks
      const campaignLogs = await queryFilterChunked(
        ethContract,
        ethContract.filters.CampaignCreated(),
        fromBlock,
        latestBlock
      );
      console.log("Campaign Logs:", campaignLogs.length, campaignLogs);

      const donationLogs = await queryFilterChunked(
        ethContract,
        ethContract.filters.DonationReceived(),
        fromBlock,
        latestBlock
      );
      console.log("Donation Logs:", donationLogs.length, donationLogs);

      const withdrawLogs = await queryFilterChunked(
        ethContract,
        ethContract.filters.FundsWithdrawn(),
        fromBlock,
        latestBlock
      );
      console.log("Withdraw Logs:", withdrawLogs.length, withdrawLogs);

      const refundLogs = await queryFilterChunked(
        ethContract,
        ethContract.filters.Refunded(),
        fromBlock,
        latestBlock
      );
      console.log("Refund Logs:", refundLogs.length, refundLogs);

      const cancelLogs = await queryFilterChunked(
        ethContract,
        ethContract.filters.CampaignCancelled(),
        fromBlock,
        latestBlock
      );
      console.log("Cancel Logs:", cancelLogs.length, cancelLogs);

      // Campaign Created
      const campaignData = await Promise.all(
        campaignLogs.map(async (log: any) => {
          const { id, owner } = log.args;
          const block = await provider.getBlock(log.blockNumber);

          return {
            type: "campaign",
            user: owner,
            amount: "0",
            campaignId: id.toString(),
            txHash: log.transactionHash,
            time: block.timestamp,
          };
        })
      );

      // Donations
      const donationData = await Promise.all(
        donationLogs.map(async (log: any) => {
          const { id, donor, amount } = log.args;
          const block = await provider.getBlock(log.blockNumber);

          return {
            type: "donation",
            user: donor,
            amount: ethers.utils.formatEther(amount),
            campaignId: id.toString(),
            txHash: log.transactionHash,
            time: block.timestamp,
          };
        })
      );

      // Withdrawals
      const withdrawData = await Promise.all(
        withdrawLogs.map(async (log: any) => {
          const { id, amount } = log.args;
          const campaign = campaigns[Number(id)];
          const block = await provider.getBlock(log.blockNumber);

          return {
            type: "withdraw",
            user: campaign?.owner || "Unknown",
            amount: ethers.utils.formatEther(amount),
            campaignId: id.toString(),
            txHash: log.transactionHash,
            time: block.timestamp,
          };
        })
      );

      // Refunds
      const refundData = await Promise.all(
        refundLogs.map(async (log: any) => {
          const { donor, id, amount } = log.args;
          const block = await provider.getBlock(log.blockNumber);

          return {
            type: "refund",
            user: donor,
            amount: ethers.utils.formatEther(amount),
            campaignId: id.toString(),
            txHash: log.transactionHash,
            time: block.timestamp,
          };
        })
      );

      // Cancellations
      const cancelData = await Promise.all(
        cancelLogs.map(async (log: any) => {
          const { id, owner } = log.args;
          const block = await provider.getBlock(log.blockNumber);

          return {
            type: "cancel",
            user: owner,
            amount: "0",
            campaignId: id.toString(),
            txHash: log.transactionHash,
            time: block.timestamp,
          };
        })
      );

      // Merge everything
      let all = [
        ...campaignData,
        ...donationData,
        ...withdrawData,
        ...refundData,
        ...cancelData,
      ];

      // Show only current wallet's activity
      all = all.filter(
        (tx) =>
          tx.user &&
          tx.user.toLowerCase() === address.toLowerCase()
      );

      // Latest first
      all.sort((a, b) => b.time - a.time);

      setActivity(all);
    } catch (err) {
      console.log("Event error:", err);
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (address && contract) {
      fetchCampaigns();
      fetchActivity();
    }
  }, [address, contract]);

  if (!address || isLoading) return <Loader />;

  // Small helpers to keep the JSX below readable
  const activityLabel = (type: string) => {
    switch (type) {
      case "campaign":
        return "Campaign Created";
      case "donation":
        return "Donation Received";
      case "withdraw":
        return "Funds Withdrawn";
      case "refund":
        return "Refund Processed";
      case "cancel":
        return "Campaign Cancelled";
      default:
        return "Activity";
    }
  };

  // Plain short tag used inside the activity badge (no icons/emoji)
  const activityTag = (type: string) => {
    switch (type) {
      case "campaign":
        return "NEW";
      case "donation":
        return "IN";
      case "withdraw":
        return "OUT";
      case "refund":
        return "RFD";
      case "cancel":
        return "CXL";
      default:
        return "TX";
    }
  };

  const activityColorClasses = (type: string) => {
    switch (type) {
      case "campaign":
        return "bg-[#16241f] text-emerald-400 border border-[#22302a]";
      case "donation":
        return "bg-[#16241f] text-teal-400 border border-[#22302a]";
      case "withdraw":
        return "bg-[#16241f] text-green-400 border border-[#22302a]";
      case "refund":
        return "bg-[#16241f] text-cyan-400 border border-[#22302a]";
      case "cancel":
        return "bg-[#241616] text-red-400 border border-[#302222]";
      default:
        return "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a]";
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1512] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="rounded-2xl bg-[#131c19] border border-[#22302a] p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-emerald-400 text-xs font-mono mb-2 tracking-wider">/ PROFILE /</p>
              <h1 className="text-4xl font-bold text-white">
                Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">Manage your campaigns and track performance</p>
            </div>
            <div className="flex items-center gap-3 bg-[#111a17] rounded-full px-4 py-2 border border-[#22302a]">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400 text-sm font-mono">Sepolia Network</span>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl bg-[#131c19] border border-[#22302a] p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-[#22302a] bg-[#111a17] flex items-center justify-center">
                <img src={thirdweb} className="w-10 h-10" alt="profile" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#131c19]"></div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <p className="text-white font-mono text-lg">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </p>
                <button
                  onClick={copyAddress}
                  className="px-3 py-1 rounded-lg bg-[#1c2a25] hover:bg-[#243830] transition-colors text-xs text-gray-300 font-mono"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Web3 Creator · Rank Bronze
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl bg-[#111a17] border border-[#22302a]">
                <p className="text-2xl font-bold text-white">{stats.totalCampaigns}</p>
                <p className="text-xs text-gray-400">Campaigns</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-[#111a17] border border-[#22302a]">
                <p className="text-2xl font-bold text-green-400">{stats.totalRaised}</p>
                <p className="text-xs text-gray-400">ETH Raised</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#131c19] rounded-xl p-5 border border-[#22302a]">
            <p className="text-gray-400 text-xs font-mono mb-2">TOTAL CAMPAIGNS</p>
            <p className="text-3xl font-bold text-emerald-400">{stats.totalCampaigns}</p>
          </div>

          <div className="bg-[#131c19] rounded-xl p-5 border border-[#22302a]">
            <p className="text-gray-400 text-xs font-mono mb-2">TOTAL RAISED</p>
            <p className="text-3xl font-bold text-green-400">{stats.totalRaised} <span className="text-sm">ETH</span></p>
          </div>

          <div className="bg-[#131c19] rounded-xl p-5 border border-[#22302a]">
            <p className="text-gray-400 text-xs font-mono mb-2">ACTIVE</p>
            <p className="text-3xl font-bold text-teal-400">{stats.activeCampaigns}</p>
          </div>

          <div className="bg-[#131c19] rounded-xl p-5 border border-[#22302a]">
            <p className="text-gray-400 text-xs font-mono mb-2">COMPLETED</p>
            <p className="text-3xl font-bold text-lime-400">{stats.completedCampaigns}</p>
          </div>
        </div>

        {/* Blockchain Activity Section */}
        <div className="rounded-2xl bg-[#131c19] border border-[#22302a] overflow-hidden">
          <div className="p-6 border-b border-[#22302a]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-white text-lg font-semibold">Blockchain Activity</h3>
                <p className="text-gray-400 text-sm">On-chain transactions and events</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#16241f] text-emerald-400 text-xs font-mono border border-[#22302a]">
                {activity.length} Events
              </div>
            </div>
          </div>

          <div className="p-6">
            {activity.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1c2a25] border border-[#22302a] flex items-center justify-center">
                  <span className="text-xs text-gray-500 font-mono">TX</span>
                </div>
                <p className="text-gray-400">No blockchain transactions yet</p>
                <p className="text-gray-500 text-sm mt-1">Your on-chain activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((tx, i) => (
                  <div
                    key={i}
                    className="bg-[#0f1613] rounded-xl p-4 hover:bg-[#141f1a] transition-colors border border-[#22302a]"
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-mono font-semibold ${activityColorClasses(tx.type)}`}>
                          {activityTag(tx.type)}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {activityLabel(tx.type)}
                          </p>
                          <p className="text-gray-400 text-sm font-mono">
                            {tx.user.slice(0, 6)}...{tx.user.slice(-4)}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-1">
                            <span className="text-gray-500 text-xs">Campaign #{tx.campaignId}</span>
                            <span className="text-gray-500 text-xs">
                              {new Date(tx.time * 1000).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {Number(tx.amount) > 0 && (
                            <p className="text-green-400 font-bold">
                              {parseFloat(tx.amount).toFixed(4)} ETH
                            </p>
                          )}
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-[#1c2a25] hover:bg-[#243830] transition-colors text-green-400 text-xs font-mono"
                        >
                          View →
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Campaigns Section */}
        <div className="rounded-2xl bg-[#131c19] border border-[#22302a] p-6">
          <DisplayCampaigns
            title="Your Campaigns"
            isLoading={isLoading}
            campaigns={campaigns}
          />
        </div>
      </div>
    </div>
  );
}