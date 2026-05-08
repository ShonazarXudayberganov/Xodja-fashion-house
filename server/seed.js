const bcrypt = require('bcryptjs');
const { db, set, setMany } = require('./db');

const reset = process.argv.includes('--reset');

if (reset) {
  console.log('🗑  Resetting all data...');
  db.exec(`
    DELETE FROM hero_slides;
    DELETE FROM marquee_items;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM testimonials;
    DELETE FROM admin_users;
    DELETE FROM settings;
    DELETE FROM sqlite_sequence WHERE name IN ('hero_slides','marquee_items','products','categories','testimonials','admin_users');
  `);
}

const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admin_users').get().c;
if (adminCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('✅ Admin user created: admin / admin123');
}

const settingsCount = db.prepare('SELECT COUNT(*) AS c FROM settings').get().c;
if (settingsCount === 0) {
  setMany({
    'brand.name': 'Xodija Fashion House',
    'brand.short': 'Xodija',
    'brand.fashion_text': 'Fashion House',
    'brand.logo_mark': 'XH',

    'contacts.phone': '+998887717974',
    'contacts.phone_display': '+998 88 771 79 74',
    'contacts.telegram_username': 'xodija_fashion',
    'contacts.instagram_username': 'xodija_fashion_house',
    'contacts.whatsapp': '998887717974',
    'contacts.bot_token': '',
    'contacts.bot_chat_id': '',

    'meta.title': 'Xodija Fashion House — Elegantlik va Mahorat',
    'meta.description_uz': 'Xodija Fashion House — professional tikuvchi dizayner, 10 yillik tajriba, Xiva, Xorazm. Oqshom liboslar, kundalik kiyimlar, ansabil to\'plamlari.',
    'meta.description_ru': 'Xodija Fashion House — профессиональный дизайнер-портной, 10 лет опыта, Хива, Хорезм.',
    'meta.keywords': 'Xodija Fashion House, tikuvchi, dizayner, Xiva, Xorazm, kelin sarposi, oqshom libos, moda, fashion',
    'meta.og_image': 'images/dress-pink-floral.jpg',
    'meta.theme_color': '#E91E8C',

    'hero.eyebrow_uz': '✨ Premium Fashion House',
    'hero.eyebrow_ru': '✨ Премиум модный дом',
    'hero.title': 'Xodija',
    'hero.title_accent': 'Fashion House',
    'hero.subtitle_uz': 'Tikuvchi dizayner • 10 yillik tajriba • Xiva, Xorazm. Har bir kiyim — sizning betakror nafosatingiz uchun.',
    'hero.subtitle_ru': 'Дизайнер-портной • 10 лет опыта • Хива, Хорезм. Каждый наряд — для вашей неповторимой элегантности.',
    'hero.cta1_text_uz': 'Katalogni ko\'rish',
    'hero.cta1_text_ru': 'Смотреть каталог',
    'hero.cta1_link': '#catalog',
    'hero.cta2_text_uz': 'Buyurtma berish',
    'hero.cta2_text_ru': 'Оформить заказ',
    'hero.cta2_link': '#order',
    'hero.badge1_value': '910+',
    'hero.badge1_label_uz': 'Mijoz',
    'hero.badge1_label_ru': 'Клиентов',
    'hero.badge2_value': '10',
    'hero.badge2_label_uz': 'Yillik tajriba',
    'hero.badge2_label_ru': 'Лет опыта',
    'hero.card_label_uz': 'Couture by Xodija',
    'hero.card_label_ru': 'Couture by Xodija',

    'about.eyebrow_uz': 'Biz haqimizda',
    'about.eyebrow_ru': 'О нас',
    'about.title_uz': 'Mahorat va sevgi bilan tikilgan har bir tafsilot',
    'about.title_ru': 'Каждая деталь сшита с мастерством и любовью',
    'about.text_uz': 'Men Xodija — professional tikuvchi dizaynerman. 10 yildan ortiq tajribam bilan har bir kiyimni sevgi va mahorat bilan tikaman. Har bir buyurtmachi uchun individual yondashuv — mening asosiy tamoyilim.',
    'about.text_ru': 'Я Ходжа — профессиональный дизайнер-портной с более чем 10-летним опытом. Каждый наряд создаю с любовью и мастерством. Индивидуальный подход — мой главный принцип.',
    'about.image_path': 'images/dress-pink-feather.jpg',
    'about.badge_text_uz': 'Sertifikatlangan dizayner',
    'about.badge_text_ru': 'Сертифицированный дизайнер',
    'about.badge_location_uz': 'Xiva, Xorazm',
    'about.badge_location_ru': 'Хива, Хорезм',
    'about.stat1_value': '59+',
    'about.stat1_label_uz': 'Tugatilgan ish',
    'about.stat1_label_ru': 'Готовых работ',
    'about.stat2_value': '910+',
    'about.stat2_label_uz': 'Baxtli mijoz',
    'about.stat2_label_ru': 'Счастливых клиентов',
    'about.stat3_value': '10',
    'about.stat3_label_uz': 'Yillik tajriba',
    'about.stat3_label_ru': 'Лет опыта',

    'catalog.eyebrow_uz': 'Bizning kolleksiya',
    'catalog.eyebrow_ru': 'Наша коллекция',
    'catalog.title_uz': 'Katalog',
    'catalog.title_ru': 'Каталог',
    'catalog.subtitle_uz': 'Har bir mavsum uchun mukammal yechimlar — oqshom liboslaridan kelin sarpolarigacha',
    'catalog.subtitle_ru': 'Совершенные решения для каждого сезона — от вечерних платьев до свадебных нарядов',

    'testimonials.eyebrow_uz': 'Mijozlar fikrlari',
    'testimonials.eyebrow_ru': 'Мнения клиентов',
    'testimonials.title_uz': 'Mijozlar sharhlari',
    'testimonials.title_ru': 'Отзывы клиентов',
    'testimonials.subtitle_uz': '910+ baxtli mijozning chin yurakdan aytgan so\'zlari',
    'testimonials.subtitle_ru': 'Искренние слова от 910+ счастливых клиентов',

    'order.eyebrow_uz': 'Buyurtma',
    'order.eyebrow_ru': 'Заказ',
    'order.title_uz': 'Buyurtma bering',
    'order.title_ru': 'Оформите заказ',
    'order.subtitle_uz': 'Formani to\'ldiring va biz siz bilan tezda bog\'lanamiz',
    'order.subtitle_ru': 'Заполните форму и мы свяжемся с вами в ближайшее время',

    'footer.tagline_uz': '10 yillik tajriba bilan yaratilgan elegantlik. Har bir kiyim — mahorat va sevgi belgisi.',
    'footer.tagline_ru': 'Элегантность, созданная с 10-летним опытом. Каждый наряд — знак мастерства и любви.',
    'footer.copyright_text_uz': 'Barcha huquqlar himoyalangan.',
    'footer.copyright_text_ru': 'Все права защищены.',
  });
  console.log('✅ Settings seeded');
}

const heroSlidesCount = db.prepare('SELECT COUNT(*) AS c FROM hero_slides').get().c;
if (heroSlidesCount === 0) {
  const insert = db.prepare('INSERT INTO hero_slides (image_path, alt_uz, alt_ru, sort_order) VALUES (?, ?, ?, ?)');
  const slides = [
    ['images/dress-pink-floral.jpg', 'Pushti gulli oqshom libosi', 'Розовое цветочное вечернее платье', 1],
    ['images/dress-pink-feather.jpg', 'Pati va diodema bilan oqshom libosi', 'Вечернее платье с перьями и диадемой', 2],
    ['images/dress-cream-green.jpg', 'Sut rangli kashtali libos', 'Кремовое платье с вышивкой', 3],
    ['images/dress-magenta-velvet.jpg', 'Magenta velvet libos', 'Бархатное платье цвета фуксии', 4],
  ];
  slides.forEach(s => insert.run(...s));
  console.log('✅ Hero slides seeded:', slides.length);
}

const marqueeCount = db.prepare('SELECT COUNT(*) AS c FROM marquee_items').get().c;
if (marqueeCount === 0) {
  const insert = db.prepare('INSERT INTO marquee_items (text_uz, text_ru, sort_order) VALUES (?, ?, ?)');
  const items = [
    ['Premium Quality', 'Premium Quality', 1],
    ['10 Yillik Tajriba', '10 лет опыта', 2],
    ['Individual Yondashuv', 'Индивидуальный подход', 3],
    ['Xiva, Xorazm', 'Хива, Хорезм', 4],
    ['910+ Baxtli Mijoz', '910+ Счастливых клиентов', 5],
    ['Couture Design', 'Couture Design', 6],
  ];
  items.forEach(i => insert.run(...i));
  console.log('✅ Marquee items seeded:', items.length);
}

const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
if (catCount === 0) {
  const insert = db.prepare('INSERT INTO categories (slug, name_uz, name_ru, short_uz, short_ru, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
  const cats = [
    ['evening', 'Oqshom liboslar', 'Вечерние', 'Oqshom', 'Вечернее', 1],
    ['ensemble', 'Ansabil', 'Ансамбли', 'Ansabil', 'Ансамбль', 2],
    ['daily', 'Kundalik liboslar', 'Повседневные', 'Kundalik', 'Повседневное', 3],
  ];
  cats.forEach(c => insert.run(...c));
  console.log('✅ Categories seeded:', cats.length);
}

const productsCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (productsCount === 0) {
  const catBySlug = {};
  for (const c of db.prepare('SELECT id, slug FROM categories').all()) catBySlug[c.slug] = c.id;

  const insert = db.prepare(`
    INSERT INTO products (category_id, name_uz, name_ru, alt_uz, alt_ru, image_path, price, price_ask, badge_type, badge_text, visible, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);
  const products = [
    [catBySlug.evening, 'Oqshom libos «Lola»', 'Вечернее платье «Лола»', 'Oqshom libosi Lola — pushti gulli', 'Вечернее платье Лола — розовое цветочное', 'images/dress-pink-floral.jpg', '1 250 000', 0, 'top', '⭐ Top', 1],
    [catBySlug.evening, 'Oqshom libos «Malika»', 'Вечернее платье «Малика»', 'Oqshom libosi Malika — pati bilan', 'Вечернее платье Малика — с перьями', 'images/dress-pink-feather.jpg', '1 480 000', 0, 'top', '⭐ Top', 2],
    [catBySlug.evening, 'Libos «Saliha»', 'Платье «Салиха»', 'Saliha kollekciya — sut rangli libos', 'Коллекция Салиха — кремовое платье', 'images/dress-cream-green.jpg', null, 1, 'new', 'Yangi', 3],
    [catBySlug.evening, 'Velvet libos «Zulfiya»', 'Бархатное платье «Зульфия»', 'Velvet libos Zulfiya — magenta', 'Бархатное платье Зульфия — фуксия', 'images/dress-magenta-velvet.jpg', '1 350 000', 0, null, null, 4],
    [catBySlug.ensemble, 'Adras ansabil', 'Адрас ансамбль', 'Adras yo\'l-yo\'l ansabil to\'plami', 'Полосатый адрас ансамбль', 'images/set-stripes-adras.jpg', '980 000', 0, 'top', '⭐ Top', 5],
    [catBySlug.ensemble, 'Sariq gulli ansabil', 'Желтый цветочный ансамбль', 'Yozgi sariq gulli ansabil', 'Летний желтый цветочный ансамбль', 'images/set-yellow-floral.jpg', '720 000', 0, 'new', 'Yangi', 6],
    [catBySlug.ensemble, 'Yashil naqshli ansabil', 'Зеленый узорчатый ансамбль', 'Yashil naqshli ansabil to\'plami', 'Зеленый узорчатый комплект', 'images/set-green-pattern.jpg', '850 000', 0, null, null, 7],
    [catBySlug.daily, 'Marjon ko\'ylak-lozim', 'Коралловый комплект', 'Marjon rangli ko\'ylak-lozim to\'plami', 'Коралловый комплект ко\'йлак-лозим', 'images/set-coral-geometric.jpg', '480 000', 0, 'sale', '-20%', 8],
    [catBySlug.daily, 'Yashil kundalik ko\'ylak', 'Зеленое повседневное платье', 'Yashil geometrik kundalik ko\'ylak', 'Зеленое геометричное повседневное', 'images/dress-teal-geometric.jpg', '380 000', 0, null, null, 9],
    [catBySlug.daily, 'Ikat naqshli libos', 'Платье с узором икат', 'Ikat naqshli bej rangli libos', 'Бежевое платье с узором икат', 'images/dress-ikat-beige.jpg', '520 000', 0, 'new', 'Yangi', 10],
  ];
  products.forEach(p => insert.run(...p));
  console.log('✅ Products seeded:', products.length);
}

const testimonialsCount = db.prepare('SELECT COUNT(*) AS c FROM testimonials').get().c;
if (testimonialsCount === 0) {
  const insert = db.prepare(`
    INSERT INTO testimonials (text_uz, text_ru, author_name, author_initials, city_uz, city_ru, stars, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const list = [
    ['«Kiyim judayam chiroyli chiqdi, Xodija opa professional!»', '«Платье получилось очень красивым, Ходжа апа профессионал!»', 'Malika S.', 'MS', 'Xiva', 'Хива', 5, 1],
    ['«Kelin sarposim juda go\'zal edi, hammaga maslahat beraman.»', '«Свадебный наряд был великолепен, всем рекомендую.»', 'Nilufar R.', 'NR', 'Samarqand', 'Самарканд', 5, 2],
    ['«Tez va sifatli, narxi ham mos. Tavsiya etaman!»', '«Быстро и качественно, цена тоже подходит. Рекомендую!»', 'Shahnoza T.', 'ST', 'Xiva', 'Хива', 5, 3],
    ['«10 yillik usta ekanini his qilasan. Mahoratga tan beraman.»', '«Чувствуется опыт мастера с 10-летним стажем.»', 'Gulnora M.', 'GM', 'Buxoro', 'Бухара', 5, 4],
    ['«Ikkinchi marta buyurtma berdim, yana xursandman!»', '«Заказываю второй раз, снова довольна!»', 'Fotima K.', 'FK', 'Andijon', 'Андижан', 5, 5],
  ];
  list.forEach(t => insert.run(...t));
  console.log('✅ Testimonials seeded:', list.length);
}

console.log('🎉 Seed complete');
process.exit(0);
