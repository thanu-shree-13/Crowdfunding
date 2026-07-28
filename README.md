# CrowdFunding — Decentralized Crowdfunding Platform

A full-stack Web3 crowdfunding platform built on Ethereum, featuring on-chain escrow logic, rule-based fraud detection, and AI-assisted campaign creation. Donors fund campaigns directly via MetaMask, with automatic refunds for unsuccessful campaigns and secure withdrawal for successful ones — all enforced by the smart contract, not a backend.

**Live on:** Sepolia Testnet

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Fraud Detection Logic](#fraud-detection-logic)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- **Create Campaigns** — set a title, description, funding target, deadline, and cover image
- **MetaMask Wallet Integration** — connect wallet to create campaigns, donate, and manage funds
- **Donate with ETH** (Sepolia Testnet) — direct on-chain donations, no intermediary
- **Secure Withdrawal** — campaign owners withdraw funds only after the funding threshold is met, protected by a reentrancy guard
- **Automatic Refunds** — donors can reclaim funds if a campaign fails to reach its threshold or is flagged
- **Rule-Based Fraud Detection** — every campaign is scored on creation using weighted risk factors, with a visible score and flag status
- **AI-Generated Campaign Descriptions** — describe your idea in a sentence; AI drafts a title, full description, and an initial fraud risk read
- **Blockchain Transaction History** — full on-chain activity feed (donations, withdrawals, campaign creation) per user
- **User Profile Dashboard** — track campaigns created, total raised, and on-chain activity in one place
- **Inactive/Completed Campaigns View** — campaigns that hit their deadline are automatically separated from active ones
- **Transparent by Design** — campaign and donation data is stored and verifiable on-chain

---

## Screenshots

> Screenshots are stored in the `Screenshots/` folder of this repo, referenced below by their original filenames.

### Homepage
![Homepage](Screenshots/Screenshot%20(1075).png)

### Creating a Campaign (AI-Assisted)
Describe a campaign idea in plain language — the AI assistant generates a title and description, and produces a live fraud-risk score with visible risk factors.

![Create Campaign](Screenshots/Screenshot%20(1076).png)
![AI-Generated Description & Fraud Score](Screenshots/Screenshot%20(1077).png)
![AI-Generated Description — Full](Screenshots/Screenshot%20(1078).png)

### On-Chain Campaign Creation
Campaign metadata is written on-chain via a MetaMask transaction.

![MetaMask — Create Campaign](Screenshots/Screenshot%20(1079).png)

### Campaign Details & Funding
![Campaign Details](Screenshots/Screenshot%20(1080).png)
![MetaMask — Donate to Campaign](Screenshots/Screenshot%20(1081).png)
![Post-Donation Fraud Score](Screenshots/Screenshot%20(1082).png)
![Blockchain Verification](Screenshots/Screenshot%20(1086).png)

### Browse Campaigns
![All Campaigns](Screenshots/Screenshot%20(1088).png)

### Withdraw & Refund
![Withdraw Dashboard — Active](Screenshots/Screenshot%20(1092).png)
![Withdraw Dashboard — Successful Campaign](Screenshots/Screenshot%20(1102).png)
![MetaMask — Withdraw Confirmation](Screenshots/Screenshot%20(1103).png)
![Withdrawal Successful](Screenshots/Screenshot%20(1104).png)
*(Refund flow screenshot pending — will be added after testing.)*

### User Dashboard
![Profile Dashboard](Screenshots/Screenshot%20(1096).png)

### Blockchain Transaction History
![Transaction History](Screenshots/Screenshot%20(1105).png)

### Inactive / Completed Campaigns
![Inactive Campaigns](Screenshots/Screenshot%20(1106).png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity ^0.8.20, OpenZeppelin (`ReentrancyGuard`, `Ownable`, `Pausable`) |
| Blockchain Network | Ethereum — Sepolia Testnet |
| Wallet Integration | MetaMask |
| Frontend | React (Vite) |
| AI Layer | AI-assisted title/description generation + fraud risk analysis |

---

## Smart Contract Architecture

The core contract (`Crowdfunding.sol`) manages the full campaign lifecycle:

- **`createCampaign()`** — validates inputs, computes an on-chain fraud score, and stores the campaign
- **`donateToCampaign()`** — accepts ETH donations, blocked for flagged or expired campaigns, protected against reentrancy
- **`withdraw()`** — releases funds to the campaign owner only after the deadline passes and **80% of the funding target** is reached; follows checks-effects-interactions to prevent reentrancy
- **`refund()`** — lets donors reclaim funds if a campaign fails to hit the threshold, is flagged, or is cancelled
- **`cancelCampaign()`** — allows an owner to cancel a campaign before any donations are received
- **Admin controls** — `pause()` / `unpause()` for emergency stops, and `setFlagged()` for manual review overrides

All state-changing functions emit events (`CampaignCreated`, `DonationReceived`, `FundsWithdrawn`, `Refunded`, `CampaignCancelled`, `FlagUpdated`) for full on-chain traceability.

---

## Fraud Detection Logic

Every campaign is scored (0–100) at creation time using weighted heuristics:

| Risk Factor | Points |
|---|---|
| Funding target > 5 ETH | +30 |
| Deadline within 1 day of creation | +30 |
| Description under 30 characters | +20 |
| No campaign image provided | +10 |
| Funding target > 50 ETH | +10 |

Campaigns scoring **50 or above** are automatically flagged and blocked from receiving donations until reviewed. The AI assistant performs a similar risk read on the campaign idea before submission, surfacing specific risk factors (e.g. "no specific details about amount, location, or timeline") so creators can improve their pitch before it goes on-chain.

---

## Getting Started

### Prerequisites
- Node.js and npm
- MetaMask browser extension
- Sepolia testnet ETH ([faucet links])

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

# Install frontend dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your contract address, RPC URL, and AI API key

# Run the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Smart Contract Deployment

```bash
# From the contracts directory
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

---

## How It Works

1. Connect your MetaMask wallet to the platform.
2. Create a campaign — optionally use the AI assistant to draft your title and description.
3. Your campaign is scored for fraud risk on-chain at creation.
4. Donors browse campaigns and fund them directly with Sepolia ETH.
5. If a campaign reaches 80% of its target by the deadline, the owner can withdraw funds.
6. If it doesn't, donors can claim a full refund.
7. All transactions are recorded and viewable on-chain.
8. Expired or completed campaigns move automatically to the Inactive Campaigns section.
9. Users can view their profile to track campaigns, donations, and blockchain transaction history.
10. Expired or completed campaigns are automatically displayed in the Inactive Campaigns section.

---

## Known Limitations

- `getCampaigns()` returns the full campaign list without pagination — fine at small scale, would need pagination in production.
- Fraud scoring is a one-time snapshot computed at creation and uses simple heuristics rather than behavioral analysis over time.
- Cancellation is only permitted before any donations are received, which narrows when the cancellation-refund path applies.
- Testnet only — production deployment would require additional gas optimization and a security audit.

---

## Roadmap

- [ ] Paginated campaign listing
- [ ] Multisig/timelock admin controls
- [ ] Expanded fraud detection using donor pattern analysis
- [ ] Mainnet deployment considerations

---


## Author

Built by [Your Name] as a final-year project.
