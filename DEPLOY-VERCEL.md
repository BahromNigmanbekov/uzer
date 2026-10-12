# UZER — GitHub va Vercel uchun qo‘llanma

Loyiha Next.js bo‘lib qoladi. Vercel’da ma’lumotlar Turso bazasida, admin yuklagan fotosuratlar Public Vercel Blob’da saqlanadi. Sahifalar Next.js server yo‘llari orqali ochiladi: refresh uchun qo‘shimcha SPA rewrite kerak emas.

## Joriy deployment

2026-10-12 kuni [uzer-seven.vercel.app](https://uzer-seven.vercel.app/) Production muhitiga joylandi. Mavjud Turso bazasi `database-pink-kettle` va Public Blob ombori `uzer-images` ulangan; Node.js 22.x ishlatiladi. Oddiy yangilashda shu saqlash xizmatlarini qoldiring, yangi baza yaratish shart emas. Jonli tekshiruvda baza ulanishi, 43 mahsulot, uchta til, sahifa yangilanishi, mobil ko‘rinish va admin kirishi ishladi. `images: true` Blob tokeni sozlanganini bildiradi; haqiqiy rasm yuklash alohida tekshiriladi.

## Sayt ochilmasa: avval bazani ulang

Vercel’da `TURSO_DATABASE_URL` yoki `TURSO_AUTH_TOKEN` kiritilmasa, baza bilan ishlaydigan amallar bajarilmaydi. Yangilangan kod katalogni ko‘rsatadi, ammo buyurtma va boshqa saqlash amallarini bloklaydi. Quyidagi qadamlar yangi deploy yoki shu holatni tuzatish uchun.

1. [Turso](https://turso.tech/) saytida akkaunt ochib, boshqaruv paneliga kiring. Mavjud ulangan **libSQL** database bo‘lsa, undan foydalaning. Baza hali bo‘lmasa, `uzer` nomli yangi **libSQL** database yarating. Bu loyiha `@libsql/client` ishlatadi; baza URL’i `libsql://` bilan boshlansin. Turso’da boshqa `turso://` engine ham bor, ushbu loyiha uchun libSQL tanlang. [Rasmiy bazani yaratish qo‘llanmasi](https://docs.turso.tech/quickstart).
2. Yaratilgan bazani oching va uning **Database URL** qiymatini nusxalang. Shu baza uchun o‘qish va yozishga ruxsat beruvchi **database auth token** yarating. Turso akkauntining boshqaruv API tokeni kerak emas. Panelda topilmasa, quyidagi CLI usuli bor. [Database token qo‘llanmasi](https://docs.turso.tech/cli/db/tokens/create).
3. [Vercel](https://vercel.com/dashboard) → `uzer` loyihangiz → **Settings → Environment Variables → Add Environment Variable** ni oching. Kalit `TURSO_DATABASE_URL`, qiymat Turso’dan olingan to‘liq URL bo‘lsin. **Production** muhitini tanlab saqlang. Keyin shu tartibda `TURSO_AUTH_TOKEN` ni qo‘shing. Qiymat maydoniga faqat qiymatni yozing: `KEY=` yoki qo‘shtirnoq kiritmang.
4. Shu joyga `ADMIN_PASSWORD` va `SESSION_SECRET` ni ham kiriting. Admin paroli kamida 16, tasodifiy session kaliti kamida 32 belgidan iborat bo‘lsin. Maxfiy qiymatlarga `NEXT_PUBLIC_` qo‘shmang, GitHub yoki chatga joylamang.
5. Admin orqali yangi rasmlar yuklash uchun loyiha → **Storage → Create Storage → Blob → Public** ni tanlang, omborni loyihangizning **Production** muhitiga ulang. `BLOB_READ_WRITE_TOKEN` mavjudligini tekshiring. [Vercel Blob yaratish qo‘llanmasi](https://vercel.com/docs/vercel-blob/using-blob-sdk#getting-started).
6. **Settings → Build and Deployment → Node.js Version** da **22.x** ni tanlang. `package.json` dagi `engines.node` loyiha panelidagi versiyani almashtirishi mumkin: rasmdagi 22.x/24.x ogohlantirishi shuni ko‘rsatadi. Bazaning ulanmagani alohida sabab. [Vercel Node.js sozlamasi](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
7. Koddagi tuzatishlarni GitHub’ga yuklang. Vercel → **Deployments** → oxirgi deployment yonidagi **⋯ → Redeploy** ni bosing va **Production** uchun qayta joylang. Environment Variables o‘zgarishi avvalgi deployment’ga tatbiq etilmaydi. [Vercel environment qo‘llanmasi](https://vercel.com/docs/environment-variables).
8. [Saytingizning tekshiruv manzilini](https://uzer-seven.vercel.app/api/health) oching. `database: true` — baza ishlayapti; `images: true` — rasm ombori sozlangan; `ok: true` — ikkala sozlama tayyor. Keyin saytni yangilang va buyurtma, admin, rasm yuklash hamda botlarni tekshiring.

Yangilangan `/api/health` qaytaradigan xavfsiz xato kodlari:

| `code` | Nima qilish kerak |
|---|---|
| `MISSING_TURSO_CONFIG` | `missing` ro‘yxatidagi kalitlarni Production muhitiga kiriting va Redeploy qiling. |
| `INVALID_TURSO_CONFIG` | URL’ni qayta nusxalang; libSQL bazaning `libsql://...` URL’i kerak. Qo‘shtirnoq, `KEY=` va ortiqcha belgilarni olib tashlang. |
| `DATABASE_AUTH_FAILED` | Aynan shu baza uchun yozishga ruxsat beradigan yangi database token yarating, `TURSO_AUTH_TOKEN` ni almashtiring va Redeploy qiling. |
| `DATABASE_UNAVAILABLE` | Turso panelida baza mavjudligi va holatini tekshiring; ulanish vaqtincha uzilgan bo‘lsa, qayta urinib ko‘ring. |
| `MISSING_BLOB_CONFIG` | Public Blob’ni loyihaga ulang va `BLOB_READ_WRITE_TOKEN` ni Production muhitida tekshiring. Baza ishlayotgan bo‘lsa, bu kod rasm yuklash sozlamasiga tegishli. |

Panel orqali libSQL bazani yaratish yoki tokenni olish topilmasa, [Turso CLI o‘rnatilgach](https://docs.turso.tech/cli/installation) quyidagi buyruqlarni o‘z kompyuteringizda bajaring. Windows uchun rasmiy CLI qo‘llanmasi WSL’dan foydalanadi. Bu usulda `--tursodb` parametrini qo‘shmang:

```sh
turso auth login
turso db create uzer
turso db show uzer --url
turso db tokens create uzer
```

Oxirgi buyruq maxfiy tokenni ko‘rsatadi; uni faqat Vercel’dagi `TURSO_AUTH_TOKEN` qiymatiga ko‘chiring. Baza va token haqidagi buyruqlar: [db show](https://docs.turso.tech/cli/db/show), [db tokens create](https://docs.turso.tech/cli/db/tokens/create).

## 1. GitHub’ga yuklash

GitHub’da repository yarating va loyihani yuklang. `.gitignore` `.env.local`, `data`, `node_modules`, `.next`, `.vercel`, test suratlari va tashqi worker fayllarini chiqarib tashlaydi. `.env.local` ichidagi parollar, bot tokenlari yoki mijozlar bazasini GitHub’ga yuklamang. Mahsulotlar katalogining shaxsiy ma’lumotlarsiz boshlang‘ich nusxasi va haqiqiy 43 mahsulot WebP rasmlari sayt uchun kerak.

## 2. Turso bazasi

[Turso](https://turso.tech/) saytida akkaunt oching, mavjud **libSQL** database’ni ishlating yoki baza hali bo‘lmasa yangi database yarating. Baza URL’ini va auth tokenini oling. Vercel loyiha sozlamalarida quyidagilarni kiriting:

- `TURSO_DATABASE_URL` — libsql://... manzil.
- `TURSO_AUTH_TOKEN` — baza tokeni.

Har bir deployment va function instance shu bazadan o‘qiydi. Bazani qayta yaratish yoki boshqa database URL’iga o‘tish yangi bazaga o‘tish hisoblanadi. Oddiy redeploy qoldiq va buyurtmalarni o‘chirmaydi.

Yangi bo‘sh baza jadvali avtomatik tayyorlanadi. Katalog MockAPI’dan olinadi; API vaqtincha ishlamasa, loyihadagi uning boshlang‘ich nusxasi ishlatiladi. Narx ×1000; kiyimlar uchun S:3, M:5, L:4, XL:2. Takroriy ishga tushish yoki parallel cold start mavjud mahsulot qoldiqlarini qayta yozmaydi.

## 3. Vercel Blob

Vercel’da loyiha → Storage → Blob yarating, **Public** turini tanlang va loyihaga ulang. `BLOB_READ_WRITE_TOKEN` avtomatik qo‘shiladi. Bu omborda faqat mahsulot va banner rasmlari bo‘ladi; mijozlar ma’lumotlari Turso’da qoladi.

Rasm fayli 4 MB gacha. JPEG/PNG/WebP fayli haqiqiy rasm sifatida tekshiriladi va kichikroq WebP’ga optimallashtiriladi. Token brauzerga yuborilmaydi. Vercel’da mahalliy diskka rasm yoki SQLite yozilmaydi.

## 4. Environment Variables

Vercel → Project → Settings → Environment Variables:

| Kalit | Qiymat |
|---|---|
| `TURSO_DATABASE_URL` | Turso baza URL’i |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `BLOB_READ_WRITE_TOKEN` | Public Blob token |
| `ADMIN_PASSWORD` | Kamida 16 belgili kuchli admin paroli |
| `SESSION_SECRET` | Uzun tasodifiy maxfiy qiymat; kamida 32 belgi |
| `CRON_SECRET` | Boshqa tasodifiy maxfiy qiymat; kamida 32 belgi |
| `STOCK_BOT_TOKEN`, `STOCK_CHAT_ID` | Ombor botingiz |
| `ORDER_BOT_TOKEN`, `ORDER_CHAT_ID` | Buyurtma botingiz |
| `SUPPORT_BOT_TOKEN`, `SUPPORT_CHAT_ID` | Yordam botingiz |

`PRODUCT_API_URL` va `PRODUCT_PRICE_MULTIPLIER` standart qiymatlari kodda bor, o‘zgartirish shart emas. `DATABASE_PATH` va `UPLOAD_PATH` Vercel uchun kerak emas.

Kalitlarni Production muhitiga kiriting. Preview deployment’larda ham to‘liq tekshirmoqchi bo‘lsangiz, ularga **alohida test Turso bazasi va Blob** ulang. Production bazasi bilan preview buyurtma yaratish haqiqiy omborni o‘zgartiradi. Environment qiymati o‘zgargach Redeploy qiling. Maxfiy qiymatlarga `NEXT_PUBLIC_` prefiksini qo‘ymang.

## 5. Deploy

Vercel → Add New → Project → GitHub repository’ni Import qiling.

- Framework: Next.js.
- Root Directory: loyiha ildizi.
- Node.js: **22.x**.
- Install Command: `npm ci`.
- Build Command: `npm run build`.
- Output Directory: standart Next.js sozlamasi; `out` yoki `dist` kiritmang.

Kalitlar kiritilganidan keyin Deploy bosing. `.vercel.app` manzilida tekshiring: `/api/health` javobi `ok: true`, `database: true`, `images: true` bo‘lsin. Buyurtma, ombor, admin, rasmlar va uch botni ham sinovdan o‘tkazing. Mahsulot URL’ini yangi brauzer oynasida to‘g‘ridan-to‘g‘ri ochib, sahifani yangilang.

DNS ulash uchun loyiha → Settings → Domains → `uzeer.uz` kiriting va Vercel ko‘rsatgan DNS yozuvlarini domen paneliga qo‘shing. GitHub’ga keyingi kod push qilinganda Vercel yangi deployment yaratadi; doimiy saqlash xizmatlari qoladi.

Haqiqiy savdo sayti tijorat loyihasi hisoblanadi. Vercel Hobby shaxsiy, notijorat ishlatish uchun; tijorat ishga tushirish uchun mos Pro tarifini tanlang: https://vercel.com/docs/plans/hobby .

## 6. Hozirgi bazani ko‘chirish (ixtiyoriy)

Mahalliy admin tahrirlari va mavjud buyurtmalarni ham saqlamoqchi bo‘lsangiz, yangi bo‘sh Turso bazasini va Public Blob’ni yaratib, yuqoridagi uch kalitni faqat mahalliy `.env.local` fayliga kiriting. Mahalliy saytni to‘xtating. Vercel hali shu bazaga ulanib ishga tushmagan bo‘lsin. Keyin:

```powershell
npm run migrate:cloud
```

Skript asl SQLite bazani faqat o‘qiydi; mahsulotlar, buyurtmalar, yordam xabarlari, yuborish navbati, admin sozlamalari va mijoz akkauntlarini bo‘sh Turso bazasiga ko‘chiradi. Mahalliy yuklangan mahsulot rasmlari Blob’ga o‘tkaziladi va havolalari yangilanadi. Mijozlar qayta login qilishadi. Mavjud remote bazaga yozishdan oldin tekshiradi va ko‘chirishni to‘xtatadi. Muvaffaqiyatli ko‘chirishdan keyin Vercel Deploy qiling. Turso va Blob zaxira nusxalarini saqlashni rejalashtiring.

## Telegram va tekshiruvlar

Xabarlar bazadagi navbatda saqlanadi va javob qaytarilgandan keyin yuboriladi. Background setInterval Vercel’da ishlatilmaydi. Muvaffaqiyatsiz xabarlar yangi buyurtma yoki yordam xabaridan keyin, adminning qayta yuborish tugmasi yoki kunlik himoyalangan `/api/cron` orqali takrorlanadi. Ko‘p qatorli navbat vaqt chegarasiga yetganda qolgan xabarlar keyingi urinish uchun saqlanadi. Tez-tez avtomatik takrorlash kerak bo‘lsa, mos hosting tarifida cron jadvalini qisqartirish mumkin.

`npm run build`, `npm test`, `npm run test:browser`, `npm run test:cloud` — mahalliy tekshiruvlar. Cloud test haqiqiy SDK orqali mahalliy HTTP baza xizmatiga ikki mustaqil serverni ulaydi; parallel checkout, cold start, idempotency, akkaunt va qoldiq saqlanishini tekshiradi. Bu hisobingizdagi haqiqiy Turso yoki Vercel deployment sinovi o‘rnini bosmaydi. Hisobingizdagi haqiqiy Turso ulanishi, Vercel deployment va Blob token bilan rasm yuklash alohida tekshirilishi kerak.
