import { useParams, useLocation, Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { baseImageUrl } from "../data";
import { FaStar, FaPlayCircle, FaUser } from "react-icons/fa";
import { BsBookmarkCheckFill, BsBookmarkPlusFill } from "react-icons/bs";
import { ImCancelCircle } from "react-icons/im";
import { MdDelete, MdEdit } from "react-icons/md";

import "./SingleMovie.css";
import { MovieContext } from "../Components/Router";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { options } from "../data";

function SingleMovie() {
  const { id } = useParams();
  const location = useLocation();
  const isTV = location.pathname.includes("/tv");
  const [cast, setCast] = useState([]);
  const [movie, setMovie] = useState(null);
  const [trailerKey, setTrailer] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [Reviews, setReviews] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [providers, setProviders] = useState([]);
  const [providerLink, setProviderLink] = useState("");
  const [director, setDirector] = useState("");
  const navigate = useNavigate();

  let { AddToWatchlist, RemoveFromWatchlist, IsInWatchlist, user } =
    useContext(MovieContext);

  useEffect(() => {
    fetchMovie();
    setShowTrailer(false);
    setTrailer(null);
  }, [id, isTV]);

  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      where("movieId", "==", String(id)),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserReviews(reviews);
    });

    return () => unsubscribe();
  }, [id]);

  async function fetchMovie() {
    const type = isTV ? "tv" : "movie";

    const movieUrl = `https://api.themoviedb.org/3/${type}/${id}`;
    const castUrl = `https://api.themoviedb.org/3/${type}/${id}/credits`;
    const reviewUrl = `https://api.themoviedb.org/3/${type}/${id}/reviews`;
    const providerUrl = `https://api.themoviedb.org/3/${type}/${id}/watch/providers`;

    const moviePromise = fetch(movieUrl, options);
    const castPromise = fetch(castUrl, options);
    const reviewPromise = fetch(reviewUrl, options);
    const providerPromise = fetch(providerUrl, options);

    const [movieRes, castRes, reviewRes, providerRes] = await Promise.all([
      moviePromise,
      castPromise,
      reviewPromise,
      providerPromise,
    ]);

    const movieData = await movieRes.json();
    const castData = await castRes.json();
    const reviewData = await reviewRes.json();
    const providerData = await providerRes.json();
    const indiaProviders = providerData.results?.IN;

    if (indiaProviders) {
      setProviderLink(indiaProviders.link);

      if (indiaProviders.flatrate) {
        setProviders(indiaProviders.flatrate);
      }
    }
    setMovie(movieData);

    const crew = castData.crew || [];
    const directorObj = crew.find((member) => member.job === "Director");
    setDirector(directorObj?.name || "N/A");

    const mainCast = (castData.cast || [])
      .filter((actor) => actor.profile_path)
      .sort((a, b) => a.order - b.order)
      .slice(0, 30);

    setCast(mainCast);
    setReviews(reviewData.results.slice(0, 5));
  }

  async function submitReview() {
    if (!user) {
      toast.warning("Login to post review");
      navigate(`/login?next=${location.pathname}`);
      return;
    }

    if (!reviewText.trim()) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, "reviews", editingId), {
          text: reviewText,
        });

        setEditingId(null);
      } else {
        await addDoc(collection(db, "reviews"), {
          movieId: String(id),
          text: reviewText,
          username: user.email.split("@")[0].replace(/[0-9.]/g, ""),
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      setReviewText("");
    } catch (error) {
      toast.error("Something went wrong ❌");
    }
  }

  async function deleteReview(reviewId) {
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.success("Review deleted");
      setUserReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (error) {}
  }
  function handleEdit(review) {
    setReviewText(review.text);
    setEditingId(review.id);
  }

  async function handleTrailer() {
    if (showTrailer) {
      setShowTrailer(false);
      return;
    }

    const type = isTV ? "tv" : "movie";

    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/${id}/videos`,
      options,
    );

    const data = await res.json();

    const trailer = data.results.find(
      (vid) => vid.type === "Trailer" && vid.site === "YouTube",
    );

    if (trailer) {
      setTrailer(trailer.key);
      setShowTrailer(true);
    }
  }

  if (!movie)
    return (
      <div className="single-skeleton">
        <div className="skeleton-left"></div>

        <div className="skeleton-right">
          <div className="skeleton-title"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text"></div>
          <div className="skeleton-text small"></div>
          <div className="skeleton-btn"></div>
          <div className="skeleton-btn"></div>
        </div>
      </div>
    );

  return (
    <div className="page">
      <div
        className="backdrop"
        style={{
          backgroundImage: movie.backdrop_path
            ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
            : `url(https://image.tmdb.org/t/p/w500${movie.poster_path})`,
        }}
      >
        <div className="single-movie">
          <div className="left">
            <img
              src={`${baseImageUrl}${movie.poster_path}`}
              alt={movie.title || movie.name}
            />
          </div>

          <div className="right">
            <h1>{movie.title || movie.name}</h1>

            <p className="overview">
              <span>Description:</span>
              {movie.overview}
            </p>
            <p className="genre">
              <span>Genre : </span>
              {movie.genres.map((e) => e.name).join(" | ") || "N/A"}
            </p>

            <p className="release">
              Release Date : {movie.release_date || movie.first_air_date}
            </p>

            <p className="rating">
              <span>Rating : </span>
              <FaStar /> {movie.vote_average?.toFixed(1)}/10
            </p>

            <p className="director">
              <span>Director : </span>
              {director}
            </p>

            <p className="language">
              <span>Language : </span>
              {movie.spoken_languages?.map((e) => e.english_name).join(", ") ||
                "N/A"}
            </p>

            {isTV && (
              <>
                <p className="season">
                  <span>Seasons : </span>
                  {movie.number_of_seasons || "N/A"}
                </p>

                <p className="episodes">
                  <span>Total Episodes : </span>
                  {movie.number_of_episodes || "N/A"}
                </p>
              </>
            )}

            <div className="provider-section">
              <h2>Available On</h2>

              {providers.length > 0 ? (
                <div className="provider-list">
                  {providers.map((p) => (
                    <a
                      key={p.provider_id}
                      href={providerLink}
                      target="_blank"
                      rel="noreferrer"
                      className="provider-item"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w200${p.logo_path}`}
                        alt={p.provider_name}
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="no-provider">Not on streaming yet 🍿</p>
              )}
            </div>

            <button className="trailer-btn" onClick={handleTrailer}>
              <FaPlayCircle /> {showTrailer ? "Close Trailer" : "Watch Trailer"}
            </button>

            <button
              className="watchlist-btn"
              onClick={async () => {
                if (!user) {
                  toast.warning("Please login first ⚠️");
                  navigate(`/login?next=${location.pathname}`, {
                    state: { pendingMovie: movie },
                  });
                  return;
                }

                if (IsInWatchlist(movie.id)) {
                  await RemoveFromWatchlist(movie.id);
                } else {
                  await AddToWatchlist({
                    ...movie,
                    media_type: isTV ? "tv" : "movie",
                  });
                }
              }}
            >
              {IsInWatchlist(movie.id) ? (
                <BsBookmarkCheckFill />
              ) : (
                <BsBookmarkPlusFill />
              )}
              {IsInWatchlist(movie.id)
                ? " Remove From Watchlist"
                : " Add To Watchlist"}
            </button>
          </div>
        </div>
      </div>

      {showTrailer && trailerKey && (
        <div className="trailer-modal" onClick={() => setShowTrailer(false)}>
          <div className="trailer-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setShowTrailer(false)}>
              <ImCancelCircle />
            </span>

            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <div className="cast-section">
        <h2 className="cast-heading">Cast</h2>

        <div className="cast-grid">
          {cast.map((actor, index) => (
            <Link key={index} to={`/person/${actor.id}`} className="cast-card">
              <div className="cast-img">
                {actor.profile_path ? (
                  <img
                    src={`${baseImageUrl}${actor.profile_path}`}
                    alt={actor.name}
                  />
                ) : (
                  <div className="no-cast-img">
                    <FaUser />
                  </div>
                )}
              </div>

              <p className="cast-name">{actor.name}</p>
              <span className="cast-character">as {actor.character}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="review-section">
        <h2>Critics Reviews</h2>

        {Reviews.map((rev) => (
          <div key={rev.id} className="review-card">
            <b>{rev.author}</b>
            <p>{rev.content.slice(0, 300)}...</p>
          </div>
        ))}
        <div className="user-reviews">
          <h4>User Reviews</h4>
          {userReviews.length === 0 ? (
            <p>No user reviews yet</p>
          ) : (
            userReviews.map((r) => (
              <div className="review-card" key={r.id}>
                <div className="review-top">
                  <b>{r.username}</b>

                  {user && r.userId === user.uid && (
                    <div className="review-btns">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(r)}
                        title="Edit Your Review"
                      >
                        <MdEdit />
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => deleteReview(r.id)}
                        title="Delete Your Review"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  )}
                </div>

                <p>{r.text}</p>
              </div>
            ))
          )}

          <h3>Post Your Reviews</h3>

          <div className="review-input">
            <textarea
              placeholder="Write your review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <button onClick={submitReview}>
              {editingId ? "Update Review" : "Post Review"}
            </button>
          </div>

          {editingId && (
            <button
              className="cancel-btn"
              onClick={() => {
                setEditingId(null);
                setReviewText("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SingleMovie;
