import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../api/axios";

const socket = io("http://localhost:5001");

function Chat() {
    const user = JSON.parse(localStorage.getItem("user"));

    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [newRoomName, setNewRoomName] = useState("");
    const [previousRoomId, setPreviousRoomId] = useState(null);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState("");

    const messageEndRef = useRef(null);

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        if (selectedRoom) {
            fetchMessages(selectedRoom._id);

            socket.emit("join_room", {
                roomId: selectedRoom._id,
                previousRoomId,
            });

            setPreviousRoomId(selectedRoom._id);
        }
    }, [selectedRoom]);

    useEffect(() => {
        socket.on("receive_message", (newMessage) => {
            setMessages((currentMessages) => {
                const exists = currentMessages.some(
                    (message) => message._id === newMessage._id
                );

                if (exists) {
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

    async function fetchRooms() {
        try {
            setError("");
            setLoadingRooms(true);

            const response = await api.get("/rooms");
            setRooms(response.data);

            if (response.data.length > 0) {
                setSelectedRoom(response.data[0]);
            }
        } catch (error) {
            setError("Failed to load rooms.");
        } finally {
            setLoadingRooms(false);
        }
    }

    async function fetchMessages(roomId) {
        try {
            setError("");
            setLoadingMessages(true);

            const response = await api.get(`/messages/room/${roomId}`);
            setMessages(response.data);
        } catch (error) {
            setError("Failed to load messages.");
        } finally {
            setLoadingMessages(false);
        }
    }

    async function handleSendMessage(event) {
        event.preventDefault();

        if (!messageText.trim() || !selectedRoom) {
            return;
        }

        try {
            setError("");

            const response = await api.post("/messages", {
                roomId: selectedRoom._id,
                content: messageText,
            });

            setMessages((currentMessages) => [
                ...currentMessages,
                response.data.data,
            ]);

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
            setError("");

            const response = await api.post("/rooms", {
                name: newRoomName,
                description: "",
            });

            const createdRoom = response.data.room;

            setRooms((currentRooms) => [...currentRooms, createdRoom]);
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

                {loadingRooms ? (
                    <p className="empty-text">Loading rooms...</p>
                ) : rooms.length === 0 ? (
                    <p className="empty-text">
                        No rooms yet. Create one to start chatting.
                    </p>
                ) : (
                    rooms.map((room) => (
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
                    ))
                )}
            </aside>

            <section className="chat-panel">
                <header className="chat-header">
                    <div>
                        <h1>
                            {selectedRoom
                                ? selectedRoom.name
                                : "No room selected"}
                        </h1>
                        <p>{selectedRoom?.description}</p>
                    </div>

                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </header>

                {error && <div className="chat-error">{error}</div>}

                <div className="message-list">
                    {loadingMessages ? (
                        <div className="empty-state">
                            <h2>Loading messages...</h2>
                        </div>
                    ) : !selectedRoom ? (
                        <div className="empty-state">
                            <h2>Select a room</h2>
                            <p>
                                Choose a room from the sidebar or create a new
                                one.
                            </p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="empty-state">
                            <h2>No messages yet</h2>
                            <p>
                                Send the first message to start the
                                conversation.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
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
                                    <span>
                                        {formatMessageTime(message.createdAt)}
                                    </span>
                                </div>
                                <p>{message.content}</p>
                            </div>
                        ))
                    )}

                    <div ref={messageEndRef} />
                </div>

                <form className="message-form" onSubmit={handleSendMessage}>
                    <input
                        placeholder={
                            selectedRoom
                                ? "Type a message..."
                                : "Select a room to send messages"
                        }
                        value={messageText}
                        onChange={(event) =>
                            setMessageText(event.target.value)
                        }
                        disabled={!selectedRoom}
                    />
                    <button type="submit" disabled={!selectedRoom}>
                        Send
                    </button>
                </form>
            </section>
        </main>
    );
}

export default Chat;