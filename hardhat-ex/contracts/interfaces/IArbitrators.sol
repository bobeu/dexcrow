// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import { SafeERC20, IERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IEscrowFactory } from "./IEscrowFactory.sol";

/**
 * @title IArbitrators
 * @dev Interface of the Arbitrators contract
 * @author Bobeu - https://github.com/bobeu
 */
interface IArbitrators {
    struct Arbiter {
        bytes32 id;
        uint256 lockedBalance;
        bool isApproved;
        uint lastSeen;
        address identifier;
    }

    struct Request {
        bool hasRequested;
        uint index;
    }

    struct ReadData {
        Arbiter[] arbiters;
        IERC20 verseToken;
        IEscrowFactory factory;
        uint256 minimumAbiterHolding;
    }

    function getArbiter(bytes32 arbiterId) external view returns(Arbiter memory);
    function requestToBeAnArbiter() external returns(bool);
    function approveArbiter(address arbiter) external returns(bool);
    function unlock() external returns(bool);
    function isApprovedArbiter(address arbiter) external view returns(bool);
    function readData() external view returns(ReadData memory);

    error VerseTokenNotSet();
    error Requested();
    error NoRequestFound();
    error FactoryNotSet();
    error NotApproved();
    error NoBalance();
    error CooldownMode();
    error ArbiterIsEngaged();
    error AribterAlreadyApproved();
    error MinimumAbiterHoldingExceedAllowance();
}