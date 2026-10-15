// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script} from "forge-std/Script.sol";
import {ChainTicketResale} from "../contracts/ChainTicketResale.sol";
contract Deploy is Script { function run() external returns (ChainTicketResale deployed) { vm.startBroadcast(); deployed=new ChainTicketResale(250); vm.stopBroadcast(); } }
