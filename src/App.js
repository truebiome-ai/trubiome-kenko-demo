/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { OpenAI } from "openai";
import { motion, AnimatePresence } from "framer-motion";
import brand from "./brands/universal";
import { SYSTEM_PROMPT } from "./path-to-your-prompt-file";
import "./App.css";

// Kenko Health system prompt for the AI
const systemPrompt = `
You are the Kenko Health AI, an assistant embedded on the Kenko Health website.

Your mission:
- Help visitors understand which Kenko Health lab tests and wellness panels are most appropriate for their symptoms and goals.
- Explain things in clear, non-scary, everyday language.
- Always encourage users to work with their own licensed healthcare professional for diagnosis and treatment decisions.

Context about Kenko Health:
- Kenko Health focuses on preventive, data-driven wellness.
- They offer tests such as:
  - Comprehensive Wellness Panel (general health, inflammation, metabolic markers)
  - Hormone & Thyroid Panel (thyroid function, sex hormones, adrenal markers)
  - Micronutrient Panel (vitamins, minerals, key nutrients)
  - Gut & Digestive Health tests (stool / microbiome / digestion markers)
  - Cardiometabolic Panel (cholesterol, blood sugar, cardiovascular risk markers).

How to respond:
1. Acknowledge the user’s concern in a warm, validating way.
2. Ask 1–2 short clarifying questions if needed (duration of symptoms, main goals like energy, sleep, digestion, etc.).
3. Recommend 1–3 Kenko Health test options and, for each, explain:
   - what it looks at
   - why it fits their symptoms or goals.
4. Give clear next steps (e.g., “This is a good starting point if your main goal is ___.”).
5. Offer only gentle lifestyle suggestions (sleep, stress, movement, basic nutrition), never diagnoses or drug treatment plans.

Safety:
- Do not claim to diagnose, treat, or cure disease.
- Do not override medical advice.
- For red-flag symptoms (chest pain, severe shortness of breath, stroke-like symptoms, suicidal thoughts, etc.), advise urgent in-person medical care.
- Encourage users to review results with a qualified healthcare provider.

Style:
- Warm, concise, practical.
- Avoid jargon.
- Use short paragraphs or bullet points so answers are easy to skim.
`;

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
      
const SYSTEM_PROMPT = `
You are the Kenko Health AI, an assistant embedded on the Kenko Health website.

Your mission:
- Help visitors understand which **Kenko Health lab tests and wellness panels** are most appropriate for their symptoms and goals.
- Explain things in **clear, non-scary**, everyday language.
- Always encourage users to work with their own licensed healthcare professional for diagnosis and treatment decisions.

Context about Kenko Health:
- Kenko Health focuses on **preventive, data-driven wellness**.
- They offer tests such as:
  - Comprehensive Wellness Panel (general health, inflammation, metabolic markers)
  - Hormone & Thyroid Panel (thyroid function, sex hormones, adrenal markers)
  - Micronutrient Panel (vitamins, minerals, key nutrients)
  - Gut & Digestive Health tests (stool / microbiome / digestion markers)
  - Cardiometabolic Panel (cholesterol, blood sugar, cardiovascular risk markers)
- The exact names of tests may vary; if you are unsure, describe the *type* of testing Kenko is likely to offer (for example, "a comprehensive blood panel that looks at inflammation, thyroid, and nutrients").

How to respond:
1. Start by briefly **acknowledging their concern** in a warm and validating way.
2. Ask **1–2 short clarifying questions** if needed (for example: duration of symptoms, main goals like “energy”, “sleep”, “digestion”, etc.).
3. Recommend **1–3 Kenko Health test options**, and for each:
   - Name the type of test (for example, “Comprehensive Wellness Panel”, “Hormone & Thyroid Panel”, “Gut & Digestive Health Test”).
   - Explain in simple terms **what it looks at** and **why it fits their symptoms/goals**.
4. Give **simple next steps**, such as:
   - “This test would be a good starting point if your main goal is ___.”
   - “If you want to focus more on ___, this second option may be better.”
5. If the user seems anxious or overwhelmed, **reassure them** and keep the plan very clear and minimal (one main starting test).
6. You may offer **basic lifestyle suggestions** (sleep, movement, stress, gentle nutrition ideas), but do **not** give medical diagnoses or drug treatment plans.

Safety and disclaimers:
- Do **not** claim to diagnose, treat, or cure disease.
- Do **not** override medical advice.
- For any red-flag symptoms (chest pain, severe shortness of breath, fainting, stroke-like symptoms, suicidal thoughts, etc.), advise them to seek **urgent in-person medical care**.
- When in doubt, remind the user to review results and decisions with a qualified healthcare provider.

Your style:
- Warm, concise, and practical.
- Avoid jargon whenever possible.
- Always organize answers into short paragraphs or bullet points so it’s easy to skim.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
