// =========================================
// ЖАСМИН — Гостевой дом
// =========================================

// =========================================
// ЛАЙТБОКС (открытие фото на весь экран)
// =========================================
const Lightbox = (() => {
  let element = null;
  let imgEl = null;
  let counterEl = null;
  let images = [];
  let index = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let isTransitioning = false;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const preload = (src) =>
    new Promise((resolve) => {
      const temp = new Image();
      temp.onload = resolve;
      temp.onerror = resolve;
      temp.src = src;
    });

  function ensureInit() {
    if (element) return;

    element = document.createElement("div");
    element.className = "lightbox";
    element.innerHTML = `
      <button class="lightbox__close" aria-label="Закрыть">✕</button>
      <button class="lightbox__prev" aria-label="Предыдущее фото">‹</button>
      <button class="lightbox__next" aria-label="Следующее фото">›</button>
      <div class="lightbox__counter"></div>
      <div class="lightbox__content">
        <img class="lightbox__img" alt="">
      </div>
    `;
    document.body.appendChild(element);

    imgEl = element.querySelector(".lightbox__img");
    counterEl = element.querySelector(".lightbox__counter");

    element.querySelector(".lightbox__close").addEventListener("click", close);
    element.querySelector(".lightbox__prev").addEventListener("click", (e) => {
      e.stopPropagation();
      prev();
    });
    element.querySelector(".lightbox__next").addEventListener("click", (e) => {
      e.stopPropagation();
      next();
    });

    element.addEventListener("click", (e) => {
      if (
        e.target === element ||
        e.target.classList.contains("lightbox__content")
      ) {
        close();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (!element.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    });

    element.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true },
    );

    element.addEventListener(
      "touchend",
      (e) => {
        if (e.changedTouches.length !== 1) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) next();
          else prev();
        }
      },
      { passive: true },
    );
  }

  // direction: 0 — нейтрально, 1 — вперёд, -1 — назад
  async function show(direction = 0) {
    if (isTransitioning) return;
    isTransitioning = true;

    const outClass =
      direction === 1
        ? "is-fading-next"
        : direction === -1
          ? "is-fading-prev"
          : "is-fading";

    const inClass =
      direction === 1
        ? "is-appearing-from-next"
        : direction === -1
          ? "is-appearing-from-prev"
          : "is-appearing";

    // 1. Уводим старое фото
    imgEl.classList.add(outClass);
    await wait(220);

    // 2. Предзагружаем новое
    const newSrc = images[index];
    await preload(newSrc);

    // 3. Мгновенно переводим в стартовую позицию «нового» (без анимации)
    imgEl.style.transition = "none";
    imgEl.classList.remove(outClass);
    imgEl.classList.add(inClass);
    imgEl.src = newSrc;
    counterEl.textContent = `${index + 1} / ${images.length}`;

    // Форсируем перерисовку, чтобы браузер применил стили без transition
    void imgEl.offsetWidth;

    // 4. Возвращаем transition и убираем in-класс → плавное появление
    imgEl.style.transition = "";
    requestAnimationFrame(() => {
      imgEl.classList.remove(inClass);
    });

    await wait(320);
    isTransitioning = false;
  }

  function open(imageArray, startIndex = 0) {
    ensureInit();
    images = Array.isArray(imageArray)
      ? imageArray.filter(Boolean)
      : [imageArray];
    if (images.length === 0) return;
    index = Math.max(0, Math.min(startIndex, images.length - 1));

    // Первое фото показываем сразу, без задержки, но с плавным проявлением
    imgEl.classList.add("is-appearing");
    imgEl.src = images[index];
    counterEl.textContent = `${index + 1} / ${images.length}`;
    element.classList.toggle("is-single", images.length <= 1);

    // Открываем сам лайтбокс
    element.classList.add("is-open");
    document.body.classList.add("lightbox-open");

    // Проявляем изображение
    requestAnimationFrame(() => {
      imgEl.classList.remove("is-appearing");
    });
  }

  function close() {
    if (!element) return;
    element.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
  }

  function next() {
    if (images.length < 2 || isTransitioning) return;
    index = (index + 1) % images.length;
    show(1);
  }

  function prev() {
    if (images.length < 2 || isTransitioning) return;
    index = (index - 1 + images.length) % images.length;
    show(-1);
  }

  return { open, close, next, prev };
})();

window.Lightbox = Lightbox;

// =========================================
// ИНИЦИАЛИЗАЦИЯ
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Скролл хедера ---
  const header = document.querySelector(".header");
  const isPageWithoutHero =
    document.body.classList.contains("page--room") ||
    document.querySelector(".room-page") !== null;

  if (header) {
    if (isPageWithoutHero) {
      header.classList.add("header--scrolled");
    } else {
      const handleScroll = () => {
        if (window.scrollY > 50) header.classList.add("header--scrolled");
        else header.classList.remove("header--scrolled");
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }
  }

  // --- 2. Мобильное меню ---
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");

  if (burger && nav) {
    const toggleMenu = (state) => {
      const isOpen =
        state !== undefined ? state : !nav.classList.contains("active");
      nav.classList.toggle("active", isOpen);
      burger.classList.toggle("active", isOpen);
    };

    burger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => toggleMenu(false));
    });

    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("active")) return;
      if (!nav.contains(e.target) && !burger.contains(e.target)) {
        toggleMenu(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("active")) {
        toggleMenu(false);
      }
    });
  }

  // --- 3. Observer для плавного появления ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

  window.observeRoomCards = function () {
    document
      .querySelectorAll("#rooms-preview > *, #rooms-grid > *")
      .forEach((card) => observer.observe(card));
  };

  // --- 4. Роутинг ---
  if (document.getElementById("rooms-preview")) loadRoomsPreview();
  if (document.getElementById("rooms-grid")) loadRooms();
  if (document.getElementById("room-container")) loadSingleRoom();
});

// =========================================
// УТИЛИТЫ
// =========================================
function declOfNum(n, titles) {
  const cases = [2, 0, 1, 1, 1, 2];
  return titles[
    n % 100 > 4 && n % 100 < 20 ? 2 : cases[n % 10 < 5 ? n % 10 : 5]
  ];
}

function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatGuests(room) {
  const list = room.guests_filter || [room.guests];
  const maxGuests = Math.max(...list);
  const word = declOfNum(maxGuests, ["гость", "гостя", "гостей"]);
  return `${list.join(", ")} ${word}`;
}

async function fetchRooms() {
  const response = await fetch("presets/rooms.json");
  if (!response.ok) throw new Error("Не удалось загрузить rooms.json");
  const data = await response.json();
  return data.rooms || [];
}

// =========================================
// ПРЕВЬЮ НА ГЛАВНОЙ — 3 случайных номера
// с миксом категорий (comfort + standard)
// =========================================
async function loadRoomsPreview() {
  const grid = document.getElementById("rooms-preview");
  if (!grid) return;

  try {
    const rooms = await fetchRooms();
    const preview = pickPreviewRooms(rooms, 3);
    renderRoomsPreview(preview, grid);
    if (window.observeRoomCards) window.observeRoomCards();
  } catch (error) {
    console.error("Ошибка загрузки превью:", error);
    grid.innerHTML = `
      <div class="col-12 text-center" style="padding: 40px;">
        <p style="color: #6B7A63;">Посмотрите все номера в <a href="apartaments.html" style="color: #536047; text-decoration: underline;">каталоге</a></p>
      </div>
    `;
  }
}

// Выбор N случайных номеров с гарантированным миксом типов
function pickPreviewRooms(rooms, count = 3) {
  if (!rooms || rooms.length === 0) return [];
  if (rooms.length <= count) return shuffle([...rooms]);

  // Группируем по типам
  const byType = {};
  rooms.forEach((room) => {
    const types = room.types || [];
    types.forEach((t) => {
      if (!byType[t]) byType[t] = [];
      if (!byType[t].includes(room)) byType[t].push(room);
    });
  });

  const typeKeys = Object.keys(byType);
  const picked = [];

  // 1. Берём по одному номеру из каждого типа (макс. count)
  const shuffledTypes = shuffle([...typeKeys]);
  for (const type of shuffledTypes) {
    if (picked.length >= count) break;
    const candidates = byType[type].filter((r) => !picked.includes(r));
    if (candidates.length === 0) continue;
    picked.push(candidates[Math.floor(Math.random() * candidates.length)]);
  }

  // 2. Добираем случайными из оставшихся
  const remaining = rooms.filter((r) => !picked.includes(r));
  const shuffledRemaining = shuffle([...remaining]);
  while (picked.length < count && shuffledRemaining.length > 0) {
    picked.push(shuffledRemaining.pop());
  }

  // 3. Перемешиваем финальный список
  return shuffle(picked);
}

// Перемешивание массива (Fisher–Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderRoomsPreview(rooms, grid) {
  if (!rooms || rooms.length === 0) {
    grid.innerHTML =
      '<div class="col-12 text-center"><p>Номера временно недоступны.</p></div>';
    return;
  }

  grid.innerHTML = rooms
    .map(
      (room) => `
    <div class="col-md-6 col-lg-4 mb-4">
      <article class="room-card">
        <div class="room-card__image">
          <img src="${room.image}" alt="${room.title}" loading="lazy">
        </div>
        <div class="room-card__content">
          <h3 class="room-card__title">${room.title}</h3>
          <div class="room-card__specs">
            <span>👥 ${formatGuests(room)}</span>
            <span>📐 ${room.area} м²</span>
          </div>
          <p class="room-card__price">от ${formatPrice(room.price)} <span>Руб / сутки</span></p>
          <a href="room.html?slug=${room.slug}" class="btn btn--outline btn--full room-card__link">Подробнее</a>
        </div>
      </article>
    </div>
  `,
    )
    .join("");
}

// =========================================
// КАТАЛОГ (apartaments.html)
// =========================================
async function loadRooms() {
  const grid = document.getElementById("rooms-grid");
  if (!grid) return;

  try {
    const rooms = await fetchRooms();
    renderRooms(rooms, grid);
    initFilters();
    if (window.observeRoomCards) window.observeRoomCards();
  } catch (error) {
    console.error("Ошибка загрузки номеров:", error);
    grid.innerHTML = `
      <div class="col-12 text-center" style="padding: 40px; background: white; border-radius: 16px;">
        <p style="color: #B9825B; font-size: 16px; margin-bottom: 10px;">Не удалось загрузить номера.</p>
        <p style="color: #6B7A63; font-size: 14px;">Позвоните нам: +7 (978) 885-41-19</p>
      </div>
    `;
  }
}

function renderRooms(rooms, grid) {
  if (!rooms || rooms.length === 0) {
    grid.innerHTML =
      '<div class="col-12 text-center"><p>Номера временно недоступны.</p></div>';
    return;
  }

  grid.innerHTML = rooms
    .map(
      (room) => `
    <div class="col-md-6 col-lg-4 mb-4 room-card-col"
         data-guests="${(room.guests_filter || [room.guests]).join(" ")}"
         data-type="${(room.types || []).join(" ")}">
      <article class="room-card">
        <div class="room-card__image">
          <img src="${room.image}" alt="${room.title}" loading="lazy">
        </div>
        <div class="room-card__content">
          <h3 class="room-card__title">${room.title}</h3>
          <div class="room-card__specs">
            <span>👥 ${formatGuests(room)}</span>
            <span>📐 ${room.area} м²</span>
          </div>
          <p class="room-card__price">от ${formatPrice(room.price)} <span>Руб / сутки</span></p>
          <a href="room.html?slug=${room.slug}" class="btn btn--outline btn--full room-card__link">Подробнее</a>
        </div>
      </article>
    </div>
  `,
    )
    .join("");
}

// =========================================
// ФИЛЬТРЫ
// =========================================
function initFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  if (filterButtons.length === 0) return;

  const activeFilters = { guests: "all", type: "all" };

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filterType = btn.dataset.filter;
      const filterValue = btn.dataset.value;

      const group = btn.closest(".filters__group");
      group
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      activeFilters[filterType] = filterValue;
      applyFilters(activeFilters);
    });
  });
}

function applyFilters(activeFilters) {
  const wrappers = document.querySelectorAll(".room-card-col");
  const grid = document.getElementById("rooms-grid");
  let visibleCount = 0;

  wrappers.forEach((wrapper) => {
    const cardGuests = wrapper.dataset.guests.split(" ").filter(Boolean);
    const cardTypes = wrapper.dataset.type.split(" ").filter(Boolean);

    const guestsMatch =
      activeFilters.guests === "all" ||
      cardGuests.includes(activeFilters.guests);
    const typeMatch =
      activeFilters.type === "all" || cardTypes.includes(activeFilters.type);

    if (guestsMatch && typeMatch) {
      wrapper.style.display = "";
      visibleCount++;
    } else {
      wrapper.style.display = "none";
    }
  });

  const existingMsg = grid.querySelector(".no-results");
  if (existingMsg) existingMsg.remove();

  if (visibleCount === 0) {
    const msg = document.createElement("div");
    msg.className = "no-results col-12";
    msg.style.cssText = "text-align: center; padding: 40px; color: #6B7A63;";
    msg.textContent =
      "По вашим фильтрам ничего не найдено. Попробуйте изменить параметры.";
    grid.appendChild(msg);
  }
}

// =========================================
// СТРАНИЦА НОМЕРА
// =========================================
async function loadSingleRoom() {
  const container = document.getElementById("room-container");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    showRoomError(
      container,
      "Номер не указан",
      "Вернитесь в каталог и выберите номер.",
    );
    return;
  }

  try {
    const rooms = await fetchRooms();
    const room = rooms.find((r) => r.slug === slug);

    if (!room) {
      showRoomError(
        container,
        "Номер не найден",
        "Возможно, он был удалён. Посмотрите другие варианты в каталоге.",
      );
      return;
    }

    renderSingleRoom(room, container);
    updatePageMeta(room);
  } catch (error) {
    console.error("Ошибка загрузки номера:", error);
    showRoomError(
      container,
      "Ошибка загрузки",
      "Позвоните нам: +7 (978) 885-41-19",
    );
  }
}

function showRoomError(container, title, message) {
  container.innerHTML = `
    <div style="text-align: center; padding: 80px 20px;">
      <h1 style="font-size: 32px; margin-bottom: 15px;">${title}</h1>
      <p style="color: var(--color-text-muted); margin-bottom: 30px;">${message}</p>
      <a href="apartaments.html" class="btn btn--primary">← Вернуться к номерам</a>
    </div>
  `;
}

function updatePageMeta(room) {
  document.title = `${room.title} — Гостевой дом Жасмин`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = `${room.title} в гостевом доме Жасмин. ${room.area} м², до ${room.guests} гостей. Цена от ${room.price} Руб/сутки.`;
  }
}

function renderSingleRoom(room, container) {
  const gallery =
    room.gallery && room.gallery.length ? room.gallery : [room.image];
  const mainImage = gallery[0];
  const thumbs = gallery
    .map(
      (img, i) => `
    <img src="${img}" alt="${room.title} — фото ${i + 1}"
         class="thumb ${i === 0 ? "active" : ""}"
         data-index="${i}">
  `,
    )
    .join("");

  const amenities = (room.amenities || []).map((a) => `<li>${a}</li>`).join("");
  const specs = (room.specs || []).map((s) => `<span>✓ ${s}</span>`).join("");

  const whatsappText = encodeURIComponent(
    `Здравствуйте! Хочу узнать про номер "${room.title}" в гостевом доме Жасмин.`,
  );
  const whatsappLink = `https://wa.me/79788854119?text=${whatsappText}`;

  container.innerHTML = `
    <nav class="breadcrumbs">
      <a href="index.html">Главная</a> <span>/</span>
      <a href="apartaments.html">Номера</a> <span>/</span>
      <span>${room.title}</span>
    </nav>

    <div class="row g-5">

      <div class="col-lg-8">
        <h1 class="room-title">${room.title}</h1>

        <div class="room-specs-large">
          <span>👥 ${formatGuests(room)}</span>
          <span>📐 ${room.area} м²</span>
          ${specs}
        </div>

        <div class="room-gallery-container">
          <div class="room-gallery-main">
            <img src="${mainImage}" alt="${room.title}" id="mainRoomImage" data-index="0">
          </div>
          ${gallery.length > 1 ? `<div class="room-gallery-thumbs">${thumbs}</div>` : ""}
        </div>

        <h2 class="subsection-title">Описание</h2>
        <p class="room-description">${room.description || ""}</p>

        ${
          amenities
            ? `
          <h2 class="subsection-title">Удобства в номере</h2>
          <ul class="amenities-list">${amenities}</ul>
        `
            : ""
        }
      </div>

      <div class="col-lg-4">
        <div class="room-sidebar">
          <div class="booking-card">
            <p class="booking-card__label">Стоимость</p>
            <p class="booking-card__price">от ${formatPrice(room.price)} <span>Руб / сутки</span></p>

            <p class="booking-card__hint">
              Позвоните или напишите — расскажем о наличии и ответим на вопросы
            </p>

            <a href="tel:+79788854119" class="btn btn--primary btn--full contact-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Позвонить
            </a>

            <a href="${whatsappLink}" target="_blank" rel="noopener" class="btn btn--whatsapp btn--full contact-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Написать в WhatsApp
            </a>

            <a href="tel:+79788854119" class="booking-card__phone">+7 (978) 885-41-19</a>
            <p class="booking-card__worktime">Ежедневно с 8:00 до 22:00</p>
          </div>
        </div>
      </div>

    </div>
  `;

  bindRoomLightbox(gallery);
}

// =========================================
// ПРИВЯЗКА ЛАЙТБОКСА — только для страницы номера
// =========================================
function bindRoomLightbox(gallery) {
  const mainImg = document.getElementById("mainRoomImage");
  if (!mainImg) return;

  mainImg.dataset.index = "0";

  // Клик по главному фото
  mainImg.addEventListener("click", () => {
    const idx = parseInt(mainImg.dataset.index, 10) || 0;
    Lightbox.open(gallery, idx);
  });

  // Клик по миниатюрам — меняем главное + запоминаем индекс
  const thumbs = document.querySelectorAll(".room-gallery-thumbs .thumb");
  thumbs.forEach((thumb, idx) => {
    thumb.addEventListener("click", () => {
      // Меняем главное фото
      mainImg.src = thumb.src;
      mainImg.dataset.index = String(idx);

      // Активная миниатюра
      thumbs.forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });
}
