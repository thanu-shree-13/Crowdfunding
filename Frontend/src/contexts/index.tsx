import {
  SmartContract,
  useAddress,
  useConnect,
  useContract,
  useContractWrite,
  useDisconnect,
} from "@thirdweb-dev/react";
import { BaseContract, ethers } from "ethers";
import {
  ReactNode,
  SetStateAction,
  createContext,
  useState,
  useCallback,
} from "react";
import Crowdfunding from "../abi/Crowdfunding.json";

type ParsedCampaign = {
  owner: string;
  title: string;
  description: string;
  target: string;
  deadline: number;
  amountCollected: string;
  withdrawableAmount: string;
  fraudScore: number;
  isFlagged: boolean;
  image: string;
  pId: string;
};

export type StateContextType = {
  address: string | undefined;
  contract: SmartContract<BaseContract> | undefined;
  connect: any;
  disconnect: () => Promise<void>;
  createCampaign: any;
  getCampaigns: () => Promise<ParsedCampaign[]>;
  getUserCampaigns: () => Promise<ParsedCampaign[]>;
  donate: (pId: string, amount: string) => Promise<any>;
  withdraw: (pId: string) => Promise<any>;
  getDonations: (pId: string) => Promise<any>;
  searchCampaign: string;
  setSearchCampaign: (search: SetStateAction<string>) => void;
  refreshCampaigns: () => Promise<void>;
};

export const StateContext = createContext<StateContextType>({
  address: undefined,
  contract: undefined,
  connect: () => {},
  disconnect: async () => {},
  createCampaign: async () => {},
  getCampaigns: async () => [],
  getUserCampaigns: async () => [],
  donate: async () => {},
  withdraw: async () => {},
  getDonations: async () => [[], []],
  searchCampaign: "",
  setSearchCampaign: () => {},
  refreshCampaigns: async () => {},
});

export function StateContextProvider({ children }: { children: ReactNode }) {
  const { contract } = useContract(
    "0x472c5F063087330b8fd9ca6B5b6E60033699879C",
    Crowdfunding
  );

  const { mutateAsync: createCampaignMutation } = useContractWrite(
    contract,
    "createCampaign"
  );

  const address = useAddress();
  const connect = useConnect();
  const disconnect = useDisconnect();

  const [searchCampaign, setSearchCampaign] = useState("");

  // ✅ DONATIONS
  const getDonations = async (pId: string) => {
    try {
      if (!contract) return [[], []];

      return await contract.call("getDonatorsPaginated", [
        Number(pId),
        0,
        100,
      ]);
    } catch (err) {
      console.log(err);
      return [[], []];
    }
  };

  // ✅ GET CAMPAIGNS
  const getCampaigns = useCallback(async () => {
    try {
      if (!contract) return [];

      const data = await contract.call("getCampaigns");

      return data.map((c: any, i: number) => ({
        owner: c.owner,
        title: c.title,
        description: c.description,
        target: ethers.utils.formatEther(c.target),
        amountCollected: ethers.utils.formatEther(c.amountCollected),
        withdrawableAmount: ethers.utils.formatEther(
          c.withdrawableAmount
        ),
        fraudScore: Number(c.fraudScore),
        isFlagged: c.isFlagged,
        deadline: Number(c.deadline),
        image: c.image,
        pId: i.toString(),
      }));
    } catch (err) {
      console.log(err);
      return [];
    }
  }, [contract]);

  // ✅ USER CAMPAIGNS
  const getUserCampaigns = async () => {
    if (!address) return [];

    const campaigns = await getCampaigns();

    return campaigns.filter(
      (c) => c.owner.toLowerCase() === address.toLowerCase()
    );
  };

  const refreshCampaigns = async () => {
    await getCampaigns();
  };

  // ✅ DONATE
  const donate = async (pId: string, amount: string) => {
    if (!contract) throw new Error("No contract");

    const value = ethers.utils.parseEther(amount);

    const data = await contract.call("donateToCampaign", [Number(pId)], {
      value,
    });

    await refreshCampaigns();
    return data;
  };

  // ✅ WITHDRAW
  const withdraw = async (pId: string) => {
    if (!contract) throw new Error("No contract");

    const data = await contract.call("withdraw", [Number(pId)]);

    await refreshCampaigns();
    return data;
  };

  // ✅ CREATE (FIXED)
  const createCampaign = async (form: any) => {
    const target = ethers.utils.parseEther(form.target);
    const deadline = Math.floor(new Date(form.deadline).getTime() / 1000);

    const data = await createCampaignMutation({
      args: [
        form.title,
        form.description,
        target,
        deadline,
        form.image,
      ],
    });

    await refreshCampaigns();
    return data;
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        disconnect,
        createCampaign,
        getCampaigns,
        getUserCampaigns,
        donate,
        withdraw,
        getDonations,
        searchCampaign,
        setSearchCampaign,
        refreshCampaigns,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}