# CrowdFunding – Fraud-Aware Decentralized Crowdfunding Platform

A full-stack decentralized crowdfunding platform built on **Ethereum Sepolia** that enables secure, transparent fundraising through smart contracts. The platform combines **AI-assisted campaign creation**, **rule-based fraud detection**, and **on-chain fund management** to improve trust between campaign creators and donors.

---

# Features

- Create crowdfunding campaigns with title, description, funding target, deadline, and image.
- MetaMask wallet integration.
- Secure ETH donations on Ethereum Sepolia.
- Smart contract–based fund management.
- Automatic refunds for failed campaigns.
- Secure withdrawals after funding goals are reached.
- AI-generated campaign title and description.
- AI-assisted fraud risk analysis.
- Rule-based blockchain fraud detection.
- User dashboard with campaign statistics.
- Transaction history.
- Active and inactive campaign management.
- Fully transparent on-chain operations.

---

# Screenshots

## Homepage

Users can browse active campaigns and connect their MetaMask wallet.

![Homepage](Screenshots/01-homepage.png)

---

## AI-Assisted Campaign Creation

Users describe their idea and AI generates a professional title, detailed description, and fraud analysis.

![Create Campaign](Screenshots/02-create-campaign.png)

![AI Description](Screenshots/03-ai-fraud-score-1.png)

![Fraud Analysis](Screenshots/03-ai-fraud-score-2.png)

---

## MetaMask Campaign Creation

Campaign creation is confirmed through MetaMask before being stored on-chain.

![MetaMask Create](Screenshots/04-metamask-create.png)

---

## Campaign Details

Campaign page showing progress, details, and secure donation functionality.

![Campaign Details](Screenshots/05-campaign-details.png)

![MetaMask Donate](Screenshots/06-metamask-donate.png)

![Fraud Verification](Screenshots/07-fraud-verified-1.png)

![Verification Complete](Screenshots/07-fraud-verified-2.png)

---

## Browse Campaigns

Browse all active campaigns with funding progress and fraud status.

![Campaign List](Screenshots/08-all-campaigns.png)

---

## Withdraw Dashboard

Campaign owners can withdraw funds after reaching the funding threshold.

![Withdraw Dashboard](Screenshots/09-withdraw-dashboard.png)

> Refund workflow screenshots will be added after final testing.

---

## User Dashboard

Displays user profile, campaigns created, donations, funds raised, and blockchain activity.

![User Dashboard](Screenshots/10-user-dashboard.png)

---

## Successful Withdrawal

Withdrawal confirmation through MetaMask.

![Withdraw Confirm](Screenshots/11-withdraw-confirm.png)

![MetaMask Withdrawal](Screenshots/11-withdraw-metamask.png)

![Withdrawal Success](Screenshots/11-withdraw-success.png)

---

## Transaction History

Complete blockchain transaction history including donations, withdrawals, refunds, and campaign creation.

![Transaction History](Screenshots/12-transaction-history.png)

---

## Inactive Campaigns

Campaigns automatically move here after expiration or completion.

![Inactive Campaigns](Screenshots/13-inactive-campaigns.png)

---

# Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Smart Contract | Solidity |
| Blockchain | Ethereum Sepolia |
| Wallet | MetaMask |
| AI | Gemini API |
| Styling | CSS |
| Deployment | Hardhat |

---

# Smart Contract Features

- Create Campaign
- Donate
- Withdraw
- Refund
- Cancel Campaign
- Fraud Detection
- Emergency Pause
- Event Logging
- Reentrancy Protection

---

# Fraud Detection

Campaigns receive a fraud score during creation.

| Rule | Score |
|------|-------|
| Target > 5 ETH | +30 |
| Deadline within 1 day | +30 |
| Description < 30 chars | +20 |
| No image | +10 |
| Target > 50 ETH | +10 |

Campaigns with a score of **50 or more** are automatically flagged.

---

# Getting Started

## Clone Repository

```bash
git clone https://github.com/thanu-shree-13/Crowdfunding.git
```

```bash
cd Crowdfunding
```

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

---

# Workflow

1. Connect MetaMask
2. Create Campaign
3. AI generates campaign details
4. Fraud score is calculated
5. Donors contribute ETH
6. Successful campaigns allow withdrawal
7. Failed campaigns allow refunds
8. All transactions are stored on Ethereum
9. Users can monitor campaigns through the dashboard

---

# Future Improvements

- Better AI fraud detection
- Pagination
- Mainnet deployment
- Admin dashboard
- Email notifications
- IPFS image storage

---

# License

MIT License

---

# Author

**Thanushree**

Final Year B.Tech Information Technology Project

Ethereum • Solidity • React • Node.js • AI • Blockchain
