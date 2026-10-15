// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {UTicket3} from "../contracts/ChainTicketResale.sol";

contract ChainTicketResaleTest is Test {
    UTicket3 ticket; address seller=address(0x1); address buyer=address(0x2);
    receive() external payable {}
    function setUp() public { ticket=new UTicket3(250, "ipfs://u-ticket-3/collection.json"); ticket.mint(seller,1,2,99,1 ether,"ipfs://u-ticket-3/tickets/1.json"); }
    function testResalePaysSellerAndRoyalty() public { vm.prank(seller); ticket.list(1,1 ether); vm.deal(buyer,1 ether); vm.prank(buyer); ticket.buy{value:1 ether}(1); assertEq(ticket.ownerOf(1),buyer); assertEq(address(ticket).balance,0); }
    function testUsedTicketCannotList() public { ticket.checkIn(1); vm.prank(seller); vm.expectRevert("used ticket"); ticket.list(1,1 ether); }
    function testResaleCannotExceedTenPercent() public { vm.prank(seller); vm.expectRevert("resale price exceeds 10 percent cap"); ticket.list(1,1.11 ether); }
}
