// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { ITradingAccount } from "../../interfaces/ITradingAccount.sol";
import { ITradeFactory } from "../../interfaces/ITradeFactory.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { Approved } from "../../Approved.sol";
import { PythPriceFeed } from "../../oracles/PythPriceFeed.sol";

/**
 * @title TradingAccount
 * @dev Individual trading account contract for each user
 * @author Bobeu - https://github.com/bobeu
 */
contract TradingAccount is ITradingAccount, PythPriceFeed, ReentrancyGuard, Approved {
    using SafeERC20 for IERC20;

    // ============ CUSTOM ERRORS ============
    error InvalidDuration();
    error InsufficientOrderDurationFee();

    // ============ STATE VARIABLES ============

    /**
    * @dev Trade factory contract
     */
    ITradeFactory private immutable tradeFactory;

    /**
     * @dev Mapping of order IDs to their respective index in the order array
     */
    mapping(bytes32 => OrderIndex) private orderIndex;

    /**
     * @dev Mapping of token addresses to balances
     */
    mapping(address => uint256) private _balances;

    /**
     * @dev Mapping of token addresses to locked balances (in orders)
     */
    mapping(address => uint256) private _lockedBalances;
   
    /**
     * @dev Mapping of token addresses to boolean
     * Account owners should always add token to verified list before they place buy order.
     * This is to protect against certain form of attacks where an actor could impersonate a token
     * and use it as purchasing asset.
     */
    mapping(address => bool) private isVerified;

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

    /**
     * @dev Order list
     */
    OrderDetails[] private orders;

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the trading account
     * @param _seller Address of the account owner
     * @param agent Agent to act on behalf of the seller
     * @param controller Address of the controller
     * @param nickname Seller's Alias or trade identifier
    */
    constructor(
        address _seller, 
        address agent, 
        address controller, 
        string memory nickname,
        address _pythAddress
    ) 
        Approved(controller, _seller) 
        PythPriceFeed(_pythAddress, _seller)
    {
        if(agent != address(0) && agent != _seller) _setPermission(agent, true);
        info.nickName = abi.encode(nickname);
        info.id = _seller;
        info.agentId = keccak256(abi.encodePacked(agent, _now(), nickname));
        tradeFactory = ITradeFactory(_msgSender());
    }

    // ============ EXTERNAL FUNCTIONS ============

    // Update nickName
    function setNickName(string memory nickName) external onlyApproved returns(bool) {
        info.nickName = abi.encode(bytes(nickName));
        return true;
    }

    // Update nickName
    function toggleTokenVerificationStatus(address token) external onlyApproved returns(bool) {
        if(token == address(0)) revert InvalidTokenOut();
        bool status = isVerified[token];
        isVerified[token] = !status;
        return true;
    }

    /**
     * @dev Create a new trading order
     * @param tokenAddress Token address
     * @param amount Amount of tokens to trade
     * @param price Price per token
     * @param expirationHours Hours until order expires
     * @return orderId Unique identifier for the order
     * @notice Orders are free up to 24 hours. Subsequent extra hours are charged based on the creating fee
     */
    function createOrder(
        address tokenAddress,
        uint256 amount,
        uint256 price,
        uint256 expirationHours,
        bytes32 _priceFeedId
    ) external payable onlyApproved nonReentrant whenNotPaused returns(bool) {
        unchecked {
            if(amount == 0) revert InvalidAmount();
            uint expiration = expirationHours * 1 hours;
            FactoryVariables memory fv = tradeFactory.getVariables(_msgSender());
            if(expirationHours == 0) {
                expiration = 24 hours;
            } else {
                if(expirationHours > 24) {
                    uint listDurationFee = fv.creationFee * (expiration - 24);
                    if(listDurationFee > 0) {
                        if(msg.value < listDurationFee) {
                            if(_balances[address(0)] >= listDurationFee) {
                                _balances[address(0)] -= listDurationFee;
                            } else {
                                revert InsufficientOrderDurationFee();
                            }
                            
                        }
                        (bool sent,) = payable(owner()).call{value:listDurationFee}('');
                        if(!sent) revert TransferFailed();
                    }
                }
            }
            if(!fv.isPythSupported){
                if(price == 0) revert PriceNotProvided();
            }
            // Generate unique order ID
            bytes32 orderId = keccak256(abi.encodePacked(
                _now(),
                info.id,
                tokenAddress,
                amount,
                orders.length
            ));
            uint currentTime = _now();
            if(price == 0) _updatePriceFeedId(orderId, _priceFeedId); 

            // Create order details
            uint index = orders.length;
            orderIndex[orderId] = OrderIndex(index, true);
            orders.push(
                OrderDetails({
                    orderId: orderId,
                    amount: amount,
                    pricePerUnit: price,
                    createdAt: currentTime,
                    expiresAt: currentTime + expiration,
                    assetInfo: _getAssetInfo(tokenAddress, amount),
                    status: OrderStatus.ACTIVE
                })
            );

            // Lock the funds for this order
            _balances[tokenAddress] -= amount;
            _lockedBalances[tokenAddress] += amount;

            emit OrderCreated(orderId, tokenAddress, index, amount, price, price == 0);
            return true;
        }
    }

    function _validateOrder(bytes32 orderId) internal view returns(OrderDetails storage orderDetails) {
        OrderIndex memory oi = orderIndex[orderId];
        if(!oi.hasIndex) revert InvalidOrderId();
        orderDetails = orders[oi.index];
        if(orderDetails.status != OrderStatus.ACTIVE) revert OrderNotActive();
        if(orderDetails.amount == 0) revert OrderNotFound();
    }

    /**
     * @dev Cancel an existing order
     * @param orderId ID of the order to cancel
     */
    function cancelOrder(bytes32 orderId) external nonReentrant onlyApproved whenNotPaused returns(bool) {
        OrderDetails storage orderDetails = _validateOrder(orderId);
        orderDetails.status = OrderStatus.CANCELLED;

        _cancelledOrders++;

        // Unlock the balance
        address tokenAddr = orderDetails.assetInfo.tokenAddress;
        unchecked {
            uint256 lockedBal = _lockedBalances[tokenAddr];
            if(lockedBal >= orderDetails.amount) _lockedBalances[tokenAddr] -= orderDetails.amount;
            _balances[tokenAddr] += orderDetails.amount;

            if(info.reputation > 0) info.reputation -= 1;
        }

        emit OrderCancelled(orderId, tokenAddr, orderDetails.amount);
        orderDetails.amount = 0;

        return true;
    }

    /**
     * @dev Deposit tokens into the trading account
     * @param token Token address (address(0) for native ETH)
     * @notice Seller can deposit. Anyone can also deposit on their behalf
     */
    function deposit(address token) external payable onlyApproved nonReentrant whenNotPaused returns(bool) {
        address from = info.id;
        uint amount = msg.value;
        
        unchecked {
            if(token != address(0)) {
                IERC20 tk = IERC20(token);
                uint256 allowanceFromSeller = tk.allowance(from, address(this));
                uint256 allowanceFromSender = tk.allowance(_msgSender(), address(this));
                (from, amount) = allowanceFromSeller > 0? (from, allowanceFromSeller) : (_msgSender(), allowanceFromSender);
                if(amount == 0) revert InvalidAmount();
                tk.safeTransferFrom(from, address(this), amount);
                _balances[token] += amount;
            } else {
                if(amount == 0) revert InvalidAmount();
                _balances[token] += amount;
            }
        }

        emit AssetDeposited(token, amount, _balances[token], _balances[address(0)]);
        return true;
    }

    /**
     * @dev Process withdrawal after cooldown period
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function withdraw(address token, uint256 amount) 
        external 
        onlyApproved
        nonReentrant 
        returns(bool)
    {
        uint256 balances = _balances[token];
        if(balances < amount) revert BalanceTooLow();
        unchecked {
            _balances[token] = balances - amount;
        }
        address _seller = info.id;
        if(token == address(0)) {
            // Native ETH withdrawal
            (bool success, ) = payable(_seller).call{value: amount}("");
            if(!success) revert TransferFailed();
        } else {
            // ERC20 token withdrawal
            IERC20(token).safeTransfer(_seller, amount);
        }

        emit AssetWithdrawn(token, amount, _balances[token]);
        return true;
    }

    // ============ FACTORY FUNCTIONS ============
    
    /**
     * @dev Exchange values between the trading account of seller and that of the Buyer
     * @param totalCost : Total amount requested as payment
     * @param pricePerUnit : Price per unit of token in trade
     * @param tokenIn : Address of token purchased. Defaults to Native coin if it is zero address
     * @param tokenOut : Payment token address
     * @notice The receiving trading account verifies that trade actually exist between the caller and the owner of this account
     * The result of the computation determines whether this account will release fund or not. Anyone is free to call this function 
     * provided they have a genuine trade and are willing to share real value.
     */
    function exchangeValues(uint256 totalCost, uint pricePerUnit, address tokenIn, address tokenOut) external payable nonReentrant returns(bool) {
        // Verify that requested amount and the value seller is willing to give out corresponds otherwise quit
        if(totalCost == 0 || pricePerUnit == 0) revert InvalidParameters();
        if(totalCost < pricePerUnit) {
            revert InvalidTotalRequest();
        } else {
            uint volume = totalCost / pricePerUnit;
            if(volume == 0) revert TradeUnverified();
            if(tokenIn != address(0)) {
                // Purchase was ERC20 token
                if(!isVerified[tokenIn]) revert UnrecognizedAsset();
                IERC20 tk = IERC20(tokenIn);
                if(tk.allowance(_msgSender(), address(this)) < volume) revert TrickyMove();
                tk.safeTransferFrom(_msgSender(), address(this), volume);
                if(tokenOut == address(0)) {
                    revert InvalidPaymentAsset();
                } else {
                    tk = IERC20(tokenOut);
                    if(_balances[tokenOut] < totalCost) revert InsufficientBalForRequestedToken();
                    _balances[tokenOut] -= totalCost;
                    tk.safeTransfer(_msgSender(), totalCost);
                    info.reputation += 5;
                    
                    emit ExchangeSuccess(_msgSender(), totalCost, volume, pricePerUnit, tokenOut, tokenIn);
                }
            } else {
                // Purchase was in Native coin
                if(msg.value < volume) revert TrickyMove();
            }
        }
        return true;

    }

    /**
     * @dev Activate expired order 
     * @param orderId ID of the order to activate
     * @param durationInHours New duration (in hours) through which target order will be valid
     */
    function activateOrder(bytes32 orderId, uint32 durationInHours) external payable onlyApproved() returns(bool) {
        OrderDetails storage orderDetails = _validateOrder(orderId);
        if(durationInHours == 0) revert InvalidDuration();
        FactoryVariables memory fv = ITradeFactory(owner()).getVariables(_msgSender());
        unchecked {
            uint listDurationFee = fv.creationFee * durationInHours;
            uint newDuration = durationInHours * 1 hours;
            if(msg.value < listDurationFee) {
                if(_balances[address(0)] >= listDurationFee) {
                    _balances[address(0)] -= listDurationFee;
                } else {
                    revert InsufficientOrderDurationFee();
                }
                
            }
            (bool sent,) = payable(owner()).call{value:listDurationFee}('');
            if(!sent) revert TransferFailed();
            orderDetails.expiresAt = newDuration;
            
            emit OrderActivated(orderId, newDuration);
        }
        return true;
    }

    /**
     * @dev Fulfill an order (called by factory)
     * @param orderId ID of the order to fulfill
     * @param buyer Address of the buyer
     * @param amount Amount being traded
     * @notice Either buyer or their representative agent can fulfil an order trade.
     * Payment for all assets is in stablecoin.
     */
    function fulfillOrder(bytes32 orderId, address buyer, uint256 amount) external returns(bool) {
        OrderDetails storage orderDetails = _validateOrder(orderId);
        if(orderDetails.status != OrderStatus.ACTIVE) revert OrderNotActive();
        if(_now() > orderDetails.expiresAt) revert OrderExpired();
        orderDetails.status = OrderStatus.FULFILLED;
        _successfulOrders++;

        // Unlock the balance
        uint amountTaken = amount;
        address tokenAddr = orderDetails.assetInfo.tokenAddress;
        unchecked {
            if(amount >= orderDetails.amount) {
                amountTaken = orderDetails.amount;
                orderDetails.amount = 0;
            } else {
                orderDetails.amount -= amount;
            }
            _lockedBalances[tokenAddr] = orderDetails.amount;
        }

        FactoryVariables memory fv = ITradeFactory(owner()).getVariables(_msgSender());
        uint totalCost;
        if(orderDetails.pricePerUnit == 0) {
            // Use price oracle
            totalCost = amount * uint(getPriceFor(orderId));
        } else {
            totalCost = orderDetails.pricePerUnit * amountTaken; // Price should be in decimals form
        }
        if(fv.supportedPaymentAsset.token == address(0)) revert InvalidPaymentAsset();
        IERC20 tk = IERC20(fv.supportedPaymentAsset.token);
        if(tk.allowance(_msgSender(), address(this)) >= totalCost) {
            tk.safeTransferFrom(_msgSender(), address(this), totalCost);
        } else {
            if(fv.alc.tradingAccount == address(0)) revert InvalidFallbackTradingAccount();
            if(tokenAddr == address(0)) {
                if(!ITradingAccount(fv.alc.tradingAccount).exchangeValues{value: amount}(totalCost, orderDetails.pricePerUnit, tokenAddr, fv.supportedPaymentAsset.token)) revert FallbackExecutionFailed();
            } else {
                IERC20(tokenAddr).safeIncreaseAllowance(fv.alc.tradingAccount, amount);
                if(!ITradingAccount(fv.alc.tradingAccount).exchangeValues(totalCost, orderDetails.pricePerUnit, tokenAddr, fv.supportedPaymentAsset.token)) revert FallbackExecutionFailed();
            }
        }
        
        info.reputation += 2;

        emit OrderFulfilled(orderId, buyer, amount);
        return true;
    }

    // ============ VIEW FUNCTIONS ============

    function _getAssetInfo(address tokenAddr, uint256 amount) internal view returns(AssetDetail memory _info) {
        if(_balances[tokenAddr] < amount) {
            revert MinimumFundingRequired();
        }
        if(tokenAddr != address(0)) {
            IERC20 tk = IERC20(tokenAddr);
            // Check that the trading account has the tokens
            if(tk.balanceOf(address(this)) == 0) {
                // Check that the seller has approved the trading account to spend the tokens
                if(tk.allowance(info.id, address(this)) == 0) {
                    revert NoFundDetected();
                }
            }
            _info =  AssetDetail(
                IERC20Metadata(tokenAddr).decimals(), // Default to 18 decimals for ERC20 tokens
                abi.encode(IERC20Metadata(tokenAddr).name()), // Default name
                abi.encode(IERC20Metadata(tokenAddr).symbol()), // Default symbol
                tokenAddr 
            );
        } else {
            _info =  AssetDetail(
                18, // Default to 18 decimals for native ETH
                "Ethereum", // Default name
                "ETH", // Default symbol
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
            owner: info.id,
            orders: orders,
            successfulOrders: _successfulOrders,
            cancelledOrders: _cancelledOrders,
            sellerInfo: info
        });
        return accountData;
    }

    /**
     * @dev Get balance for a specific token
     * @param token Token address
     * @return balance Token balance
     */
    function getBalance(address token) external view returns (uint256 balance) {
        balance = _balances[token];
        return balance;
    }

    /**
     * @dev Get locked balance for a specific token
     * @param token Token address
     * @return lockedBalance Locked token balance
     */
    function getLockedBalance(address token) external view override returns (uint256 lockedBalance) {
        lockedBalance = _lockedBalances[token];
        return lockedBalance;
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Pause execution 
     * Only the factory contract can pause the Trading account
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Resume execution 
     * Only the factory contract can pause the Trading account
     */
    function unpause() public onlyOwner {
        _unpause();
    }
}