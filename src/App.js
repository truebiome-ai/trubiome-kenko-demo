/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { OpenAI } from "openai";
import { motion, AnimatePresence } from "framer-motion";
import brand from "./brands/universal";
import "./App.css";

const SYSTEM_PROMPT = `
You are the Kenko Health AI, an assistant embedded on the Kenko Health website.

Your mission:
- Help visitors understand which Kenko Health lab tests and specialised panels are most appropriate for their symptoms and goals.
- Explain things in clear, non-scary everyday language.
- Always encourage users to review results and decisions with their own licensed healthcare professional.

Core test groups you can recommend (only from this list):
- Fertility / reproductive tests (via Fertilysis):
  • Reproductive Microbiome Analysis
  • Sperm DNA Fragmentation Index (DFI)
  • Reproductive Immunology Panels (HLA, KIR, alloimmunity)
  -> When you recommend these together, you may call them a “Fertility Investigation Package” or “Fertility Diagnostic Package”.
- Organix Comprehensive Profile:
  • Comprehensive Nutritional Analysis
  • Energy Production Assessment
  • Mood & Brain Health Insights
  • Detoxification Evaluation
  • Gut Health Indicator
  • Mitochondrial Function Analysis
- Environmental health:
  • PlasticTox Human Microplastic Screen
- Stress / cortisol:
  • Cortisol Awakening Response (CAR) Test
  • Nighttime Cortisol (Midnight Spike) Test
  • Systemic Cortisol Dysfunction Panel
- Men’s health:
  • ZRT Male Hormone Profile (adrenal, thyroid, testosterone, estrogen balance, PSA)

ABSOLUTE RULES ABOUT FERTILITY CASES:
- If the user mentions fertility, infertility, trouble conceiving, recurrent miscarriage, implantation failure, or clearly reproductive concerns:
  1) Ask ONE short clarifying question about their situation (for example: how long they’ve been trying, irregular cycles, prior miscarriages, partner factors, etc.).
  2) Then ALWAYS recommend the Fertilysis fertility tests as the primary option:
     - Reproductive Microbiome Analysis
     - Sperm DNA Fragmentation Index (DFI) – especially when male-factor may be relevant
     - Reproductive Immunology Panels
  3) Present them as a combined Fertility Investigation Package and explain briefly what each part checks and why it matters.
  4) You may optionally mention an additional hormone or nutrient-focused test (for example, Organix Comprehensive Profile components) as a secondary consideration, but the Fertility package must always come first and be clearly highlighted as the main recommendation.

General response pattern for ALL users:
1) Intake:
   - Acknowledge their concern in a warm, validating way.
   - Reflect back the main symptom cluster (fatigue, gut issues, fertility, stress, etc.).
2) ONE follow-up question:
   - Ask just 1 concise clarifying question to refine which test or panel is best.
3) Test recommendations + CTA:
   - Recommend 1–3 tests from the list above (never invent new test names).
   - For each test, explain in 1–3 short sentences:
       • what it looks at
       • why it matches their symptoms or goals.
   - End with a clear next step and a generic CTA, for example:
       “To learn more or order this test, you can join Kenko Health’s programme or speak with your Kenko practitioner.”

Safety and scope:
- Do NOT claim to diagnose, treat, or cure any disease.
- Do NOT give drug treatment plans or override medical advice.
- For red-flag symptoms (chest pain, severe shortness of breath, stroke-like symptoms, severe suicidal thoughts, etc.), advise urgent in-person medical care.
- Encourage users to review their results and decisions with a qualified healthcare provider.

Style:
- Warm, concise, and practical.
- Avoid jargon; when you must use a technical term, briefly explain it in plain language.
- Use short paragraphs or bullet points so answers are easy to skim.
- Keep the overall flow: intake → one follow-up question → clear test recommendation(s) + gentle CTA.
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
