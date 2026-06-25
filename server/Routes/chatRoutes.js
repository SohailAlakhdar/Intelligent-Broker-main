const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const path = require("path");
const dotenv = require("dotenv");
const { estateModel } = require("../Model/estateModel"); // adjust path

dotenv.config({ path: path.resolve(__dirname, "../config/.env.dev") });

console.log("Chat routes loaded");

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Message is required." });
        }

        // 1. Text search first, fallback to recent approved listings
        let estates = await estateModel
            .find({ status: "approved", $text: { $search: message } })
            .populate("type", "name")
            .populate("category", "name")
            .limit(8)
            .lean();

        if (estates.length === 0) {
            estates = await estateModel
                .find({ status: "approved" })
                .populate("type", "name")
                .populate("category", "name")
                .sort({ createdAt: -1 })
                .limit(8)
                .lean();
        }

        // 2. Build lightweight context for the model (just enough to pick relevant ones)
        const context = estates
            .map((e, i) => {
                const dealType = e.auctionData?.endDate
                    ? "auction"
                    : e.category?.name?.toLowerCase().includes("rent")
                    ? "rent"
                    : "sale";
                return `[${i}] id:${e._id} | ${e.address} | $${e.price} | ${e.numOfRooms} bed/${e.numOfBathRooms} bath | ${e.size}m² | dealType:${dealType}`;
            })
            .join("\n");

        // 3. Ask Gemini for a short reply + which listing indices are relevant
        const systemPrompt = `You are a real estate assistant for "Intelligent Broker".
Given the user's message and the listings below, respond with ONLY valid JSON, no markdown, no backticks:
{
  "reply": "a short, friendly 1-2 sentence response",
  "relevantIndices": [array of the [n] index numbers from the listings below that match the user's request, in relevance order]
}
If nothing matches, return an empty array for relevantIndices and explain that in "reply".

Listings:
${context || "No listings available."}`;

        const completion = await openai.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
            ],
        });

        let parsed;
        try {
            const raw = completion.choices[0].message.content
                .replace(/```json|```/g, "")
                .trim();
            parsed = JSON.parse(raw);
        } catch (e) {
            // If the model didn't return clean JSON, fall back to plain text, no cards
            return res.json({
                reply: completion.choices[0].message.content,
                estates: [],
            });
        }

        // 4. Map relevant indices back to full estate objects for the frontend
        const matchedEstates = (parsed.relevantIndices || [])
            .map((i) => estates[i])
            .filter(Boolean)
            .map((e) => ({
                id: e._id,
                address: e.address,
                price: e.price,
                rooms: e.numOfRooms,
                bathrooms: e.numOfBathRooms,
                size: e.size,
                floor: e.floor,
                desc: e.desc,
                type: e.type?.name || null,
                category: e.category?.name || null,
                dealType: e.auctionData?.endDate
                    ? "auction"
                    : e.category?.name?.toLowerCase().includes("rent")
                    ? "rent"
                    : "sale",
                auctionEndDate: e.auctionData?.endDate || null,
                image: e.pic?.[0]?.path || null,
            }));

        res.json({
            reply: parsed.reply,
            estates: matchedEstates,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            reply: "Something went wrong.",
            estates: [],
            details: error.message,
        });
    }
});

module.exports = router;