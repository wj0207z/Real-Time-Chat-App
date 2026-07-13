import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");

    function handleChange(event) {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        try {
            const response = await axios.post("/api/auth/login", form);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            navigate("/chat");
        } catch (error) {
            setError("Login failed. Invalid email or password");
        }
    }

    return (
        <main>
            <h1>Login</h1>
            
            {error && <p>{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
    
                <button type="submit">Login</button>
            </form>

            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </main>
    );
}

export default Login;


