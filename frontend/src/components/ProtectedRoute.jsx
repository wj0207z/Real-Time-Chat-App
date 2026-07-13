import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" />;
    }

    // If the user is authenticated, render the children components
    //children components are the components that are wrapped inside the ProtectedRoute component in App.jsx
    // For example, in App.jsx, the Chat component is wrapped inside the ProtectedRoute component, so the Chat component will be rendered if the user is authenticated
    return children;
}

export default ProtectedRoute;