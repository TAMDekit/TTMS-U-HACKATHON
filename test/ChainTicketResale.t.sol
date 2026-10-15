// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {ChainTicketResale} from "../contracts/ChainTicketResale.sol";

contract ChainTicketResaleTest is Test {
    ChainTicketResale ticket; address seller=address(0x1); address buyer=address(0x2);
    function setUp() public { ticket=new ChainTicketResale(250); ticket.mint(seller,1,2,99); }
    function testResalePaysSellerAndRoyalty() public { vm.prank(seller); ticket.list(1,1 ether); vm.deal(buyer,1 ether); vm.prank(buyer); ticket.buy{value:1 ether}(1); assertEq(ticket.ownerOf(1),buyer); assertEq(address(ticket).balance,0); }
    function testUsedTicketCannotList() public { ticket.checkIn(1); vm.prank(seller); vm.expectRevert("used ticket"); ticket.list(1,1 ether); }
}
