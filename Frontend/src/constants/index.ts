import {
  dashboard,
  createCampaign,
  profile,
  logout,
  payment,
  withdraw,
} from "../assets";

export const navlinks = [
  {
    name: "dashboard",
    imgUrl: dashboard,
    link: "/",
  },
  {
    name: "create-campaign",
    imgUrl: createCampaign,
    link: "/create-campaign",
  },
  {
    name: "withdraw",        // ✅ ADD THIS
    imgUrl: withdraw,
    link: "/withdraw",
  },
  {
    name: "payment",         // ✅ ADD THIS
    imgUrl: payment,
    link: "/payment",
  },
  {
    name: "profile",
    imgUrl: profile,
    link: "/profile",
  },
  {
    name: "logout",
    imgUrl: logout,
    link: "/",
  },
];