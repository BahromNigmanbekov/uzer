import fs from 'node:fs';
const root='artifacts/ozbe-audit';
const audit=JSON.parse(fs.readFileSync(`${root}/audit.json`,'utf8'));
const details=JSON.parse(fs.readFileSync(`${root}/details.json`,'utf8'));
const checkout=JSON.parse(fs.readFileSync(`${root}/checkout.json`,'utf8'));
const interactions=JSON.parse(fs.readFileSync(`${root}/interactions.json`,'utf8'));
const sitemap=audit.sitemaps.find(s=>s.url.endsWith('sitemap.xml')).locations;
const missing=sitemap.filter(u=>!audit.pages.some(p=>p.url===u));
const rows=audit.pages.map((p,i)=>`| ${i+1} | [${new URL(p.url).pathname+new URL(p.url).search}](${p.url}) | ${p.status} | [Kompyuter](${p.desktopScreenshot.split(/[\\/]/).pop()}) · [Telefon](${p.mobileScreenshot.split(/[\\/]/).pop()}) |`).join('\n');
const report=`# OZBE dizayni va sahifalari bo‘yicha tekshiruv

Manba: [ozbe.store](https://ozbe.store/uz). Tekshiruv sanasi: 2026-10-11. Bu hujjat UZER saytining keyingi dizayn ishlari uchun amaldagi ochiq saytni kuzatish natijasidir. Ilova kodi ushbu tadqiqot davomida o‘zgartirilmagan.

## Qamrov va dalillar

- Sitemapdagi ${sitemap.length} manzilning barchasi ochildi; tekshirilmay qolgan sitemap manzillari: ${missing.length}.
- Asosiy tekshiruvda ${audit.pages.length} alohida URL kompyuterda 1440×1000 va telefonda 390×844 o‘lchamda ochildi. Barchasining hujjat javobi HTTP 200. Bu raqam filtrli URLlarni ham o‘z ichiga oladi; 52 xil sahifa shabloni degani emas.
- Qo‘shimcha ravishda UZ kolleksiya, rasmdagi aniq RU kolleksiya/saralash manzili, RU va EN bosh sahifalari hamda bo‘sh va mahsulotli checkout ko‘rildi.
- ${interactions.states.length} menyu, hover, qidiruv, filtr va mahsulot holati, ${details.pages.length} batafsil sahifa yozuvi va tasdiqlangan savat/checkout yozuvi saqlandi.
- [Asosiy DOM va o‘lchovlar](audit.json), [interaktiv holatlar](interactions.json), [ma’lumot sahifalari](details.json), [tasdiqlangan checkout](checkout.json).

## Dizaynning asosiy qoidalari

| Element | Kuzatilgan ko‘rinish |
| --- | --- |
| Matn shrifti | Manrope; asosiy vazn 400. Logo alohida brend grafikasidir. |
| Ranglar | Oq yuzalar, asosiy to‘q bordo #3A0300, xira bordo-kulrang yordamchi matnlar. |
| Kompyuter headeri | 1440px kenglikda 72px balandlik, tepaga mahkamlangan; chetlarda 32px bo‘shliq. |
| Navigatsiya | Chapda Do‘kon, Yangi, Kolleksiyalar, Do‘konlar; markazda logo; o‘ngda qidiruv, til, kabinet, yurak va savat. |
| Tipografika | Navigatsiyada taxminan 11px; bosh sahifa katta sarlavhasi 1440px kenglikda 115.2px; bo‘lim sarlavhalari 43.2px. |
| Kartochkalar | Soyasiz, tashqi bordersiz, katta mahsulot rasmi; nom va narx chapda, rang nuqtalari o‘ngda. |
| Grid | Kompyuterda 4 ustun, telefonda 2 ustun kuzatildi; rasmning sizes qoidasida o‘rta ekran uchun 3 ustun ko‘rsatilgan. |
| Tugmalar | Katalog va checkout CTA to‘g‘ri to‘rtburchak; mahsulot sahifasida o‘lcham, rang va asosiy CTA yumaloq. |
| Mobil menyu | Oq, deyarli butun ekran; katta havolalar, akkordeonlar, pastroqda kabinet/saqlanganlar va UZ/RU/EN tugmalari. |

Bosh sahifada header banner ustida shaffof, yozuvlari oq. Ichki sahifalar va pastga aylantirilgan holatda yorug‘ fon va to‘q belgilar ishlatiladi. Bo‘sh joy, katta rasmlar va ingichka chiziqlar sayt ko‘rinishining muhim qismidir.

## Bosh sahifa tuzilishi

1. Katta birinchi banner, past chapdagi juda katta sarlavha va kolleksiyaga o‘tish tugmasi.
2. Yangi kelgan mahsulotlar gorizontal qatori, barcha mahsulotlarga havola va strelkalar.
3. To‘rtta katta kolleksiya tasvirli blok.
4. Ustki kiyimlar qatori.
5. Shimlarga bag‘ishlangan to‘rtta katta blok va pastki kiyimlar qatori.
6. Keng kartxolder banneri va aksessuarlar qatori.
7. Jismoniy do‘kon, manzil va aloqa bloki.
8. Bir necha ustunli footer, ijtimoiy havolalar va pastda juda katta OZBE logosi.

Bannerning ayrim fon rasmlari tekshiruvda yuklanmadi; joylashuvi, matni va gradienti ko‘rindi. Ularning ko‘rinmagan fotosurat tafsilotlari haqida taxmin qilinmadi.

## Katalog va kolleksiyalar

[Katalog](https://ozbe.store/uz/products) tepada katta nom/banner, undan keyin mahsulot soni, saralash va filtr tugmalarini beradi. Faol filtrlar o‘chiriladigan chiplar bilan ko‘rsatiladi. Foydalanuvchi yuborgan rasm banner pastga aylantirilgandan keyingi ko‘rinishga mos.

Saralash tavsiya, yangi, ko‘p sotiladigan, narx o‘sishi va kamayishi variantlarini beradi. Filtr panelida kategoriya, kolleksiya, o‘lcham va rang guruhlari bor. Panel tagida tozalash va natijalarni ko‘rish amallari joylashgan.

Kompyuterda kartochkaga kursor olib borilganda boshqa rasm va pastki CTA paydo bo‘ladi. Telefonda CTA ko‘rinib turadi. Rasmlar katta, kataklar orasidagi bo‘shliq kichik. Yangi mahsulot belgisi, mavjud o‘lchamlar va rang nuqtalari kartochkaga qo‘shimcha ma’lumot beradi. Qidiruv paneli va unga matn kiritish holati ochildi; qidiruvning barcha chekka holatlari tekshirilmagan.

## Mahsulot sahifasi

Kompyuterda uch qism: chapda kategoriya, nom, saqlash, tavsif va katta narx; markazda katta rasm galereyasi; o‘ngda rang/o‘lcham, savat CTA va yetkazib berish/qaytarish ma’lumotlari. Tanlangan rang va o‘lcham to‘q fonli. Variantga bog‘liq kam qolgan son ko‘rsatiladi. RIZQ mahsulotida rang tanlovi, Naqsh mahsulotida o‘lcham tanlovi kuzatildi. Pastda mos mahsulotlar gorizontal qatori bor. Telefonda qismlar ketma-ket joylashadi.

Dalillar: [rangli mahsulot](detail-color-product-full.png), [telefon mahsuloti](state-mobile-product-detail.png), [yetkazib berish bo‘limi](state-product-delivery.png).

## Savat va buyurtma

Mahsulot o‘lchami tanlanib savatga qo‘shildi. O‘ngdan ochiladigan savat 1440px ekranda taxminan 520px kenglikda; orqa sahifa xiralashadi. Savatda mahsulot rasmi, nomi, o‘lchami, miqdor boshqaruvi va o‘chirish amali, pastda jami hamda checkout CTA bor.

[Haqiqiy checkout](https://ozbe.store/uz/checkout) mahsulotli savatdan ochildi. Chapda katta sarlavha va raqamlangan aloqa/olish/to‘lov bo‘limlari; o‘ngda chegarali buyurtma kartasi. Aloqa maydonlari ism, familiya, telefon va ixtiyoriy email. Yetkazib berish yoki do‘kondan olish tanlovi, hudud, standart/ekspress turi va manzil bor. Promo-kod va izoh ixtiyoriy. To‘lov bo‘limi va buyurtmani yuborish tugmasi ko‘rildi. Haqiqiy buyurtma yuborilmadi, shaxsiy ma’lumot kiritilmadi.

Dalillar: [tasdiqlangan savat](verified-cart.png), [tasdiqlangan checkout](verified-checkout.png).

Muhim arxiv izohi: oldingi state-checkout-form.png nomli surat checkout emas, /uz/payment sahifasi ustidagi savat panelidir. Checkout uchun verified-checkout.png va checkout.json asosiy dalil. Avvalgi click timeoutlari avtomatik tekshiruv urinishlaridir; keyingi tekshiruvda savat va checkout muvaffaqiyatli ochildi.

## Axborot va akkaunt sahifalari

About, contact, delivery, returns, FAQ, lookbook, press, information, privacy, terms, offer va payment sahifalari ochildi. Umumiy uslub: katta sarlavha, yordamchi bo‘lim havolalari, o‘ngda matn/bo‘limlar, ingichka chiziqlar, yordamga murojaat bloki va umumiy footer. Aloqada do‘kon manzili, telefon, email va xarita/ijtimoiy havolalar mavjud. Do‘konlar menyusi tashqi xaritaga yo‘naltiradi.

Kirish va ro‘yxatdan o‘tish formalari ochildi. Kabinet va saqlangan mahsulotlar kirish talab qiladi. Yangi akkaunt yaratilmagan. Ochiq saytda admin panel ko‘rinmadi; uning ichki dizayni haqida xulosa chiqarilmaydi. RU va EN bosh sahifalari tekshirildi, lekin barcha ichki sahifalar har uch tilda alohida qayta tekshirilmagan.

## UZER uchun qo‘llash kerak bo‘lgan farqlar

Foydalanuvchi talabi saqlanadi: Next.js, Zen Dots bilan UZER logosi #07064D, qora asosiy tugmalar, UZ standart til, RU/EN, berilgan API mahsulotlari va narxlarni 1000 ga ko‘paytirish. Checkoutda ixtiyoriy Telegram username talabini UZER formasi bajarishi kerak. OZBE narxlari, ombori va mahsulot tavsiflari UZER ma’lumotlari o‘rniga olinmaydi.

Mavjud UZER funksional asosining dizayni to‘liq OZBE bilan bir xil emas. Keyingi moslashtirishda bosh sahifadagi banner/mahsulot qatorlari/kolleksiya bloklari, Manrope matn shrifti, scrollga bog‘liq header, kengroq filtrlar, alohida uch qismli mahsulot sahifasi, ma’lumot sahifalari va katta footer e’tiborga olinishi kerak. Shopify uslubidagi admin, statistikalar va uch Telegram bot foydalanuvchining alohida talabi; OZBE ochiq sahifalaridan ularning ichki tuzilishini ko‘rib bo‘lmaydi.

## Tekshirilgan asosiy URLlar

| № | Manzil | HTTP | Suratlar |
| --- | --- | --- | --- |
${rows}

## Chegaralar

Sitemap va topilgan ochiq havolalar tekshirildi. Bu barcha yashirin URLlar, barcha rang/o‘lcham kombinatsiyalari yoki avtorizatsiyadan keyingi sahifalar tekshirildi degani emas. HTTP 200 barcha rasm va xizmat muvaffaqiyatli yuklandi degani emas. Haqiqiy xarid, to‘lov, akkaunt yaratish va tashqi xabar yuborish bajarilmadi. Hisobot kuzatilgan dizaynni hujjatlashtiradi; yuridik matnlarni qayta nashr qilmaydi.
`;
fs.writeFileSync(`${root}/README.md`,report,'utf8');
console.log(JSON.stringify({report:`${root}/README.md`,pages:audit.pages.length,sitemap:sitemap.length,missing,checkoutError:checkout.error,bytes:Buffer.byteLength(report)},null,2));
