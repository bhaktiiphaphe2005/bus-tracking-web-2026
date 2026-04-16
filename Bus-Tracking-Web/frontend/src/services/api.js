import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// --- STUDENT AUTH ---

export const studentSignup = async (userData) => {
  try {
    const response = await api.post("/auth/student/signup", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Signup failed";
  }
};

export const studentLogin = async (credentials) => {
  try {
    const response = await api.post("/auth/student/login", credentials);
    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("role", "student"); // Save role for easy access
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || "Login failed";
  }
};

// --- DRIVER AUTH ---

export const driverLogin = async (credentials) => {
  try {
    const response = await api.post("/auth/driver/login", credentials);
    if (response.data) {
      localStorage.setItem("user", JSON.stringify(response.data));
      localStorage.setItem("role", "driver");
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || "Login failed";
  }
};

// --- BUS DATA ---

export const getAllBuses = async () => {
  try {
    const response = await api.get("/bus/all");
    return response.data;
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
};

export default api;