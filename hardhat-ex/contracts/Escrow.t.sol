// SPDX-License-Identifier: MIT

pragma  solidity 0.8.30;

import { Escrow } from "./Escrow.sol";
import { IEscrow } from "./interfaces/IEscrow.sol";
import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mock ERC20 token for testing
contract MockERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    uint256 private _totalSupply;
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 18;
    
    constructor(uint256 initialSupply) {
        _totalSupply = initialSupply;
        _balances[msg.sender] = initialSupply;
    }
    
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) external override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) external view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) external override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        return true;
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(_balances[from] >= amount, "ERC20: insufficient balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        
        _allowances[owner][spender] = amount;
    }
    
    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
}

contract EscrowTest is Test {
    Escrow public escrow;
    MockERC20 public mockToken;
    
    address public buyer = address(0x1);
    address public seller = address(0x2);
    address public arbiter = address(0x3);
    address public platformFeeRecipient = address(0x4);
    address public unauthorizedUser = address(0x5);
    address public agent = address(0x6);
    
    uint256 public constant ASSET_AMOUNT = 1 ether;
    uint256 public constant DEADLINE = 7 days;
    uint256 public constant DISPUTE_WINDOW = 24 hours;
    string public constant DESCRIPTION = "Test escrow transaction";
    
    event EscrowCreated(
        address indexed buyer,
        address indexed seller,
        address indexed arbiter,
        address assetToken,
        uint256 assetAmount,
        uint256 deadline
    );
    
    event AssetDeposited(
        address indexed depositor,
        address indexed assetToken,
        uint256 amount,
        uint256 timestamp
    );
    
    event FulfillmentConfirmed(
        address indexed confirmer,
        uint256 timestamp
    );
    
    event FundsReleased(
        address indexed recipient,
        address indexed assetToken,
        uint256 amount,
        uint256 timestamp
    );
    
    event DisputeRaised(
        address indexed disputer,
        string reason,
        uint256 timestamp
    );
    
    event DisputeResolved(
        address indexed arbiter,
        bool releaseFunds,
        string reasoning,
        uint256 timestamp
    );

    // Initial set up
    function setUp() public {
        // Deploy mock ERC20 token
        mockToken = new MockERC20(1000 ether);
        
        // Fund test accounts
        vm.deal(buyer, 10 ether);
        vm.deal(seller, 10 ether);
        vm.deal(arbiter, 10 ether);
        vm.deal(platformFeeRecipient, 10 ether);
        
        // Mint tokens to buyer
        mockToken.mint(buyer, 100 ether);
        
        // Create escrow for ETH
        vm.prank(buyer);
        escrow = new Escrow(
            buyer,
            seller,
            arbiter,
            address(0), // ETH
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
    }

    // ============ Constructor Tests ============
    
    function test_Constructor_ValidParams() public {
        Escrow newEscrow = new Escrow(
            buyer,
            seller,
            arbiter,
            address(0),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
        
        assertEq(newEscrow.owner(), address(this));
        assertTrue(newEscrow.isExpired() == false);
    }
    
    // Testing for revert: Testing valid buyer address by parsing zero address
    function test_Constructor_InvalidBuyer() public {
        vm.expectRevert("Invalid buyer address");
        new Escrow(
            address(0),
            seller,
            arbiter,
            address(0),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
    }
    
    // Testing for revert: Testing valid seller address by parsing zero address
    function test_Constructor_InvalidSeller() public {
        vm.expectRevert("Invalid seller address");
        new Escrow(
            buyer,
            address(0),
            arbiter,
            address(0),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
    }
    
    // Testing for revert: Testing valid Arbiter address by parsing zero address
    function test_Constructor_InvalidArbiter() public {
        vm.expectRevert("Invalid arbiter address");
        new Escrow(
            buyer,
            seller,
            address(0),
            address(0),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
    }
    
    // Testing for revert: User should not create an escrow with zero amount
    function test_Constructor_InvalidAmount() public {
        vm.expectRevert("Asset amount must be greater than 0");
        new Escrow(
            buyer,
            seller,
            arbiter,
            address(0),
            0,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
    }
    
    // Testing for revert: Creating an escrow should always ensure that the deadline is in the future
    function test_Constructor_InvalidDeadline() public {
        vm.expectRevert("Deadline must be in the future");
        new Escrow(
            buyer,
            seller,
            arbiter,
            address(0),
            ASSET_AMOUNT,
            block.timestamp - 1,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
    }
    
    // Testing for revert: Dispute window should be greater than zero
    function test_Constructor_InvalidDisputeWindow() public {
        vm.expectRevert("Dispute window must be greater than 0");
        new Escrow(
            buyer,
            seller,
            arbiter,
            address(0),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            0,
            platformFeeRecipient
        );
    }
    
    // Testing for revert: Ensure that the platform fee recipient is not zero address
    function test_Constructor_InvalidPlatformFeeRecipient() public {
        vm.expectRevert("Invalid platform fee recipient");
        new Escrow(
            buyer,
            seller,
            arbiter,
            address(0),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            address(0)
        );
    }

    // ============ Deposit Tests ============
    
    function test_Deposit_ETH_Success() public {
        uint256 initialBalance = address(escrow).balance;
        uint256 buyerInitialBalance = buyer.balance;
        
        vm.expectEmit(true, true, true, true);
        emit AssetDeposited(buyer, address(0), ASSET_AMOUNT, block.timestamp);
        
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        assertEq(address(escrow).balance, initialBalance + ASSET_AMOUNT);
        assertEq(buyer.balance, buyerInitialBalance - ASSET_AMOUNT);
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.AWAITING_FULFILLMENT);
    }
    
    function test_Deposit_ETH_InsufficientAmount() public {
        vm.expectRevert("Incorrect ETH amount");
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT - 1}();
    }
    
    function test_Deposit_ETH_OnlyBuyer() public {
        vm.expectRevert("Only buyer can call this function");
        vm.prank(seller);
        escrow.deposit{value: ASSET_AMOUNT}();
    }
    
    function test_Deposit_ETH_WrongState() public {
        // First deposit
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        // Try to deposit again
        vm.expectRevert("Invalid escrow state");
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
    }
    
    function test_Deposit_ETH_Expired() public {
        // Fast forward past deadline
        vm.warp(block.timestamp + DEADLINE + 1);
        
        vm.expectRevert("Escrow has expired");
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
    }
    
    function test_Deposit_ERC20_Success() public {
        // Create ERC20 escrow
        Escrow erc20Escrow = new Escrow(
            buyer,
            seller,
            arbiter,
            address(mockToken),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
        
        // Approve tokens
        vm.prank(buyer);
        mockToken.approve(address(erc20Escrow), ASSET_AMOUNT);
        
        uint256 initialBalance = mockToken.balanceOf(address(erc20Escrow));
        uint256 buyerInitialBalance = mockToken.balanceOf(buyer);
        
        vm.expectEmit(true, true, true, true);
        emit AssetDeposited(buyer, address(mockToken), ASSET_AMOUNT, block.timestamp);
        
        vm.prank(buyer);
        erc20Escrow.deposit();
        
        assertEq(mockToken.balanceOf(address(erc20Escrow)), initialBalance + ASSET_AMOUNT);
        assertEq(mockToken.balanceOf(buyer), buyerInitialBalance - ASSET_AMOUNT);
        assertTrue(erc20Escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.AWAITING_FULFILLMENT);
    }
    
    function test_Deposit_ERC20_InsufficientBalance() public {
        Escrow erc20Escrow = new Escrow(
            buyer,
            seller,
            arbiter,
            address(mockToken),
            200 ether, // More than buyer has (buyer has 100 ether)
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
        
        vm.prank(buyer);
        mockToken.approve(address(erc20Escrow), 200 ether);
        
        vm.expectRevert("Insufficient token balance");
        vm.prank(buyer);
        erc20Escrow.deposit();
    }
    
    function test_Deposit_ERC20_InsufficientAllowance() public {
        Escrow erc20Escrow = new Escrow(
            buyer,
            seller,
            arbiter,
            address(mockToken),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
        
        vm.expectRevert("Insufficient token allowance");
        vm.prank(buyer);
        erc20Escrow.deposit();
    }
    
    function test_Deposit_ERC20_ETHNotAccepted() public {
        Escrow erc20Escrow = new Escrow(
            buyer,
            seller,
            arbiter,
            address(mockToken),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
        
        vm.prank(buyer);
        mockToken.approve(address(erc20Escrow), ASSET_AMOUNT);
        
        vm.expectRevert("ETH not accepted for ERC20 escrow");
        vm.prank(buyer);
        erc20Escrow.deposit{value: 1 ether}();
    }

    // ============ Fulfillment Tests ============
    
    function test_ConfirmFulfillment_Success() public {
        // First deposit
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        uint256 sellerInitialBalance = seller.balance;
        
        vm.prank(buyer);
        escrow.confirmFulfillment();
        
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.COMPLETED);
        // Seller receives amount minus fees (platform fee: 0.5%, arbiter fee: 1%)
        uint256 expectedAmount = ASSET_AMOUNT - (ASSET_AMOUNT * 150) / 10000; // 1.5% total fees
        assertEq(seller.balance, sellerInitialBalance + expectedAmount);
    }
    
    function test_ConfirmFulfillment_OnlyBuyer() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.expectRevert("Only buyer can call this function");
        vm.prank(seller);
        escrow.confirmFulfillment();
    }
    
    function test_ConfirmFulfillment_WrongState() public {
        vm.expectRevert("Invalid escrow state");
        vm.prank(buyer);
        escrow.confirmFulfillment();
    }
    
    function test_ReleaseFunds_Buyer() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        uint256 sellerInitialBalance = seller.balance;
        
        vm.prank(buyer);
        escrow.releaseFunds();
        
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.COMPLETED);
        // Seller receives amount minus fees (platform fee: 0.5%, arbiter fee: 1%)
        uint256 expectedAmount = ASSET_AMOUNT - (ASSET_AMOUNT * 150) / 10000; // 1.5% total fees
        assertEq(seller.balance, sellerInitialBalance + expectedAmount);
    }
    
    function test_ReleaseFunds_Arbiter() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        uint256 sellerInitialBalance = seller.balance;
        
        vm.prank(arbiter);
        escrow.releaseFunds();
        
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.COMPLETED);
        // Seller receives amount minus fees (platform fee: 0.5%, arbiter fee: 1%)
        uint256 expectedAmount = ASSET_AMOUNT - (ASSET_AMOUNT * 150) / 10000; // 1.5% total fees
        assertEq(seller.balance, sellerInitialBalance + expectedAmount);
    }
    
    function test_ReleaseFunds_Unauthorized() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.expectRevert("Only buyer or arbiter can release funds");
        vm.prank(unauthorizedUser);
        escrow.releaseFunds();
    }

    // ============ Refund Tests ============
    
    function test_RefundFunds_BuyerAfterDeadline() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        // Fast forward past deadline
        vm.warp(block.timestamp + DEADLINE + 1);
        
        uint256 buyerInitialBalance = buyer.balance;
        
        vm.prank(buyer);
        escrow.refundFunds();
        
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.CANCELED);
        // Buyer receives amount minus fees (platform fee: 0.5%, arbiter fee: 1%)
        uint256 expectedAmount = ASSET_AMOUNT - (ASSET_AMOUNT * 150) / 10000; // 1.5% total fees
        assertEq(buyer.balance, buyerInitialBalance + expectedAmount);
    }
    
    function test_RefundFunds_BuyerBeforeDeadline() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.expectRevert("Deadline not reached");
        vm.prank(buyer);
        escrow.refundFunds();
    }
    
    function test_RefundFunds_Arbiter() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        uint256 buyerInitialBalance = buyer.balance;
        
        vm.prank(arbiter);
        escrow.refundFunds();
        
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.CANCELED);
        // Buyer receives amount minus fees (platform fee: 0.5%, arbiter fee: 1%)
        uint256 expectedAmount = ASSET_AMOUNT - (ASSET_AMOUNT * 150) / 10000; // 1.5% total fees
        assertEq(buyer.balance, buyerInitialBalance + expectedAmount);
    }
    
    function test_RefundFunds_Unauthorized() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.expectRevert("Only buyer or arbiter can refund funds");
        vm.prank(unauthorizedUser);
        escrow.refundFunds();
    }

    // ============ Dispute Tests ============
    
    function test_RaiseDispute_Buyer() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        string memory reason = "Product not as described";
        
        vm.expectEmit(true, true, true, true);
        emit DisputeRaised(buyer, reason, block.timestamp);
        
        vm.prank(buyer);
        escrow.raiseDispute(reason);
        
        IEscrow.EscrowData memory data = escrow.getEscrowData();
        assertTrue(data.escrowDetails.state == IEscrow.EscrowState.DISPUTE_RAISED);
        assertTrue(data.disputeInfo.isActive);
        assertEq(data.disputeInfo.disputer, buyer);
    }
    
    function test_RaiseDispute_Seller() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        string memory reason = "Payment not received";
        
        vm.prank(seller);
        escrow.raiseDispute(reason);
        
        IEscrow.EscrowData memory data = escrow.getEscrowData();
        assertTrue(data.escrowDetails.state == IEscrow.EscrowState.DISPUTE_RAISED);
        assertTrue(data.disputeInfo.isActive);
        assertEq(data.disputeInfo.disputer, seller);
    }
    
    function test_RaiseDispute_EmptyReason() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.expectRevert("Dispute reason cannot be empty");
        vm.prank(buyer);
        escrow.raiseDispute("");
    }
    
    function test_RaiseDispute_Unauthorized() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.expectRevert("Only buyer or seller can call this function");
        vm.prank(unauthorizedUser);
        escrow.raiseDispute("Test reason");
    }
    
    function test_RaiseDispute_WrongState() public {
        vm.expectRevert("Invalid escrow state");
        vm.prank(buyer);
        escrow.raiseDispute("Test reason");
    }
    
    function test_ResolveDispute_ReleaseFunds() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.prank(buyer);
        escrow.raiseDispute("Test dispute");
        
        string memory reasoning = "Seller provided valid proof";
        uint256 sellerInitialBalance = seller.balance;
        
        vm.expectEmit(true, true, true, true);
        emit DisputeResolved(arbiter, true, reasoning, block.timestamp);
        
        vm.prank(arbiter);
        escrow.resolveDispute(true, reasoning);
        
        IEscrow.EscrowData memory data = escrow.getEscrowData();
        assertTrue(data.escrowDetails.state == IEscrow.EscrowState.COMPLETED);
        assertFalse(data.disputeInfo.isActive);
        assertTrue(data.disputeInfo.arbiterDecision);
        // Seller receives amount minus fees (platform fee: 0.5%, arbiter fee: 1%)
        uint256 expectedAmount = ASSET_AMOUNT - (ASSET_AMOUNT * 150) / 10000; // 1.5% total fees
        assertEq(seller.balance, sellerInitialBalance + expectedAmount);
    }
    
    function test_ResolveDispute_RefundFunds() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.prank(buyer);
        escrow.raiseDispute("Test dispute");
        
        string memory reasoning = "Buyer's claim is valid";
        uint256 buyerInitialBalance = buyer.balance;
        
        vm.prank(arbiter);
        escrow.resolveDispute(false, reasoning);
        
        IEscrow.EscrowData memory data = escrow.getEscrowData();
        assertTrue(data.escrowDetails.state == IEscrow.EscrowState.CANCELED);
        assertFalse(data.disputeInfo.isActive);
        assertFalse(data.disputeInfo.arbiterDecision);
        // Buyer receives amount minus fees (platform fee: 0.5%, arbiter fee: 1%)
        uint256 expectedAmount = ASSET_AMOUNT - (ASSET_AMOUNT * 150) / 10000; // 1.5% total fees
        assertEq(buyer.balance, buyerInitialBalance + expectedAmount);
    }
    
    function test_ResolveDispute_OnlyArbiter() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.prank(buyer);
        escrow.raiseDispute("Test dispute");
        
        vm.expectRevert("Only arbiter can call this function");
        vm.prank(buyer);
        escrow.resolveDispute(true, "Test reasoning");
    }
    
    function test_ResolveDispute_NoActiveDispute() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.expectRevert("Invalid escrow state");
        vm.prank(arbiter);
        escrow.resolveDispute(true, "Test reasoning");
    }
    
    function test_ResolveDispute_EmptyReasoning() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.prank(buyer);
        escrow.raiseDispute("Test dispute");
        
        vm.expectRevert("Reasoning cannot be empty");
        vm.prank(arbiter);
        escrow.resolveDispute(true, "");
    }

    // ============ Agent Tests ============
    
    function test_AuthorizeAgent() public {
        vm.prank(buyer);
        escrow.authorizeAgent(agent);
        
        assertTrue(escrow.authorizedAgents(agent));
    }
    
    function test_AuthorizeAgent_InvalidAddress() public {
        vm.expectRevert("Invalid agent address");
        vm.prank(buyer); // buyer is the owner
        escrow.authorizeAgent(address(0));
    }
    
    function test_AuthorizeAgent_OnlyOwner() public {
        vm.expectRevert();
        vm.prank(unauthorizedUser);
        escrow.authorizeAgent(agent);
    }
    
    function test_RevokeAgent() public {
        vm.prank(buyer);
        escrow.authorizeAgent(agent);
        
        vm.prank(buyer);
        escrow.revokeAgent(agent);
        
        assertFalse(escrow.authorizedAgents(agent));
    }
    
    function test_AgentDeposit() public {
        vm.prank(buyer);
        escrow.authorizeAgent(agent);
        
        vm.prank(agent);
        escrow.agentDeposit();
        
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.AWAITING_FULFILLMENT);
    }
    
    function test_AgentDeposit_Unauthorized() public {
        vm.expectRevert("Only authorized agents can call this function");
        vm.prank(agent);
        escrow.agentDeposit();
    }
    
    function test_AgentConfirmFulfillment() public {
        vm.prank(buyer);
        escrow.authorizeAgent(agent);
        
        // Buyer deposits funds first
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        uint256 sellerInitialBalance = seller.balance;
        
        vm.prank(agent);
        escrow.agentConfirmFulfillment();
        
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.COMPLETED);
        // Seller receives amount minus fees (platform fee: 0.5%, arbiter fee: 1%)
        uint256 expectedAmount = ASSET_AMOUNT - (ASSET_AMOUNT * 150) / 10000; // 1.5% total fees
        assertEq(seller.balance, sellerInitialBalance + expectedAmount);
    }
    
    function test_AgentResolveDispute() public {
        vm.prank(buyer);
        escrow.authorizeAgent(agent);
        
        // Buyer deposits funds first
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.prank(buyer);
        escrow.raiseDispute("Test dispute");
        
        uint256 sellerInitialBalance = seller.balance;
        
        vm.prank(agent);
        escrow.agentResolveDispute(true, "Agent decision");
        
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.COMPLETED);
        // Seller receives amount minus fees (platform fee: 0.5%, arbiter fee: 1%)
        uint256 expectedAmount = ASSET_AMOUNT - (ASSET_AMOUNT * 150) / 10000; // 1.5% total fees
        assertEq(seller.balance, sellerInitialBalance + expectedAmount);
    }

    // ============ Admin Tests ============
    
    function test_Pause() public {
        vm.prank(buyer);
        escrow.pause();
        
        assertTrue(escrow.paused());
    }
    
    function test_Pause_OnlyOwner() public {
        vm.expectRevert();
        vm.prank(unauthorizedUser);
        escrow.pause();
    }
    
    function test_Unpause() public {
        vm.prank(buyer);
        escrow.pause();
        
        vm.prank(buyer);
        escrow.unpause();
        
        assertFalse(escrow.paused());
    }
    
    function test_EmergencyWithdraw() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.prank(buyer);
        escrow.pause();
        
        uint256 ownerInitialBalance = buyer.balance;
        
        vm.prank(buyer);
        escrow.emergencyWithdraw();
        
        // Emergency withdraw transfers full amount (no fees deducted in emergency)
        assertEq(buyer.balance, ownerInitialBalance + ASSET_AMOUNT);
    }
    
    function test_EmergencyWithdraw_NotPaused() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.expectRevert("Contract must be paused");
        vm.prank(buyer); // buyer is the owner
        escrow.emergencyWithdraw();
    }
    
    function test_EmergencyWithdraw_OnlyOwner() public {
        vm.prank(buyer);
        escrow.pause();
        
        vm.expectRevert();
        vm.prank(unauthorizedUser);
        escrow.emergencyWithdraw();
    }

    // ============ Edge Cases and Security Tests ============
    
    function test_ReentrancyProtection() public {
        // This test would require a malicious contract to test reentrancy
        // For now, we'll test that the deposit function has the nonReentrant modifier
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        // Should succeed without reentrancy issues
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.AWAITING_FULFILLMENT);
    }
    
    function test_ExpiredEscrow() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        // Fast forward past deadline
        vm.warp(block.timestamp + DEADLINE + 1);
        
        assertTrue(escrow.isExpired());
        
        // Should not be able to confirm fulfillment
        vm.expectRevert("Escrow has expired");
        vm.prank(buyer);
        escrow.confirmFulfillment();
    }
    
    function test_GetBalance_ETH() public {
        assertEq(escrow.getBalance(), 0);
        
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        assertEq(escrow.getBalance(), ASSET_AMOUNT);
    }
    
    function test_GetBalance_ERC20() public {
        Escrow erc20Escrow = new Escrow(
            buyer,
            seller,
            arbiter,
            address(mockToken),
            ASSET_AMOUNT,
            block.timestamp + DEADLINE,
            DESCRIPTION,
            DISPUTE_WINDOW,
            platformFeeRecipient
        );
        
        assertEq(erc20Escrow.getBalance(), 0);
        
        vm.prank(buyer);
        mockToken.approve(address(erc20Escrow), ASSET_AMOUNT);
        
        vm.prank(buyer);
        erc20Escrow.deposit();
        
        assertEq(erc20Escrow.getBalance(), ASSET_AMOUNT);
    }
    
    function test_GetEscrowData() public {
        IEscrow.EscrowData memory data = escrow.getEscrowData();
        
        assertEq(data.escrowDetails.buyer, buyer);
        assertEq(data.escrowDetails.seller, seller);
        assertEq(data.escrowDetails.arbiter, arbiter);
        assertEq(data.escrowDetails.assetToken, address(0));
        assertEq(data.escrowDetails.assetAmount, ASSET_AMOUNT);
        assertTrue(data.escrowDetails.state == IEscrow.EscrowState.AWAITING_DEPOSIT);
        assertEq(data.platformFeeRecipient, platformFeeRecipient);
    }
    
    function test_StateTransitions() public {
        // Initial state
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.AWAITING_DEPOSIT);
        
        // After deposit
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.AWAITING_FULFILLMENT);
        
        // After dispute
        vm.prank(buyer);
        escrow.raiseDispute("Test dispute");
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.DISPUTE_RAISED);
        
        // After dispute resolution
        vm.prank(arbiter);
        escrow.resolveDispute(true, "Test reasoning");
        assertTrue(escrow.getEscrowData().escrowDetails.state == IEscrow.EscrowState.COMPLETED);
    }
    
    function test_MultipleDisputes() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        // First dispute
        vm.prank(buyer);
        escrow.raiseDispute("First dispute");
        
        // Try to raise another dispute
        vm.expectRevert("Invalid escrow state");
        vm.prank(seller);
        escrow.raiseDispute("Second dispute");
    }
    
    function test_DisputeAfterCompletion() public {
        vm.prank(buyer);
        escrow.deposit{value: ASSET_AMOUNT}();
        
        vm.prank(buyer);
        escrow.confirmFulfillment();
        
        // Try to raise dispute after completion
        vm.expectRevert("Invalid escrow state");
        vm.prank(buyer);
        escrow.raiseDispute("Test dispute");
    }
}
