import { useEffect, useState } from "react";
import { baseImageUrl } from "../data";
import "./Home.css";
import { Link } from "react-router-dom";

function Home({ urls, heading, btn1, btn2 }) {
  const [movieData, setMovieData] = useState([]);
  const [showData, setShowData] = useState(urls[0]);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch(showData);
        const result = await response.json();
        setMovieData(result.results || []);
      } catch (error) {
        console.error("Error fetching movies:", error);
      }
    }

    fetchMovies();
  }, [showData]);

  function trimContent(content) {
    if (content.length > 20) {
      return content.slice(0, 20) + "...";
    }
    return content;
  }

  return (
    <section className="home-section">
      <header className="home-header">
        <h2>{heading}</h2>

        <div className="toggle-buttons">
          <button className="active-btn" onClick={() => setShowData(urls[0])}>
            {btn1}
          </button>

          <button onClick={() => setShowData(urls[1])}>{btn2}</button>
        </div>
      </header>

      <div className="movie-grid">
        {movieData.length > 0 ? (
          movieData.map((item) => (
            <div key={item.id} className="movie-card">
              {item.poster_path && (
               <Link to={`/movie/${item.id}`}>
                  <img
                    src={`${baseImageUrl}${item.poster_path}`}
                    alt={item.title}
                  />
                </Link>
              )}

              <div className="content">
                <h3>{trimContent(item.title || item.name)}</h3>

                <p>
                  {item.release_date
                    ? new Date(item.release_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "2-digit",
                      })
                    : ""}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>No Data To Show Yet!</p>
        )}
      </div>
    </section>
  );
}

export default Home;
