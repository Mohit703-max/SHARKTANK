import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import InvestorDeck from "../components/InvestorDeck";

export default function Dashboard() {
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const role = user?.user?.role;

  return (
    <div style={{ padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>SharkTank App</h1>
        <div>
          <span style={{ marginRight: "10px" }}>Role: {role}</span>
          <button onClick={logoutUser}>Logout</button>
        </div>
      </header>

      <main style={{ marginTop: "40px" }}>
        {role === "innovator" && (
          <div>
            <h2>Welcome, Innovator!</h2>
            <button style={{ marginTop: "20px", padding: "10px 20px" }} onClick={() => navigate("/create-pitch")}>
              Create New Pitch
            </button>
          </div>
        )}

        {role === "investor" && (
          <div>
            <h2>Investor Deck</h2>
            <InvestorDeck />
          </div>
        )}

        {role === "user" && <p>Welcome, user! Dashboard content coming soon.</p>}
      </main>
    </div>
  );
}