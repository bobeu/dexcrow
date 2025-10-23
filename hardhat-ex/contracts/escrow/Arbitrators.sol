// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IArbitrators } from "../interfaces/IArbitrators.sol";
import { IEscrowFactory } from "../interfaces/IEscrowFactory.sol";

/**
 * @title Arbitrators Smart Contract
 * @author @bobeu : https://github.com/bobeu
 */
contract Arbitrators is IArbitrators, Ownable, Pausable {
    using SafeERC20 for IERC20;

    IERC20 internal verseToken;

    IEscrowFactory internal factory;

    uint256 internal minimumAbiterHolding;

    Arbiter[] internal arbiters;

    mapping(address => Request) internal requests;

    mapping(bytes32 => Request) internal idToRequest;

    modifier validateVariables {
        if(address(verseToken) == address(0)) revert VerseTokenNotSet();
        if(address(factory) == address(0)) revert FactoryNotSet();
        _;
    }

    constructor() Ownable(_msgSender()) {}

    function _now() internal view returns(uint _return) {
        _return = block.timestamp;
    }
 
    function requestToBeAnArbiter() external whenNotPaused validateVariables returns(bool){
        address sender = _msgSender();
        Request memory req = requests[sender];
        uint256 allowance = verseToken.allowance(sender, address(this));
        if(allowance < minimumAbiterHolding) revert MinimumAbiterHoldingExceedAllowance();
        if(minimumAbiterHolding > 0) {
            verseToken.safeTransferFrom(sender, address(this), minimumAbiterHolding);
        }
        bytes32 id = keccak256(abi.encodePacked(sender, allowance, _now()));
        if(!req.hasRequested) {
            req.hasRequested = true;
            req.index = arbiters.length;
            requests[sender] = req;
            idToRequest[id] = req;
            arbiters.push(Arbiter({
                    id: id,
                    lockedBalance: allowance,
                    isApproved: false,
                    lastSeen: _now(),
                    identifier: sender
                }
            ));
        } else {
            Arbiter memory arb = arbiters[req.index];
            if(arb.isApproved) revert AribterAlreadyApproved();
            arbiters[req.index].isApproved = true;
            arbiters[req.index].id = id;
        }
        idToRequest[id] = req;
        return true;
    }

    function approveArbiter(address arbiter) public onlyOwner returns(bool) {
        Request memory req = requests[arbiter];
        if(!req.hasRequested) revert NoRequestFound();
        if(arbiters[req.index].isApproved) revert AribterAlreadyApproved();
        arbiters[req.index].isApproved = true;
        arbiters[req.index].lastSeen = _now();

        return true;
    }

    function unlock() public validateVariables returns(bool) {
        address sender = _msgSender();
        Request memory req = requests[sender];
        (bool isEngaged,) = factory.getArbiterStatus(sender);
        if(isEngaged) revert ArbiterIsEngaged();
        if(!req.hasRequested) revert Requested();
        Arbiter memory arb = arbiters[req.index];
        if(!arb.isApproved) revert NotApproved();
        if(arb.lockedBalance == 0) revert NoBalance();
        unchecked {
            if((_now() - arb.lastSeen) < 48 hours) revert CooldownMode();
        }
        arbiters[req.index].lastSeen = _now();
        arbiters[req.index].lockedBalance = 0;
        arbiters[req.index].isApproved = false;
        verseToken.safeTransfer(sender, arb.lockedBalance);

        return true;
    } 

    function getArbiter(bytes32 arbiterId) external view returns(Arbiter memory _result){
        Request memory req = idToRequest[arbiterId];
        if(req.hasRequested){
            _result = arbiters[req.index];
        }
        return _result;
    }
    
    function isApprovedArbiter(address arbiter) external view returns(bool){
        Request memory req = requests[arbiter];
        if(!req.hasRequested) return false;
        return arbiters[req.index].isApproved;
    }

    function readData() external view returns(ReadData memory) {
        return ReadData({
            arbiters: arbiters,
            verseToken: verseToken,
            factory: factory,
            minimumAbiterHolding: minimumAbiterHolding
        });
    }
}
