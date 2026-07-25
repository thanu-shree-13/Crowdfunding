import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/home";
import { Sidebar } from "./components/sidebar";
import { Navbar } from "./components/navbar";
import { CreateCampaign } from "./pages/createCampaign";
import { Profile } from "./pages/profile";
import { CampaignDetails } from "./pages/campaignDetails";
import { Payment } from "./pages/Payment";
import { Withdraw } from "./pages/Withdraw";

function App() {
  return (
    <div className="relative flex flex-row p-4 sm:px-8 bg-gradient-to-br from-teal-800 via-slate-900 to-slate-950 min-h-screen text-gray-200">
      
      {/* Sidebar */}
      <div className="hidden sm:flex mr-10 relative">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-[1280px] mx-auto w-full">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/campaign-details/:id" element={<CampaignDetails />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/withdraw" element={<Withdraw />} />
        
        </Routes>
      </div>
    </div>
  );
}

export default App;