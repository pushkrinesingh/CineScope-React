import { useContext, useEffect, useState } from "react";
import { baseImageUrl } from "../data";
import "./Home.css";
import { Link, useLocation } from "react-router-dom";
import { FaPlus, FaCheck } from "react-icons/fa";
import { MovieContext } from "../Components/Router";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { options } from "../data";

function Home({ urls, heading, btn1, btn2 }) {
  const [movieData, setMovieData] = useState([]);
  const [activeUrl, setActiveUrl] = useState(urls[0]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { AddToWatchlist, RemoveFromWatchlist, IsInWatchlist, user } =
    useContext(MovieContext);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        const response = await fetch(activeUrl, options);
        const result = await response.json();
        setMovieData(result.results || []);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [activeUrl]);

  function trimContent(content) {
    if (!content) return "";
    return content.length > 20 ? content.slice(0, 20) + "..." : content;
  }

  const isPerson = activeUrl.includes("person");

  return (
    <section className="home-section">
      <header className="home-header">
        <h2>{heading}</h2>
        {!isPerson && urls[1] && btn1 && btn2 &&(
          <div className="toggle-buttons">
            <button
              className={activeUrl === urls[0] ? "active-btn" : ""}
              onClick={() => setActiveUrl(urls[0])}
            >
              {btn1}
            </button>
            <button
              className={activeUrl === urls[1] ? "active-btn" : ""}
              onClick={() => setActiveUrl(urls[1])}
            >
              {btn2}
            </button>
          </div>
        )}
      </header>

      <div className="movie-grid">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="movie-card skeleton">
              <div className="skeleton-img"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text small"></div>
              <div className="skeleton-btn"></div>
            </div>
          ))
        ) : movieData.length > 0 ? (
          movieData.map((item) => {
            const imagePath = item.poster_path || item.profile_path;
            const title = item.title || item.name;
            const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");

            return (
              <div
                key={`${mediaType}-${item.id}`}
                className={item.profile_path ? "celeb-card" : "movie-card"}
              >
                {imagePath && (
                  <div className="img-wrapper">
                    <Link
                      to={
                        item.profile_path
                          ? `/person/${item.id}`
                          : `/${mediaType}/${item.id}`
                      }
                    >
                      <img src={`${baseImageUrl}${imagePath}`} alt={title} />
                    </Link>

                    {!item.profile_path && (
                      <button
                        className={
                          IsInWatchlist(item.id) ? "imdb-btn-added" : "imdb-btn"
                        }
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!user) {
                            toast.warning("Please login first ⚠️");
                            navigate(`/login?next=${location.pathname}`, {
                              state: { pendingMovie: item },
                            });
                            return;
                          }
                          if (IsInWatchlist(item.id)) {
                            await RemoveFromWatchlist(item.id);
                          } else {
                            await AddToWatchlist(item);
                          }
                        }}
                        title="Add To WatchList"
                      >
                        {IsInWatchlist(item.id) ? <FaCheck /> : <FaPlus />}
                      </button>
                    )}
                  </div>
                )}

                <div className="content">
                  <h3>{trimContent(title)}</h3>
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