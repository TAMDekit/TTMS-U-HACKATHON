export const ticketContractAddress = (process.env.NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS || "0x00C69e6402b1Ee4b84d54516F795869bD8D78bEE") as `0x${string}`;

export const ticketContractAbi = [
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "eventId", type: "uint256" }, { name: "ticketType", type: "uint256" }, { name: "orderId", type: "uint256" }, { name: "originalPrice", type: "uint256" }, { name: "metadataURI", type: "string" }], outputs: [{ name: "id", type: "uint256" }] },
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "tickets", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "eventId", type: "uint256" }, { name: "ticketType", type: "uint256" }, { name: "orderId", type: "uint256" }, { name: "checkedIn", type: "bool" }] },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "nextTokenId", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "originalPriceWei", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "maxResalePrice", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "listings", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "seller", type: "address" }, { name: "priceWei", type: "uint256" }] },
  { type: "function", name: "list", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "priceWei", type: "uint256" }], outputs: [] },
  { type: "function", name: "cancelListing", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { type: "function", name: "buy", stateMutability: "payable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { type: "event", name: "TicketMinted", anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "eventId", type: "uint256" }, { indexed: true, name: "orderId", type: "uint256" }, { indexed: false, name: "owner", type: "address" }, { indexed: false, name: "metadataURI", type: "string" }] },
] as const;
