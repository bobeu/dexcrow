// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { TradingAccount, IERC20, ITradingAccount, ITradeFactory, IERC20Metadata } from "./peripherals/TradingAccount.sol";

/**
 * @title TradeFactory
 * @dev Factory contract for managing trading accounts and orders
 * @author Bobeu : https://github.com/bobeu
 */
contract TradeFactory is ITradeFactory, Ownable {
    // ============ STATE VARIABLES ============
    address private immutable pythAddress;

    /**
     * @dev Mapping of user addresses to positions in the account array
     */
    mapping(address => Index) private _indexes;

    /**
     * @dev Total accounts created to date
     */
    AccountInfo[] private _accounts;

    /**
     * @dev Stable asset universally acceptable as payment across all Trading accounts
     */
    SupportPaymentAsset private supportedPaymentAsset;

    /**
     * @dev Platform fee percentage (in basis points)
     */
    uint256 private _platformFee = 50; // 0.5%

    /**
     * @dev Total fees collected
     */
    uint256 private _totalFees;

    /**
     * @dev Fee denominator for calculations
     */
    uint256 private constant FEE_DENOMINATOR = 10000;

    /**
     * @dev Required fee for listing an order for some period of time
     */
    uint256 private creationFee;

    /**
     * @dev Whether the current chain is supported by Pyth for price data or not
     */
    bool private isPythSupported;

    /**
     * @dev Pause or resume execution
     */
    bool private isPaused;

    /**
     * @dev Only valid address is allowed
     */
    modifier onlyValidAddress(address target) {
        if(target == address(0)) revert InvalidAddress();
        _;
    }

    // ============ CONSTRUCTOR ============

    /**
     * @dev Constructor to initialize the trade factory
     */
    constructor(address _pythAddress) Ownable(_msgSender()) {
        creationFee = 1e15 wei; // 0.0015 ether per 24 hours
        pythAddress = _pythAddress;
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Create a new trading account for a seller - internal
     * @param seller Address of the seller
     * @param agent Seller's agent address
     * @param nickName Seller's alias
     * @return account Address of the created trading account
     */
    function _tryGetTradingAccount(address seller, address agent, string memory nickName) internal returns(address account) {
        if(seller == address(0)) revert InvalidOwner();
        Index memory id = _indexes[seller];
        if(!id.hasIndex) {
            // Deploy new trading account and save to storage
            uint currentTime = _now();
            account = address(new TradingAccount(seller, agent, owner(), nickName, pythAddress));
            _indexes[seller] = Index(_accounts.length, true);
            _accounts.push(
                AccountInfo({
                    user: seller,
                    tradingAccount: account,
                    createdAt: currentTime
                })
            );
            
            emit AccountCreated(seller, account, currentTime);
        } else {
            account = _accounts[id.index].tradingAccount;
        }
    }

    /**
     * @dev Get trading account for a user
     * @param user User address
     * @return account Trading account data
     */
    function _getAccountInfo(address user) internal view returns (AccountInfo memory account) {
        Index memory id = _indexes[user];
        if(id.hasIndex) {
            account = _accounts[id.index];
        }
    }

     // Return the fee parameters in state
    function _getFeeVariables(address any) internal view returns(FactoryVariables memory _fvs) {
        _fvs.creationFee = creationFee;
        _fvs.feeDenom = FEE_DENOMINATOR;
        _fvs.isPythSupported = isPythSupported;
        _fvs.platformFee = _platformFee;
        _fvs.supportedPaymentAsset = supportedPaymentAsset;
        _fvs.alc = _getAccountInfo(any);
    }

    // ============ EXTERNAL FUNCTIONS ============

    /**
     * @dev Create a new trading account for a user
     * @param agent Address of the user's agent if any
     * @return account Address of the created trading account
     * @notice Uses the msg.sender if the parsed address is empty otherwise defaults to user. This allows approved or external accounts
     * such as agent to act on behalf of another.
     */
    function createTradingAccount(address agent, string memory nickName) external returns (address account) {
        if(isPaused) revert Paused();
        address seller = _msgSender();
        Index memory id = _indexes[seller];
        if(id.hasIndex) revert AccountAlreadyExists();
        return _tryGetTradingAccount(seller, agent, nickName);
    }

    // ============ FEE MANAGEMENT ============

    /**
     * @dev Set platform fee
     * @param newFee New fee percentage (in basis points)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner returns(bool) {
        if(newFee > 5000) revert InvalidFee(); // Arbitrary fee
        _platformFee = newFee;
        emit FeeSet(newFee, FeeType.PLATFORM);
        return true;
    }

    /**
     * @dev Set order creation fee
     * @param newFee New fee percentage (in basis points)
     */
    function setCreationFee(uint256 newFee) external onlyOwner returns(bool){
        creationFee = newFee;
        emit FeeSet(newFee, FeeType.CREATION);
        return true;
    }

    /**
     * @dev Set order creation fee
     * @param newPaymentAsset New supported payment asset - Supports stablecoin only
     */
    function setSupportedPaymentAsset(address newPaymentAsset) external onlyOwner returns(bool){
        emit NewPaymentAssetAdded(supportedPaymentAsset.token, newPaymentAsset);
        IERC20Metadata tk = IERC20Metadata(newPaymentAsset);
        supportedPaymentAsset = SupportPaymentAsset({
            decimals: tk.decimals(),
            name: abi.encode(bytes(tk.name())),
            symbol: abi.encode(bytes(tk.symbol())),
            token: newPaymentAsset
        });
        return true;
    }

    /**
     * @dev Toggle Pyth support status
     * @return status New Pyth support status
     */
    function toggleIsPythSupportedNetwork() external onlyOwner returns(bool) {
        bool status = isPythSupported;
        isPythSupported = !status;
        return true;
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = _totalFees;
        if(amount == 0) revert InvalidAmount();

        _totalFees = 0;
        address _owner = owner();
        uint contractBal = address(this).balance;
        if(contractBal < amount || (amount == 0 && contractBal > amount)) amount = contractBal;
        (bool success, ) = payable(_owner).call{value: amount}("");
        if(!success) revert TransferFailed();

        emit FeesWithdrawn(amount, _owner);
    }

    // ============ VIEW FUNCTIONS ============

    // Return the fee parameters in state
    function getVariables(address any) external view returns(FactoryVariables memory) {
        return _getFeeVariables(any);
    }

    // Get the current block time stamp
    function _now() internal view returns(uint currentTime) {
        currentTime = block.timestamp;
    }

    /**
     * @dev Get comprehensive factory data
     * @return factoryData Packed factory data
     */
    function getFactoryData(address any) external view returns (FactoryData memory factoryData) {
        factoryData = FactoryData({
            owner: owner(),
            platformFee: _platformFee,
            totalFees: _totalFees,
            totalAccounts: _accounts.length,
            accounts: _accounts,
            variables: _getFeeVariables(any),
            isPaused: isPaused,
            pythAddress: pythAddress
        });
    }

    /**
     * @dev Get trading account for a user
     * @param user User address
     * @return account Trading account data
     */
    function getAccountInfo(address user) external view override returns (AccountInfo memory) {
        return _getAccountInfo(user);
    }

    // ============ ADMIN FUNCTIONS ============
    /**
     * @dev Pause the contract
     */
    function toggleExecution(bool status) external onlyOwner {
        isPaused = status;
    }

}