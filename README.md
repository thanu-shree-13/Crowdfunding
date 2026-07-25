# CryptoCrowd – Fraud-Aware Decentralized Crowdfunding dApp

CryptoCrowd is a decentralized crowdfunding application built on the Ethereum Sepolia Testnet. The platform allows users to create fundraising campaigns, donate securely through MetaMask, and manage funds using smart contracts. To improve trust and transparency, the project includes rule-based fraud detection and AI-assisted campaign description generation.

## Features

- Create crowdfunding campaigns
- Connect wallet using MetaMask
- Donate with Ethereum (Sepolia Testnet)
- Automatic refunds if the campaign target is not met
- Secure withdrawal of funds after successful campaigns
- Rule-based fraud detection for suspicious campaigns
- AI-generated campaign descriptions
- Transparent campaign and transaction details on the blockchain

## Tech Stack

### Frontend
- React.js
- JavaScript
- HTML
- CSS

### Blockchain
- Solidity
- Hardhat
- Ethers.js
- MetaMask
- Ethereum Sepolia Testnet

### AI
- AI API for campaign description generation
- Rule-based fraud detection

## Project Structure

```
CryptoCrowd/
│
├── client/                 # React frontend
├── smart-contract/         # Solidity contracts
├── ai-server/              # AI services
├── scripts/                # Deployment scripts
├── package.json
└── README.md
```

## Installation

Clone the repository

```bash
git clone https://github.com/<your-username>/CryptoCrowd.git
```

Move into the project directory

```bash
cd CryptoCrowd
```

Install frontend dependencies

```bash
cd client
npm install
```

Install smart contract dependencies

```bash
cd ../smart-contract
npm install
```

Install AI server dependencies

```bash
cd ../ai-server
npm install
```

## Environment Variables

Create a `.env` file inside the required folders and add the following values.

```env
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=your_rpc_url
CONTRACT_ADDRESS=deployed_contract_address
AI_API_KEY=your_ai_api_key
```

## Running the Project

Start the React application

```bash
npm start
```

Compile smart contracts

```bash
npx hardhat compile
```

Deploy contracts

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Start the AI server

```bash
npm run dev
```

## How It Works

1. Users connect their MetaMask wallet.
2. A campaign can be created by providing the required details.
3. The fraud detection module analyzes the campaign for suspicious patterns.
4. AI can generate a campaign description if needed.
5. Approved campaigns are deployed and stored on the blockchain.
6. Users donate ETH through MetaMask.
7. If the funding goal is reached before the deadline, the campaign owner can withdraw the funds.
8. If the funding goal is not achieved, donors can claim refunds through the smart contract.

## Smart Contract Functions

| Function | Description |
|----------|-------------|
| `createCampaign()` | Creates a new fundraising campaign |
| `donateToCampaign()` | Sends ETH to a campaign |
| `withdraw()` | Allows the campaign owner to withdraw funds after reaching the target |
| `refund()` | Returns ETH to donors if the campaign fails |
| `getCampaigns()` | Returns all campaign details |
| `getDonators()` | Returns the list of donors for a campaign |

## Screenshots

Add screenshots of:

- Home Page
- Create Campaign
- Campaign Details
- Donation Flow
- Fraud Detection Result
- Withdraw Page
- Refund Page

## Future Improvements

- Multi-chain support
- User authentication
- Campaign analytics dashboard
- NFT rewards for donors
- IPFS storage for campaign media
- Mobile-friendly interface

## Author

Developed as a blockchain-based crowdfunding project using Ethereum smart contracts, React.js, and AI integration.
