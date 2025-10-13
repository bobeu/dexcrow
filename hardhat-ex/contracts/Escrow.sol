// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
// import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { IEscrow } from "./interfaces/IEscrow.sol";

/**
 * @title Escrow Smart Contract
 * @dev A comprehensive decentralized escrow contract for secure peer-to-peer transactions
 * 
 * This contract implements a multi-state escrow system that supports:
 * - ETH and ERC20 token transactions
 * - Dispute resolution with arbiters
 * - Authorized agent functionality
 * - Platform fee collection
 * - Emergency pause and withdrawal mechanisms
 * 
 * The contract follows a state machine pattern with the following states:
 * 1. AWAITING_DEPOSIT: Initial state, waiting for buyer to deposit funds
 * 2. AWAITING_FULFILLMENT: Funds deposited, waiting for seller to fulfill obligations
 * 3. DISPUTE_RAISED: A dispute has been raised and is awaiting arbiter resolution
 * 4. COMPLETED: Transaction completed successfully, funds released to seller
 * 5. CANCELED: Transaction canceled, funds refunded to buyer
 * 
 * @author @bobeu : https://github.com/bobeu
 */
contract Escrow is IEscrow, ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ STATE VARIABLES ============
    
    /**
     * @dev Main escrow data structure containing all transaction details
     * Includes escrow details, dispute information, fee settings, and platform recipient
     */
    EscrowData public data;
    
    /**
     * @dev Mapping of authorized agents who can perform certain actions on behalf of parties
     * Agents can deposit funds, confirm fulfillment, and resolve disputes
     * Only the contract owner (buyer) can authorize/revoke agents
     */
    mapping(address => bool) public authorizedAgents;

    // ============ MODIFIERS ============
    
    /**
     * @dev Restricts function access to only the buyer or seller
     * Used for functions that either party can call (e.g., raising disputes)
     */
    modifier onlyParties() {
        require(
            _msgSender() == data.escrowDetails.buyer || 
            _msgSender() == data.escrowDetails.seller,
            "Only buyer or seller can call this function"
        );
        _;
    }

    /**
     * @dev Restricts function access to only the buyer
     * Used for buyer-specific actions like depositing funds and confirming fulfillment
     */
    modifier onlyBuyer() {
        require(_msgSender() == data.escrowDetails.buyer, "Only buyer can call this function");
        _;
    }

    /**
     * @dev Restricts function access to only the seller
     * Used for seller-specific actions (currently not used but available for future features)
     */
    modifier onlySeller() {
        require(_msgSender() == data.escrowDetails.seller, "Only seller can call this function");
        _;
    }

    /**
     * @dev Restricts function access to only the designated arbiter
     * Used for dispute resolution functions
     */
    modifier onlyArbiter() {
        require(_msgSender() == data.escrowDetails.arbiter, "Only arbiter can call this function");
        _;
    }

    /**
     * @dev Restricts function access to only authorized agents
     * Agents can perform certain actions on behalf of the buyer
     */
    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[_msgSender()], "Only authorized agents can call this function");
        _;
    }

    /**
     * @dev Ensures the escrow is in the specified state
     * @param _state The required escrow state for the function to execute
     */
    modifier validState(EscrowState _state) {
        require(data.escrowDetails.state == _state, "Invalid escrow state");
        _;
    }

    /**
     * @dev Ensures the escrow has not expired
     * Prevents actions on expired escrows
     */
    modifier notExpired() {
        require(_now() <= data.escrowDetails.deadline, "Escrow has expired");
        _;
    }

    /**
     * @dev Ensures the escrow has expired
     * Used for functions that should only work on expired escrows (e.g., refunds)
     */
    modifier expired() {
        require(_now() > data.escrowDetails.deadline, "Escrow has not expired");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Initializes a new escrow contract with the specified parameters
     * @param _buyer Address of the buyer who will deposit funds
     * @param _seller Address of the seller who will fulfill the transaction
     * @param _arbiter Address of the arbiter who will resolve disputes
     * @param _assetToken Address of the ERC20 token (address(0) for ETH)
     * @param _assetAmount Amount of tokens/ETH to be escrowed
     * @param _deadline Unix timestamp when the escrow expires
     * @param _description Human-readable description of the transaction
     * @param _disputeWindowHours Hours after deadline when disputes can still be raised
     * @param _platformFeeRecipient Address that will receive platform fees
     * 
     * The constructor performs comprehensive validation and initializes:
     * - Escrow details with all transaction parameters
     * - Platform fee settings (0.5% platform, 1% arbiter)
     * - Initial state as AWAITING_DEPOSIT
     * - Dispute information structure
     * 
     * Emits EscrowCreated event upon successful initialization
     */
    constructor(
        address _buyer,
        address _seller,
        address _arbiter,
        address _assetToken,
        uint256 _assetAmount,
        uint256 _deadline,
        string memory _description,
        uint256 _disputeWindowHours,
        address _platformFeeRecipient
    ) Ownable(_msgSender()) {
        // Validate all input parameters
        require(_buyer != address(0), "Invalid buyer address");
        require(_seller != address(0), "Invalid seller address");
        require(_arbiter != address(0), "Invalid arbiter address");
        require(_assetAmount > 0, "Asset amount must be greater than 0");
        require(_deadline > _now(), "Deadline must be in the future");
        require(_disputeWindowHours > 0, "Dispute window must be greater than 0");
        require(_platformFeeRecipient != address(0), "Invalid platform fee recipient");

        // Initialize escrow details
        data.escrowDetails = EscrowDetails({
            buyer: _buyer,
            seller: _seller,
            arbiter: _arbiter,
            assetToken: _assetToken,
            assetAmount: _assetAmount,
            deadline: _deadline,
            state: EscrowState.AWAITING_DEPOSIT,
            createdAt: _now(),
            updatedAt: _now(),
            description: _description,
            disputeWindowHours: _disputeWindowHours
        });

        // Initialize fee settings
        data.platformFeeRecipient = _platformFeeRecipient;
        data.platformFeePercentage = 50; // 0.5%
        data.arbiterFeePercentage = 100; // 1%
        data.feeDenominator = 10000; // 10000 = 100%
        
        // Emit creation event
        emit EscrowCreated(
            _buyer,
            _seller,
            _arbiter,
            _assetToken,
            _assetAmount,
            _deadline
        );
    }

    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @dev Returns the current block timestamp
     * @return currentTime The current block timestamp
     * 
     * This function provides a consistent way to get the current time
     * and can be overridden for testing purposes
     */
    function _now() internal view returns(uint currentTime) {
        currentTime = block.timestamp;
    }

    /**
     * @dev Encodes a string to bytes format for storage efficiency
     * @param reason The string to encode
     * @return encoded The encoded bytes representation
     * 
     * This function is used to store string data more efficiently
     * by converting it to bytes format
     */
    function _encodeString(string memory reason) internal pure returns(bytes memory encoded) {
        encoded = abi.encode(bytes(reason));
    }

    // External Functions

    /**
     * @dev Deposit assets into escrow
     * @notice Only buyer can deposit assets
     */
    function deposit() 
        external 
        payable 
        nonReentrant 
        whenNotPaused
        onlyBuyer
        validState(EscrowState.AWAITING_DEPOSIT)
        notExpired
    {
        if (data.escrowDetails.assetToken == address(0)) {
            // Native token (ETH)
            require(msg.value >= data.escrowDetails.assetAmount, "Incorrect ETH amount");
        } else {
            // ERC20 token
            require(msg.value == 0, "ETH not accepted for ERC20 escrow");
            IERC20 token = IERC20(data.escrowDetails.assetToken);
            require(
                token.balanceOf(_msgSender()) >= data.escrowDetails.assetAmount,
                "Insufficient token balance"
            );
            require(
                token.allowance(_msgSender(), address(this)) >= data.escrowDetails.assetAmount,
                "Insufficient token allowance"
            );
            
            token.safeTransferFrom(_msgSender(), address(this), data.escrowDetails.assetAmount);
        }

        data.escrowDetails.state = EscrowState.AWAITING_FULFILLMENT;
        uint currentTime = _now();
        data.escrowDetails.updatedAt = currentTime;

        emit AssetDeposited(
            _msgSender(),
            data.escrowDetails.assetToken,
            data.escrowDetails.assetAmount,
            currentTime
        );
    }

    /**
     * @dev Confirm fulfillment and release funds to seller
     * @notice Only buyer can confirm fulfillment
     */
    function confirmFulfillment() 
        external 
        nonReentrant 
        whenNotPaused
        onlyBuyer
        validState(EscrowState.AWAITING_FULFILLMENT)
        notExpired
    {
        _releaseFunds(data.escrowDetails.seller);
        
        emit FulfillmentConfirmed(_msgSender(), _now());
    }

    /**
     * @dev Release funds to seller (arbiter can also call this)
     * @notice Can be called by buyer or arbiter
     */
    function releaseFunds() 
        external 
        nonReentrant 
        whenNotPaused
        validState(EscrowState.AWAITING_FULFILLMENT)
        notExpired
    {
        require(
            _msgSender() == data.escrowDetails.buyer || _msgSender() == data.escrowDetails.arbiter,
            "Only buyer or arbiter can release funds"
        );
        
        _releaseFunds(data.escrowDetails.seller);
    }

    /**
     * @dev Refund funds to buyer
     * @notice Can be called by buyer (after deadline) or arbiter
     */
    function refundFunds() 
        external 
        nonReentrant 
        whenNotPaused
        validState(EscrowState.AWAITING_FULFILLMENT)
    {
        require(
            _msgSender() == data.escrowDetails.buyer || _msgSender() == data.escrowDetails.arbiter,
            "Only buyer or arbiter can refund funds"
        );
        
        if (_msgSender() == data.escrowDetails.buyer) {
            require(_now() > data.escrowDetails.deadline, "Deadline not reached");
        }
        
        _releaseFunds(data.escrowDetails.buyer);
    }

    /**
     * @dev Raise a dispute
     * @param _reason Reason for the dispute
     * @notice Only buyer or seller can raise disputes
     */
    function raiseDispute(string memory _reason) 
        external 
        nonReentrant 
        whenNotPaused
        onlyParties
        validState(EscrowState.AWAITING_FULFILLMENT)
        notExpired
    {
        require(bytes(_reason).length > 0, "Dispute reason cannot be empty");
        uint currentTime = _now();
        data.escrowDetails.state = EscrowState.DISPUTE_RAISED;
        data.escrowDetails.updatedAt = currentTime;
        
        data.disputeInfo = DisputeInfo({
            isActive: true,
            disputer: _msgSender(),
            reason: _encodeString(_reason),
            raisedAt: currentTime,
            arbiter: data.escrowDetails.arbiter,
            arbiterDecision: false,
            arbiterReasoning: _encodeString("NA"),
            resolvedAt: 0
        });  

        emit DisputeRaised(_msgSender(), _reason, currentTime);
    }

    /**
     * @dev Resolve dispute (arbiter only)
     * @param _releazeFunds True to release funds to seller, false to refund to buyer
     * @param _reasoning Reasoning for the decision
     */
    function resolveDispute(bool _releazeFunds, string memory _reasoning) 
        external 
        nonReentrant 
        whenNotPaused
        onlyArbiter
        validState(EscrowState.DISPUTE_RAISED)
    {
        require(data.disputeInfo.isActive, "No active dispute");
        require(bytes(_reasoning).length > 0, "Reasoning cannot be empty");
        
        uint currentTime = _now();
        data.disputeInfo.arbiterDecision = _releazeFunds;
        data.disputeInfo.arbiterReasoning = _encodeString(_reasoning);
        data.disputeInfo.resolvedAt = currentTime;
        data.disputeInfo.isActive = false;
        
        data.escrowDetails.updatedAt = currentTime;

        if (_releazeFunds) {
            _releaseFunds(data.escrowDetails.seller);
        } else {
            _releaseFunds(data.escrowDetails.buyer);
        }

        emit DisputeResolved(_msgSender(), _releazeFunds, _reasoning, currentTime);
    }

    // Agent Functions

    /**
     * @dev Deposit assets via authorized agent
     * @notice Only authorized agents can call this
     */
    function agentDeposit() 
        external 
        nonReentrant 
        whenNotPaused
        onlyAuthorizedAgent
        validState(EscrowState.AWAITING_DEPOSIT)
        notExpired
    {
        uint currentTime = _now();
        data.escrowDetails.state = EscrowState.AWAITING_FULFILLMENT;
        data.escrowDetails.updatedAt = currentTime;

        emit AssetDeposited(
            data.escrowDetails.buyer,
            data.escrowDetails.assetToken,
            data.escrowDetails.assetAmount,
            currentTime
        );
    }

    /**
     * @dev Confirm fulfillment via authorized agent
     * @notice Only authorized agents can call this
     */
    function agentConfirmFulfillment() 
        external 
        nonReentrant 
        whenNotPaused
        onlyAuthorizedAgent
        validState(EscrowState.AWAITING_FULFILLMENT)
        notExpired
    {
        _releaseFunds(data.escrowDetails.seller);
        
        emit FulfillmentConfirmed(_msgSender(), _now());
    }

    /**
     * @dev Resolve dispute via authorized agent
     * @param _releazeFunds True to release funds to seller, false to refund to buyer
     * @param _reasoning Reasoning for the decision
     */
    function agentResolveDispute(bool _releazeFunds, string memory _reasoning) 
        external 
        nonReentrant 
        whenNotPaused
        onlyAuthorizedAgent
        validState(EscrowState.DISPUTE_RAISED)
    {
        require(data.disputeInfo.isActive, "No active dispute");
        require(bytes(_reasoning).length > 0, "Reasoning cannot be empty");
        
        uint currentTime = _now();
        data.disputeInfo.arbiterDecision = _releazeFunds;
        data.disputeInfo.arbiterReasoning = _encodeString(_reasoning);
        data.disputeInfo.resolvedAt = currentTime;
        data.disputeInfo.isActive = false;
        
        data.escrowDetails.updatedAt = currentTime;

        if (_releazeFunds) {
            _releaseFunds(data.escrowDetails.seller);
        } else {
            _releaseFunds(data.escrowDetails.buyer);
        }

        emit DisputeResolved(_msgSender(), _releazeFunds, _reasoning, currentTime);
    }
 
    // View Functions

    /**
     * @dev Get escrow data
     */
    function getEscrowData() external view returns (EscrowData memory) {
        return data;
    }

    // /**
    //  * @dev Get dispute information
    //  */
    // function getDisputeInfo() external view returns (DisputeInfo memory) {
    //     return disputeInfo;
    // }

    /**
     * @dev Check if escrow is expired
     */
    function isExpired() external view returns (bool) {
        return _now() > data.escrowDetails.deadline;
    }

    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        if (data.escrowDetails.assetToken == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(data.escrowDetails.assetToken).balanceOf(address(this));
        }
    } 

    // Admin Functions

    /**
     * @dev Authorize an agent
     * @param _agent Agent address to authorize
     */
    function authorizeAgent(address _agent) external onlyOwner {
        require(_agent != address(0), "Invalid agent address");
        authorizedAgents[_agent] = true;
    }

    /**
     * @dev Revoke agent authorization
     * @param _agent Agent address to revoke
     */
    function revokeAgent(address _agent) external onlyOwner {
        authorizedAgents[_agent] = false;
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw (only if contract is paused)
     * @notice This should only be used in extreme circumstances
     */
    function emergencyWithdraw() external onlyOwner {
        require(paused(), "Contract must be paused");
        
        if (data.escrowDetails.assetToken == address(0)) {
            (bool success, ) = payable(owner()).call{value: address(this).balance}("");
            require(success, "Emergency withdraw failed");
        } else {
            IERC20 token = IERC20(data.escrowDetails.assetToken);
            token.safeTransfer(owner(), token.balanceOf(address(this)));
        }
    }

    // Internal Functions

    /**
     * @dev Internal function to release funds
     * @param _recipient Address to receive the funds
     */
    function _releaseFunds(address _recipient) internal {
        require(data.escrowDetails.state == EscrowState.AWAITING_FULFILLMENT || 
                data.escrowDetails.state == EscrowState.DISPUTE_RAISED, 
                "Invalid state for fund release");

        uint256 amount = data.escrowDetails.assetAmount;
        uint256 platformFee = (amount * data.platformFeePercentage) / data.feeDenominator;
        uint256 arbiterFee = (amount * data.arbiterFeePercentage) / data.feeDenominator;
        uint256 netAmount = (amount - platformFee) - arbiterFee;
        uint currentTime = _now();
        data.escrowDetails.state = _recipient == data.escrowDetails.seller ? 
            EscrowState.COMPLETED : EscrowState.CANCELED;
        data.escrowDetails.updatedAt = currentTime;

        if (data.escrowDetails.assetToken == address(0)) {
            // Native token (ETH)
            if (netAmount > 0) {
                (bool success, ) = payable(_recipient).call{value: netAmount}("");
                require(success, "Transfer to recipient failed");
            }
            if (platformFee > 0) {
                (bool success, ) = payable(data.platformFeeRecipient).call{value: platformFee}("");
                require(success, "Transfer to platform failed");
            }
            if (arbiterFee > 0) {
                (bool success, ) = payable(data.escrowDetails.arbiter).call{value: arbiterFee}("");
                require(success, "Transfer to arbiter failed");
            }
        } else {
            // ERC20 token
            IERC20 token = IERC20(data.escrowDetails.assetToken);
            
            if (netAmount > 0) {
                token.safeTransfer(_recipient, netAmount);
            }
            if (platformFee > 0) {
                token.safeTransfer(data.platformFeeRecipient, platformFee);
            }
            if (arbiterFee > 0) {
                token.safeTransfer(data.escrowDetails.arbiter, arbiterFee);
            }
        }

        emit FundsReleased(_recipient, data.escrowDetails.assetToken, netAmount, currentTime);
    } 

    // Receive function for ETH deposits
    receive() external payable {
        // This function allows the contract to receive ETH
        // The actual deposit logic is handled in the deposit() function
    }
}
