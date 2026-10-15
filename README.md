# U Ticket 3

## Current MVP architecture

The product can run in UI/mock mode without local PostgreSQL or DBeaver. Real shared data is designed for Supabase (hosted) using the SQL in `supabase/schema.sql`. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before enabling the real data adapter.

The NFT side uses Foundry. `contracts/ChainTicketResale.sol` contains a testnet-only ERC-721 ticket with minting, listing, resale, creator royalty, ownership checks, and used-ticket protection. The resale market is intentionally transparent: listing and sale events are emitted on-chain. Never deploy with a mainnet key.

### Foundry

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit
forge test
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
```

The current environment must have network access and a Solidity compiler cached before `forge test` can run. Use a testnet deployer key only through `FOUNDRY_PRIVATE_KEY` in a local ignored `.env`.

### Resale rules

- Seller must own the NFT.
- A checked-in/used ticket cannot be listed or sold.
- Buyer pays the exact listing price.
- A creator royalty (default 2.5%) is paid to the contract owner.
- Seller receives the remainder.
- Listing and sale are visible through emitted events.

Web3 concert ticketing concept for hackathon demos. This first implementation is **Phase 1: UI + mock data** and intentionally uses no real payment, wallet, or blockchain transaction.

## Current audit

- The workspace was empty: no framework, source files, package manifest, or dependencies were present.
- The public Eventpop landing page was reviewed read-only for broad UX patterns only: curated event sections, upcoming/popular grouping, event discovery, and a separate organizer/service information area. Authenticated ticket checkout and account surfaces were not publicly verifiable.
- The implementation does not use Eventpop names, logo, assets, copy, brand colors, or source code.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Product direction

ChainTicket uses a dark “signal / live moment” visual language: electric cyan for primary action, violet for discovery, lime for availability/success, compact mono metadata, medium rounded cards, and restrained glass-like surfaces. The landing/discovery flow is: discover → search/filter → inspect event → select ticket → cart → checkout → mint/mock ticket → verify/check-in.

## Next phases

1. Add Prisma schema and PostgreSQL seed data.
2. Add Auth.js roles: USER, ORGANIZER, ADMIN.
3. Add transactional reservation locks with expiry.
4. Add Stripe test-mode checkout and order/ticket records.
5. Add QR verification and single-use check-in.
6. Add wagmi/viem mock wallet mode, then ERC-721/1155 testnet minting.

Never use real card data or mainnet funds. Keep all secrets in `.env.local`.

## Supabase real-data setup

1. Create a Supabase project and copy its URL and anon key into `.env.local` using `.env.example`.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Run `supabase/seed.sql` to create real event and ticket rows.
4. Enable Email provider in Supabase Authentication.
5. Never expose a service-role key in `NEXT_PUBLIC_*` variables.

The browser auth client and Base Sepolia wallet provider are wired in the app. The live data adapter is in `lib/events.ts`; when Supabase is configured, database errors are surfaced instead of silently replacing a failed write with fake success.
