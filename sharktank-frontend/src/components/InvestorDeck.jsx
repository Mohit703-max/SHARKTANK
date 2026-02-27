import { useEffect, useState } from "react";
import { fetchPitches, swipePitch } from "../api/api";
import { motion, AnimatePresence } from "framer-motion";

export default function InvestorDeck() {
  const [pitches, setPitches] = useState([]);
  const [action, setAction] = useState(""); // "liked" | "disliked"
  const [popup, setPopup] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPitches();
        setPitches(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleSwipe = async (liked, pitchId) => {
    setAction(liked ? "liked" : "disliked");
    setPopup(liked ? "Liked this pitch!" : "Disliked this pitch!");

    setTimeout(() => {
      setAction("");
      setPopup("");
      setPitches((prev) => prev.filter((p) => p._id !== pitchId));
    }, 1000);

    try {
      await swipePitch(pitchId, liked);
    } catch (err) {
      console.error(err);
    }
  };

  if (pitches.length === 0)
    return <p className="text-center mt-20 text-gray-600">No pitches available.</p>;

  return (
    <div className="relative w-full max-w-md mx-auto mt-10 h-[600px]">
      <AnimatePresence>
        {pitches.map((p, idx) => (
          <motion.div
            key={p._id}
            drag="y"
            dragElastic={0.3} // super smooth pull
            dragConstraints={{ top: 0, bottom: 0 }}
            whileDrag={{ scale: 1.05, rotate: 2 }} // subtle rotation/scale
            onDragEnd={(e, info) => {
              if (info.point.y < -100 || info.velocity.y < -500) handleSwipe(true, p._id);
              else if (info.point.y > 100 || info.velocity.y > 500) handleSwipe(false, p._id);
            }}
            initial={{ y: 50 * idx, opacity: 0 }}
            animate={{ y: 50 * idx, opacity: 1 }}
            exit={{ y: -500, opacity: 0 }}
            className="absolute w-full h-[300px] rounded-xl shadow-lg p-6 bg-white flex flex-col justify-between cursor-grab"
            style={{ top: `${idx * 30}px`, zIndex: pitches.length - idx }}
          >
            <div>
              <h3 className="text-xl font-bold mb-2">{p.title}</h3>
              <p className="text-gray-700">{p.description}</p>
              <p className="mt-2 text-sm text-gray-500">
                Industry: {p.industry || "N/A"}
              </p>
              <p className="text-sm text-gray-500">
                Funding Goal: ${p.fundingGoal || "N/A"}
              </p>
            </div>

            {/* Semi-circle action icon */}
            {action && idx === 0 && (
              <div
                className={`absolute top-0 right-0 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${
                  action === "liked" ? "bg-green-400" : "bg-red-400"
                }`}
                style={{ clipPath: "circle(50% at 50% 50%)", transform: "translate(50%, -50%)" }}
              >
                {action === "liked" ? "✔" : "✖"}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Popup message */}
      {popup && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg font-semibold text-white ${
            action === "liked" ? "bg-green-500" : "bg-red-500"
          } shadow-lg`}
        >
          {popup}
        </div>
      )}
    </div>
  );
}