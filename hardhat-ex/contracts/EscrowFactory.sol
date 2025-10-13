// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { Escrow } from "./Escrow.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EscrowFactory contract
 * @dev Factory contract for creating escrow instances
 * @author @bobeu : https://github.com/bobeu
 */
contract EscrowFactory is Ownable, Pausable, ReentrancyGuard {
    //Errors
    error InsufficientCreationFee(uint256 valueSent);
    error DescriptionCannotBeEmpty();
    error BuyerAndSellerCannotBeTheSame();
    error BuyerAndArbiterCannotBeTheSame();
    error SellerAndArbiterCannotBeTheSame();
    error ErrorSendingToPlatformFeeRecipient();

    // Events
    event EscrowCreated(
        address indexed escrowAddress,
        address indexed buyer,
        address indexed seller,
        address arbiter,
        uint256 timestamp
    );

    event PlatformFeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );

    event DefaultDisputeWindowUpdated(
        uint256 oldWindow,
        uint256 newWindow
    );

    struct ReadData {
        address[] allEscrow;
        address[] userEscrows;
        uint totalEscrows;
        uint userEscrowCount;
    }

    // State Variables
    address[] public escrows;
    mapping(address => bool) public isEscrow;
    mapping(address => address[]) public userEscrows;
    
    address public platformFeeRecipient;
    uint256 public defaultDisputeWindowHours = 24; // 24 hours default
    uint256 public totalEscrowsCreated;
    
    // Escrow creation fee (in wei)
    uint256 public creationFee = 0.001 ether;

    // Modifiers
    modifier onlyValidAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }

    modifier onlyValidAmount(uint256 _amount) {
        require(_amount > 0, "Amount must be greater than 0");
        _;
    }

    modifier validDeadline(uint256 _deadline) {
        require(_deadline > block.timestamp, "Deadline must be in the future");
        _;
    }

    modifier validDisputeWindow(uint256 _window) {
        require(_window > 0, "Dispute window must be greater than 0");
        require(_window <= 168, "Dispute window cannot exceed 7 days");
        _;
    }

    // Constructor
    constructor(address _platformFeeRecipient) onlyValidAddress(_platformFeeRecipient) Ownable(_msgSender()) {
        platformFeeRecipient = _platformFeeRecipient;
    }

    /**
     * @dev Validate escrow creation parameters
     */
    function _validateEscrowParams(
        address _buyer,
        address _seller,
        address _arbiter,
        string memory _description,
        uint256 valueSent
    ) internal view {
        if(valueSent < creationFee) revert InsufficientCreationFee(valueSent);
        if(bytes(_description).length == 0) revert DescriptionCannotBeEmpty();
        if(_buyer == _seller) revert BuyerAndSellerCannotBeTheSame();
        if(_buyer == _arbiter) revert BuyerAndArbiterCannotBeTheSame();
        if(_seller == _arbiter) revert SellerAndArbiterCannotBeTheSame();
    }

    /**
     * @dev Create and deploy new escrow contract
     */
    function _deployEscrow(
        address _buyer,
        address _seller,
        address _arbiter,
        address _assetToken,
        uint256 _assetAmount,
        uint256 _deadline,
        string memory _description,
        uint256 _disputeWindowHours
    ) internal returns (address) {
        return address(new Escrow(
            _buyer,
            _seller,
            _arbiter,
            _assetToken,
            _assetAmount,
            _deadline,
            _description,
            _disputeWindowHours,
            platformFeeRecipient
        ));
    }

    /**
     * @dev Register escrow in factory mappings
     */
    function _registerEscrow(
        address _escrowAddress,
        address _buyer,
        address _seller,
        address _arbiter
    ) internal {
        escrows.push(_escrowAddress);
        isEscrow[_escrowAddress] = true;
        userEscrows[_buyer].push(_escrowAddress);
        userEscrows[_seller].push(_escrowAddress);
        userEscrows[_arbiter].push(_escrowAddress);
        totalEscrowsCreated++;
    }

    /**
     * @dev Transfer creation fee to platform
     */
    function _transferCreationFee(uint256 valueSent) internal {
        if (valueSent > 0) {
            (bool sent,) = platformFeeRecipient.call{value:valueSent}('');
            if(!sent) revert ErrorSendingToPlatformFeeRecipient();
        }
    }

    /**
     * @dev Create a new escrow contract - Internal function
     * @param _buyer Address of the buyer
     * @param _seller Address of the seller
     * @param _arbiter Address of the arbiter
     * @param _assetToken Address of the asset token (address(0) for ETH)
     * @param _assetAmount Amount of assets to escrow
     * @param _deadline Unix timestamp when escrow expires
     * @param _description Description of the escrow
     * @param _disputeWindowHours Hours within which disputes can be raised
     * @notice With this model, an user can have multiple escrows running simultaneously
     */
    function _createEscrow(
        address _buyer,
        address _seller,
        address _arbiter,
        address _assetToken,
        uint256 _assetAmount,
        uint256 _deadline,
        string memory _description,
        uint256 _disputeWindowHours,
        uint256 valueSent
    ) 
        internal 
        nonReentrant 
        whenNotPaused
        onlyValidAddress(_buyer)
        onlyValidAddress(_seller)
        onlyValidAddress(_arbiter)
        onlyValidAmount(_assetAmount)
        validDeadline(_deadline)
        validDisputeWindow(_disputeWindowHours)
    {
        _validateEscrowParams(_buyer, _seller, _arbiter, _description, valueSent);
        
        address escrowAddress = _deployEscrow(
            _buyer,
            _seller,
            _arbiter,
            _assetToken,
            _assetAmount,
            _deadline,
            _description,
            _disputeWindowHours
        );
        
        _registerEscrow(escrowAddress, _buyer, _seller, _arbiter);
        _transferCreationFee(valueSent);

        emit EscrowCreated(
            escrowAddress,
            _buyer,
            _seller,
            _arbiter,
            block.timestamp
        );
    }

    ///@dev See _createEscrow
    function createEscrow(
        address _buyer,
        address _seller,
        address _arbiter,
        address _assetToken,
        uint256 _assetAmount,
        uint256 _deadline,
        string memory _description,
        uint256 _disputeWindowHours
    ) 
        external 
        payable 
        returns (bool) 
    {
        _createEscrow(_buyer, _seller, _arbiter, _assetToken, _assetAmount, _deadline, _description, _disputeWindowHours, msg.value);
        return true;
    }

    /**                          
     * @dev Create escrow with default dispute window
     * @param _buyer Address of the buyer
     * @param _seller Address of the seller
     * @param _arbiter Address of the arbiter
     * @param _assetToken Address of the asset token (address(0) for ETH)
     * @param _assetAmount Amount of assets to escrow
     * @param _deadline Unix timestamp when escrow expires
     * @param _description Description of the escrow
     * @return escrowAddress Address of the created escrow contract
     */
    function createEscrowWithDefaultWindow(
        address _buyer,
        address _seller,
        address _arbiter,
        address _assetToken,
        uint256 _assetAmount,
        uint256 _deadline,
        string memory _description
    ) 
        external 
        payable 
        returns (bool)
    {
        _createEscrow(
            _buyer, 
            _seller, 
            _arbiter, 
            _assetToken, 
            _assetAmount, 
            _deadline, 
            _description, 
            defaultDisputeWindowHours, 
            msg.value
        );
        return true;
    }

    function getData(address _user) external view returns(ReadData memory) {
        return ReadData(
            escrows,
            userEscrows[_user],
            totalEscrowsCreated,
            userEscrows[_user].length
        );
    }

    /**
     * @dev Get all escrows created by this factory
     * @return Array of escrow addresses
     */
    function getAllEscrows() external view returns (address[] memory) {
        return escrows;
    }

    /**
     * @dev Get escrows for a specific user
     * @param _user User address
     * @return Array of escrow addresses
     */
    function getUserEscrows(address _user) external view returns (address[] memory) {
        return userEscrows[_user];
    }

    /**
     * @dev Get total number of escrows created
     * @return Total count
     */
    function getTotalEscrows() external view returns (uint256) {
        return totalEscrowsCreated;
    }

    /**
     * @dev Get escrow count for a specific user
     * @param _user User address
     * @return Count of escrows
     */
    function getUserEscrowCount(address _user) external view returns (uint256) {
        return userEscrows[_user].length;
    }

    /**
     * @dev Check if an address is a valid escrow
     * @param _escrowAddress Address to check
     * @return True if valid escrow
     */
    function isValidEscrow(address _escrowAddress) external view returns (bool) {
        return isEscrow[_escrowAddress];
    }

    /**
     * @dev Get escrow details by address
     * @param _escrowAddress Address of the escrow
     * @return Escrow details
     */
    function getEscrowDetails(address payable _escrowAddress) 
        external 
        view 
        returns (Escrow.EscrowDetails memory) 
    {
        require(isEscrow[_escrowAddress], "Invalid escrow address");
        return Escrow(_escrowAddress).getEscrowData().escrowDetails;
    }

    /**
     * @dev Get escrow state by address
     * @param _escrowAddress Address of the escrow
     * @return Escrow state
     */
    function getEscrowState(address payable _escrowAddress) 
        external 
        view 
        returns (Escrow.EscrowState) 
    {
        require(isEscrow[_escrowAddress], "Invalid escrow address");
        return Escrow(_escrowAddress).getEscrowData().escrowDetails.state;
    }

    /**
     * @dev Get paginated escrows
     * @param _offset Starting index
     * @param _limit Number of escrows to return
     * @return Array of escrow addresses
     */
    function getEscrowsPaginated(uint256 _offset, uint256 _limit) 
        external 
        view 
        returns (address[] memory) 
    {
        require(_offset < escrows.length, "Offset out of bounds");
        
        uint256 end = _offset + _limit;
        if (end > escrows.length) {
            end = escrows.length;
        }
        
        address[] memory result = new address[](end - _offset);
        for (uint256 i = _offset; i < end; i++) {
            result[i - _offset] = escrows[i];
        }
        
        return result;
    }

    // Admin Functions

    /**
     * @dev Update platform fee recipient
     * @param _newRecipient New platform fee recipient address
     */
    function updatePlatformFeeRecipient(address _newRecipient) 
        external 
        onlyOwner 
        onlyValidAddress(_newRecipient) 
    {
        address oldRecipient = platformFeeRecipient;
        platformFeeRecipient = _newRecipient;
        
        emit PlatformFeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    /**
     * @dev Update default dispute window
     * @param _newWindow New default dispute window in hours
     */
    function updateDefaultDisputeWindow(uint256 _newWindow) 
        external 
        onlyOwner 
        validDisputeWindow(_newWindow) 
    {
        uint256 oldWindow = defaultDisputeWindowHours;
        defaultDisputeWindowHours = _newWindow;
        
        emit DefaultDisputeWindowUpdated(oldWindow, _newWindow);
    }

    /**
     * @dev Update creation fee
     * @param _newFee New creation fee in wei
     */
    function updateCreationFee(uint256 _newFee) external onlyOwner {
        creationFee = _newFee;
    }

    /**
     * @dev Pause the factory
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the factory
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw (only if contract is paused)
     * @notice This should only be used in extreme circumstances
     */
    function emergencyWithdraw() external onlyOwner returns(bool) {
        require(paused(), "Contract must be paused");
        (bool sent,) = owner().call{value: address(this).balance}('');
        require(sent, "Withdrawal failed");
        return true;
    }

    // Receive function for ETH
    receive() external payable {
        // This function allows the contract to receive ETH
    }
}
