/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { OpenAI } from "openai";
import { motion, AnimatePresence } from "framer-motion";
import brand from "./brands/universal";
import "./App.css";

const SYSTEM_PROMPT = `
You are the Ombre Gut Intelligence Assistant — a warm, conversational, highly knowledgeable functional-medicine AI built to help users understand their symptoms and find the best Ombre products.

EXTREMELY IMPORTANT RULES:
- You may ONLY recommend products from the provided Ombre product list.
- You may NOT invent, suggest, or reference any product not in the list.
- If a symptom matches no product exactly, recommend:
  1. Ombre Gut Health Test
  2. One product from the list that is the closest reasonable match  
- NEVER recommend “Daily Synbiotic,” “Synbiotic,” “SuperGut,” or any other Ombre products not explicitly included.

PRODUCT LIST YOU MUST FOLLOW:
(You will only use these)
- Ombre Gut Health Test
- Rise
- Prebiotic Fiber with Super Greens
- 3-in-1 Probiotic
- Healthy Gut
- Metabolic Booster
- Endless Energy
- Ultimate Immunity
- Mood Enhancer
- Heart Health

CONVERSATION RULES:
1. Acknowledge symptoms.
2. Ask ONE clarifying question.
3. Recommend 1–2 relevant products from the approved list.
4. Give short, warm explanations.
5. If symptoms are chronic, unclear, or broad → recommend Ombre Gut Health Test.
6. NEVER output anything outside this list.

STYLE:
- Conversational, warm, supportive.
- Short paragraphs.
- No robotic phrasing.
- No diagnosing.

Your mission is to guide users to the correct Ombre products ONLY from the above list.

`;

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  // ----------------------------
  // INITIAL MESSAGES
  // ----------------------------
  const [messages, setMessages] = useState([
    { role: "assistant", content: brand.greeting },
    {
      role: "assistant",
      type: "disclaimer",
      content:
        "<span style='font-size:12px; opacity:0.7;'>Disclaimer: This assistant is for educational purposes only and does not provide medical advice, diagnosis, or treatment.</span>",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatWindowRef = React.useRef(null);

  // ----------------------------
  // AUTO SCROLL
  // ----------------------------
  React.useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // ----------------------------
  // PRODUCT CARD RENDERER
  // ----------------------------
  const renderProductCard = (product) => {
    return (
      <div className="product-card" key={product.name}>
        <img src={product.image} alt={product.name} className="product-image" />
        <h4>{product.name}</h4>
        <p>{product.description}</p>
        <a href={product.link} target="_blank" rel="noopener noreferrer">
          <button className="product-button">View Product</button>
        </a>
      </div>
    );
  };

  // ----------------------------
  // SEND MESSAGE
  // ----------------------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...newMessages],
        temperature: 0.7,
      });

      const botMessage = response.choices[0].message.content;

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: botMessage,
        },
      ]);
    } catch (error) {
      console.error("OpenAI API error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Oops, something went wrong. Please try again.",
        },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <div className="app">
      <AnimatePresence>
        <motion.div
          className="chat-window"
          ref={chatWindowRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 60, damping: 10 }}
        >
          {messages.map((msg, i) => {
  const matchedProducts =
    typeof msg.content === "string"
      ? brand.products.filter((p) => msg.content.includes(p.name))
      : [];

  return (
    <motion.div
      key={i}
      className={`message ${msg.role}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: i * 0.03, type: "spring" }}
    >
      {/* Always show the chatbot text */}
      <span
        dangerouslySetInnerHTML={{
          __html: msg.content.replace(/\n/g, "<br/>"),
        }}
      />

      {/* Product cards BELOW the text */}
      {matchedProducts.length > 0 && (
        <div className="product-card-container">
          {matchedProducts.map((product) => (
            <div className="product-card" key={product.name}>
              <img src={product.image} alt={product.name} className="product-image" />
              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <a href={product.link} target="_blank" rel="noopener noreferrer">
                <button className="product-button">View Product</button>
              </a>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
})}


          {loading && (
            <motion.div
              className="message assistant typing-dots"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* INPUT */}
      <motion.div
        className="input-area"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <input
          type="text"
          placeholder="Type your symptoms here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <motion.button whileTap={{ scale: 0.95 }} onClick={sendMessage}>
          Send
        </motion.button>
      </motion.div>
    </div>
  );
}

export default App;
