import { useState, useContext, useEffect } from "react";
import { DisplayCampaigns } from "../components/displayCampaigns";
import { StateContext } from "../contexts";
import { Loader } from "../components/loader";
import { thirdweb } from "../assets";
import { ethers } from "ethers";

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

  // 🔥 FETCH ACTIVITY
  const fetchActivity = async () => {
    if (!contract || !address) return;

    try {
      const campaigns = await getCampaigns();

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const ethContract = new ethers.Contract(
        contract.getAddress(),
        contract.abi,
        provider
      );

      const withdrawLogs = await ethContract.queryFilter(
        ethContract.filters.FundsWithdrawn(),
        0,
        "latest"
      );

      const refundLogs = await ethContract.queryFilter(
        ethContract.filters.Refunded(),
        0,
        "latest"
      );

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

      let all = [...withdrawData, ...refundData];
      all = all.filter(
        (tx) =>
          tx.user &&
          tx.user.toLowerCase() === address.toLowerCase()
      );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#13131f] to-[#1a1a2e] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e1e2e] to-[#2a2a3e] border border-[#2a2a3e] p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-purple-400 text-xs font-mono mb-2 tracking-wider">/ PROFILE /</p>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">Manage your campaigns and track performance</p>
            </div>
            <div className="flex items-center gap-3 bg-[#1a1a2e] rounded-full px-4 py-2 border border-[#2a2a3e]">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-green-400 text-sm font-mono">Sepolia Network</span>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#2a2a3e] p-6 transition-all duration-300 hover:border-purple-500/30">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-full bg-[#1a1a2e] flex items-center justify-center">
                  <img src={thirdweb} className="w-10 h-10" alt="profile" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1a2e]"></div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <p className="text-white font-mono text-lg">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </p>
                <button
                  onClick={copyAddress}
                  className="px-3 py-1 rounded-lg bg-[#2a2a3e] hover:bg-[#3a3a4e] transition-colors text-xs text-gray-400 font-mono"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <p className="text-purple-400 text-sm mt-2 flex items-center gap-1 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Web3 Creator · Rank Bronze
              </p>
            </div>
            
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e]">
                <p className="text-2xl font-bold text-white">{stats.totalCampaigns}</p>
                <p className="text-xs text-gray-400">Campaigns</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e]">
                <p className="text-2xl font-bold text-green-400">{stats.totalRaised}</p>
                <p className="text-xs text-gray-400">ETH Raised</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-[#2a2a3e] hover:border-purple-500/30 transition-all">
            <p className="text-gray-400 text-xs font-mono mb-2">TOTAL CAMPAIGNS</p>
            <p className="text-3xl font-bold text-purple-400">{stats.totalCampaigns}</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-[#2a2a3e] hover:border-green-500/30 transition-all">
            <p className="text-gray-400 text-xs font-mono mb-2">TOTAL RAISED</p>
            <p className="text-3xl font-bold text-green-400">{stats.totalRaised} <span className="text-sm">ETH</span></p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-[#2a2a3e] hover:border-blue-500/30 transition-all">
            <p className="text-gray-400 text-xs font-mono mb-2">ACTIVE</p>
            <p className="text-3xl font-bold text-blue-400">{stats.activeCampaigns}</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl p-5 border border-[#2a2a3e] hover:border-orange-500/30 transition-all">
            <p className="text-gray-400 text-xs font-mono mb-2">COMPLETED</p>
            <p className="text-3xl font-bold text-orange-400">{stats.completedCampaigns}</p>
          </div>
        </div>

        {/* Blockchain Activity Section */}
        <div className="rounded-2xl bg-[#1a1a2e] border border-[#2a2a3e] overflow-hidden">
          <div className="p-6 border-b border-[#2a2a3e]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-white text-lg font-semibold">Blockchain Activity</h3>
                <p className="text-gray-400 text-sm">On-chain transactions and events</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-mono border border-purple-500/20">
                {activity.length} Events
              </div>
            </div>
          </div>

          <div className="p-6">
            {activity.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2a2a3e] flex items-center justify-center">
                  <span className="text-2xl">📡</span>
                </div>
                <p className="text-gray-400">No blockchain transactions yet</p>
                <p className="text-gray-500 text-sm mt-1">Your on-chain activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((tx, i) => (
                  <div
                    key={i}
                    className="bg-[#13131f] rounded-xl p-4 hover:bg-[#1a1a2a] transition-all border border-[#2a2a3e] hover:border-purple-500/30"
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                          tx.type === "withdraw" 
                            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}>
                          {tx.type === "withdraw" ? "💰" : "🔄"}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {tx.type === "withdraw" ? "Funds Withdrawn" : "Refund Processed"}
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
                          <p className="text-green-400 font-bold">
                            {parseFloat(tx.amount).toFixed(4)} ETH
                          </p>
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-[#2a2a3e] hover:bg-[#3a3a4e] transition-colors text-blue-400 text-xs font-mono"
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
        <div className="rounded-2xl bg-[#1a1a2e] border border-[#2a2a3e] p-6">
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