-- U Ticket 3: Rich ThaiTicket / MelonTicket style event catalog
-- Run this in Supabase SQL Editor to populate all event categories and tickets

insert into events (title, slug, description, artist, venue, starts_at, image_url, status) values
-- Concerts
('BLACKPINK WORLD TOUR <BORN PINK> FINALE', 'blackpink-born-pink-finale', 'The record-breaking global tour concludes with an unforgettable stadium spectacle in Bangkok.', 'BLACKPINK', 'Rajamangala National Stadium, Bangkok', '2026-11-20T19:00:00+07:00', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),
('Coldplay: Music of the Spheres Tour', 'coldplay-music-of-the-spheres', 'A luminous celebration of music, sustainability, and joy with LED wristbands and cosmic stages.', 'Coldplay', 'National Stadium, Bangkok', '2026-11-25T20:00:00+07:00', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),
('IU H.E.R. WORLD TOUR CONCERT IN BANGKOK', 'iu-her-world-tour-bangkok', 'South Korea sovereign vocal icon IU returns with a magical 3-hour emotional live journey.', 'IU (Lee Ji-eun)', 'Impact Arena, Muang Thong Thani', '2026-12-05T18:00:00+07:00', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),
('Tattoo Colour: กาลครั้ง 5 แทททู คัลเลอร์', 'tattoo-colour-carnival-5', 'คอนเสิร์ตใหญ่จัดเต็มของวงป๊อปอันดับหนึ่งแห่งยุค พร้อมแขกรับเชิญสุดพิเศษและเพลงฮิตตลอด 15 ปี', 'Tattoo Colour', 'BITEC Bangna Hall 100, Bangkok', '2026-12-13T19:00:00+07:00', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),
('Three Man Down Live: Basic Concert', 'three-man-down-basic-concert', 'คอนเสิร์ตเดี่ยวสุดยิ่งใหญ่ที่รวมทุกเพลงฮิตและโชว์ระดับตำนานของวงร็อกแห่งยุค', 'Three Man Down', 'Impact Exhibition Hall 5, Bangkok', '2026-12-20T19:00:00+07:00', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),

-- Festivals
('Big Mountain Music Festival 15 (BMMF15)', 'bmmf-15-khao-yai', 'เทศกาลดนตรีที่ใหญ่ที่สุดในประเทศไทย 9 เวที 200 กว่าศิลปิน ท่ามกลางลมหนาวเขาใหญ่', 'Various Thai & International Artists', 'The Ocean Khao Yai, Nakhon Ratchasima', '2026-12-12T14:00:00+07:00', 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),
('Wonderfruit 2026: Art & Life Festival', 'wonderfruit-2026-pattaya', 'A global gathering celebrating art, music, nature and mindful living across 5 days.', 'Global Electronic, Folk & Ambient Artists', 'The Fields at Siam Country Club, Pattaya', '2026-12-17T12:00:00+07:00', 'https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),
('Summer Sonic Bangkok 2026', 'summer-sonic-bangkok-2026', 'The premier Japanese urban music festival lands in Bangkok featuring world-class headliners.', 'International Rock, Pop & Indie Acts', 'IMPACT Challenger Hall, Bangkok', '2027-01-23T13:00:00+07:00', 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),

-- Fan Meeting
('Park Bo-gum Asia Fan Meeting Tour: Good Day', 'park-bo-gum-fan-meeting-bangkok', 'An intimate fan meeting with warm singing, candid talks and memorable interactive games.', 'Park Bo-gum', 'Thunder Dome, Muang Thong Thani', '2027-01-17T18:00:00+07:00', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),
('Billkin & PP Krit: Double Trouble Fan Fest', 'billkin-pp-krit-double-trouble', 'แฟนมีตติ้งและคอนเสิร์ตคู่สุดพิเศษของบิวกิ้นและพีพี พร้อมโชว์เดี่ยวและสเตจร่วมสุดอลังการ', 'Billkin & PP Krit', 'Queen Sirikit National Convention Center (QSNCC)', '2027-02-07T17:00:00+07:00', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),

-- Stage & Musical
('The Phantom of the Opera Bangkok', 'phantom-of-the-opera-bangkok', 'The world most acclaimed musical returns with grand orchestral accompaniment and gothic splendour.', 'West End Cast & Orchestra', 'Muangthai Rachadalai Theatre, Bangkok', '2027-01-30T19:30:00+07:00', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED'),
('ฟ้าจรดทราย เดอะมิวสิคัล 2026', 'fah-jarod-sai-the-musical', 'ละครเวทีฟอร์มยักษ์ระดับตำนาน บทเพลงไพเราะและการแสดงสุดตราตรึงใจ', 'Rachadalai All-Stars Cast', 'Muangthai Rachadalai Theatre, Bangkok', '2027-02-14T19:00:00+07:00', 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1000&q=80', 'PUBLISHED')
on conflict (slug) do nothing;

-- Ticket Types for New Events
-- BLACKPINK
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'VIP Standing (Soundcheck)', 14800, 400, 380 from events where slug='blackpink-born-pink-finale' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Standing Zone A', 9800, 1200, 1150 from events where slug='blackpink-born-pink-finale' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Seated Tier 1', 6800, 1500, 1420 from events where slug='blackpink-born-pink-finale' on conflict (event_id,name) do nothing;

-- Coldplay
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Kubik Experience (VIP)', 12500, 300, 290 from events where slug='coldplay-music-of-the-spheres' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'General Standing', 5800, 2000, 1920 from events where slug='coldplay-music-of-the-spheres' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Upper Bleachers', 3500, 1800, 1750 from events where slug='coldplay-music-of-the-spheres' on conflict (event_id,name) do nothing;

-- IU
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'VIP Platinum (Lanyard + Soundcheck)', 11000, 350, 340 from events where slug='iu-her-world-tour-bangkok' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Gold Seated', 6500, 1000, 960 from events where slug='iu-her-world-tour-bangkok' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Silver Seated', 3800, 1200, 1180 from events where slug='iu-her-world-tour-bangkok' on conflict (event_id,name) do nothing;

-- Tattoo Colour
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'บัตรยืนสุดชิล (Early Bird)', 2500, 800, 750 from events where slug='tattoo-colour-carnival-5' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'บัตรนั่ง VIP มีเก้าอี้', 4000, 400, 390 from events where slug='tattoo-colour-carnival-5' on conflict (event_id,name) do nothing;

-- Three Man Down
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Standing Zone', 2800, 1000, 940 from events where slug='three-man-down-basic-concert' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Seated Zone', 3800, 500, 470 from events where slug='three-man-down-basic-concert' on conflict (event_id,name) do nothing;

-- BMMF 15
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, '2-Day Early Cow Pass', 3200, 5000, 4850 from events where slug='bmmf-15-khao-yai' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'VIP 2-Day Pass (Fast Lane + Lounge)', 6500, 800, 760 from events where slug='bmmf-15-khao-yai' on conflict (event_id,name) do nothing;

-- Wonderfruit
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Full 5-Day Wonder Pass', 8900, 1200, 1150 from events where slug='wonderfruit-2026-pattaya' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Weekend Pass (Fri-Sun)', 6200, 800, 780 from events where slug='wonderfruit-2026-pattaya' on conflict (event_id,name) do nothing;

-- Summer Sonic
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, '1-Day General Entry', 4500, 2500, 2400 from events where slug='summer-sonic-bangkok-2026' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, '2-Day Combo Ticket', 7900, 1500, 1420 from events where slug='summer-sonic-bangkok-2026' on conflict (event_id,name) do nothing;

-- Park Bo-gum
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Hi-Touch VIP Seated', 6800, 300, 280 from events where slug='park-bo-gum-fan-meeting-bangkok' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Standard Seated', 3800, 800, 770 from events where slug='park-bo-gum-fan-meeting-bangkok' on conflict (event_id,name) do nothing;

-- Billkin & PP Krit
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'VIP Stage Front + Official Poster', 7500, 450, 420 from events where slug='billkin-pp-krit-double-trouble' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Regular Seated', 4200, 1200, 1150 from events where slug='billkin-pp-krit-double-trouble' on conflict (event_id,name) do nothing;

-- Phantom of the Opera
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Royal Circle (Best View)', 5500, 300, 290 from events where slug='phantom-of-the-opera-bangkok' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'Stalls / Balcony', 2800, 600, 580 from events where slug='phantom-of-the-opera-bangkok' on conflict (event_id,name) do nothing;

-- ฟ้าจรดทราย
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'บัตรทองคำ ชั้น 1', 4500, 350, 330 from events where slug='fah-jarod-sai-the-musical' on conflict (event_id,name) do nothing;
insert into ticket_types (event_id, name, price_cents, total_supply, available_supply)
select id, 'บัตรชั้น 2 บรรยากาศอบอุ่น', 2200, 500, 480 from events where slug='fah-jarod-sai-the-musical' on conflict (event_id,name) do nothing;
