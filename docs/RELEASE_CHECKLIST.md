# U Ticket 3 Release Checklist

ใช้ตรวจสอบก่อน Demo หรือเปิดให้ผู้ใช้จริงเข้าทดสอบ

## Supabase

- [ ] รัน `supabase/schema.sql`
- [ ] รัน `supabase/mvp-migration.sql`
- [ ] รัน `supabase/purchase-flow.sql`
- [ ] รัน `supabase/seed.sql`
- [ ] เปิด Email provider ใน Supabase Auth
- [ ] ตั้ง Redirect URLs สำหรับ localhost และ Vercel
- [ ] ตรวจ RLS ด้วย user ที่ไม่ใช่เจ้าของข้อมูล
- [ ] ผู้ใช้ทั่วไปแก้ role ของตัวเองไม่ได้ และการ Check-in จำกัดเฉพาะ ORGANIZER/ADMIN
- [ ] Ticket code และ QR payload ไม่เปิดให้อ่านแบบ public
- [ ] ตรวจว่า `service_role` ไม่อยู่ใน client หรือ Vercel `NEXT_PUBLIC_*`

## Reservation

- [ ] ผู้ใช้ที่ไม่ Login ถูกปฏิเสธด้วย `AUTH_REQUIRED`
- [ ] จองได้สูงสุด 6 ใบต่อคำขอ
- [ ] Countdown ใช้ `expires_at` จากฐานข้อมูล
- [ ] Reservation หมดอายุเปลี่ยนเป็น `EXPIRED`
- [ ] การจองพร้อมกันไม่ทำให้ available inventory ติดลบ
- [ ] Payment failure ไม่สร้าง ticket
- [ ] Payment success สร้าง order และ ticket ได้ครั้งเดียว

## Wallet / Ethereum Sepolia

- [ ] MetaMask เชื่อมต่อได้
- [ ] Wrong network แสดงปุ่มเปลี่ยนเป็น Ethereum Sepolia
- [ ] Chain ID คือ `11155111`
- [ ] ไม่มี private key หรือ seed phrase ใน repository
- [ ] Contract address เป็นของ Ethereum Sepolia เท่านั้น
- [ ] Transaction receipt ต้องสำเร็จก่อนบันทึกผลสำเร็จใน Supabase
- [ ] API mint ต้องยืนยัน session, ownership และสถานะ order ก่อนส่ง transaction
- [ ] การ mint ต้องมี atomic claim ป้องกันการส่งซ้ำ และ server เป็นผู้เชื่อม token ID หลังยืนยัน receipt
- [ ] ค่า `PRIVATE_KEY` อยู่ใน server-only environment variable เท่านั้น
- [ ] ค่า `SUPABASE_SERVICE_ROLE_KEY` อยู่ใน server-only environment variable เท่านั้น

## ก่อนเปิดรับเงินจริง

- [ ] แทนที่ mock checkout ด้วย payment provider และยืนยันผลผ่าน signed webhook
- [ ] ปิดการสร้าง order สถานะ `PAID` จาก client ก่อนต่อ payment provider
- [ ] แทนที่ NFT metadata URI demo ด้วย metadata ที่ pin และตรวจสอบได้จริง

## NFT Resale

- [ ] ตรวจ owner จาก chain ก่อนสร้าง listing
- [ ] Ticket ที่ check-in แล้ว list ไม่ได้
- [ ] ซื้อ listing เดิมซ้ำไม่ได้
- [ ] Seller ซื้อ ticket ของตัวเองไม่ได้
- [ ] แสดง royalty และยอดสุทธิของ seller
- [ ] Sync `Listed`, `Sale`, `CheckedIn` แบบ idempotent
- [ ] มี transaction hash และ Sepolia Etherscan link

## Production verification

```text
npm run typecheck
npm run build
forge test
```

หากคำสั่งใดล้มเหลว ให้รายงาน error จริงและสถานะเป็น Blocked จนกว่าจะตรวจสอบซ้ำสำเร็จ
