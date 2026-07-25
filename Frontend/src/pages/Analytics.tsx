import { useContext, useEffect, useState } from "react";
import { StateContext } from "../contexts";
import { Loader } from "../components/loader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function Analytics() {
  const { getCampaigns, contract } = useContext(StateContext);

  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [pieData, setPieData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const campaigns = await getCampaigns();

      if (!Array.isArray(campaigns)) return;

      let totalRaised = 0;
      let success = 0;
      let failed = 0;

      let topCampaign = { amount: 0, title: "None" };

      const chartData = campaigns.map((c: any, i: number) => {
        const raised = Number(c.amountCollected || 0);
        const target = Number(c.target || 0);

        totalRaised += raised;

        if (raised >= target && target > 0) success++;
        else failed++;

        if (raised > topCampaign.amount) {
          topCampaign = {
            amount: raised,
            title: c.title,
          };
        }

        return {
          name: `C${i + 1}`,
          raised,
          target,
        };
      });

      // 🔥 EVENTS FOR WITHDRAW vs REFUND
      let withdrawCount = 0;
      let refundCount = 0;

      try {
        const provider = new (await import("ethers")).ethers.providers.Web3Provider(window.ethereum);
        const ethContract = new (await import("ethers")).ethers.Contract(
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

        withdrawCount = withdrawLogs.length;
        refundCount = refundLogs.length;
      } catch {
        console.log("Event fetch skipped");
      }

      const avgDonation =
        campaigns.length > 0
          ? totalRaised / campaigns.length
          : 0;

      setStats({
        totalRaised: totalRaised.toFixed(3),
        successRate:
          campaigns.length > 0
            ? ((success / campaigns.length) * 100).toFixed(1)
            : "0",
        avgDonation: avgDonation.toFixed(3),
        totalCampaigns: campaigns.length,
        topCampaign: topCampaign.title,
      });

      setPieData([
        { name: "Withdraw", value: withdrawCount },
        { name: "Refund", value: refundCount },
      ]);

      setData(chartData);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <div className="p-6 min-h-screen bg-[#0f0f14] text-white">

      <h1 className="text-3xl font-bold mb-6">
        📊 Analytics Dashboard
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card title="Total Raised" value={`${stats.totalRaised} ETH`} color="text-green-400"/>
        <Card title="Success Rate" value={`${stats.successRate}%`} color="text-blue-400"/>
        <Card title="Avg Donation" value={`${stats.avgDonation} ETH`} color="text-purple-400"/>
        <Card title="Campaigns" value={stats.totalCampaigns} />
        <Card title="Top Campaign" value={stats.topCampaign} />
      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* LINE */}
        <ChartBox title="ETH Raised Trend">
          <LineChart data={data}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="name" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Line dataKey="raised" stroke="#4ade80" strokeWidth={3} />
          </LineChart>
        </ChartBox>

        {/* BAR */}
        <ChartBox title="Raised vs Target">
          <BarChart data={data}>
            <CartesianGrid stroke="#333" />
            <XAxis dataKey="name" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Bar dataKey="raised" fill="#60a5fa" />
            <Bar dataKey="target" fill="#f87171" />
          </BarChart>
        </ChartBox>
      </div>

      {/* PIE */}
      <div className="mt-8 bg-[#1f1f2e] p-6 rounded-xl">
        <h3 className="mb-4">Withdraw vs Refund</h3>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" outerRadius={100}>
              <Cell fill="#22c55e" />
              <Cell fill="#ef4444" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 🔥 SMALL COMPONENTS

const Card = ({ title, value, color = "text-white" }: any) => (
  <div className="bg-[#1f1f2e] p-4 rounded-xl">
    <p className="text-gray-400 text-sm">{title}</p>
    <p className={`text-lg font-bold ${color}`}>{value}</p>
  </div>
);

const ChartBox = ({ title, children }: any) => (
  <div className="bg-[#1f1f2e] p-6 rounded-xl">
    <h3 className="mb-4">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      {children}
    </ResponsiveContainer>
  </div>
);