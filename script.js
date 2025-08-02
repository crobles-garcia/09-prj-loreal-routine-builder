const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateRoutineBtn = document.getElementById("generateRoutine");
const selectedProducts = [];

/* Chat memory */
const chatHistory = [
  {
    role: "system",
    content:
      "You are a skincare and beauty expert that helps users build personalized routines and answer related questions about skincare, haircare, makeup, fragrance, and grooming. Keep answers clear, friendly, and helpful."
  }
];

/* Placeholder */
productsContainer.innerHTML = `<div class="placeholder-message">Select a category to view products</div>`;

/* Load product data */
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

  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = e.target.closest(".product-card");
      card.classList.toggle("expanded");
    });
  });
}

/* Update selected products list */
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

/* Filter products */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filteredProducts = products.filter((product) => product.category === selectedCategory);
  displayProducts(filteredProducts);
});

/* Generate AI Routine */
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

  const prompt = `Here are my selected products:\n\n${JSON.stringify(userProducts, null, 2)}\n\nCan you create a complete routine using these products?`;

  chatHistory.push({ role: "user", content: prompt });

  chatWindow.innerHTML = `<p><em>✨ Creating your personalized routine...</em></p>`;

  try {
    const response = await fetch("https://09-prj-loreal-routine-builder.croblesg.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: chatHistory,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    chatHistory.push({ role: "assistant", content: aiReply });

    chatWindow.innerHTML = `<div class="chat-reply">${aiReply.replace(/\n/g, "<br>")}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error("Routine generation failed:", error);
    chatWindow.innerHTML = `<p>⚠️ Something went wrong while generating your routine. Please try again.</p>`;
  }
});

/* Follow-up questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  chatWindow.innerHTML += `<div class="chat-reply"><strong>You:</strong> ${userInput}</div>`;
  document.getElementById("userInput").value = "";

  chatWindow.innerHTML += `<div class="chat-reply"><em>Thinking...</em></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  chatHistory.push({ role: "user", content: userInput });

  try {
    const response = await fetch("https://09-prj-loreal-routine-builder.croblesg.workers.dev/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: chatHistory,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const aiReply = data.choices[0].message.content;

    chatHistory.push({ role: "assistant", content: aiReply });

    chatWindow.innerHTML += `<div class="chat-reply">${aiReply.replace(/\n/g, "<br>")}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error("Follow-up chat failed:", error);
    chatWindow.innerHTML += `<div class="chat-reply">⚠️ Something went wrong while answering. Please try again.</div>`;
  }
});
document.getElementById("clearSelected").addEventListener("click", () => {
  selectedProducts.length = 0;
  clearSelectedStorage();
  updateSelectedList();
  loadProducts().then(displayProducts);
});
