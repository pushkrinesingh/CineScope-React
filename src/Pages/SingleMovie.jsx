import { useParams, useLocation, Link } from "react-router-dom";
import { useContext, useEffect, useState, useRef } from "react";
import { baseImageUrl } from "../data";
import {
  FaStar,
  FaPlayCircle,
  FaUser,
  FaRegArrowAltCircleRight,
  FaRegArrowAltCircleLeft,
} from "react-icons/fa";
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
import Home from "./Home";

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
  const [providerLink, setProviderLink] = useState("");
  const [creatorLabel, setCreatorLabel] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [fetchError, setFetchError] = useState(false);
  const [streamProviders, setStreamProviders] = useState([]);
  const [rentProviders, setRentProviders] = useState([]);
  const [buyProviders, setBuyProviders] = useState([]);
  const [ageRating, setAgeRating] = useState("N/A");
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const navigate = useNavigate();
  const castRef = useRef(null);

  const { AddToWatchlist, RemoveFromWatchlist, IsInWatchlist, user } =
    useContext(MovieContext);

  useEffect(() => {
    fetchMovie();
    setShowTrailer(false);
    setTrailer(null);
  }, [id, isTV]);

  useEffect(() => {
    if (isTV) {
      fetchSeasonDetails(selectedSeason);
    }
  }, [selectedSeason, id, isTV]);

  useEffect(() => {
    const q = query(
      collection(db, "reviews"),
      where("movieId", "==", String(id)),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviews = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserReviews(reviews);
      },
      (error) => {
        console.error("Reviews listener error:", error);
      },
    );

    return () => unsubscribe();
  }, [id]);

  async function fetchMovie() {
    try {
      setFetchError(false);
      const type = isTV ? "tv" : "movie";

      const movieUrl = `https://api.themoviedb.org/3/${type}/${id}`;
      const castUrl = `https://api.themoviedb.org/3/${type}/${id}/credits`;
      const reviewUrl = `https://api.themoviedb.org/3/${type}/${id}/reviews`;
      const providerUrl = `https://api.themoviedb.org/3/${type}/${id}/watch/providers`;
      const ratingUrl = isTV
        ? `https://api.themoviedb.org/3/tv/${id}/content_ratings`
        : `https://api.themoviedb.org/3/movie/${id}/release_dates`;

      const [movieRes, castRes, reviewRes, providerRes, ratingRes] =
        await Promise.all([
          fetch(movieUrl, options),
          fetch(castUrl, options),
          fetch(reviewUrl, options),
          fetch(providerUrl, options),
          fetch(ratingUrl, options),
        ]);

      const movieData = await movieRes.json();
      const castData = await castRes.json();
      const reviewData = await reviewRes.json();
      const providerData = await providerRes.json();
      const ratingData = await ratingRes.json();

      if (isTV) {
        const indiaRating = ratingData.results?.find(
          (r) => r.iso_3166_1 === "IN",
        );

        const usRating = ratingData.results?.find((r) => r.iso_3166_1 === "US");

        setAgeRating(indiaRating?.rating || usRating?.rating || "N/A");
      } else {
        const indiaRelease = ratingData.results?.find(
          (r) => r.iso_3166_1 === "IN",
        );

        const usRelease = ratingData.results?.find(
          (r) => r.iso_3166_1 === "US",
        );

        const indiaCert = indiaRelease?.release_dates?.find(
          (r) => r.certification,
        )?.certification;

        const usCert = usRelease?.release_dates?.find(
          (r) => r.certification,
        )?.certification;

        setAgeRating(indiaCert || usCert || "N/A");
      }

      const indiaProviders = providerData.results?.IN;
      if (indiaProviders) {
        setProviderLink(indiaProviders.link);
        setStreamProviders(indiaProviders.flatrate || []);
        setRentProviders(indiaProviders.rent || []);
        setBuyProviders(indiaProviders.buy || []);
      } else {
        setStreamProviders([]);
        setRentProviders([]);
        setBuyProviders([]);
        setProviderLink("");
      }

      setMovie(movieData);

      const crew = castData.crew || [];

      if (isTV) {
        const creators = movieData.created_by
          ?.map((person) => person.name)
          .join(", ");

        const executiveProducers = crew
          .filter((member) => member.job === "Executive Producer")
          .map((member) => member.name)
          .join(", ");

        setCreatorLabel("Creator");
        setCreatorName(creators || executiveProducers || "N/A");
      } else {
        let directorObj = crew.find((member) => member.job === "Director");

        if (!directorObj) {
          directorObj = crew.find(
            (member) => member.department === "Directing",
          );
        }

        setCreatorLabel("Director");
        setCreatorName(directorObj?.name || "N/A");
      }

      const mainCast = (castData.cast || [])
        .filter((actor) => actor.profile_path)
        .sort((a, b) => a.order - b.order)
        .slice(0, 35);

      setCast(mainCast);
      setReviews(reviewData.results.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch movie:", error);
      setFetchError(true);
    }
  }

  function scrollCastLeft() {
    castRef.current?.scrollBy({
      left: -1050,
      behavior: "smooth",
    });
  }

  function scrollCastRight() {
    castRef.current?.scrollBy({
      left: 1050,
      behavior: "smooth",
    });
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
      toast.error("Something went wrong ");
    }
  }

  async function deleteReview(reviewId) {
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.success("Review deleted");
    } catch (error) {
      toast.error("Failed to delete review ");
      console.error("Delete review error:", error);
    }
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

    try {
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
      } else {
        toast.info("No trailer available for this title.");
      }
    } catch (error) {
      toast.error("Failed to load trailer. Try again.");
    }
  }

  async function fetchSeasonDetails(seasonNumber) {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}`,
        options,
      );

      const data = await res.json();

      setSeasonDetails(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleEpisodes() {
    await fetchSeasonDetails(selectedSeason);

    setShowEpisodes(true);
  }

  if (fetchError)
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h2>Something went wrong </h2>
        <p style={{ color: "gray" }}>
          Could not load movie details. Check your connection and try again.
        </p>
        <button onClick={fetchMovie}>Retry</button>
      </div>
    );

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
              src={
                movie.poster_path
                  ? `${baseImageUrl}${movie.poster_path}`
                  : "https://placehold.co/300x450?text=No+Image"
              }
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
              {movie.genres?.map((e) => e.name).join(" | ") || "N/A"}
            </p>

            <p className="release">
              Release Date : {movie.release_date || movie.first_air_date}
            </p>

            <p className="rating">
              <span>Rating : </span>
              <FaStar /> {movie.vote_average?.toFixed(1)}/10
            </p>

            <p className="age-rating">
              <span>Rated : </span>
              {ageRating}
            </p>

            <p className="status">
              <span>Status : </span>
              {movie.status || "N/A"}
            </p>

            <p className="director">
              <span>{creatorLabel} : </span>
              {creatorName}
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
                <div className="season-actions">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  >
                    {movie.seasons?.map((season) => (
                      <option key={season.id} value={season.season_number}>
                        {season.name}
                      </option>
                    ))}
                  </select>

                  <button className="episodes-btn" onClick={handleEpisodes}>
                    View Episodes
                  </button>
                </div>
              </>
            )}

            {showEpisodes && (
              <div
                className="episodes-modal"
                onClick={() => setShowEpisodes(false)}
              >
                <div
                  className="episodes-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="episode-close-btn"
                    onClick={() => setShowEpisodes(false)}
                  >
                    <ImCancelCircle />
                  </div>

                  <h2>
                    {movie.name} - Season {selectedSeason}
                  </h2>

                  <div className="episodes-list">
                    {seasonDetails?.episodes?.map((ep) => (
                      <div className="episode-card" key={ep.id}>
                        <img
                          src={
                            ep.still_path
                              ? `https://image.tmdb.org/t/p/w500${ep.still_path}`
                              : "https://placehold.co/500x280?text=No+Image"
                          }
                          alt={ep.name}
                        />

                        <div className="episode-info">
                          <h3>
                            Episode {ep.episode_number}: {ep.name}
                          </h3>

                          <p>{ep.overview || "No description available."}</p>

                          <span>
                            ⭐ {ep.vote_average?.toFixed(1)} •{" "}
                            {ep.runtime || "N/A"} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="provider-section">
              <h2>Available On</h2>

              {streamProviders.length === 0 &&
              rentProviders.length === 0 &&
              buyProviders.length === 0 ? (
                <div className="no-provider">
                  <p>Not available on any platform yet</p>
                </div>
              ) : (
                <div className="provider-categories">
                  {streamProviders.length > 0 && (
                    <div className="provider-category">
                      <span className="provider-tag stream"> Stream</span>
                      <div className="provider-logos">
                        {streamProviders.map((p) => (
                          <a
                            key={p.provider_id}
                            href={providerLink}
                            target="_blank"
                            rel="noreferrer"
                            className="provider-logo-wrap"
                            title={p.provider_name}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                              alt={p.provider_name}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {rentProviders.length > 0 && (
                    <div className="provider-category">
                      <span className="provider-tag rent"> Rent</span>
                      <div className="provider-logos">
                        {rentProviders.map((p) => (
                          <a
                            key={p.provider_id}
                            href={providerLink}
                            target="_blank"
                            rel="noreferrer"
                            className="provider-logo-wrap"
                            title={p.provider_name}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                              alt={p.provider_name}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {buyProviders.length > 0 && (
                    <div className="provider-category">
                      <span className="provider-tag buy"> Buy</span>
                      <div className="provider-logos">
                        {buyProviders.map((p) => (
                          <a
                            key={p.provider_id}
                            href={providerLink}
                            target="_blank"
                            rel="noreferrer"
                            className="provider-logo-wrap"
                            title={p.provider_name}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                              alt={p.provider_name}
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="trailer-btn" onClick={handleTrailer}>
              <FaPlayCircle /> {showTrailer ? "Close Trailer" : "Watch Trailer"}
            </button>

            <button
              className="watchlist-btn"
              onClick={async () => {
                if (!user) {
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
        <div className="cast-header">
          <h2 className="cast-heading">Cast</h2>

          <div className="cast-controls">
            <button onClick={scrollCastLeft}>
              <FaRegArrowAltCircleLeft />
            </button>
            <button onClick={scrollCastRight}>
              <FaRegArrowAltCircleRight />
            </button>
          </div>
        </div>

        <div className="cast-grid" ref={castRef}>
          {cast.map((actor) => (
            <Link
              key={actor.id}
              to={`/person/${actor.id}`}
              className="cast-card"
            >
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

      <div className="similar-section">
        <Home
          heading={isTV ? "Similar TV Shows" : "Similar Movies"}
          urls={[
            `https://api.themoviedb.org/3/${isTV ? "tv" : "movie"}/${id}/similar`,
          ]}
        />
      </div>

      <div className="review-section">
        <h2>Critics Reviews</h2>
        {Reviews.map((rev) => (
          <div key={rev.id} className="review-card">
            <b>{rev.author}</b>
            <p>
              {rev.content.length > 300
                ? rev.content.slice(0, 300) + "..."
                : rev.content}
            </p>
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
