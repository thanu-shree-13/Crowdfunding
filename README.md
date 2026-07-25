# CrowdfundChain

CrowdfundChain is a blockchain-based crowdfunding platform where users can create fundraising campaigns and receive donations through cryptocurrency. The main purpose of this project is to make crowdfunding more transparent and secure by using Ethereum smart contracts.

Along with blockchain, the project also includes AI features that help generate campaign descriptions and detect potentially fraudulent campaigns before they are published.

## Features

- Create crowdfunding campaigns
- Connect wallet using MetaMask
- Donate using Ethereum
- Withdraw funds after reaching the funding goal
- Refund donors if the campaign is unsuccessful
- AI-generated campaign descriptions
- AI-based fraud detection
- View campaign and donation details on the blockchain

## Built With

### Frontend
- React.js
- HTML
- CSS
- JavaScript

### Blockchain
- Solidity
- Hardhat
- Ethers.js
- MetaMask
- Sepolia Testnet

### AI
- AI API for campaign description generation
- AI fraud detection module

## Project Structure

```
CrowdfundChain
│
├── client
├── smart-contract
├── ai-server
└── README.md
```

## Getting Started

### Clone the repository

```bash
git clone https://github.com/your-username/CrowdfundChain.git
```

Move into the project folder.

```bash
cd CrowdfundChain
```

Install dependencies.

Frontend

```bash
cd client
npm install
```

Smart Contract

```bash
cd smart-contract
npm install
```

AI Server

```bash
cd ai-server
npm install
```

## Running the Project

Start the frontend.

```bash
npm start
```

Start the AI server.

```bash
npm run dev
```

Compile the smart contracts.

```bash
npx hardhat compile
```

Deploy to the Sepolia network.

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Environment Variables

Create a `.env` file and add the required values.

```env
PRIVATE_KEY=
SEPOLIA_RPC_URL=
CONTRACT_ADDRESS=
AI_API_KEY=
```

## How the Project Works

1. Connect MetaMask.
2. Create a fundraising campaign.
3. AI checks the campaign for possible fraud and can generate a description.
4. If the campaign passes the checks, it is stored on the blockchain.
5. Other users can donate to the campaign.
6. When the target amount is reached, the campaign owner can withdraw the funds.
7. If the campaign expires without reaching the target, donors can request refunds.

## Smart Contract Functions

- createCampaign()
- donateToCampaign()
- withdraw()
- refund()
- getCampaigns()
- getDonators()

## Future Improvements

Some features that can be added later:

- Support for multiple blockchains
- NFT rewards for donors
- Better analytics dashboard
- Mobile application
- User profile and campaign history

## Author

Developed as a final-year blockchain project.
