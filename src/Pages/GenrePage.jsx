import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { baseImageUrl, options } from "../data";
import "./GenrePage.css";
import { MovieContext } from "../Components/Router";
import { FaCheck, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";

const GenrePage = () => {
  const { id } = useParams();
  const [content, setContent] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const observer = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const { AddToWatchlist, RemoveFromWatchlist, IsInWatchlist, user } =
    useContext(MovieContext);

  useEffect(() => {
    setContent([]);
    setPage(1);
  }, [id]);

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        const [movieRes, tvRes] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/discover/movie?with_genres=${id}&page=${page}&include_adult=false`,
            options,
          ),
          fetch(
            `https://api.themoviedb.org/3/discover/tv?with_genres=${id}&page=${page}&include_adult=false`,
            options,
          ),
        ]);
        const movieData = await movieRes.json();
        const tvData = await tvRes.json();
        const movies =
          movieData.results?.map((m) => ({ ...m, media_type: "movie" })) || [];
        const tv =
          tvData.results?.map((t) => ({ ...t, media_type: "tv" })) || [];
        const combined = [...movies, ...tv].filter((item) => {
          if (item.adult === true) return false;
          const title = (item.title || item.name || "").toLowerCase();
          const adultWords = [
            "xxx",
            "erotic",
            "nude",
            "porn",
            "sex",
            "hot",
            "cock",
            "dick",
            "pussy",
          ];
          if (adultWords.some((word) => title.includes(word))) return false;
          return true;
        });

        setContent((prev) => {
          const merged = [...prev, ...combined];
          const unique = merged.filter(
            (item, index, self) =>
              index ===
              self.findIndex(
                (t) => t.id === item.id && t.media_type === item.media_type,
              ),
          );
          return unique;
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [id, page]);

  const lastElementRef = (node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) {
        setPage((prev) => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  };

  return (
    <div className="genre-container">
      <h2>Movies & TV Shows</h2>
      <div className="genre-grid">
        {content.map((item, index) => (
          <div
            className="film-card"
            key={`${item.media_type}-${item.id}`}
            ref={content.length === index + 1 ? lastElementRef : null}
          >
            <div className="genre-img-wrapper">
              <Link to={`/${item.media_type}/${item.id}`}>
                <img
                  src={
                    item.poster_path
                      ? `${baseImageUrl}${item.poster_path}`
                      : "https://via.placeholder.com/300x450?text=No+Image"
                  }
                  alt={item.title || item.name}
                />
              </Link>
              <button
                className={
                  IsInWatchlist(item.id)
                    ? "genre-imdb-btn-added"
                    : "genre-imdb-btn"
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
            </div>
            <div className="film-info">
              <h3>{item.title || item.name}</h3>
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
        ))}
      </div>
      {loading && <p className="loading">Loading more...</p>}
    </div>
  );
};

export default GenrePage;
