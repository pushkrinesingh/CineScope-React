import { useContext, useEffect, useState } from "react";
import { baseImageUrl } from "../data";
import "./Home.css";
import { Link } from "react-router-dom";
import { FaBookmark } from "react-icons/fa";
import { MovieContext } from "../Components/Router";

function Home({ urls, heading, btn1, btn2 }) {
  const [movieData, setMovieData] = useState([]);
  const [showData, setShowData] = useState(urls[0]);

  const { AddToWatchlist } = useContext(MovieContext);

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
    if (!content) return "";
    return content.length > 20 ? content.slice(0, 20) + "..." : content;
  }

  return (
    <section className="home-section">
      <header className="home-header">
        <h2>{heading}</h2>

        <div className="toggle-buttons">
          <button
            className={showData === urls[0] ? "active-btn" : ""}
            onClick={() => setShowData(urls[0])}
          >
            {btn1}
          </button>

          <button
            className={showData === urls[1] ? "active-btn" : ""}
            onClick={() => setShowData(urls[1])}
          >
            {btn2}
          </button>
        </div>
      </header>

      <div className="movie-grid">
        {movieData.length > 0 ? (
          movieData.map((item) => {
            const isTV = showData.includes("tv");

            return (
              <div key={item.id} className="movie-card">
                {item.poster_path && (
                  <Link to={`/${isTV ? "tv" : "movie"}/${item.id}`}>
                    <img
                      src={`${baseImageUrl}${item.poster_path}`}
                      alt={item.title || item.name}
                    />
                  </Link>
                )}

                <div className="content">
                  <h3>{trimContent(item.title || item.name)}</h3>

                  <p>
                    {item.release_date || item.first_air_date
                      ? new Date(
                          item.release_date || item.first_air_date,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "2-digit",
                        })
                      : ""}
                  </p>

                  <button onClick={() => AddToWatchlist(item)}>
                    <FaBookmark /> WatchList
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-data">No Data To Show Yet!</p>
        )}
      </div>
    </section>
  );
}

export default Home;
