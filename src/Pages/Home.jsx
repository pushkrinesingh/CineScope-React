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
  const [showData, setShowData] = useState(urls);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { AddToWatchlist, RemoveFromWatchlist, IsInWatchlist, user } =
    useContext(MovieContext);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        const response = await Promise.all(
          showData.map((url) => fetch(url, options)),
        );
        const result = await Promise.all(response.map((res) => res.json()));
        const combinedData = result.flatMap((r) => r.results || []);
        setMovieData(combinedData);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [showData]);

  function trimContent(content) {
    if (!content) return "";
    return content.length > 20 ? content.slice(0, 20) + "..." : content;
  }

  const isPerson = showData.some((url) => url.includes("person"));

  return (
    <section className="home-section">
      <header className="home-header">
        <h2>{heading}</h2>
        {!isPerson && (
          <div className="toggle-buttons">
            <button
              className={showData[0] === urls[0] ? "active-btn" : ""}
              onClick={() => setShowData([urls[0]])}
            >
              {btn1}
            </button>
            <button
              className={showData[0] === urls[1] ? "active-btn" : ""}
              onClick={() => setShowData([urls[1]])}
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
          movieData.map((item, index) => {
            const imagePath = item.poster_path || item.profile_path;
            const title = item.title || item.name;

            return (
              <div
                key={index}
                className={item.profile_path ? "celeb-card" : "movie-card"}
              >
                {imagePath && (
                  <div className="img-wrapper">
                    <Link
                      to={
                        item.profile_path
                          ? `/person/${item.id}`
                          : `/${item.first_air_date ? "tv" : "movie"}/${item.id}`
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
