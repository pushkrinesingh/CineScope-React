import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { options } from "../data";
import "./MoodRecommender.css";
import { FaMagic } from "react-icons/fa";
import { MovieContext } from "./Router";

const MoodRecommender = () => {
  const { user } = useContext(MovieContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [mood, setMood] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getMoodRecommendations = async () => {
    if (!mood.trim()) return;

    setLoading(true);
    setError("");
    setMovies([]);

    try {
      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: ` You are a movie expert. Suggest 12 popular movies that perfectly match the user's mood. Return ONLY a JSON array.
                Do NOT include any explanation, text, or markdown.

                Strict format:
                [
                  {"title": "Movie Name", "year": 2020, "reason": "Why it matches"}
                ]

                Rules:
                - Use ONLY double quotes
                - No trailing commas
                - No extra text before or after JSON
                - Keep output valid JSON ONLY`,
              },
              {
                role: "user",
                content: `User mood: ${mood}`,
              },
            ],
            max_tokens: 600,
            temperature: 0.85,
          }),
        },
      );

      const groqData = await groqRes.json();
      const content = groqData.choices[0].message.content;

      let suggestions = [];

      try {
        suggestions = JSON.parse(content);
      } catch (err1) {
        try {
          const start = content.indexOf("[");
          const end = content.lastIndexOf("]") + 1;

          if (start !== -1 && end !== -1) {
            const sliced = content.slice(start, end);

            const cleaned = sliced
              .replace(/,\s*}/g, "}")
              .replace(/,\s*]/g, "]")
              .replace(/[\u0000-\u001F]+/g, "");

            suggestions = JSON.parse(cleaned);
          } else {
            throw new Error("No JSON found");
          }
        } catch (err2) {
          console.error("FULL AI RESPONSE:", content);
          console.error("Parsing failed completely");

          setError("AI failed to generate valid data. Try again.");
          setLoading(false);
          return;
        }
      }

      const fetchMovieDetails = async (title) => {
        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`,
            options,
          );
          const data = await res.json();
          const movie = data.results[0];
          if (movie) {
            return {
              id: movie.id,
              title: movie.title,
              year: movie.release_date
                ? movie.release_date.split("-")[0]
                : "N/A",
              poster: movie.poster_path
                ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                : null,
              reason:
                suggestions.find(
                  (s) => s.title === title || s.title?.includes(title),
                )?.reason || "",
            };
          }
        } catch (e) {}
        return null;
      };

      const detailedMovies = await Promise.all(
        suggestions.map((s) => fetchMovieDetails(s.title)),
      );
      setMovies(detailedMovies.filter(Boolean));
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movieId) => {
    setShowModal(false);
    navigate(`/movie/${movieId}`);
  };
  useEffect(() => {
    if (location.state?.openMood && user) {
      setShowModal(true);
    }
  }, [location]);
  const handleOpen = () => {
    if (!user) {
      navigate("/login?next=/", {
        state: { openMood: true },
      });
      return;
    }
    setShowModal(true);
  };

  return (
    <>
      <button className="mood-btn" onClick={handleOpen}>
        <FaMagic /> Mood Suggestions
      </button>

      {showModal && (
        <div className="mood-overlay">
          <div className="mood-modal">
            <div className="mood-header">
              <h2>What are you in the mood for?</h2>
              <button
                className="mood-close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="mood-input-area">
              <textarea
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="Example: Today is a cozy rainy day... or It's our anniversary..."
                rows="4"
              />
              <button
                className="get-btn"
                onClick={getMoodRecommendations}
                disabled={loading || !mood.trim()}
              >
                {loading ? "Finding perfect movies..." : "Get Recommendations"}
              </button>
            </div>

            {error && <p className="error">{error}</p>}

            {movies.length > 0 && (
              <div className="mood-movies-grid">
                {movies.map((movie, i) => (
                  <div
                    key={i}
                    className="mood-movie-card"
                    onClick={() => handleMovieClick(movie.id)}
                  >
                    <img src={movie.poster} alt={movie.title} />
                    <div className="mood-movie-info">
                      <h4>
                        {movie.title} <span>({movie.year})</span>
                      </h4>
                      <p className="mood-reason">{movie.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MoodRecommender;
