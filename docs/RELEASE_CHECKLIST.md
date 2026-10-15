# U Ticket 3 Release Checklist

ใช้ตรวจสอบก่อน Demo หรือเปิดให้ผู้ใช้จริงเข้าทดสอบ

## Supabase

- [ ] รัน `supabase/schema.sql`
- [ ] รัน `supabase/seed.sql`
- [ ] รัน `supabase/mvp-migration.sql`
- [ ] เปิด Email provider ใน Supabase Auth
- [ ] ตั้ง Redirect URLs สำหรับ localhost และ Vercel
- [ ] ตรวจ RLS ด้วย user ที่ไม่ใช่เจ้าของข้อมูล
- [ ] ตรวจว่า `service_role` ไม่อยู่ใน client หรือ Vercel `NEXT_PUBLIC_*`

## Reservation

- [ ] ผู้ใช้ที่ไม่ Login ถูกปฏิเสธด้วย `AUTH_REQUIRED`
- [ ] จองได้สูงสุด 6 ใบต่อคำขอ
- [ ] Countdown ใช้ `expires_at` จากฐานข้อมูล
- [ ] Reservation หมดอายุเปลี่ยนเป็น `EXPIRED`
- [ ] การจองพร้อมกันไม่ทำให้ available inventory ติดลบ
- [ ] Payment failure ไม่สร้าง ticket
- [ ] Payment success สร้าง order และ ticket ได้ครั้งเดียว

## Wallet / Base Sepolia

- [ ] MetaMask เชื่อมต่อได้
- [ ] Wrong network แสดงปุ่มเปลี่ยนเป็น Base Sepolia
- [ ] Chain ID คือ `84532`
- [ ] ไม่มี private key หรือ seed phrase ใน repository
- [ ] Contract address เป็นของ Base Sepolia เท่านั้น
- [ ] Transaction receipt ต้องสำเร็จก่อนบันทึกผลสำเร็จใน Supabase

## NFT Resale

- [ ] ตรวจ owner จาก chain ก่อนสร้าง listing
- [ ] Ticket ที่ check-in แล้ว list ไม่ได้
- [ ] ซื้อ listing เดิมซ้ำไม่ได้
- [ ] Seller ซื้อ ticket ของตัวเองไม่ได้
- [ ] แสดง royalty และยอดสุทธิของ seller
- [ ] Sync `Listed`, `Sale`, `CheckedIn` แบบ idempotent
- [ ] มี transaction hash และ BaseScan link

## Production verification

```text
npm run typecheck
npm run build
forge test
```

หากคำสั่งใดล้มเหลว ให้รายงาน error จริงและสถานะเป็น Blocked จนกว่าจะตรวจสอบซ้ำสำเร็จ
