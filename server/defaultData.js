const bcrypt = require('bcryptjs');

function makeDefaultData() {
  const categories = [
    { id: 1, slug: 'evening', name_uz: 'Oqshom liboslar', name_ru: 'Вечерние', short_uz: 'Oqshom', short_ru: 'Вечернее', sort_order: 1 },
    { id: 2, slug: 'ensemble', name_uz: 'Ansabil', name_ru: 'Ансамбли', short_uz: 'Ansabil', short_ru: 'Ансамбль', sort_order: 2 },
    { id: 3, slug: 'daily', name_uz: 'Kundalik liboslar', name_ru: 'Повседневные', short_uz: 'Kundalik', short_ru: 'Повседневное', sort_order: 3 },
  ];

  const settings = {
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

    'contact.eyebrow_uz': 'Bog\'lanish',
    'contact.eyebrow_ru': 'Контакты',
    'contact.title_uz': 'Bizni toping',
    'contact.title_ru': 'Найдите нас',
    'contact.subtitle_uz': 'Xiva markazidagi ustaxonamizga tashrif buyuring yoki bog\'laning',
    'contact.subtitle_ru': 'Посетите нашу мастерскую в центре Хивы или свяжитесь с нами',
    'contact.address_uz': 'Xiva shahar, Xorazm viloyati',
    'contact.address_ru': 'г. Хива, Хорезмская область',
    'contact.address_detail_uz': '',
    'contact.address_detail_ru': '',
    'contact.hours_label_uz': 'Ish vaqti',
    'contact.hours_label_ru': 'Часы работы',
    'contact.hours_uz': 'Dushanba – Shanba: 09:00 – 19:00',
    'contact.hours_ru': 'Пн – Сб: 09:00 – 19:00',
    'contact.hours_extra_uz': 'Yakshanba: dam olish',
    'contact.hours_extra_ru': 'Воскресенье: выходной',
    'contact.map_lat': '41.376407',
    'contact.map_lng': '60.385525',
    'contact.map_zoom': '17',
    'contact.map_embed_url': '',
    'contact.directions_url': 'https://yandex.uz/maps/-/CPXcIVjj',

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
  };

  const hero_slides = [
    { id: 1, image_path: 'images/dress-pink-floral.jpg', alt_uz: 'Pushti gulli oqshom libosi', alt_ru: 'Розовое цветочное вечернее платье', sort_order: 1 },
    { id: 2, image_path: 'images/dress-pink-feather.jpg', alt_uz: 'Pati va diodema bilan oqshom libosi', alt_ru: 'Вечернее платье с перьями и диадемой', sort_order: 2 },
    { id: 3, image_path: 'images/dress-cream-green.jpg', alt_uz: 'Sut rangli kashtali libos', alt_ru: 'Кремовое платье с вышивкой', sort_order: 3 },
    { id: 4, image_path: 'images/dress-magenta-velvet.jpg', alt_uz: 'Magenta velvet libos', alt_ru: 'Бархатное платье цвета фуксии', sort_order: 4 },
  ];

  const marquee_items = [
    { id: 1, text_uz: 'Premium Quality', text_ru: 'Premium Quality', sort_order: 1 },
    { id: 2, text_uz: '10 Yillik Tajriba', text_ru: '10 лет опыта', sort_order: 2 },
    { id: 3, text_uz: 'Individual Yondashuv', text_ru: 'Индивидуальный подход', sort_order: 3 },
    { id: 4, text_uz: 'Xiva, Xorazm', text_ru: 'Хива, Хорезм', sort_order: 4 },
    { id: 5, text_uz: '910+ Baxtli Mijoz', text_ru: '910+ Счастливых клиентов', sort_order: 5 },
    { id: 6, text_uz: 'Couture Design', text_ru: 'Couture Design', sort_order: 6 },
  ];

  const products = [
    { id: 1, category_id: 1, name_uz: 'Oqshom libos «Lola»', name_ru: 'Вечернее платье «Лола»', alt_uz: 'Oqshom libosi Lola — pushti gulli', alt_ru: 'Вечернее платье Лола — розовое цветочное', image_path: 'images/dress-pink-floral.jpg', price: '1 250 000', price_ask: 0, badge_type: 'top', badge_text: '⭐ Top', visible: 1, sort_order: 1 },
    { id: 2, category_id: 1, name_uz: 'Oqshom libos «Malika»', name_ru: 'Вечернее платье «Малика»', alt_uz: 'Oqshom libosi Malika — pati bilan', alt_ru: 'Вечернее платье Малика — с перьями', image_path: 'images/dress-pink-feather.jpg', price: '1 480 000', price_ask: 0, badge_type: 'top', badge_text: '⭐ Top', visible: 1, sort_order: 2 },
    { id: 3, category_id: 1, name_uz: 'Libos «Saliha»', name_ru: 'Платье «Салиха»', alt_uz: 'Saliha kollekciya — sut rangli libos', alt_ru: 'Коллекция Салиха — кремовое платье', image_path: 'images/dress-cream-green.jpg', price: null, price_ask: 1, badge_type: 'new', badge_text: 'Yangi', visible: 1, sort_order: 3 },
    { id: 4, category_id: 1, name_uz: 'Velvet libos «Zulfiya»', name_ru: 'Бархатное платье «Зульфия»', alt_uz: 'Velvet libos Zulfiya — magenta', alt_ru: 'Бархатное платье Зульфия — фуксия', image_path: 'images/dress-magenta-velvet.jpg', price: '1 350 000', price_ask: 0, badge_type: null, badge_text: null, visible: 1, sort_order: 4 },
    { id: 5, category_id: 2, name_uz: 'Adras ansabil', name_ru: 'Адрас ансамбль', alt_uz: 'Adras yo\'l-yo\'l ansabil to\'plami', alt_ru: 'Полосатый адрас ансамбль', image_path: 'images/set-stripes-adras.jpg', price: '980 000', price_ask: 0, badge_type: 'top', badge_text: '⭐ Top', visible: 1, sort_order: 5 },
    { id: 6, category_id: 2, name_uz: 'Sariq gulli ansabil', name_ru: 'Желтый цветочный ансамбль', alt_uz: 'Yozgi sariq gulli ansabil', alt_ru: 'Летний желтый цветочный ансамбль', image_path: 'images/set-yellow-floral.jpg', price: '720 000', price_ask: 0, badge_type: 'new', badge_text: 'Yangi', visible: 1, sort_order: 6 },
    { id: 7, category_id: 2, name_uz: 'Yashil naqshli ansabil', name_ru: 'Зеленый узорчатый ансамбль', alt_uz: 'Yashil naqshli ansabil to\'plami', alt_ru: 'Зеленый узорчатый комплект', image_path: 'images/set-green-pattern.jpg', price: '850 000', price_ask: 0, badge_type: null, badge_text: null, visible: 1, sort_order: 7 },
    { id: 8, category_id: 3, name_uz: 'Marjon ko\'ylak-lozim', name_ru: 'Коралловый комплект', alt_uz: 'Marjon rangli ko\'ylak-lozim to\'plami', alt_ru: 'Коралловый комплект ko\'ylak-lozim', image_path: 'images/set-coral-geometric.jpg', price: '480 000', price_ask: 0, badge_type: 'sale', badge_text: '-20%', visible: 1, sort_order: 8 },
    { id: 9, category_id: 3, name_uz: 'Yashil kundalik ko\'ylak', name_ru: 'Зеленое повседневное платье', alt_uz: 'Yashil geometrik kundalik ko\'ylak', alt_ru: 'Зеленое геометричное повседневное', image_path: 'images/dress-teal-geometric.jpg', price: '380 000', price_ask: 0, badge_type: null, badge_text: null, visible: 1, sort_order: 9 },
    { id: 10, category_id: 3, name_uz: 'Ikat naqshli libos', name_ru: 'Платье с узором икат', alt_uz: 'Ikat naqshli bej rangli libos', alt_ru: 'Бежевое платье с узором икат', image_path: 'images/dress-ikat-beige.jpg', price: '520 000', price_ask: 0, badge_type: 'new', badge_text: 'Yangi', visible: 1, sort_order: 10 },
  ];

  const testimonials = [
    { id: 1, text_uz: '«Kiyim judayam chiroyli chiqdi, Xodija opa professional!»', text_ru: '«Платье получилось очень красивым, Ходжа апа профессионал!»', author_name: 'Malika S.', author_initials: 'MS', city_uz: 'Xiva', city_ru: 'Хива', stars: 5, sort_order: 1 },
    { id: 2, text_uz: '«Kelin sarposim juda go\'zal edi, hammaga maslahat beraman.»', text_ru: '«Свадебный наряд был великолепен, всем рекомендую.»', author_name: 'Nilufar R.', author_initials: 'NR', city_uz: 'Samarqand', city_ru: 'Самарканд', stars: 5, sort_order: 2 },
    { id: 3, text_uz: '«Tez va sifatli, narxi ham mos. Tavsiya etaman!»', text_ru: '«Быстро и качественно, цена тоже подходит. Рекомендую!»', author_name: 'Shahnoza T.', author_initials: 'ST', city_uz: 'Xiva', city_ru: 'Хива', stars: 5, sort_order: 3 },
    { id: 4, text_uz: '«10 yillik usta ekanini his qilasan. Mahoratga tan beraman.»', text_ru: '«Чувствуется опыт мастера с 10-летним стажем.»', author_name: 'Gulnora M.', author_initials: 'GM', city_uz: 'Buxoro', city_ru: 'Бухоро', stars: 5, sort_order: 4 },
    { id: 5, text_uz: '«Ikkinchi marta buyurtma berdim, yana xursandman!»', text_ru: '«Заказываю второй раз, снова довольна!»', author_name: 'Fotima K.', author_initials: 'FK', city_uz: 'Andijon', city_ru: 'Андижан', stars: 5, sort_order: 5 },
  ];

  const admin_users = [
    {
      id: 1,
      username: 'admin',
      password_hash: bcrypt.hashSync('admin123', 10),
      created_at: new Date().toISOString(),
    },
  ];

  return normalizeData({
    settings,
    hero_slides,
    marquee_items,
    categories,
    products,
    testimonials,
    orders: [],
    admin_users,
  });
}

function normalizeData(data) {
  const out = data && typeof data === 'object' ? data : {};
  out.settings = out.settings && typeof out.settings === 'object' && !Array.isArray(out.settings) ? out.settings : {};
  for (const table of ['hero_slides', 'marquee_items', 'categories', 'products', 'testimonials', 'orders', 'admin_users']) {
    out[table] = Array.isArray(out[table]) ? out[table] : [];
  }
  out.sequences = out.sequences && typeof out.sequences === 'object' ? out.sequences : {};
  for (const table of Object.keys(out).filter(k => Array.isArray(out[k]))) {
    const maxId = out[table].reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
    out.sequences[table] = Math.max(Number(out.sequences[table]) || 0, maxId);
  }
  return out;
}

module.exports = { makeDefaultData, normalizeData };
