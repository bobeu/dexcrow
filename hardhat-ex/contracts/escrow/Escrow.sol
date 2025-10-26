// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { IEscrow } from "../interfaces/IEscrow.sol";
import { IEscrowFactory } from "../interfaces/IEscrowFactory.sol";

/**
 * @title Escrow Smart Contract
 * @dev A comprehensive decentralized escrow contract for secure peer-to-peer transactions
 * ======== CRYPTO - FIAT ======== 
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
    EscrowData internal data;
    
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
        if(_msgSender() != data.escrowDetails.buyer && _msgSender() != data.escrowDetails.seller) {
            revert OnlyBuyerOrSellerCanCall();
        }
        _;
    }

    /**
     * @dev Restricts function access to only the buyer
     * Used for buyer-specific actions like depositing funds and confirming fulfillment
     */
    modifier onlyBuyer() {
        if(_msgSender() != data.escrowDetails.buyer) revert OnlyBuyerCanCall();
        _;
    }

    /**
     * @dev Restricts function access to only the seller
     * Used for seller-specific actions (currently not used but available for future features)
     */
    modifier onlySeller() {
        if(_msgSender() != data.escrowDetails.seller) revert OnlySellerCanCall();
        _;
    }

    /**
     * @dev Restricts function access to only the designated arbiter
     * Used for dispute resolution functions
     */
    modifier onlyArbiter() {
        if(_msgSender() != data.escrowDetails.arbiter) revert OnlyArbiterCanCall();
        _;
    }

    /**
     * @dev Restricts function access to only the designated arbiter or buyer
     * Used for dispute resolution functions
     */
    modifier onlyArbiterOrBuyer() {
        if(_msgSender() != data.escrowDetails.buyer) {
            if(_msgSender() != data.escrowDetails.arbiter) revert OnlyBuyerOrArbiterCanRefundFunds();
        }
        _;
    }

    /**
     * @dev Restricts function access to only authorized agents
     * Agents can perform certain actions on behalf of the buyer
     */
    modifier onlyAuthorizedAgent() {
        if(!authorizedAgents[_msgSender()]) revert OnlyAuthorizedAgentsCanCall();
        _;
    }

    /**
     * @dev Ensures the escrow is in the specified state
     * @param _state The required escrow state for the function to execute
     */
    modifier validState(EscrowState _state) {
        if(data.escrowDetails.state != _state) revert InvalidEscrowState();
        _;
    }

    /**
     * @dev Ensures the escrow has not expired
     * Prevents actions on expired escrows
     */
    modifier notExpired() {
        if(_now() > data.escrowDetails.deadline) revert EscrowHasExpired();
        _;
    }

    /**
     * @dev Ensures the escrow has expired
     * Used for functions that should only work on expired escrows (e.g., refunds)
     */
    modifier expired() {
        if(_now() <= data.escrowDetails.deadline) revert EscrowHasNotExpired();
        _;
    }

    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Initializes a new escrow contract with the specified parameters
     * @param _buyer Address of the buyer who will deposit funds
     * @param _seller Address of the seller who will fulfill the transaction
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
        address _assetToken,
        uint256 _assetAmount,
        uint256 _deadline,
        string memory _description,
        uint256 _disputeWindowHours,
        address _platformFeeRecipient
    ) Ownable(_msgSender()) {
        // Validate all input parameters
        if(_buyer == address(0)) revert InvalidBuyerAddress();
        if(_seller == address(0)) revert InvalidSellerAddress();
        // Allow address(0) as arbiter - can be set later via becomeArbiter()
        if(_assetAmount == 0) revert AssetAmountMustBeGreaterThanZero();
        if(_deadline <= _now()) revert DeadlineMustBeInTheFuture();
        if(_disputeWindowHours == 0) revert DisputeWindowMustBeGreaterThanZero();
        if(_platformFeeRecipient == address(0)) revert InvalidPlatformFeeRecipient();

        // Initialize escrow details
        data.escrowDetails = EscrowDetails({
            buyer: _buyer,
            seller: _seller,
            arbiter: address(0),
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
        
        // Initialize dispute info
        data.disputeInfo = DisputeInfo({
            isActive: false,
            disputer: address(0),
            reason: "",
            raisedAt: 0,
            arbiter: address(0),
            arbiterDecision: false,
            arbiterReasoning: "",
            resolvedAt: 0
        });
        
        // Emit creation event
        emit EscrowCreated(
            _buyer,
            _seller,
            address(0),
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

    function becomeArbiter() external returns(bool) {
        address sender = _msgSender();
        if(!IEscrowFactory(owner()).isApprovedArbiter(sender, 1)) revert NotApproved();
        if(sender == data.escrowDetails.arbiter) revert CallerIsTheArbiter();
        if(data.escrowDetails.arbiter != address(0)) {
            if(data.disputeInfo.isActive) {
                if(_now() < data.disputeInfo.raisedAt) revert ArbiterSwapWindowNotOpen();
            } else {
                if(data.disputeInfo.resolvedAt > 0) revert EscrowWasResolved();
            }
        }
        
        emit ArbiterSwapped(data.escrowDetails.arbiter, sender);
        data.escrowDetails.arbiter = sender;

        return true;
    }

    // External Functions

    /**
     * @dev Deposit assets into escrow
     * @notice Only seller can deposit crypto assets (crypto-to-fiat operation)
     */
    function deposit() 
        external 
        payable 
        nonReentrant 
        whenNotPaused
        onlySeller
        validState(EscrowState.AWAITING_DEPOSIT)
        notExpired
    {
        if(data.escrowDetails.assetToken == address(0)) {
            // Native token (ETH)
            if(msg.value < data.escrowDetails.assetAmount) revert IncorrectETHAmount();
        } else {
            // ERC20 token
            if(msg.value > 0) revert ETHNotAcceptedForERC20Escrow();
            IERC20 token = IERC20(data.escrowDetails.assetToken);
            if(token.balanceOf(_msgSender()) < data.escrowDetails.assetAmount) {
                revert InsufficientTokenBalance();
            }
            if(token.allowance(_msgSender(), address(this)) < data.escrowDetails.assetAmount) {
                revert InsufficientTokenAllowance();
            }
            
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
        onlyArbiterOrBuyer
    {
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
        onlyArbiterOrBuyer
    {
        if(_msgSender() == data.escrowDetails.buyer) {
            if(_now() <= data.escrowDetails.deadline) revert DeadlineNotReached();
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
        if(bytes(_reason).length == 0) revert DisputeReasonCannotBeEmpty();
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
        if(!data.disputeInfo.isActive) revert NoActiveDispute();
        if(bytes(_reasoning).length == 0) revert ReasoningCannotBeEmpty();
        
        uint currentTime = _now();
        data.disputeInfo.arbiterDecision = _releazeFunds;
        data.disputeInfo.arbiterReasoning = _encodeString(_reasoning);
        data.disputeInfo.resolvedAt = currentTime;
        data.disputeInfo.isActive = false;
        
        data.escrowDetails.updatedAt = currentTime;

        if(_releazeFunds) {
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
        if(!data.disputeInfo.isActive) revert NoActiveDispute();
        if(bytes(_reasoning).length == 0) revert ReasoningCannotBeEmpty();
        
        uint currentTime = _now();
        data.disputeInfo.arbiterDecision = _releazeFunds;
        data.disputeInfo.arbiterReasoning = _encodeString(_reasoning);
        data.disputeInfo.resolvedAt = currentTime;
        data.disputeInfo.isActive = false;
        
        data.escrowDetails.updatedAt = currentTime;

        if(_releazeFunds) {
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
        if(data.escrowDetails.assetToken == address(0)) {
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
        if(_agent == address(0)) revert InvalidAgentAddress();
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
        if(!paused()) revert ContractMustBePaused();
        
        if(data.escrowDetails.assetToken == address(0)) {
            (bool success, ) = payable(owner()).call{value: address(this).balance}("");
            if(!success) revert EmergencyWithdrawFailed();
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
        if(data.escrowDetails.state != EscrowState.AWAITING_FULFILLMENT) {
            revert InvalidStateForFundRelease();
        }
        if(data.escrowDetails.state == EscrowState.DISPUTE_RAISED) {
            revert InvalidStateForFundRelease();
        }

        unchecked{
            uint256 amount = data.escrowDetails.assetAmount;
            uint256 platformFee = (amount * data.platformFeePercentage) / data.feeDenominator;
            uint256 arbiterFee = (amount * data.arbiterFeePercentage) / data.feeDenominator;
            uint256 netAmount = (amount - platformFee) - arbiterFee;
            uint currentTime = _now();
            data.escrowDetails.state = EscrowState.COMPLETED;
            data.escrowDetails.updatedAt = currentTime;
            if(data.escrowDetails.assetToken == address(0)) {
                // Native token (ETH)
                if(netAmount > 0) {
                    (bool success, ) = payable(_recipient).call{value: netAmount}("");
                    if(!success) revert TransferToRecipientFailed();
                }
                if(platformFee > 0) {
                    (bool success, ) = payable(data.platformFeeRecipient).call{value: platformFee}("");
                    if(!success) revert TransferToPlatformFailed();
                }
                if(arbiterFee > 0) {
                    (bool success, ) = payable(data.escrowDetails.arbiter).call{value: arbiterFee}("");
                    if(!success) revert TransferToArbiterFailed();
                }
            } else {
                // ERC20 token
                IERC20 token = IERC20(data.escrowDetails.assetToken);
                
                if(netAmount > 0) {
                    token.safeTransfer(_recipient, netAmount);
                }
                if(platformFee > 0) {
                    token.safeTransfer(data.platformFeeRecipient, platformFee);
                }
                if(arbiterFee > 0) {
                    token.safeTransfer(data.escrowDetails.arbiter, arbiterFee);
                }
            }

            if(data.escrowDetails.arbiter != address(0)) {
                require(IEscrowFactory(owner()).updateArbiterStatus(data.escrowDetails.arbiter), "Update failed");
            }

            emit FundsReleased(_recipient, data.escrowDetails.assetToken, netAmount, currentTime);

        }

    } 

}
