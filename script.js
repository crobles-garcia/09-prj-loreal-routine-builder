const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateRoutineBtn = document.getElementById("generateRoutine");

const selectedProducts = [];

/* Placeholder */
productsContainer.innerHTML = `<div class="placeholder-message">Select a category to view products</div>`;

/* Load products from JSON */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Display product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.id === product.id);
      return `
        <div class="product-card ${isSelected ? "selected" : ""}" data-id="${product.id}">
          <div class="product-overlay">${product.description}</div>
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <button class="toggle-btn">View Details</button>
            <div class="description-full">${product.description}</div>
          </div>
        </div>
      `;
    })
    .join("");

  // Card click to select/unselect
  document.querySelectorAll(".product-card").forEach((card) => {
    const productId = parseInt(card.dataset.id);
    const product = products.find((p) => p.id === productId);

    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("toggle-btn")) return;

      const index = selectedProducts.findIndex((p) => p.id === productId);
      if (index === -1) {
        selectedProducts.push(product);
      } else {
        selectedProducts.splice(index, 1);
      }

      displayProducts(products);
      updateSelectedList();
    });
  });

  // Toggle description
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = e.target.closest(".product-card");
      card.classList.toggle("expanded");
    });
  });
}

/* Update the "Selected Products" section */
function updateSelectedList() {
  const container = document.getElementById("selectedProductsList");
  container.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-item" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <span>${product.name}</span>
        <button class="remove-btn" title="Remove">×</button>
      </div>
    `
    )
    .join("");

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.closest(".selected-item").getAttribute("data-id"));
      const index = selectedProducts.findIndex((p) => p.id === id);
      if (index !== -1) {
        selectedProducts.splice(index, 1);
        updateSelectedList();
        loadProducts().then(displayProducts);
      }
    });
  });
}

/* Filter products by category */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filteredProducts = products.filter((product) => product.category === selectedCategory);
  displayProducts(filteredProducts);
});

/* Chatbox fallback for manual entry */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

/* Generate routine via Cloudflare Worker */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = `<p>Please select products to generate a routine.</p>`;
    return;
  }

  const userProducts = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description
  }));

  chatWindow.innerHTML = `<p><em>✨ Creating your personalized routine...</em></p>`;

  try {
    const response = await fetch("https://09-prj-loreal-routine-builder.croblesg.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4", // or "gpt-3.5-turbo" if needed
        messages: [
          {
            role: "system",
            content: "You are a skincare and beauty expert helping users build personalized routines using selected products. Be clear, concise, and friendly."
          },
          {
            role: "user",
            content: `Here are my selected products:\n\n${JSON.stringify(userProducts, null, 2)}\n\nCan you create a complete routine using these products?`
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    chatWindow.innerHTML = `<div class="chat-reply">${aiReply.replace(/\n/g, "<br>")}</div>`;
  } catch (error) {
    console.error("Routine generation failed:", error);
    chatWindow.innerHTML = `<p>⚠️ Something went wrong while generating your routine. Please try again.</p>`;
  }
});
