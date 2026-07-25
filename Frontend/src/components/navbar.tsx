import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logo, menu, search, thirdweb } from "../assets";
import { CustomButton } from "./customButton";
import { navlinks } from "../constants";
import { StateContext } from "../contexts";
import { metamaskWallet } from "@thirdweb-dev/react";

export function Navbar() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState("dashboard");
  const [toggleDrawer, setToggleDrawer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { address, connect, searchCampaign, setSearchCampaign } =
    useContext(StateContext);

  const handleCreateClick = () => {
    if (address) {
      navigate("/create-campaign");
    }
  };

  const handleConnectClick = () => {
    connect(metamaskWallet());
  };

  return (
    <div className="flex md:flex-row flex-col-reverse justify-between mb-[35px] gap-6">
      
      {/* Search */}
      <div className="lg:flex-1 flex flex-row max-w-[458px] py-2 pl-4 pr-2 h-[52px] bg-[#1c1c24] rounded-[100px] transition-all duration-300 hover:bg-[#23232b] focus-within:ring-2 focus-within:ring-[#4acd8d]">
        <input
          type="text"
          placeholder="Search for campaigns..."
          className="flex w-full font-epilogue font-normal text-[14px] placeholder:text-[#4b5264] text-white bg-transparent outline-none"
          value={searchCampaign}
          onChange={(e) => setSearchCampaign(e.target.value)}
        />
        <div className="w-[72px] h-full rounded-[20px] bg-[#4acd8d] flex justify-center items-center cursor-pointer transition-all duration-300 hover:bg-[#3bb77a] hover:scale-105 active:scale-95">
          <img src={search} alt="search" className="w-[15px] h-[15px]" />
        </div>
      </div>

      {/* Desktop */}
      <div className="sm:flex hidden flex-row justify-end gap-4">
        {!address ? (
          <CustomButton
            btnType="button"
            title="Connect Wallet"
            styles="bg-gradient-to-r from-[#8c6dfd] to-[#6c4ef8] hover:from-[#7a5cfd] hover:to-[#5c3ef8] transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            handleClick={handleConnectClick}
          />
        ) : (
          <div className="relative group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <CustomButton
              btnType="button"
              title="Create Campaign"
              styles="bg-gradient-to-r from-[#1dc071] to-[#16a34a] hover:from-[#1fcf7a] hover:to-[#15803d] transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center gap-2"
              handleClick={handleCreateClick}
            />
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded-lg py-1 px-3 whitespace-nowrap">
                Launch your crowdfunding campaign ✨
              </div>
            </div>
          </div>
        )}

        <Link to="/profile">
          <div className="w-[52px] h-[52px] rounded-full bg-[#2c2f32] flex justify-center items-center cursor-pointer transition-all duration-300 hover:bg-[#3a3a43] hover:scale-110 active:scale-95">
            <img src={thirdweb} alt="user" className="w-[60%] h-[60%]" />
          </div>
        </Link>
      </div>

      {/* Mobile */}
      <div className="sm:hidden flex justify-between items-center relative">
        <div className="w-[40px] h-[40px] rounded-[10px] bg-[#2c2f32] flex justify-center items-center transition-all duration-300 hover:bg-[#3a3a43]">
          <img src={logo} alt="logo" className="w-[60%] h-[60%]" />
        </div>

        <img
          src={menu}
          alt="menu"
          className="w-[34px] h-[34px] cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
          onClick={() => setToggleDrawer((prev) => !prev)}
        />

        <div
          className={`absolute top-[60px] right-0 left-0 bg-[#1c1c24] z-10 shadow-secondary py-4 rounded-2xl ${
            !toggleDrawer ? "-translate-y-[100vh] opacity-0" : "translate-y-0 opacity-100"
          } transition-all duration-500 ease-in-out`}
        >
          <ul className="mb-4">
            {navlinks.map((link) => (
              <li
                key={link.name}
                className={`flex p-4 cursor-pointer transition-all duration-300 ${
                  isActive === link.name 
                    ? "bg-[#3a3a43] border-l-4 border-[#1dc071]" 
                    : "hover:bg-[#2c2f32]"
                }`}
                onClick={() => {
                  setIsActive(link.name);
                  setToggleDrawer(false);
                  navigate(link.link);
                }}
              >
                <img
                  src={link.imgUrl}
                  alt={link.name}
                  className={`w-[24px] h-[24px] transition-all duration-300 ${
                    isActive === link.name ? "scale-110" : "grayscale"
                  }`}
                />
                <p
                  className={`ml-[20px] font-epilogue font-semibold text-[14px] transition-all duration-300 ${
                    isActive === link.name
                      ? "text-[#1dc071]"
                      : "text-[#808191]"
                  }`}
                >
                  {link.name}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex mx-4">
            {!address ? (
              <CustomButton
                btnType="button"
                title="Connect Wallet"
                styles="bg-gradient-to-r from-[#8c6dfd] to-[#6c4ef8] hover:from-[#7a5cfd] hover:to-[#5c3ef8] transition-all duration-300 hover:scale-105 active:scale-95 w-full shadow-lg"
                handleClick={handleConnectClick}
              />
            ) : (
              <CustomButton
                btnType="button"
                title="✨ Create Campaign"
                styles="bg-gradient-to-r from-[#1dc071] to-[#16a34a] hover:from-[#1fcf7a] hover:to-[#15803d] transition-all duration-300 hover:scale-105 active:scale-95 w-full shadow-lg"
                handleClick={handleCreateClick}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}