// components/SocketComponent.tsx
"use client";
import { useState } from 'react';
import { useSocket } from '@/_Common/function/Socket';

export default function SocketComponent() {
    const [message, setMessage] = useState('');
    const { messages, sendMessage, SocketConnected } = useSocket();

    const handleSendMessage = () => {
        if (message.trim()) {
            sendMessage(message);
            setMessage(''); // Clear the input field
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Socket.IO Chat</h2>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #ddd', padding: '10px' }}>
                {messages.map((msg: string, index: number) => (
                    <div key={index} style={{ margin: '5px 0' }}>
                        {msg}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                style={{ padding: '8px', width: '80%', marginRight: '10px', borderRadius: '4px', border: '1px solid #ddd', color: 'black' }}
            />
            <button onClick={handleSendMessage} style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#0070f3', color: '#fff', border: 'none' }}>
                Send
            </button>
        </div>
    );
}
