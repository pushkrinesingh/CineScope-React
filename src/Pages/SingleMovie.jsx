import { useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { baseImageUrl } from "../data";
import { FaBookmark, FaStar } from "react-icons/fa";
import { ImCancelCircle } from "react-icons/im";


import "./SingleMovie.css";
import { MovieContext } from "../Components/Router";

function SingleMovie() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [trailerKey, setTrailer] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  let {AddToWatchlist}=useContext(MovieContext);

  useEffect(() => {
    fetchMovie();
    setShowTrailer(false);
    setTrailer(null);
  }, [id]);

  async function fetchMovie() {
    const API_KEY = import.meta.env.VITE_API_KEY;

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`
    );

    const result = await response.json();
    setMovie(result);
  }

  async function handleTrailer() {
    if (showTrailer) {
      setShowTrailer(false);
      return;
    }

    const API_KEY = import.meta.env.VITE_API_KEY;

    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`
    );

    const data = await res.json();

    const trailer = data.results.find(
      (vid) => vid.type === "Trailer" && vid.site === "YouTube"
    );

    if (trailer) {
      setTrailer(trailer.key);
      setShowTrailer(true);
    }
  }

  if (!movie) return <h2 className="loading">Loading...</h2>;

  return (
    <div className="page">
      <div className="single-movie">

        <div className="left">
          <img
            src={`${baseImageUrl}${movie.poster_path}`}
            alt={movie.title}
          />
        </div>

        <div className="right">
          <h1>{movie.title}</h1>

          <p className="overview">{movie.overview}</p>

          <p className="release">
            Release Date: {movie.release_date}
          </p>

          <p className="rating">
            Rating:
            <FaStar /> {movie.vote_average.toFixed(1)}/10
          </p>

          <button className="trailer-btn" onClick={handleTrailer}>
            {showTrailer ? "Close Trailer" : "Watch Trailer"}
          </button>

          <button className="watchlist-btn" onClick={()=>AddToWatchlist(movie)}>
            <FaBookmark /> Add To Watchlist
          </button>
        </div>
      </div>

      {showTrailer && trailerKey && (
        <div
          className="trailer-modal"
          onClick={() => setShowTrailer(false)}
        >
          <div
            className="trailer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="close-btn"
              onClick={() => setShowTrailer(false)}
            >
              <ImCancelCircle/>
            </span>

            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

export default SingleMovie;