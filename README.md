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

## Screenshots

### Homepage

![Homepage](Screenshots/Screenshot%20(1075).png)

---

### Create Campaign

![Create Campaign](Screenshots/Screenshot%20(1076).png)

---

### AI Generated Campaign

![AI Generated Description](Screenshots/Screenshot%20(1077).png)

![Fraud Score](Screenshots/Screenshot%20(1078).png)

---

### MetaMask Campaign Creation

![MetaMask Create](Screenshots/Screenshot%20(1079).png)

---

### Campaign Details

![Campaign Details](Screenshots/Screenshot%20(1080).png)

![MetaMask Donation](Screenshots/Screenshot%20(1081).png)

![Fraud Verification](Screenshots/Screenshot%20(1082).png)

---

### Browse Campaigns

![All Campaigns](Screenshots/Screenshot%20(1086).png)

---

### Withdraw Dashboard

![Withdraw Dashboard](Screenshots/Screenshot%20(1088).png)

---

### User Dashboard

![User Dashboard](Screenshots/Screenshot%20(1089).png)

---

### Withdrawal Process

![Withdraw Confirmation](Screenshots/Screenshot%20(1090).png)

![MetaMask Withdrawal](Screenshots/Screenshot%20(1091).png)

![Withdrawal Success](Screenshots/Screenshot%20(1092).png)

---

### Transaction History

![Transaction History](Screenshots/Screenshot%20(1096).png)

---

### Profile Dashboard

![Profile Dashboard](Screenshots/Screenshot%20(1102).png)

---

### Campaign Statistics

![Campaign Statistics](Screenshots/Screenshot%20(1103).png)

---

### User Activity

![User Activity](Screenshots/Screenshot%20(1104).png)

---

### Inactive Campaigns

![Inactive Campaigns](Screenshots/Screenshot%20(1105).png)

---

### Completed Campaigns

![Completed Campaigns](Screenshots/Screenshot%20(1106).png)

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
