// ==========================================
// BNH Food Court — Core JavaScript Application
// ==========================================

const WHATSAPP_NUMBER = "919074838362";
const CART_STORAGE_KEY = "bnh_foodcourt_cart";

// State
let cart = [];
let currentCategory = "all";
let currentDiet = "all";
let currentSearch = "";
let currentOrderType = "Delivery"; // "Delivery" or "Takeaway"

// ===== CART PERSISTENCE =====
function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      cart = JSON.parse(saved);
      if (!Array.isArray(cart)) cart = [];
    }
  } catch (e) {
    cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Failed to save cart to localStorage", e);
  }
}

// ===== NAV SCROLL WITH DEBOUNCED RENDER =====
let scrollTicking = false;
window.addEventListener("scroll", () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      const nav = document.querySelector(".nav");
      if (nav && !nav.classList.contains("force-scrolled")) {
        nav.classList.toggle("scrolled", window.scrollY > 40);
      }
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

// ===== MOBILE MENU =====
function openMenu() {
  const menu = document.getElementById("mobileMenu");
  const hamburger = document.querySelector(".hamburger");
  if (menu) {
    menu.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  if (hamburger) hamburger.classList.add("hidden");
}

function closeMenu() {
  const menu = document.getElementById("mobileMenu");
  const hamburger = document.querySelector(".hamburger");
  if (menu) {
    menu.classList.remove("open");
    document.body.style.overflow = "";
  }
  if (hamburger) hamburger.classList.remove("hidden");
}

// Close mobile menu on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// ===== SCROLL REVEAL (SMOOTH INTERSECTION OBSERVER) =====
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
);

// ===== FAQ ACCORDION =====
function toggleFaq(el) {
  const item = el.parentElement;
  document.querySelectorAll(".faq-item").forEach((i) => {
    if (i !== item) i.classList.remove("open");
  });
  item.classList.toggle("open");
}

// ===== LIVE RESTAURANT STATUS (11 AM - 11 PM IST) =====
function updateLiveStatus() {
  const statusEls = document.querySelectorAll(".live-status");
  if (statusEls.length === 0) return;

  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 3600000 * 5.5);
  const hour = ist.getHours();
  const isOpen = hour >= 11 && hour < 23;

  statusEls.forEach((el) => {
    if (isOpen) {
      el.innerHTML = `<span class="status-dot open"></span><span class="status-text">Open Now <span class="status-time">(11 AM – 11 PM)</span></span>`;
      el.classList.remove("is-closed");
      el.classList.add("is-open");
    } else {
      el.innerHTML = `<span class="status-dot closed"></span><span class="status-text">Closed Now <span class="status-time">(Opens 11 AM)</span></span>`;
      el.classList.remove("is-open");
      el.classList.add("is-closed");
    }
  });
}

// ===== UNIFIED MENU FILTERING ENGINE WITH SMOOTH TRANSITIONS =====
function applyFilters() {
  const cards = document.querySelectorAll(".menu-card, .order-card");
  if (cards.length === 0) return;

  let visibleCount = 0;
  const q = currentSearch.toLowerCase().trim();

  cards.forEach((card) => {
    const cardCat = (card.dataset.cat || "").toLowerCase();
    const cardDiet = (card.dataset.diet || "").toLowerCase();
    const cardText = (card.textContent || "").toLowerCase();

    const matchesCat = currentCategory === "all" || cardCat === currentCategory;
    const matchesDiet = currentDiet === "all" || cardDiet === currentDiet;
    const matchesSearch = !q || cardText.includes(q);

    if (matchesCat && matchesDiet && matchesSearch) {
      card.style.display = "";
      // Re-trigger smooth entrance animation
      card.style.animation = "none";
      card.offsetHeight; // trigger reflow
      card.style.animation = "";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  // Empty Search/Filter State
  let emptyMsg = document.getElementById("noItemsFound");
  const container = document.getElementById("menuGrid");
  if (!emptyMsg && container) {
    emptyMsg = document.createElement("div");
    emptyMsg.id = "noItemsFound";
    emptyMsg.className = "no-items-state";
    container.parentNode.insertBefore(emptyMsg, container.nextSibling);
  }

  if (emptyMsg) {
    if (visibleCount === 0) {
      emptyMsg.innerHTML = `
        <div class="empty-icon">🍽️</div>
        <h4>No dishes found</h4>
        <p>Try searching for something else or reset your filters.</p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset Filters</button>
      `;
      emptyMsg.style.display = "block";
    } else {
      emptyMsg.style.display = "none";
    }
  }
}

function filterMenu(cat, btn) {
  currentCategory = cat;
  document
    .querySelectorAll(".filter-tab")
    .forEach((t) => t.classList.remove("active"));
  if (btn) {
    btn.classList.add("active");
  } else {
    const matchingBtn = document.querySelector(
      `.filter-tab[data-filter="${cat}"], .filter-tab[onclick*="'${cat}'"]`
    );
    if (matchingBtn) matchingBtn.classList.add("active");
  }
  applyFilters();
}

function filterDiet(diet, btn) {
  currentDiet = diet;
  document
    .querySelectorAll(".diet-tab")
    .forEach((t) => t.classList.remove("active"));
  if (btn) btn.classList.add("active");
  applyFilters();
}

function filterSearch(query) {
  currentSearch = query;
  applyFilters();
}

function resetFilters() {
  currentCategory = "all";
  currentDiet = "all";
  currentSearch = "";

  const searchInput = document.getElementById("dishSearch");
  if (searchInput) searchInput.value = "";

  document
    .querySelectorAll(".filter-tab")
    .forEach((t, i) => t.classList.toggle("active", i === 0));
  document
    .querySelectorAll(".diet-tab")
    .forEach((t, i) => t.classList.toggle("active", i === 0));

  applyFilters();
}

// ===== URL HASH CATEGORY ROUTING =====
function handleUrlHash() {
  const hash = window.location.hash.replace("#", "").toLowerCase().trim();
  if (!hash) return;

  const validTabs = [
    "biryani",
    "combo",
    "chinese",
    "grill",
    "manthi",
    "shawarma",
    "tiffin",
    "meals",
    "veg",
  ];

  if (validTabs.includes(hash)) {
    const targetBtn = Array.from(document.querySelectorAll(".filter-tab")).find(
      (btn) => {
        const onclickAttr = btn.getAttribute("onclick") || "";
        return onclickAttr.includes(`'${hash}'`);
      }
    );
    if (targetBtn) {
      filterMenu(hash, targetBtn);
      const grid = document.getElementById("menuGrid");
      if (grid) {
        const offset = grid.getBoundingClientRect().top + window.scrollY - 130;
        window.scrollTo({ top: offset, behavior: "smooth" });
      }
    }
  }
}

// ===== CART MANAGEMENT WITH TACTILE FEEDBACK =====
function triggerCartBounce() {
  const floatCart = document.getElementById("floatingCart");
  if (floatCart) {
    floatCart.classList.remove("bounce");
    void floatCart.offsetWidth;
    floatCart.classList.add("bounce");
  }
}

function addToCart(name, price, id) {
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name, price: Number(price), qty: 1 });
  }
  saveCart();
  updateCart();
  updateQtyDisplayWithPop(id);
  triggerCartBounce();
  showToast(`✓ ${name} added to cart!`);
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCart();
  updateAllQtyDisplays();
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item && delta > 0) return;
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((i) => i.id !== id);
    }
  }
  saveCart();
  updateCart();
  updateQtyDisplayWithPop(id);
  triggerCartBounce();
}

function updateQtyDisplayWithPop(id) {
  const els = document.querySelectorAll(`[data-qty-id="${id}"]`);
  const item = cart.find((i) => i.id === id);
  const qty = item ? item.qty : 0;
  els.forEach((el) => {
    el.textContent = qty;
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  });
}

function updateAllQtyDisplays() {
  const allQtyEls = document.querySelectorAll("[data-qty-id]");
  allQtyEls.forEach((el) => {
    const id = el.dataset.qtyId;
    const item = cart.find((i) => i.id === id);
    el.textContent = item ? item.qty : 0;
  });
}

function updateCart() {
  const panel = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");
  const emptyEl = document.getElementById("cartEmpty");
  const summaryEl = document.getElementById("cartSummary");
  const floatCart = document.getElementById("floatingCart");
  const floatCount = document.getElementById("floatCartCount");

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (floatCart) {
    if (totalCount > 0) {
      floatCart.classList.add("visible");
    } else {
      floatCart.classList.remove("visible");
    }
  }
  if (floatCount) floatCount.textContent = totalCount;
  if (countEl) countEl.textContent = totalCount;

  if (!panel) return;

  panel.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    if (emptyEl) emptyEl.style.display = "block";
    if (summaryEl) summaryEl.style.display = "none";
    if (totalEl) totalEl.textContent = "₹0";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (summaryEl) summaryEl.style.display = "block";

  cart.forEach((item) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    panel.innerHTML += `
      <div class="cart-item">
        <div>
          <div class="name">${item.name}</div>
          <div class="qty">₹${item.price} × ${item.qty}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="item-total">₹${itemTotal}</span>
          <button class="cart-remove-btn" onclick="removeFromCart('${item.id}')" title="Remove item" aria-label="Remove ${item.name}">✕</button>
        </div>
      </div>
    `;
  });

  if (totalEl) totalEl.textContent = "₹" + total;
}

// ===== ORDER TYPE (DELIVERY vs TAKEAWAY) =====
function setOrderType(type, btn) {
  currentOrderType = type;
  document
    .querySelectorAll(".order-type-btn")
    .forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const addrGroup = document.getElementById("addrGroup");
  const payDisplay = document.getElementById("payDisplay");

  if (type === "Takeaway") {
    if (addrGroup) addrGroup.style.display = "none";
    if (payDisplay) payDisplay.innerHTML = "💵 Pay at Food Court Counter";
  } else {
    if (addrGroup) addrGroup.style.display = "block";
    if (payDisplay) payDisplay.innerHTML = "💵 Cash on Delivery";
  }
}

// ===== WHATSAPP CHECKOUT =====
function whatsappCheckout() {
  if (cart.length === 0) {
    showToast("⚠️ Your cart is empty! Add items first.");
    return;
  }

  const nameInput = document.getElementById("custName");
  const phoneInput = document.getElementById("custPhone");
  const addrInput = document.getElementById("custAddr");

  const name = (nameInput?.value || "").trim();
  const phone = (phoneInput?.value || "").trim();
  const addr = (addrInput?.value || "").trim();

  if (!name) {
    showToast("⚠️ Please enter your name!");
    nameInput?.focus();
    return;
  }

  const cleanPhone = phone.replace(/[\s\-\+]/g, "");
  const phoneValid = /^(91)?[6789]\d{9}$/.test(cleanPhone);
  if (!phone || !phoneValid) {
    showToast("⚠️ Please enter a valid 10-digit phone number!");
    phoneInput?.focus();
    return;
  }

  if (currentOrderType === "Delivery" && !addr) {
    showToast("⚠️ Please enter your delivery address!");
    addrInput?.focus();
    return;
  }

  let msg = `🍽️ *BNH FOOD COURT — NEW ORDER*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*Order Type:* ${currentOrderType === "Takeaway" ? "🥡 Takeaway / Pickup" : "🚚 Home Delivery"}\n`;
  msg += `*Payment:* ${currentOrderType === "Takeaway" ? "Pay at Counter" : "Cash on Delivery"}\n\n`;
  msg += `*Order Items:*\n`;

  let total = 0;
  cart.forEach((i, idx) => {
    const t = i.price * i.qty;
    total += t;
    msg += `${idx + 1}. ${i.name}\n   └ Qty: ${i.qty} × ₹${i.price} = *₹${t}*\n`;
  });

  msg += `\n*TOTAL AMOUNT: ₹${total}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*Customer Details:*\n`;
  msg += `• Name: ${name}\n`;
  msg += `• Phone: ${phone}\n`;
  if (currentOrderType === "Delivery" && addr) {
    msg += `• Delivery Address: ${addr}\n`;
  }
  msg += `\n📍 *BNH Food Court*, Near JCT College, Pichanur, Coimbatore`;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");
}

// ===== CONTACT FORM SUBMIT =====
function submitContact(e) {
  e.preventDefault();
  const name = (document.getElementById("cName")?.value || "").trim();
  const phone = (document.getElementById("cPhone")?.value || "").trim();
  const message = (document.getElementById("cMsg")?.value || "").trim();

  if (!name || !phone || !message) {
    showToast("⚠️ Please fill in all fields!");
    return;
  }

  const cleanPhone = phone.replace(/[\s\-\+]/g, "");
  const phoneValid = /^(91)?[6789]\d{9}$/.test(cleanPhone);
  if (!phoneValid) {
    showToast("⚠️ Please enter a valid 10-digit phone number!");
    return;
  }

  let msg = `📬 *BNH FOOD COURT — ENQUIRY*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `• *Name:* ${name}\n`;
  msg += `• *Phone:* ${phone}\n\n`;
  msg += `*Message:*\n${message}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━`;

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, "_blank");
  e.target.reset();
  showToast("✓ Message sent via WhatsApp!");
}

// ===== TOAST NOTIFICATION =====
let activeToast = null;
function showToast(msg) {
  if (activeToast) activeToast.remove();

  const t = document.createElement("div");
  t.className = "bnh-toast";
  t.textContent = msg;

  document.body.appendChild(t);
  activeToast = t;

  requestAnimationFrame(() => {
    t.classList.add("show");
  });

  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => {
      if (t === activeToast) activeToast = null;
      t.remove();
    }, 400);
  }, 2400);
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  updateCart();
  updateAllQtyDisplays();

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  updateLiveStatus();
  setInterval(updateLiveStatus, 60000);

  handleUrlHash();
  window.addEventListener("hashchange", handleUrlHash);

  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenu) {
    mobileMenu.addEventListener("click", (e) => {
      if (e.target === mobileMenu || e.target.tagName === "A") {
        closeMenu();
      }
    });
  }

  // Smooth scroll for floating cart on order page
  const floatCart = document.getElementById("floatingCart");
  if (floatCart && window.location.pathname.includes("order.html")) {
    floatCart.addEventListener("click", (e) => {
      e.preventDefault();
      const panel = document.getElementById("cartPanel");
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
});
