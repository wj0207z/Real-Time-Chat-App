import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../api/axios";

//need to put outside the chat function to avoid multiple connections being created on every render
//this means create only one socket and reuse it across the component lifecycle
const socket = io("http://localhost:5001");

function Chat() {
    const user = JSON.parse(localStorage.getItem("user"));

    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [error, setError] = useState("");

    const [newRoomName, setNewRoomName] = useState("");

    const [previousRoomId, setPreviousRoomId] = useState(null);

    const messageEndRef = useRef(null);

    

    useEffect(() => {
        fetchRooms();
    }, []);

    async function fetchRooms() {
        try {
            const response = await api.get("/rooms");
            setRooms(response.data);

            if (response.data.length > 0) {
                setSelectedRoom(response.data[0]);
            }
        } catch (error) {
            setError("Failed to load rooms.");
        }
    }

    useEffect(() => {
        if (selectedRoom) {
            fetchMessages(selectedRoom._id);
        }
    }, [selectedRoom]);

    //when user selects General room, it tells socket server to join that room
    //backend will receive roomId
    //backend will leave old room and join new room
    useEffect(() => {
        if (selectedRoom) {
            socket.emit("join_room", {
                roomId: selectedRoom._id,
                previousRoomId,
            });

            setPreviousRoomId(selectedRoom._id);
        }
    }, [selectedRoom]);


    //when backend emits receive_message, it will update the screen with messages
    //this useEffect will run only once when the component mounts, and it will set up the socket listener for receive_message event
    //when the component unmounts, it will remove the listener to avoid memory leaks
    //prevent duplicated socket messages
    useEffect(() => {
        socket.on("receive_message", (newMessage) => {
            setMessages((currentMessages) => {
                const messageAlreadyExists = currentMessages.some(
                    (message) => message._id === newMessage._id
                );

                if (messageAlreadyExists) {
                    return currentMessages;
                }

                return [...currentMessages, newMessage];
            });
        });

        return () => {
            socket.off("receive_message");
        };
    }, []);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages]);

    async function fetchMessages(roomId) {
        try {
            const response = await api.get(`/messages/room/${roomId}`);
            setMessages(response.data);
        } catch (error) {
            setError("Failed to load messages.");
        }
    }

    async function handleSendMessage(event) {
        event.preventDefault();

        if (!messageText.trim() || !selectedRoom) {
            return;
        }

        try {
            const response = await api.post("/messages", {
                roomId: selectedRoom._id,
                content: messageText,
            });

            //Socket.IO receive_message event will be emitted from backend, and the message will be added to the messages state in the useEffect above
            socket.emit("send_message", response.data.data);
            setMessageText("");
        } catch (error) {
            setError("Failed to send message.");
        }
    }

    async function handleCreateRoom(event) {
    event.preventDefault();

    if (!newRoomName.trim()) {
        return;
    }

    try {
        const response = await api.post("/rooms", {
            name: newRoomName,
            description: "",
        });

        const createdRoom = response.data.room;

        setRooms([...rooms, createdRoom]);
        setSelectedRoom(createdRoom);
        setNewRoomName("");
    } catch (error) {
        setError("Failed to create room.");
    }
}

function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
}

function formatMessageTime(dateString) {
    return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

    return (
        <main className="chat-page">
            <aside className="room-sidebar">
                <div className="sidebar-header">
                    <h2>Rooms</h2>
                    {user && <p>{user.name}</p>}
                </div>

                <form className="room-form" onSubmit={handleCreateRoom}>
                    <input
                        placeholder="New room name"
                        value={newRoomName}
                        onChange={(event) => setNewRoomName(event.target.value)}
                    />
                    <button type="submit">Add</button>
                </form>

                {rooms.map((room) => (
                    <button
                        key={room._id}
                        className={
                            selectedRoom?._id === room._id
                                ? "room-button active"
                                : "room-button"
                        }
                        onClick={() => setSelectedRoom(room)}
                    >
                        {room.name}
                    </button>
                ))}
            </aside>

            <section className="chat-panel">
                <header className="chat-header">
                    <div>
                        <h1>{selectedRoom ? selectedRoom.name : "No room selected"}</h1>
                        <p>{selectedRoom?.description}</p>
                    </div>

                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </header>

                {error && <div className="auth-error">{error}</div>}

                <div className="message-list">
                    {messages.map((message) => (
                        <div
                            key={message._id}
                            className={
                                message.sender?._id === user?.id
                                    ? "message-bubble mine"
                                    : "message-bubble"
                            }
                        >
                            <div className="message-meta">
                                <strong>{message.sender?.name}</strong>
                                <span>{formatMessageTime(message.createdAt)}</span>
                            </div>
                            <p>{message.content}</p>
                        </div>
                    ))}

                    <div ref={messageEndRef} />
                </div>

                <form className="message-form" onSubmit={handleSendMessage}>
                    <input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                    />
                    <button type="submit">Send</button>
                </form>
            </section>
        </main>
    );
}

export default Chat;