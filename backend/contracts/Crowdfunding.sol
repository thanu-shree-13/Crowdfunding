// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title Crowdfunding Contract
/// @author Your Name
/// @notice A decentralized crowdfunding platform with fraud detection, refunds, and admin controls
/// @dev Inherits ReentrancyGuard, Ownable, and Pausable from OpenZeppelin

contract Crowdfunding is ReentrancyGuard, Ownable, Pausable {

    // ---------------- CONSTANTS ----------------

    /// @notice Minimum funding percentage required for owner to withdraw (80%)
    uint256 public constant WITHDRAWAL_THRESHOLD = 80;

    /// @notice Fraud score threshold above which a campaign is flagged
    uint256 public constant FRAUD_THRESHOLD = 50;

    // ---------------- STRUCTS ----------------

    /// @notice Stores all data for a campaign (includes mapping so not returnable directly)
    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        uint256 withdrawableAmount;
        string image;
        uint256 fraudScore;
        bool isFlagged;
        bool withdrawn;
        bool cancelled;
        address[] donators;
        mapping(address => uint256) donations;
    }

    /// @notice A returnable version of Campaign (no mapping)
    struct CampaignView {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        uint256 withdrawableAmount;
        string image;
        uint256 fraudScore;
        bool isFlagged;
        bool withdrawn;
        bool cancelled;
    }

    /// @notice Represents a single donation transaction
    struct Transaction {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    // ---------------- STORAGE ----------------

    /// @notice All campaigns stored by ID
    mapping(uint256 => Campaign) public campaigns;

    /// @notice All transactions per campaign
    mapping(uint256 => Transaction[]) public transactions;

    /// @notice Total number of campaigns created
    uint256 public numberOfCampaigns = 0;

    // ---------------- EVENTS ----------------

    /// @notice Emitted when a new campaign is created
    event CampaignCreated(uint256 indexed id, address indexed owner, string title);

    /// @notice Emitted when a donation is received
    event DonationReceived(uint256 indexed id, address indexed donor, uint256 amount);

    /// @notice Emitted when the owner withdraws funds
    event FundsWithdrawn(uint256 indexed id, address indexed owner, uint256 amount);

    /// @notice Emitted when a donor is refunded
    event Refunded(uint256 indexed id, address indexed donor, uint256 amount);

    /// @notice Emitted when a campaign is cancelled by its owner
    event CampaignCancelled(uint256 indexed id, address indexed owner);

    /// @notice Emitted when admin manually flags or unflags a campaign
    event FlagUpdated(uint256 indexed id, bool isFlagged);

    // ---------------- MODIFIERS ----------------

    /// @notice Ensures the campaign ID is valid
    /// @param _id Campaign ID to validate
    modifier validCampaign(uint256 _id) {
        require(_id < numberOfCampaigns, "Invalid campaign ID");
        _;
    }

    /// @notice Ensures the campaign has not been cancelled
    /// @param _id Campaign ID to check
    modifier notCancelled(uint256 _id) {
        require(!campaigns[_id].cancelled, "Campaign is cancelled");
        _;
    }

    // ---------------- CONSTRUCTOR ----------------

    /// @notice Initializes the contract and sets the deployer as owner
    constructor() Ownable(msg.sender) {}

    // ---------------- ADMIN ----------------

    /// @notice Pauses all donations and withdrawals (emergency use)
    /// @dev Only callable by contract owner
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Resumes normal operation after a pause
    /// @dev Only callable by contract owner
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Allows admin to manually flag or unflag a campaign
    /// @param _id Campaign ID
    /// @param _flagged New flag status
    function setFlagged(uint256 _id, bool _flagged)
        external
        onlyOwner
        validCampaign(_id)
    {
        campaigns[_id].isFlagged = _flagged;
        emit FlagUpdated(_id, _flagged);
    }

    // ---------------- CREATE ----------------

    /// @notice Creates a new crowdfunding campaign
    /// @param _title Title of the campaign
    /// @param _description Description of the campaign (min 30 chars recommended)
    /// @param _target Funding goal in wei
    /// @param _deadline Unix timestamp for the campaign deadline
    /// @param _image IPFS or URL string for the campaign image
    /// @return id The ID of the newly created campaign
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
    ) public whenNotPaused returns (uint256) {

        require(bytes(_title).length > 0,       "Title required");
        require(bytes(_description).length > 0, "Description required");
        require(_target > 0,                    "Target must be > 0");
        require(_deadline > block.timestamp,    "Deadline must be in future");

        Campaign storage c = campaigns[numberOfCampaigns];

        c.owner       = msg.sender;
        c.title       = _title;
        c.description = _description;
        c.target      = _target;
        c.deadline    = _deadline;
        c.image       = _image;

        // --- Fraud Score Calculation ---
        uint256 score = 0;

        if (_target > 5 ether)                             score += 30;
        if (_deadline <= block.timestamp + 1 days)         score += 30;
        if (bytes(_description).length < 30)               score += 20;
        if (bytes(_image).length == 0)                     score += 10;
        if (_target > 50 ether)                            score += 10;

        c.fraudScore = score;
        c.isFlagged  = score >= FRAUD_THRESHOLD;

        emit CampaignCreated(numberOfCampaigns, msg.sender, _title);

        numberOfCampaigns++;
        return numberOfCampaigns - 1;
    }

    // ---------------- DONATE ----------------

    /// @notice Donate ETH to a campaign
    /// @param _id The ID of the campaign to donate to
    /// @dev Reverts if campaign is past deadline, cancelled, flagged, or would exceed target
    function donateToCampaign(uint256 _id)
        public
        payable
        whenNotPaused
        nonReentrant
        validCampaign(_id)
        notCancelled(_id)
    {
        Campaign storage c = campaigns[_id];

        require(block.timestamp < c.deadline,  "Deadline passed");
        require(!c.isFlagged,                  "Campaign is flagged");
        require(msg.value > 0,                 "Must send ETH");
        require(
            c.amountCollected + msg.value <= c.target,
            "Exceeds funding target"
        );

        if (c.donations[msg.sender] == 0) {
            c.donators.push(msg.sender);
        }

        c.donations[msg.sender] += msg.value;
        c.amountCollected       += msg.value;
        c.withdrawableAmount    += msg.value;

        transactions[_id].push(Transaction(
            msg.sender,
            msg.value,
            block.timestamp
        ));

        emit DonationReceived(_id, msg.sender, msg.value);
    }

    // ---------------- WITHDRAW ----------------

    /// @notice Campaign owner withdraws funds after deadline if threshold is met
    /// @param _id The ID of the campaign
    /// @dev Requires 80% of target to be reached; uses checks-effects-interactions
    function withdraw(uint256 _id)
        public
        nonReentrant
        whenNotPaused
        validCampaign(_id)
        notCancelled(_id)
    {
        Campaign storage c = campaigns[_id];

        require(msg.sender == c.owner,         "Not campaign owner");
        require(!c.withdrawn,                  "Already withdrawn");
        require(block.timestamp > c.deadline,  "Campaign still active");
        require(!c.isFlagged,                  "Flagged campaign cannot withdraw");
        require(
            c.withdrawableAmount >= (c.target * WITHDRAWAL_THRESHOLD) / 100,
            "Funding threshold not reached (80%)"
        );

        uint256 amount = c.withdrawableAmount;

        // Effects before interactions (reentrancy safety)
        c.withdrawn          = true;
        c.withdrawableAmount = 0;

        (bool success, ) = payable(c.owner).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(_id, c.owner, amount);
    }

    // ---------------- REFUND ----------------

    /// @notice Donor claims a refund if campaign failed, was flagged, or was cancelled
    /// @param _id The ID of the campaign
    /// @dev Safe against reentrancy; zeroes donation before transfer
    function refund(uint256 _id)
        public
        nonReentrant
        validCampaign(_id)
    {
        Campaign storage c = campaigns[_id];

        bool deadlinePassed    = block.timestamp > c.deadline;
        bool belowThreshold    = c.withdrawableAmount < (c.target * WITHDRAWAL_THRESHOLD) / 100;
        bool eligibleForRefund = (deadlinePassed && (belowThreshold || c.isFlagged)) || c.cancelled;

        require(eligibleForRefund, "Refund not available");
        require(!c.withdrawn,      "Funds already withdrawn");

        uint256 donated = c.donations[msg.sender];
        require(donated > 0, "No donation to refund");

        // Safety invariant check
        require(c.withdrawableAmount >= donated, "Invariant: insufficient withdrawable");

        // Effects before interactions
        c.donations[msg.sender] = 0;
        c.withdrawableAmount   -= donated;

        (bool success, ) = payable(msg.sender).call{value: donated}("");
        require(success, "Refund transfer failed");

        emit Refunded(_id, msg.sender, donated);
    }

    // ---------------- CANCEL ----------------

    /// @notice Campaign owner cancels their campaign before deadline
    /// @param _id The ID of the campaign
    /// @dev Can only cancel if no donations have been made yet
    function cancelCampaign(uint256 _id)
        public
        validCampaign(_id)
        notCancelled(_id)
    {
        Campaign storage c = campaigns[_id];

        require(msg.sender == c.owner,         "Not campaign owner");
        require(block.timestamp < c.deadline,  "Deadline already passed");
        require(
            c.amountCollected == 0,
            "Cannot cancel: donations exist. Donors may refund after deadline."
        );

        c.cancelled = true;

        emit CampaignCancelled(_id, msg.sender);
    }

    // ---------------- VIEW ----------------

    /// @notice Returns all campaigns as a flat array (no mappings)
    /// @return list Array of CampaignView structs
    function getCampaigns() public view returns (CampaignView[] memory) {
        CampaignView[] memory list = new CampaignView[](numberOfCampaigns);

        for (uint i = 0; i < numberOfCampaigns; i++) {
            Campaign storage c = campaigns[i];

            list[i] = CampaignView(
                c.owner,
                c.title,
                c.description,
                c.target,
                c.deadline,
                c.amountCollected,
                c.withdrawableAmount,
                c.image,
                c.fraudScore,
                c.isFlagged,
                c.withdrawn,
                c.cancelled
            );
        }

        return list;
    }

    /// @notice Returns paginated donators and their donation amounts for a campaign
    /// @param _id Campaign ID
    /// @param start Start index (0-based)
    /// @param limit Max number of results to return
    /// @return addrs Array of donor addresses
    /// @return amounts Array of corresponding donation amounts
    function getDonatorsPaginated(
        uint256 _id,
        uint256 start,
        uint256 limit
    )
        public
        view
        validCampaign(_id)
        returns (address[] memory addrs, uint256[] memory amounts)
    {
        Campaign storage c = campaigns[_id];

        uint256 end  = start + limit;
        if (end > c.donators.length) end = c.donators.length;

        uint256 size = end > start ? end - start : 0;

        addrs   = new address[](size);
        amounts = new uint256[](size);

        for (uint i = 0; i < size; i++) {
            address donor = c.donators[start + i];
            addrs[i]      = donor;
            amounts[i]    = c.donations[donor];
        }
    }

    /// @notice Returns all transactions for a given campaign
    /// @param _id Campaign ID
    /// @return Array of Transaction structs
    function getTransactions(uint256 _id)
        public
        view
        validCampaign(_id)
        returns (Transaction[] memory)
    {
        return transactions[_id];
    }

    /// @notice Returns the donation amount for a specific donor in a campaign
    /// @param _id Campaign ID
    /// @param _donor Address of the donor
    /// @return Amount donated in wei
    function getDonation(uint256 _id, address _donor)
        public
        view
        validCampaign(_id)
        returns (uint256)
    {
        return campaigns[_id].donations[_donor];
    }

    /// @notice Returns total number of unique donators for a campaign
    /// @param _id Campaign ID
    /// @return Count of unique donators
    function getDonatorCount(uint256 _id)
        public
        view
        validCampaign(_id)
        returns (uint256)
    {
        return campaigns[_id].donators.length;
    }

    // ---------------- BLOCK DIRECT ETH ----------------

    /// @notice Rejects direct ETH transfers — use donateToCampaign instead
    receive() external payable {
        revert("Use donateToCampaign()");
    }
}
