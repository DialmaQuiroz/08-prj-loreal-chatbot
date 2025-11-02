document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const chatWindow = document.getElementById("chatWindow");

  // Friendly greetings for variety
  const greetings = [
    "👋 Welcome! Ask me about hair care products or your future skincare routine.",
    "✨ Hi there! Curious about L'Oreal products or routines? Just ask!",
    "😊 Hello! I'm here to help with all your L'Oreal beauty questions.",
  ];

  // Show a random greeting on page load
  chatWindow.innerHTML = `<div class="msg ai">${
    greetings[Math.floor(Math.random() * greetings.length)]
  }</div>`;

  // Cloudflare Worker endpoint
  const workerUrl = "https://chatbot-worker.u1381801.workers.dev/";

  // Helper function to add a message to the chat window
  function addMessage(content, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${sender}`;
    msgDiv.textContent = content;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Async function to call the Cloudflare Worker
  async function callCloudflareWorker(userPrompt) {
    // Show loading indicator
    addMessage("Thinking...🤔", "ai");

    // Prepare messages for OpenAI API
    const messages = [
      {
        role: "system",
        content:
          "You are a friendly and helpful assistant who's an expert on L'Oreal products. You help people find the best skincare and haircare routines based on their needs. Your responses should be concise and informative. You also politely refuse to answer questions unrelated to L'Oreal products, routines, recommendations, beauty-related topics, makeup, or skincare related advice. You always refer to L'Oreal's official website for product details and avoid making up information. If you don't know the answer, you politely say you don't know and ask for more details about their skincare or haircare needs.",
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    try {
      // Send POST request to Cloudflare Worker
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();

      // Get AI response from OpenAI
      const aiReply = data.choices[0].message.content.trim();

      // Remove loading indicator
      const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
      if (loadingMsg && loadingMsg.textContent === "Thinking...🤔") {
        chatWindow.removeChild(loadingMsg);
      }

      // Show AI response
      addMessage(aiReply, "ai");
    } catch (error) {
      // Remove loading indicator
      const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
      if (loadingMsg && loadingMsg.textContent === "Thinking...🤔") {
        chatWindow.removeChild(loadingMsg);
      }
      addMessage("Sorry, something went wrong. Please try again later.", "ai");
      console.error("Error:", error);
    }
  }

  // Handle form submit
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const prompt = userInput.value.trim();
    if (!prompt) return;

    // Show user message
    addMessage(prompt, "user");

    // Clear input
    userInput.value = "";

    // Get AI response
    callCloudflareWorker(prompt);
  });
});
