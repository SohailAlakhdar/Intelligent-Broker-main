import styled from "styled-components";
import "animate.css";

export const ChatbotStyle = styled.div`
    .chat-container {
        width: 400px;
        height: 600px;
        margin: auto;
        border-radius: 15px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .chat-header {
        background: #0d6efd;
        color: white;
        padding: 15px;
        font-weight: bold;
        text-align: center;
    }

    .chat-messages {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        background: #f8f9fa;
    }

    .user-message {
        background: #0d6efd;
        color: white;
        padding: 10px;
        border-radius: 10px;
        margin: 10px 0;
        max-width: 70%;
        margin-left: auto;
    }

    .bot-message {
        background: white;
        padding: 10px;
        border-radius: 10px;
        margin: 10px 0;
        max-width: 70%;
        border: 1px solid #ddd;
    }

    .chat-input {
        display: flex;
        padding: 10px;
        border-top: 1px solid #ddd;
    }

    .chat-input input {
        flex: 1;
        padding: 10px;
    }

    .chat-input button {
        margin-left: 10px;
    }
`;
