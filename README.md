# UZER — Next.js do‘koni

Next.js App Router, TypeScript va Tailwind CSS. Vercel uchun Turso va Public Vercel Blob, mahalliy server uchun SQLite va disk ishlatiladi. Node.js 22.x kerak. Bosh sahifa va ochiq sahifalar OZBE’dagi o‘rganilgan tuzilishga moslashtirilgan; UZER brendi va berilgan API mahsulotlari ishlatiladi.

## Ishga tushirish

1. `npm install`
2. `npm run setup` — mavjud sozlamalarni saqlaydi; kerak bo‘lsa `.env.local`, admin paroli va sessiya kalitini yaratadi.
3. `npm run dev -- --port 3010`
4. Do‘kon: http://localhost:3010, katalog: http://localhost:3010/uz/products, admin: http://localhost:3010/admin.

Admin paroli `.env.local` ichidagi `ADMIN_PASSWORD`. Parol va tokenlarni Git ga yubormang. Production uchun `npm run build`, keyin `npm start` (standart port 3000; boshqa port uchun `PORT` environment qiymatini kiriting).

## Sahifalar

Har bir sahifa `/uz`, `/ru`, `/en` til prefiksi bilan mavjud. `/` birinchi ochilishda o‘zbekcha bosh sahifa.

| Sahifa | Manzil |
| --- | --- |
| Bosh sahifa | `/uz` |
| Katalog, yangi va kolleksiyalar | `/uz/products`, `/uz/products?collection=new` |
| Mahsulot | `/uz/products/1` — har mahsulotning o‘z ID manzili bor |
| Sevimlilar | `/uz/saved-products` |
| Buyurtma | `/uz/checkout` |
| Kirish va ro‘yxatdan o‘tish | `/uz/sign-in`, `/uz/sign-up` |
| Mijoz kabineti | `/uz/profile` |
| Brend va ma’lumot | `/uz/about`, `/uz/information` |
| Aloqa, do‘kon va hamkorlik | `/uz/contact`, `/uz/stores`, `/uz/press` |
| Yetkazib berish, qaytarish, FAQ | `/uz/delivery`, `/uz/returns`, `/uz/faq` |
| Lookbook | `/uz/lookbook` |
| Maxfiylik, shartlar, oferta, to‘lov | `/uz/privacy`, `/uz/terms`, `/uz/offer`, `/uz/payment` |

Bosh sahifada katta banner, mahsulot karusellari, ikki to‘rtlik kolleksiya bloki, aksessuar banneri va katta footer bor. Mahsulot sahifasi kompyuterda uch ustun, telefonda ketma-ket qismlardan iborat. Filtrlarda kategoriya, yangi mahsulotlar, qoldiq, razmer, nomdagi rang va narx oralig‘i ishlatiladi. Ko‘p sotilgan saralashi yakunlangan haqiqiy buyurtmalar hisobidan olinadi. Telefon va manzil foydalanuvchi bergan qiymatlardan kiritilgan.

## Admin va do‘kon ma’lumotlari

Admin → Sozlamalar orqali telefon, manzil, ish vaqti, Instagram/Telegram/TikTok havolalari va asosiy banner mahsulotini saqlash mumkin. Ijtimoiy havolalar kiritilmaguncha ko‘rsatilmaydi. Mahsulotlar, o‘lchamlar, rasmlar, qoldiq, tartib va tarjimalar mahsulot muharririda o‘zgartiriladi. Ombor, buyurtmalar, haqiqiy sotuv diagrammalari va yordam xabarlari mavjud.

## Telegram — 3 ta mustaqil bot

`.env.local` qiymatlari:

- `STOCK_BOT_TOKEN` / `STOCK_CHAT_ID`: ombor va kam qolgan razmerlar.
- `ORDER_BOT_TOKEN` / `ORDER_CHAT_ID`: buyurtmalar, mahsulot rasmlari va razmerlar.
- `SUPPORT_BOT_TOKEN` / `SUPPORT_CHAT_ID`: fikr va yordam xabarlari.

Botlarni tegishli chat/guruhga qo‘shing, qiymatlarni kiriting va serverni qayta ishga tushiring. Tokenlar brauzerga berilmaydi. Xabarlar doimiy navbatga yoziladi; Admin → Sozlamalar → Qayta yuborish orqali yuborilmagan xabarlar qayta ishlanadi. Haqiqiy Telegram yetkazilishi token va chat ID kiritilgach tekshiriladi.

## Mahsulotlar va ombor

Birinchi ishga tushishda berilgan MockAPI mahsulotlari SQLite bazaga import qilinadi. Narxlar ×1000 qilib so‘mga aylantiriladi. API ga yozilmaydi. Kiyimlar uchun foydalanuvchi belgilagan S:3, M:5, L:4, XL:2 (jami 14) boshlang‘ich qoldiq qo‘shilgan. Cap va Bag ONE SIZE qoldig‘ini saqlaydi. Admin har bir razmerni qo‘shadi, o‘chiradi yoki sonini o‘zgartiradi. scripts/configure-sizes.mjs oldingi bazadan zaxira oladi va faqat bir marta ishlaydi; admin tahrirlarini qayta yozmaydi.

Mahsulotlar qo‘shiladi, tahrirlanadi, yashiriladi, o‘chiriladi va tartiblanadi. Telefondan JPEG, PNG, WEBP rasmlar (4 MB gacha) yuklanadi. Buyurtma tranzaksiyada qoldiqni tekshiradi va kamaytiradi; qayta yuborilgan bir xil buyurtma ikki marta qoldiq ayirmaydi. Bekor qilish qoldiqni bir marta qaytaradi. Yakunlangan buyurtmalar sotuv statistikasida hisoblanadi. Qoldiq 5 dona yoki kam bo‘lganda ombor botiga xabar navbatga qo‘yiladi. API dan yangi import mavjud admin tahrirlarini almashtirmaydi.

43 ta dastlabki rasm `public/products` ichida WebP sifatida saqlangan; URL mosligi `lib/product-assets.json` orqali qo‘llanadi. Yangi mahalliy kesh uchun `node scripts/cache-product-images.mjs`. Bitta Pink Cap rasmi mavjud optimallashtirilgan keshdan tiklangan va 384px kenglikda; yuqori aniqlikdagi suratni admin orqali almashtirish mumkin. Yangi mahsulot yoki yangi rasm havolasi mahalliy kesh bo‘lmasa original manbadan olinadi.

## Mijoz kabineti va tillar

Mijoz ro‘yxatdan o‘tadi, kiradi va chiqadi. Parollar scrypt bilan himoyalangan; sessiyalar serverda saqlanadi, cookie HttpOnly. Akkauntga kirgan holda berilgan buyurtmalar faqat shu mijozga ko‘rinadi. Akkauntsiz buyurtma berish ham mumkin. Sevimlilar va savat qurilmada saqlanadi. Buyurtmada ism, familiya, telefon, olish usuli, ixtiyoriy Telegram username va izoh bor. Yetkazib berish tanlansa manzil majburiy; olib ketish tanlansa do‘kon manzili olinadi. Hozir onlayn to‘lov qabul qilinmaydi; operator shartlarni tasdiqlaydi.

Interfeys va ma’lumot sahifalari uch tilda. Mahsulot nomi va tavsifining RU/EN tarjimalari admin muharririda kiritiladi; tarjima bo‘lmasa API’dagi original matn ko‘rsatiladi. Manrope va Zen Dots lokal shriftlar; logo rangi #07064D, asosiy tugmalar qora.

## Tekshiruv va ko‘rinishlar

`npm run build`, `npm run typecheck`, `npm test`, `npm run test:browser`.

Sinovlar alohida vaqtinchalik bazalarda bajariladi; ishchi ombor va buyurtmalarga tegmaydi. Brauzer sinovlari kompyuter/mobil ko‘rinish, sahifalar, tillar, haqiqiy xarid oqimi, kabinet, admin sozlamalari va tahrirlashni tekshiradi. Natijalar va suratlar `artifacts/uzer-redesign`, OZBE dizayn tadqiqoti `artifacts/ozbe-audit` ichida.

## Hosting va zaxira nusxa

Vercel uchun batafsil sozlash: [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md). Turso va Public Blob kalitlarini hosting environment qiymatlariga kiriting. Mahalliy yoki VPS rejimida SQLite uchun doimiy disk kerak; Dockerfile va compose.yaml mavjud. Mahalliy bazani bulutga ko‘chirish uchun npm run migrate:cloud qo‘llanadi. Haqiqiy hostingga hali joylashtirilmagan.

Banner va uslub rasmlari: admin → Sozlamalar bo‘limida kompyuter banneri, telefon banneri va 8 ta uslub fotosi alohida yuklanadi. Telefonda portret banner avtomatik tanlanadi. Rasmlarni public/campaign/hero-desktop.jpg, hero-mobile.jpg va style-1.jpg … style-8.jpg nomlari bilan joylashtirish ham mumkin (jpg/jpeg/png/webp). Hozir suhbatdagi asl fayllar loyiha papkasida yo‘q; ular yuklanguncha mavjud mahsulot fotosi zaxira ko‘rinishida turadi. Berilgan skrinshotlar sayt fotosi sifatida ishlatilmaydi.
