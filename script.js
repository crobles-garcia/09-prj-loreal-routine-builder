// DOM elements
// Full updated JavaScript with image display and filtering fixes

let allProducts = [];
let selectedProducts = JSON.parse(localStorage.getItem("selectedProducts")) || [];

const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const clearSelectedBtn = document.getElementById("clearSelected");
const searchInput = document.getElementById("searchInput");

async function loadProducts() {
  try {
    const response = await fetch("products.json");
    const data = await response.json();
    allProducts = data.products;
    renderProducts();
    updateSelectedList();
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

function renderProducts() {
  const category = categoryFilter.value;
  const keyword = searchInput.value.toLowerCase();
  const filtered = allProducts.filter(p =>
    (!category || p.category === category) &&
    (p.name.toLowerCase().includes(keyword) || p.description.toLowerCase().includes(keyword))
  );

  productsContainer.innerHTML = "";
  filtered.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <h3>${product.name}</h3>
      <p>${product.brand}</p>
      <p>${product.description}</p>
      <button onclick="toggleProduct(${product.id})">
        ${selectedProducts.includes(product.id) ? "Remove" : "Select"}
      </button>
    `;
    productsContainer.appendChild(card);
  });
}

function toggleProduct(id) {
  const index = selectedProducts.indexOf(id);
  if (index > -1) {
    selectedProducts.splice(index, 1);
  } else {
    selectedProducts.push(id);
  }
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
  renderProducts();
  updateSelectedList();
}

function updateSelectedList() {
  selectedProductsList.innerHTML = "";
  const selectedItems = allProducts.filter(p => selectedProducts.includes(p.id));
  selectedItems.forEach(product => {
    const div = document.createElement("div");
    div.className = "selected-item";
    div.innerHTML = `
      <span>${product.name}</span>
      <button onclick="toggleProduct(${product.id})">Remove</button>
    `;
    selectedProductsList.appendChild(div);
  });
}

categoryFilter.addEventListener("change", renderProducts);
searchInput.addEventListener("input", renderProducts);
clearSelectedBtn.addEventListener("click", () => {
  selectedProducts = [];
  localStorage.removeItem("selectedProducts");
  renderProducts();
  updateSelectedList();
});

window.onload = loadProducts;

