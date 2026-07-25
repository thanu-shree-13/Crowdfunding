import { useContext, useEffect, useState } from "react";
import { StateContext } from "../contexts";
import { DisplayCampaigns } from "../components/displayCampaigns";
import { Loader } from "../components/loader";

type ParsedCampaign = {
  owner: string;
  title: string;
  description: string;
  target: string;
  deadline: number;
  amountCollected: string;
  image: string;
  pId: string;
  donators: string[];
};

export function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([] as ParsedCampaign[]);

  const context = useContext(StateContext);

  const address = context?.address;
  const contract = context?.contract;
  const getCampaigns = context?.getCampaigns;
  const getDonations = context?.getDonations;
  const searchCampaign = context?.searchCampaign || "";

  async function fetchCampaigns() {
    try {
      if (!getCampaigns || !getDonations) {
        console.log("Context not ready");
        return;
      }

      setIsLoading(true);

      const data = await getCampaigns();

      const filteredData = data.filter((campaign) =>
        campaign.title
          .toLowerCase()
          .includes(searchCampaign.toLowerCase())
      );

      const campaignsWithDonators = await Promise.all(
        filteredData.map(async (campaign) => {
          try {
            const donations: any = await getDonations(campaign.pId);

            const donators =
              donations && donations[0] ? donations[0] : [];

            return { ...campaign, donators };
          } catch {
            return { ...campaign, donators: [] };
          }
        })
      );

      setCampaigns(campaignsWithDonators);
    } catch (error) {
      console.error("FETCH ERROR:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!contract) return;
    fetchCampaigns();
  }, [contract, address, searchCampaign]);

  if (!address) {
    return (
      <h1 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        Please connect your wallet 
      </h1>
    );
  }

  if (!contract || isLoading) {
    return <Loader />;
  }

  if (!campaigns.length) {
    return (
      <h1 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        No Campaigns Found 
      </h1>
    );
  }

  return (
    <DisplayCampaigns
      title="All Campaigns"
      isLoading={isLoading}
      campaigns={campaigns}
    />
  );
}