# U Ticket 3

## Current MVP architecture

The product supports a local demo flow and Supabase-backed accounts, reservations, orders, and tickets. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy anon key) and apply the SQL migrations in `supabase/` to enable shared data.

The NFT side uses Foundry. `contracts/ChainTicketResale.sol` contains a testnet-only ERC-721 ticket with minting, listing, resale, creator royalty, ownership checks, and used-ticket protection. The server mint route requires an authenticated user, a valid ticket belonging to that user's paid order, and an atomic one-at-a-time mint claim. Configure `PRIVATE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` only as server-side environment variables; never use a mainnet key or expose either in `NEXT_PUBLIC_*`.

**Checkout is simulated.** The current flow creates test orders and does not charge a card or verify an external payment. Do not accept real customers, funds, or production orders until a payment provider and verified payment callback have replaced the mock checkout.

### Foundry

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit
forge test
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

The current environment must have network access and a Solidity compiler cached before `forge test` can run. Use a testnet deployer key only through `FOUNDRY_PRIVATE_KEY` in a local ignored `.env`.

### Resale rules

- Seller must own the NFT.
- A checked-in/used ticket cannot be listed or sold.
- Buyer pays the exact listing price.
- A creator royalty (default 2.5%) is paid to the contract owner.
- Seller receives the remainder.
- Listing and sale are visible through emitted events.

## On-chain Marketplace (Sepolia)

The `/marketplace` page has three views: primary ticket sales, active fan resale listings, and tickets owned by the connected wallet. A buyer connects an injected wallet, switches to Ethereum Sepolia, and confirms the exact ETH amount shown by the contract. A primary purchase mints the ERC-721 directly to the buyer; the configured contract owner receives the primary-sale proceeds. A resale buyer pays the exact listing price, and the seller receives the proceeds minus the contract royalty.

The configured address may still point to an earlier contract without primary-sale support. Before using these flows, deploy the updated `UTicket3` contract to Sepolia, set `NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS` to that address, and rebuild/restart the app. Connect the deploying owner wallet and use the Primary tickets tab to configure a sale for a published event and ticket type (ETH price and supply are stored on-chain). Buyers can purchase from the Primary tickets tab without a Supabase login. Ticket holders can list or cancel NFTs in My tickets; buyers who missed the primary allocation can purchase from Resale listings.

This is testnet functionality only. Sepolia ETH is not fiat or mainnet ETH. The existing home-page cart/checkout remains simulated and must not be presented as paid. Do not accept real customer funds until a production deployment, verified payment path, inventory synchronization, and security review are complete.

This is a hackathon demo targeting Ethereum Sepolia. UI demo tickets are stored locally; Supabase-backed ticket orders and optional Sepolia NFT minting require the configured services above. No real payment is processed.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Product direction

ChainTicket uses a dark “signal / live moment” visual language: electric cyan for primary action, violet for discovery, lime for availability/success, compact mono metadata, medium rounded cards, and restrained glass-like surfaces. The landing/discovery flow is: discover → search/filter → inspect event → select ticket → cart → checkout → mint/mock ticket → verify/check-in.

## Next phases

1. Integrate a payment provider with signed, verified callbacks before treating orders as paid.
2. Assign organizer roles through a trusted admin process and scope check-in permissions to assigned events.
3. Persist and pin real NFT metadata; the current URI is only a demo placeholder.
4. Add production-grade monitoring, rate limits, and managed key custody before any real-user deployment.

Never use real card data or mainnet funds. Keep local secrets in the ignored `.env.local`; use a managed secret store for deployment and never expose server secrets through `NEXT_PUBLIC_*`.

## Supabase real-data setup

1. Create a Supabase project and copy its URL and publishable/anon key into `.env.local` using `.env.example`.
2. Run `supabase/schema.sql`, `supabase/mvp-migration.sql`, then `supabase/purchase-flow.sql` in Supabase SQL Editor.
3. Run `supabase/seed.sql` to create event and ticket rows.
4. Enable Email provider in Supabase Authentication and assign organizer roles only through a trusted admin process.
5. Never expose a service-role key in `NEXT_PUBLIC_*` variables.

The browser auth client and Ethereum Sepolia wallet provider are wired in the app. The live data adapter is in `lib/events.ts`; when Supabase is configured, database errors are surfaced instead of silently replacing a failed write with fake success.
