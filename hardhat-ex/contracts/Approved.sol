// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

abstract contract Approved is Ownable, Pausable {
    error AddressIsZero();
    
    event Approval(address indexed);
    event UnApproval(address indexed);

    // Mapping of account to approvals
    mapping (address => bool) private approval;

    // Only approved account is allowed
    modifier onlyApproved {
        require(_isApproved(_msgSender()), "Not approved account");
        _;
    }

    constructor(address initOwner, address admin) Ownable(initOwner) {
        _setPermission(admin, true);
    }

    /**
     * @dev Set approval for
     * @param target : Account to set approval for
     * @param value : Approval state - true or false
     */
    function _setPermission(address target, bool value) internal {
        if(target == address(0)) revert AddressIsZero();
        approval[target] = value;
    }

    /**
     * @dev Set approval for target
     * @param target : Account to set approval for
     */
    function setPermission(address target) public onlyOwner {
        _setPermission(target, true);
        emit Approval(target);
    }

    /**
     * @dev Set approval for target
     * @param target : Account to set approval for
     */
    function _isApproved(address target) internal view returns(bool result) {
        result = approval[target];
    }

    /**
     * @dev Set approval for target
     * @param target : Account to set approval for
     */
    function isPermitted(address target) public view returns(bool) {
        return _isApproved(target);
    }

    /**
     * @dev Set approval for target
     * @param target : Account to set approval for
     */
    function unApprove(address target) public onlyOwner {
        _setPermission(target, false);
        emit UnApproval(target);
    }

}