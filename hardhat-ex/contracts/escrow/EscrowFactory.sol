// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { Escrow } from "./Escrow.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IEscrowFactory } from "../interfaces/IEscrowFactory.sol";
import { IArbitrators } from "../interfaces/IArbitrators.sol";

/**
 * @title EscrowFactory contract
 * @dev Factory contract for creating escrow instances
 * @author @bobeu : https://github.com/bobeu
 */
contract EscrowFactory is IEscrowFactory, Ownable, Pausable, ReentrancyGuard {

    // State Variables
    address[] internal escrows;

    IArbitrators internal arbitrator;

    mapping(address => bool) internal isEscrow;

    mapping(address => address[]) internal userEscrows;

    mapping(address arbiter => uint8) internal escrowAtHand;
    
    address internal platformFeeRecipient;

    uint256 internal defaultDisputeWindowHours = 24; // 24 hours default

    uint256 internal totalEscrowsCreated;
    
    // Escrow creation fee (in wei)
    uint256 internal creationFee = 0.001 ether;

    // Modifiers
    modifier onlyValidAddress(address _addr) {
        if (_addr == address(0)) revert InvalidAddress();
        _;
    }

    modifier onlyValidAmount(uint256 _amount) {
        if (_amount == 0) revert AmountMustBeGreaterThanZero();
        _;
    }

    modifier validDeadline(uint256 _deadline) {
        if (_deadline <= block.timestamp) revert DeadlineMustBeInTheFuture();
        _;
    }

    modifier validDisputeWindow(uint256 _window) {
        if (_window == 0) revert DisputeWindowMustBeGreaterThanZero();
        if (_window > 168) revert DisputeWindowCannotExceedSevenDays();
        _;
    }

    modifier onlyValidEscrow(address _escrowAddress) {
        if (!isEscrow[_escrowAddress]) revert InvalidEscrowAddress();
        _;
    }

    // Constructor
    constructor(
        address _platformFeeRecipient,
        IArbitrators _arbitrator
    ) 
        onlyValidAddress(_platformFeeRecipient) 
        onlyValidAddress(address(_arbitrator)) 
        Ownable(_msgSender()) 
    {
        platformFeeRecipient = _platformFeeRecipient;
        arbitrator = _arbitrator;
    }

    
    // Receive function for ETH
    receive() external payable {
        // This function allows the contract to receive ETH
    }

    /**
     * @dev Validate escrow creation parameters
     */
    function _validateEscrowParams(
        address _buyer,
        address _seller,
        string memory _description,
        uint256 valueSent
    ) internal view {
        if(valueSent < creationFee) revert InsufficientCreationFee(valueSent);
        if(bytes(_description).length == 0) revert DescriptionCannotBeEmpty();
        if(_buyer == _seller) revert BuyerAndSellerCannotBeTheSame();
    }

    /**
     * @dev Create and deploy new escrow contract
     */
    function _deployEscrow(
        address _buyer,
        address _seller,
        address _assetToken,
        uint256 _assetAmount,
        uint256 _deadline,
        string memory _description,
        uint256 _disputeWindowHours
    ) internal returns (address) {
        return address(new Escrow(
            _buyer,
            _seller,
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
        address _seller
    ) internal {
        escrows.push(_escrowAddress);
        isEscrow[_escrowAddress] = true;
        userEscrows[_buyer].push(_escrowAddress);
        userEscrows[_seller].push(_escrowAddress);
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
        onlyValidAmount(_assetAmount)
        validDeadline(_deadline)
        validDisputeWindow(_disputeWindowHours)
    {
        _validateEscrowParams(_buyer, _seller, _description, valueSent);
        
        address escrowAddress = _deployEscrow(
            _buyer,
            _seller,
            _assetToken,
            _assetAmount,
            _deadline,
            _description,
            _disputeWindowHours
        );
        
        _registerEscrow(escrowAddress, _buyer, _seller);
        _transferCreationFee(valueSent);

        emit EscrowCreated(
            escrowAddress,
            _buyer,
            _seller,
            block.timestamp
        );
    }

    ///@dev See _createEscrow
    function createEscrow(
        address _buyer,
        address _seller,
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
        _createEscrow(_buyer, _seller, _assetToken, _assetAmount, _deadline, _description, _disputeWindowHours, msg.value);
        return true;
    }

    /**                          
     * @dev Create escrow with default dispute window
     * @param _buyer Address of the buyer
     * @param _seller Address of the seller
     * @param _assetToken Address of the asset token (address(0) for ETH)
     * @param _assetAmount Amount of assets to escrow
     * @param _deadline Unix timestamp when escrow expires
     * @param _description Description of the escrow
     * @return escrowAddress Address of the created escrow contract
     */
    function createEscrowWithDefaultWindow(
        address _buyer,
        address _seller,
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
            _assetToken, 
            _assetAmount, 
            _deadline, 
            _description, 
            defaultDisputeWindowHours, 
            msg.value
        );
        return true;
    }

    // Read escrow data
    function getData(address _user) external view returns(ReadData memory) {
        return ReadData(
            escrows,
            userEscrows[_user],
            totalEscrowsCreated,
            userEscrows[_user].length,
            address(arbitrator),
            platformFeeRecipient,
            defaultDisputeWindowHours,
            totalEscrowsCreated,
            creationFee
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
        onlyValidEscrow(_escrowAddress)
        returns (Escrow.EscrowDetails memory) 
    {
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
        onlyValidEscrow(_escrowAddress)
        returns (Escrow.EscrowState) 
    {
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
        if (_offset >= escrows.length) revert OffsetOutOfBounds();
        
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

    function getArbiterStatus(address arbiter) external view returns(bool, uint8 num) {
        num = escrowAtHand[arbiter];
        return (num > 0, num);
    }

    function isApprovedArbiter(address arbiter, uint8 flag) external onlyValidEscrow(_msgSender()) returns(bool) {
        bool isApproved = arbitrator.isApprovedArbiter(arbiter);
        if(flag == 1 && isApproved) {
            unchecked {
                escrowAtHand[arbiter] += flag;
            }
            userEscrows[arbiter].push(_msgSender());
        }
        return isApproved;
    }

    function updateArbiterStatus(address arbiter) external onlyValidEscrow(_msgSender()) returns(bool) {
        if(arbiter != address(0)) {
            unchecked {
                if(escrowAtHand[arbiter] > 0) escrowAtHand[arbiter] -= 1;
            }
        }
        return true;
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
        if (!paused()) revert ContractMustBePaused();
        (bool sent,) = owner().call{value: address(this).balance}('');
        if (!sent) revert WithdrawalFailed();
        return true;
    }
}
