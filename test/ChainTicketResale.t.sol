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

    function testPrimaryPurchaseMintsToBuyerAndPaysOwner() public {
        ticket.setPrimarySale(10,20,0.2 ether,3);
        vm.deal(buyer,1 ether);
        uint256 ownerBalance = address(this).balance;
        vm.prank(buyer);
        uint256[] memory ids = ticket.buyPrimary{value:0.4 ether}(10,20,2,"data:application/json,ticket");
        assertEq(ids.length,2);
        assertEq(ticket.ownerOf(ids[0]),buyer);
        assertEq(ticket.ownerOf(ids[1]),buyer);
        assertEq(ticket.originalPriceWei(ids[0]),0.2 ether);
        assertEq(address(this).balance,ownerBalance + 0.4 ether);
        (,,uint256 sold) = ticket.primarySales(10,20);
        assertEq(sold,2);
    }

    function testPrimaryPurchaseRequiresExactValue() public {
        ticket.setPrimarySale(10,20,0.2 ether,3);
        vm.deal(buyer,1 ether);
        vm.prank(buyer);
        vm.expectRevert("wrong primary value");
        ticket.buyPrimary{value:0.3 ether}(10,20,2,"data:application/json,ticket");
    }

    function testPrimaryPurchaseCannotExceedSupply() public {
        ticket.setPrimarySale(10,20,0.2 ether,1);
        vm.deal(buyer,1 ether);
        vm.prank(buyer);
        vm.expectRevert("primary sale sold out");
        ticket.buyPrimary{value:0.4 ether}(10,20,2,"data:application/json,ticket");
    }

    function testPrimaryTicketCanBeResoldToAnotherBuyer() public {
        ticket.setPrimarySale(10,20,0.2 ether,1);
        vm.deal(seller,1 ether);
        vm.prank(seller);
        uint256[] memory ids = ticket.buyPrimary{value:0.2 ether}(10,20,1,"data:application/json,ticket");
        vm.prank(seller);
        ticket.list(ids[0],0.21 ether);
        vm.deal(buyer,1 ether);
        vm.prank(buyer);
        ticket.buy{value:0.21 ether}(ids[0]);
        assertEq(ticket.ownerOf(ids[0]),buyer);
    }

    function testOnlyOwnerCanConfigurePrimarySale() public {
        vm.prank(seller);
        vm.expectRevert();
        ticket.setPrimarySale(10,20,0.2 ether,3);
    }
}
