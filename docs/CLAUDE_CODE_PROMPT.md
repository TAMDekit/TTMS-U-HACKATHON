# Claude Code Prompt — U Ticket 3 Resale + Reservation

ทำงานต่อใน `C:\Users\TAM\Documents\Hackathon` โปรเจกต์ U Ticket 3 โดยรับบท Senior Full-stack Developer และ Web3 Engineer

เป้าหมาย: ทำระบบจองบัตรและตลาด Resale NFT ให้ใช้งานจริงบน Supabase Cloud และ Ethereum Sepolia testnet ห้ามใช้ Mainnet ห้ามใช้ mock ใน production path และห้ามเปิดเผย secret

## กติกา

- อ่านโค้ดและ `git status` ก่อนแก้ไข ห้ามลบงานเดิมโดยไม่จำเป็น
- ใช้ Supabase Auth, Database และ RLS
- ห้ามใช้ local PostgreSQL หรือ DBeaver
- ห้ามใส่ service-role key/private key/seed phrase ใน client หรือ Git
- ทุกธุรกรรม Web3 ต้องตรวจ chain เป็น Ethereum Sepolia (11155111)
- ใช้ mock ได้เฉพาะ fallback เมื่อยังไม่มี contract address แต่ต้องแสดงสถานะชัดเจน
- อย่าอ้างว่าทำเสร็จจนกว่าจะทดสอบจริง

## Reservation Queue

1. ใช้ `supabase/mvp-migration.sql` เป็นฐานและตรวจ schema ก่อน
2. ใช้ RPC `create_reservation(p_ticket_type_id, p_quantity)` เป็นจุดเดียวในการจอง
3. Reservation อายุ 10 นาทีและต้อง lock row ป้องกัน overselling
4. เมื่อหมดเวลาให้เปลี่ยนเป็น EXPIRED
5. ห้ามลด inventory ก่อน payment สำเร็จ
6. เมื่อ payment สำเร็จให้เปลี่ยน reservation เป็น COMPLETED และสร้าง order/order_items/tickets ใน transaction ที่ปลอดภัย
7. เพิ่ม countdown ที่คำนวณจาก `expires_at` จริง ไม่ hardcode
8. รองรับ SOLD_OUT, AUTH_REQUIRED, INVALID_QUANTITY และ EXPIRED พร้อมข้อความ UX ที่เข้าใจง่าย

## NFT Resale

1. ใช้ contract `contracts/ChainTicketResale.sol` ซึ่งเป็น `UTicket3`, NFT name `U Ticket 3`, symbol `UT3`
2. ตรวจ owner จาก chain ก่อนสร้าง listing
3. ห้าม list ticket ที่ checked-in แล้ว
4. Listing ต้องมี ticketId, seller wallet, priceWei/priceCents, chainId และ contract address
5. การขายต้องเรียก contract `buy(tokenId)` และรอ receipt ก่อน update Supabase
6. Resale ต้องแสดง royalty, seller proceeds, buyer total และ network
7. Sync events `Listed`, `Sale`, `CheckedIn` กลับ Supabase โดยไม่สร้าง listing ซ้ำ
8. Cancel listing ต้องตรวจ seller wallet และ transaction receipt
9. ป้องกันซื้อ listing ที่หมดอายุ/ขายไปแล้ว/เป็นเจ้าของเอง
10. แสดง transaction hash และ block explorer link

## UI ที่ต้องมี

- Reservation countdown 10 นาที
- My Tickets แสดง NFT status: Minting, Minted, Listed, Sold, Used
- Ticket detail พร้อม QR และ tokenId
- ปุ่ม List for resale, Cancel listing และ Buy resale
- Wallet connect, wrong-network state และ switch-to-Ethereum-Sepolia state
- Loading, empty, error, sold-out และ transaction-pending states

## Verification

รันและรายงานผล:

```text
npm run typecheck
npm run build
forge test
```

ถ้า Foundry ติด network/compiler/dependency ให้รายงาน error จริง ห้ามเดา และอย่าอ้างว่า contract ผ่าน test

รายงานท้ายงาน:

- ไฟล์ที่แก้
- SQL ที่ต้องรันใน Supabase
- Environment variables ที่ต้องเพิ่มโดยไม่แสดงค่า secret
- Transaction hash/contract address ถ้ามี
- Test results
- Blockers ที่ยังเหลือ
