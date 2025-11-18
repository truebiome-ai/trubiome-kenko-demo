/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { OpenAI } from "openai";
import { motion, AnimatePresence } from "framer-motion";
import brand from "./brands/universal";
import "./App.css";

// 🔍 Match symptoms to product keywords using fuzzy matching
const isSimilar = (input, keyword) => {
  return input.toLowerCase().includes(keyword.toLowerCase()) ||
         keyword.toLowerCase().includes(input.toLowerCase());
};

// 🧠 Get recommended products based on user symptoms
const getProductRecommendations = (userSymptoms) => {
  return brand.products.filter(product =>
    product.keywords.some(keyword =>
      userSymptoms.some(symptom => isSimilar(symptom, keyword))
    )
  );
};

// 🔗 Format produuct results as markdown links for chatbot replies
const formatProductLinks = (products) =>
  products
    .map(
      (product) =>
        `- **[${product.name}](${product.link})** – ${product.description}`
    )
    .join("\n");

const openai = new OpenAI({
  apiKey:process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: brand.greeting }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);

  const chatWindowRef = React.useRef(null);

  React.useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTo({
        top: chatWindowRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);


  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const productList = brand.products
      .map(
        (p) =>
          `- **${p.name}** – ${p.description}. [Buy ${p.name}](${p.link})`
      )
      .join("\n");
      
const systemPrompt = `
You are ${brand.name}, an intelligent gut health assistant trained in functional medicine principles.

You specialize in helping people understand root causes of symptoms like bloating, gas, brain fog, fatigue, constipation, diarrhea, sugar cravings, mood swings, and more — using the product list below.

Your job is to:
1. Ask **1–2 short follow-up questions** based on the user’s symptoms to gather clarity. Be specific to their symptom category. For example:
   - Bloating/gas: “Do you notice it’s worse after certain foods?” or “How soon after eating does it start?”
   - Fatigue/brain fog: “Do you feel tired even after a full night’s sleep?”
   - Constipation/diarrhea: “How often are your bowel movements?”
   - Cravings/mood: “Do you feel more anxious or down after eating sugar?”

2. Then recommend **products ONLY from this list**, based on their symptoms and answers. For each product:
   - Explain in simple terms what it does
   - How it helps
   - Use markdown: [Buy ProductName](link)

3. After the recommendation, always ask a **final engaging question** like:
   - “Would you like me to build a full gut support protocol?”
   - “Want to look at common causes of this symptom?”
   - “Would you like diet tips that may help?”

🧠 Tone: Calm, clear, confident — like a knowledgeable functional medicine coach. Never apologize, never say “I understand.” Just be smart, caring, and direct.

💡 Be conversational. Break longer responses into **2–4 short chatbot-style messages**, with line breaks if helpful.

🌿 Available Products:
${productList}

Keep it friendly, helpful, and forward-moving. You're here to *guide the user to root causes and recommend the most relevant product(s)*.
`;


    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...newMessages,
        ],
        temperature: 0.7,
      });

      const botMessage = response.choices[0].message.content;
      setMessages([
        ...newMessages,
        { role: "assistant", content: botMessage },
      ]);
      setFollowUpCount(followUpCount + 1);
    } catch (error) {
      console.error("OpenAI API error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Oops, something went wrong. Please try again later.",
        },
      ]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

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

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`message ${msg.role}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 50 }}
            >
              <span
                dangerouslySetInnerHTML={{
                  __html: msg.content.replace(/\n/g, "<br/>"),
                }}
              />
            </motion.div>
          ))}

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

      <motion.div
        className="input-area"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <input
          type="text"
          placeholder="Type your symptoms here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={sendMessage}
        >
          Send
        </motion.button>
      </motion.div>
    </div>
  );
}

export default App;
