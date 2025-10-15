// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { ITradingAccount } from "../../interfaces/ITradingAccount.sol";
import { ITradeFactory } from "../../interfaces/ITradeFactory.sol";
import { IOrder } from "../../interfaces/IOrder.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Approved } from "../../Approved.sol";

/**
 * @title TradingAccount
 * @dev Individual trading account contract for each user
 * @author TradeVerse Team
 */
contract TradingAccount is ITradingAccount, ReentrancyGuard, Approved {
    using SafeERC20 for IERC20;

    // ============ CUSTOM ERRORS ============
    error InvalidOwner();
    error InvalidFactory();
    error OnlyFactory();
    error NoWithdrawalRequest();
    error WithdrawalAlreadyProcessed();
    error CooldownNotPassed();
    error InvalidTokenAddress();
    error InsufficientBalance();
    error OrderNotFound();
    error OrderNotActive();
    error InvalidAmount();
    error InvalidExpiration();
    error TransferFailed();
    error SendingFeeFailed();
    error PriceNotProvided();
    error NoFundDetected();
    error FundFaucetFailed();
    error InvalidOrderId();
    error MinimumFundingRequired();
    error PendingWithdrawalRequest();
    error InvalidPaymentAsset();

    // ============ STATE VARIABLES ============

    // /**
    //  * @dev Address of the trade factory contract
    //  */
    // ITradeFactory private immutable _tradeFactory;

    // /**
    //  * @dev Address of the seller
    //  */
    // address private immutable _seller;

    /**
     * @dev Mapping of order IDs to their respective index in the order array
     */
    mapping(bytes32 => OrderIndex) private orderIndex;

    // /**
    //  * @dev Array of active order IDs
    //  */
    // bytes32[] private _activeOrderIds;

    /**
     * @dev Mapping of token addresses to balances
     */
    mapping(address => uint256) private _balances;

    /**
     * @dev Mapping of token addresses to locked balances (in orders)
     */
    mapping(address => uint256) private _lockedBalances;

    /**
     * @dev Mapping of token addresses to withdrawal requests
     */
    mapping(address => WithdrawalRequest) private _withdrawalRequests;

    /**
     * @dev Cooldown period for withdrawals (in seconds)
     */
    uint256 private immutable COOLDOWN_PERIOD = 15 minutes;

    /**
     * @dev Total number of orders created
     */
    uint256 private _totalOrders;

    /**
     * @dev Number of successful orders
     */
    uint256 private _successfulOrders;

    /**
     * @dev Number of cancelled orders
     */
    uint256 private _cancelledOrders;

    /**
     * @dev Seller info
     */
    SellerInfo private info;

    OrderDetails private orders;

    // ============ MODIFIERS ============

    // /**
    //  * @dev Restricts function access to only the trade factory
    //  */
    // modifier onlySellerOrAgent() {
    //     if(_msgSender() != address(_tradeFactory)) revert OnlyFactory();
    //     _;
    // }

    /**
     * @dev Ensures withdrawal request exists and is not processed
     */
    modifier hasWithdrawalRequest(address token) {
        if(_withdrawalRequests[token].amount == 0) revert NoWithdrawalRequest();
        if(!_withdrawalRequests[token].isOpen) revert WithdrawalAlreadyProcessed();
        _;
    }

    /**
     * @dev Ensures cooldown period has passed
     */
    modifier cooldownPassed(address token) {
        if(_now() < _withdrawalRequests[token].cooldownEnd) revert CooldownNotPassed();
        _;
    }

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the trading account
     * @param _seller Address of the account owner
     * @param agent Agent to act on behalf of the seller
     * @param nickName Seller's Alias or trade idenfifier
     * @param tradeFactory Address of the trade factory contract
    */
    constructor(
        address _seller, 
        address agent, 
        address tradeFactory, 
        string memory nickname
    ) Approved(tradeFactory, seller) 
    {
        if(tradeFactory == address(0)) revert InvalidFactory();
        if(_seller == address(0)) revert InvalidFactory();
        if(agent != address(0)) _setPermission(agent, true);
        info.nickName = abi.encode(bytes(nickname));
        info.id = _seller;
    }

    // Sending ETH via this method activates sell order for native asset
    receive() external payable {}

    // ============ EXTERNAL FUNCTIONS ============

    // Update nickName
    function setNickName(string memory nickName) external onlyApproved returns(bool) {
        info.nickName = abi.encode(bytes(nickName));
        return true;
    }

    /**
     * @dev Create a new trading order
     * @param tokenAddress Token address (as bytes32 for cross-chain compatibility)
     * @param amount Amount of tokens to trade
     * @param pricePerUnit Price per token
     * @param expirationHours Hours until order expires
     * @param nickname User's nickname 
     * @return order Address of the created order contract
     * @return orderId Unique identifier for the order
     * @notice Orders are free up to 24 hours. Subsequent extra hours are charged based on the creating fee
     */
    function createOrder(
        address tokenAddress,
        uint256 amount,
        uint256 pricePerUnit,
        uint256 expirationHours
    ) external onlyApproved nonReentrant whenNotPaused returns(address order, bytes32 orderId) {
        if(_withdrawalRequests[token].isOpen) revert PendingWithdrawalRequest();
        unchecked {
            if(amount == 0) revert InvalidAmount();
            uint expiration = expirationHours * 1 hours;
            FactoryVariables memory fv = ITradeFactory(owner()).getVariables();
            if(expirationHours == 0) {
                expiration = 24 hours;
            } else {
                if(expiration > 24) {
                    uint listDurationFee = fv.creationFee * (expiration - 24);
                    if(listDurationFee > 0) {
                        if(msg.value < listDurationFee && address(this).balance < listDurationFee) {
                            revert InsufficientOrderDurationFee();
                        } else {
                            (bool sent,) = payable(owner()).call{value:listDurationFee}('');
                            if(!sent) revert SendingFeeFailed();
                        }
                    }
                }
            }
            if(!fv.isPythSupported){
                if(pricePerUnit == 0) revert PriceNotProvided();
            }
            // Generate unique order ID
            orderId = keccak256(abi.encodePacked(
                _now(),
                _owner,
                tokenAddress,
                amount,
                _totalOrders
            ));
            uint currentTime = _now();
            

            // Create order details
            uint index = orders.length;
            orderIndex[orderId] = OrderIndex(index, true);
            orders.push(
                OrderDetails({
                    amount: amount,
                    pricePerUnit: pricePerUnit,
                    createdAt: currentTime,
                    expiresAt: currentTime + expiration,
                    reputation: 0,
                    asseetInfo: _getAssetInfo(tokenAddress, amount),
                    status: OrderStatus.ACTIVE
                })
            );
            _totalOrders++;

            emit OrderCreated(orderId, tokenAddress, index, amount, price, price == 0, nickname);
        }
    }

    function _validateOrder(bytes32 orderId) internal returns(OrderDetails storage orderDetails) {
        OrderIndex memory oi = orderIndex[orderId];
        if(!oi.hasIndex) revert InvalidOrderId();
        orderDetails = orders[oi.index];
        if(orderDetails.amount == 0) revert OrderNotFound();
        if(orderDetails.status != OrderStatus.ACTIVE) revert OrderNotActive();
    }

    /**
     * @dev Cancel an existing order
     * @param orderId ID of the order to cancel
     */
    function cancelOrder(bytes32 orderId) external nonReentrant onlyApproved whenNotPaused {
        // OrderIndex memory oi = orderIndex[orderId];
        // if(!oi.hasIndex) revert InvalidOrderId();
        // OrderDetails storage orderDetails = orders[oi.index];
        // if(orderDetails.amount == 0) revert OrderNotFound();
        // if(orderDetails.status != OrderStatus.ACTIVE) revert OrderNotActive();

        OrderDetails storage orderDetails = _validateOrder(orderId);
        orderDetails.status = OrderStatus.CANCELLED;

        _cancelledOrders++;

        // Unlock the balance
        address tokenAddr = orderDetails.tokenAddress;
        unchecked {
            uint256 lockedBal = _lockedBalances[tokenAddr];
            if(lockedBal >= orderDetails.amount) _lockedBalances[tokenAddr] -= orderDetails.amount;
            _balances[tokenAddr] += orderDetails.amount;

            if(orderDetails.reputation > 0) orderDetails.reputation -= 1;
        }

        emit OrderCancelled(orderId, tokenAddr, orderDetails.amount);
        orderDetails.amount = 0;
    }

    /**
     * @dev Deposit tokens into the trading account
     * @param token Token address (address(0) for native ETH)
     */
    function deposit(address token) external payable nonReentrant whenNotPaused returns(bool) {
        (address from, uint amount) = (info.id, msg.value);
        unchecked {
            _balances[address(0)] += amount;
            if(token != address(0)) {
                IERC20 tk = IERC20(token);
                uint256 allowanceFromSeller = tk.allowance(from, address(this));
                uint256 allowanceFromSender = tk.allowance(_msgSender(), address(this));
                (from, amount) = allowanceFromSeller > 0? (from, allowanceFromSeller) : (_msgSender(), allowanceFromSender);
                tk.safeTransferFrom(from, address(this), amount);
                _balances[token] += amount;
              
            }
        }

        emit AssetDeposited(token, amount, _balances[token], _balances[address(0)]);
    }

    /**
     * @dev Request withdrawal of tokens
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function requestWithdrawal(address token, uint256 amount) external onlyApproved nonReentrant whenNotPaused {
        if(amount == 0) revert InvalidAmount();
        uint256 withdrawable = _balances[token]; // Pull either erc20 or native balance
        if(withdrawable < amount) revert InsufficientBalance();

        uint currentTime = _now();
        _withdrawalRequests[token] = WithdrawalRequest({
            amount: amount,
            requestedAt: currentTime,
            cooldownEnd: currentTime + COOLDOWN_PERIOD,
            isOpen: true
        });

        emit WithdrawalRequested(token, amount, currentTime + COOLDOWN_PERIOD);
    }

    /**
     * @dev Process withdrawal after cooldown period
     * @param token Token address to withdraw
     */
    function processWithdrawal(address token) 
        external 
        onlyApproved
        nonReentrant 
        whenNotPaused 
        hasWithdrawalRequest(token) 
        cooldownPassed(token) 
    {
        WithdrawalRequest storage request = _withdrawalRequests[token];
        request.isOpen = false;
        uint256 balances = _balances[token];
        if(balances >= request.amount) {
            unchecked {
                _balances[token] = balances - request.amount;
            }
        } 
        address _seller = info.id;
        if(token == address(0)) {
            // Native ETH withdrawal
            (bool success, ) = payable(_seller).call{value: request.amount}("");
            if(!success) revert TransferFailed();
        } else {
            // ERC20 token withdrawal
            IERC20(token).safeTransfer(_seller, request.amount);
        }
        request.amount = 0;

        emit AssetWithdrawn(token, request.amount, _balances[token]);
    }

    // /**
    //  * @dev Set cooldown period for withdrawals
    //  * @param newCooldownPeriod New cooldown period in seconds
    //  */
    // function setCooldownPeriod(uint256 newCooldownPeriod) external override onl {
    //     if(_msgSender() != _owner) revert InvalidOwner();
    //     COOLDOWN_PERIOD = newCooldownPeriod;
    //     emit CooldownPeriodSet(newCooldownPeriod);
    // }

    // ============ FACTORY FUNCTIONS ============

    /**
     * @dev Fulfill an order (called by factory)
     * @param orderId ID of the order to fulfill
     * @param buyer Address of the buyer
     * @param amount Amount being traded
     * @notice Either buyer or their representative agent can fulfil an order trade.
     * Payment for all assets is in stablecoin.
     */
    function fulfillOrder(bytes32 orderId, address buyer, uint256 amount) external returns(bool) {
        // OrderDetails storage orderDetails = _orders[orderId];
        // if(orderDetails.amount == 0) revert OrderNotFound();
        // if(orderDetails.status != uint8(IOrder.OrderStatus.ACTIVE)) revert OrderNotActive();

        OrderDetails storage orderDetails = _validateOrder(orderId);
        orderDetails.status = OrderStatus.FULFILLED;
        _successfulOrders++;

        // Unlock the balance
        uint amountTaken = amount;
        uint totalCost;
        address tokenAddr = orderDetails.tokenAddres;
        unchecked {
            if(amount >= orderDetails.amount) {
                amountTaken = orderDetails.amount;
                orderDetails.amount = 0;
            } else {
                orderDetails.amount -= amount;
            }
            _lockedBalances[tokenAddr] = orderDetails.amount;
        }

        if(orderDetails.price == 0) {
            // Use price oracle
        } else {
            totalCost = orderDetails.price * amountTaken;
        }
        FactoryVariables memory fv = ITradeFactory(owner()).getVariables();
        if(fv.supportedPaymentAsset == address(0)) revert InvalidPaymentAsset();
        

        // if(orderDetails.tokenAddres != address(0)) {
        //     _balances[tokenAddr] -= amount;
        // }

        // Remove from active orders
        // for (uint256 i = 0; i < _activeOrderIds.length; i++) {
        //     if(_activeOrderIds[i] == orderId) {
        //         _activeOrderIds[i] = _activeOrderIds[_activeOrderIds.length - 1];
        //         _activeOrderIds.pop();
        //         break;
        //     }
        // }

        emit OrderFulfilled(orderId, buyer, amount);
    }

    /**
     * @dev Update reputation (called by factory)
     * @param orderId ID of the order
     * @param reputation New reputation value
     */
    function updateReputation(bytes32 orderId, uint256 reputation) external override onlyFactory {
        OrderDetails storage orderDetails = _orders[orderId];
        if(orderDetails.amount == 0) revert OrderNotFound();
        
        orderDetails.reputation = reputation;
    }

    // ============ VIEW FUNCTIONS ============

    function _getAssetInfo(address tokenAddr, uint256 amount) internal view returns(AssetDetail memory _info) {
        if(_balances[tokenAddr] < amount) {
            revert MinimumFundingRequired();
        } else {
            _balances[tokenAddr] -= amount;
            _lockedBalances[tokenAddr] += amount;
        }
        if(tokenAddr != address(0)) {
            IERC20 tk = IERC20(tokenAddr);
            if(tk.balanceOf(address(this)) == 0) {
                if(tk.allowance(seller, address(this)) == 0) {
                    revert NoFundDetected();
                } else {
                    if(!tk.safeTransferFrom(seller, address(this), amount)) revert FundFaucetFailed();
                }
            }
            _info =  AssetDetail(
                tk.decimals(),
                tk.name(),
                tk.symbol(),
                tokenAddr 
            );
        }
    }

    // Get the latest time stamp
    function _now() internal view returns(uint currentTime) {
        currentTime = block.timestamp;
    }

    /**
     * @dev Get comprehensive account information
     * @return accountData Packed account data
     */
    function getAccountData() external view override returns (AccountData memory accountData) {
        accountData = AccountData({
            owner: _owner,
            tradeFactory: address(_tradeFactory),
            totalOrders: _totalOrders,
            successfulOrders: _successfulOrders,
            cancelledOrders: _cancelledOrders,
            cooldownPeriod: COOLDOWN_PERIOD,
            activeOrderCount: _activeOrderIds.length
        });
    }

    /**
     * @dev Get order details
     * @param orderId ID of the order
     * @return orderDetails Order details
     */
    function getOrder(bytes32 orderId) external view override returns (OrderDetails memory orderDetails) {
        orderDetails = _orders[orderId];
    }

    /**
     * @dev Get all active order IDs
     * @return orderIds Array of active order IDs
     */
    function getActiveOrderIds() external view override returns (bytes32[] memory orderIds) {
        orderIds = _activeOrderIds;
    }

    /**
     * @dev Get balance for a specific token
     * @param token Token address
     * @return balance Token balance
     */
    function getBalance(address token) external view override returns (uint256 balance) {
        balance = _balances[token];
    }

    /**
     * @dev Get locked balance for a specific token
     * @param token Token address
     * @return lockedBalance Locked token balance
     */
    function getLockedBalance(address token) external view override returns (uint256 lockedBalance) {
        lockedBalance = _lockedBalances[token];
    }

    /**
     * @dev Get withdrawal request for a specific token
     * @param token Token address
     * @return request Withdrawal request details
     */
    function getWithdrawalRequest(address token) external view override returns (WithdrawalRequest memory request) {
        request = _withdrawalRequests[token];
    }

    /**
     * @dev Get owner address
     * @return owner_ Account owner address
     */
    function getOwnerAndApproved(address agent) external view override returns (address, bool) {
        return (owner(), _isApproved(agent));
    }

    /**
     * @dev Get trade factory address
     * @return factory_ Trade factory address
     */
    function tradeFactory() external view override returns (address factory_) {
        factory_ = address(_tradeFactory);
    }

    /**
     * @dev Get cooldown period
     * @return cooldownPeriod_ Cooldown period in seconds
     */
    function cooldownPeriod() external view override returns (uint256 cooldownPeriod_) {
        cooldownPeriod_ = COOLDOWN_PERIOD;
    }

    /**
     * @dev Get total orders count
     * @return totalOrders_ Total number of orders
     */
    function totalOrders() external view override returns (uint256 totalOrders_) {
        totalOrders_ = _totalOrders;
    }

    /**
     * @dev Get successful orders count
     * @return successfulOrders_ Number of successful orders
     */
    function successfulOrders() external view override returns (uint256 successfulOrders_) {
        successfulOrders_ = _successfulOrders;
    }

    /**
     * @dev Get cancelled orders count
     * @return cancelledOrders_ Number of cancelled orders
     */
    function cancelledOrders() external view override returns (uint256 cancelledOrders_) {
        cancelledOrders_ = _cancelledOrders;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Pause the contract
     */
    function pause() external {
        if(_msgSender() != _owner) revert InvalidOwner();
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external {
        if(_msgSender() != _owner) revert InvalidOwner();
        _unpause();
    }

    /**
     * @dev Emergency withdraw (only owner)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external {
        if(_msgSender() != _owner) revert InvalidOwner();
        if(amount == 0) revert InvalidAmount();
        if(_balances[token] < amount) revert InsufficientBalance();

        _balances[token] -= amount;

        if(token == address(0)) {
            (bool success, ) = payable(_owner).call{value: amount}("");
            if(!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(_owner, amount);
        }
    }

    /**
     * @dev Pause execution 
     * Only the factory contract can pause the Trading account
     */
    function deactivateAccount(bool stop) external onlyOwner returns (bool){
        stop? _pause() : _unpause();
        return true;
    }
}