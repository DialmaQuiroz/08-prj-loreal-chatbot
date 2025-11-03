document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const chatWindow = document.getElementById("chatWindow");

  // Check if required DOM elements exist
  if (!chatForm || !userInput || !chatWindow) {
    // Show a clear error for beginners
    alert(
      "Error: Missing chatForm, userInput, or chatWindow element. Please check your HTML IDs."
    );
    return;
  }

  // Create a display for the latest user question above the chat window
  let userQuestionDisplay = document.getElementById("user-question-display");
  if (!userQuestionDisplay) {
    userQuestionDisplay = document.createElement("div");
    userQuestionDisplay.id = "user-question-display";
    chatWindow.parentNode.insertBefore(userQuestionDisplay, chatWindow);
  }

  // Friendly greetings for variety
  const greetings = [
    "👋 Welcome! Ask me about hair care products or your future skincare routine.",
    "✨ Hi there! Curious about L'Oreal products or routines? Just ask!",
    "😊 Hello! I'm here to help with all your L'Oreal beauty questions.",
  ];

  // Helper function to add a message bubble to the chat window
  function addMessageBubble(content, sender) {
    // Create a new div for the message bubble
    const bubble = document.createElement("div");
    // Use CSS classes that match style.css
    bubble.classList.add("msg");
    bubble.classList.add(sender === "user" ? "user" : "ai");
    // Preserve line breaks and spacing for readability
    bubble.innerHTML = content.replace(/\n/g, "<br>");
    chatWindow.appendChild(bubble);
    // Scroll to the bottom so latest message is visible
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Show a random greeting on page load using the same bubble style as bot messages
  chatWindow.innerHTML = ""; // Clear chat window
  addMessageBubble(
    greetings[Math.floor(Math.random() * greetings.length)],
    "bot"
  );
  userQuestionDisplay.textContent = "";

  // Cloudflare Worker endpoint
  const workerUrl = "https://chatbot-worker.u1381801.workers.dev/";

  // Conversation history for multi-turn context
  const conversation = [
    {
      role: "system",
      content:
        "You are a friendly and helpful assistant who's an expert on L'Oreal products. You help people find the best skincare and haircare routines based on their needs. Your responses should be concise and informative. You also politely refuse to answer questions unrelated to L'Oreal products, routines, recommendations, beauty-related topics, makeup, or skincare related advice. You always refer to L'Oreal's official website for product details and avoid making up information. If you don't know the answer, you politely say you don't know and ask for more details about their skincare or haircare needs.",
    },
  ];

  // Async function to call the Cloudflare Worker with full conversation history
  async function callCloudflareWorker() {
    // Show loading indicator
    addMessageBubble("Thinking...🤔", "bot");

    try {
      // Send POST request to Cloudflare Worker
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: conversation }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      // Get the AI reply from the API response
      const data = await response.json();

      // If the API returns an error, show it to the user
      if (data.error) {
        // Show a readable error message for beginners
        let errorMsg =
          typeof data.error === "object"
            ? JSON.stringify(data.error)
            : data.error;
        addMessageBubble(
          `Sorry, there was an error with the AI: ${errorMsg}`,
          "bot"
        );
        return;
      }

      // Check if the API response has the expected structure
      if (
        !data.choices ||
        !data.choices[0] ||
        !data.choices[0].message ||
        !data.choices[0].message.content
      ) {
        addMessageBubble(
          "Sorry, I didn't get a valid response from the AI. Please try again.",
          "bot"
        );
        return;
      }

      // The AI's reply is inside data.choices[0].message.content
      const aiReply = data.choices[0].message.content.trim();

      // Add bot response to conversation history
      conversation.push({ role: "assistant", content: aiReply });

      // Remove loading indicator
      const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
      if (loadingMsg && loadingMsg.textContent === "Thinking...🤔") {
        chatWindow.removeChild(loadingMsg);
      }

      // Show AI response with preserved line breaks
      addMessageBubble(aiReply, "bot");
    } catch (error) {
      // Remove loading indicator
      const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
      if (loadingMsg && loadingMsg.textContent === "Thinking...🤔") {
        chatWindow.removeChild(loadingMsg);
      }
      addMessageBubble(
        "Sorry, something went wrong. Please try again later.",
        "bot"
      );
      // Show error in console for debugging
      console.error("Error:", error);
    }
  }

  // Handle form submit
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const prompt = userInput.value.trim();
    if (!prompt) return;

    // Add user message to conversation history
    conversation.push({ role: "user", content: prompt });

    // Show user message bubble
    addMessageBubble(prompt, "user");

    // Display user question above chat
    userQuestionDisplay.textContent = prompt;

    // Clear input
    userInput.value = "";

    // Get AI response
    callCloudflareWorker();
  });
});
