// import React, { useState } from "react";
// import { ChatbotStyle } from "../components/Styles/chatbotStyle.jsx";
// import { ButtonS } from "../components/Styles/buttonElementsStyle.jsx";
// import Loading from "./loading";

// function ChatBotPage() {
//     const [messages, setMessages] = useState([
//         {
//             sender: "bot",
//             text: "👋 Welcome to Intelligent Broker. How can I help you find a property today?",
//         },
//     ]);
//     const [message, setMessage] = useState("");
//     const sendMessage = async () => {
//         if (!message.trim()) return;

//         try {
//             const response = await fetch("https://intelligent-broker-main-1.onrender.com/chat", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     message,
//                 }),
//             });

//             const data = await response.json();

//             setMessages((prev) => [
//                 ...prev,
//                 { sender: "user", text: message },
//                 { sender: "bot", text: data.reply },
//             ]);

//             setMessage("");
//         } catch (error) {
//             console.error(error);
//             setMessages((prev) => [
//                 ...prev,
//                 {
//                     sender: "bot",
//                     text: "Couldn't reach the server. Please try again.",
//                 },
//             ]);
//         }
//     };
//     return (
//         <ChatbotStyle>
//             <div className="chat-container">
//                 <div className="chat-header">
//                     🤖 Intelligent Broker Assistant
//                 </div>

//                 <div className="chat-messages">
//                     {messages.map((msg, index) => (
//                         <div
//                             key={index}
//                             className={
//                                 msg.sender === "user"
//                                     ? "user-message"
//                                     : "bot-message"
//                             }
//                         >
//                             {msg.text}
//                         </div>
//                     ))}
//                 </div>

//                 <div className="chat-input">
//                     <input
//                         type="text"
//                         value={message}
//                         onChange={(e) => setMessage(e.target.value)}
//                         placeholder="Ask about properties..."
//                     />
//                     <ButtonS onClick={sendMessage}>Send</ButtonS>
//                 </div>
//             </div>
//         </ChatbotStyle>
//     );
// }

// export default ChatBotPage;
