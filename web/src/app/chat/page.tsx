"use client";
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

export default function SocketComponent() {
    const [socket, setSocket] = useState<any>(null);
    const [message, setMessage] = useState<any>('');
    const [messages, setMessages] = useState<any>([]);

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL, {
            transports: ['websocket', 'polling'],       // Use only WebSocket transport
            reconnection: true,              // Enable reconnection
            reconnectionAttempts: Infinity,   // Try to reconnect indefinitely
            reconnectionDelay: 1000,         // Wait 1 second before attempting to reconnect
            reconnectionDelayMax: 5000,      // Max wait time before next attempt
            timeout: 20000,                  // Timeout for initial connection attempt
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to Socket.IO server');
        });

        newSocket.on('message', (newMessage) => {
            console.log('New message received:', newMessage);
            setMessages((prevMessages: any) => [...prevMessages, newMessage]);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
            if (reason === 'io server disconnect') {
                // The disconnection was initiated by the server
                // Reconnect manually (if needed)
                newSocket.connect();
            } else {
                // Else: the client has lost connection (e.g. due to internet)
                console.log('Trying to reconnect...');
            }
        });

        const handleOnline = () => {
            console.log('Back online. Attempting to reconnect...');
            newSocket.connect();
        };

        const handleOffline = () => {
            console.log('You are offline. Please check your connection.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };

        return () => {
            socket.disconnect();
        };
    }, []);



    const sendMessage = () => {

        console.log("SOCKET+++-->", socket);
        if (message.trim() && socket) {
            socket.emit('message', message);
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
            <button onClick={sendMessage} style={{ padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#0070f3', color: '#fff', border: 'none' }}>
                Send
            </button>
        </div>
    );
}
