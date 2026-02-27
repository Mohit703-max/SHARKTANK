import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { createPitch } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function CreatePitch() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!user || user.user.role !== "innovator") return <p>Access Denied</p>;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [fundingGoal, setFundingGoal] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPitch({ title, description, industry, fundingGoal: Number(fundingGoal) });
      alert("Pitch created successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Pitch creation failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
      }}
    >
      <h2>Create New Pitch</h2>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <input placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
      <input type="number" placeholder="Funding Goal" value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)} required />
      <button type="submit">Submit Pitch</button>
    </form>
  );
}