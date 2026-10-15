// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script} from "forge-std/Script.sol";
import {UTicket3} from "../contracts/ChainTicketResale.sol";
contract Deploy is Script { function run() external returns (UTicket3 deployed) { vm.startBroadcast(); deployed=new UTicket3(250, "ipfs://u-ticket-3/collection.json"); vm.stopBroadcast(); } }
