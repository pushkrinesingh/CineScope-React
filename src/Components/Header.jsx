import React, { useState, useEffect, useContext } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BiSolidCameraMovie } from "react-icons/bi";
import { MdOutlineLogin, MdDarkMode, MdLightMode } from "react-icons/md";
import { FaBookmark, FaSearch, FaUser, FaBars, FaTimes } from "react-icons/fa";
import { options } from "../data";
import "./Header.css";
import { MovieContext } from "./Router";
import { useRef } from "react";
import MoodRecommender from "./MoodRecommender";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const dummyPoster = "https://via.placeholder.com/92x138?text=No+Image";

const Header = () => {
  const [theme, setTheme] = useState("dark");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [genres, setGenres] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const { handleLogout, user } = useContext(MovieContext);
  const navigate = useNavigate();
  const location = useLocation();

  const genreId = location.pathname.startsWith("/genre/")
    ? location.pathname.split("/")[2]
    : "";

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  function highlightText(text, query) {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      ),
    );
  }

  async function toggleTheme() {
  const newTheme = theme === "dark" ? "light" : "dark";

  setTheme(newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);

  if (!user) return;

  try {
    const docRef = doc(db, "users", user.uid);

    await updateDoc(docRef, {
      theme: newTheme,
    });
  } catch (err) {
    console.error("Theme update failed", err);
  }
}

 useEffect(() => {
  async function fetchTheme() {
    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const savedTheme = snap.data().theme || "dark";
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    } catch (err) {
      console.error(err);
    }
  }

  fetchTheme();
}, [user]);


  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestions([]);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchGenres() {
      const res = await fetch(
        `https://api.themoviedb.org/3/genre/movie/list?language=en-US`,
        options,
      );
      const data = await res.json();
      setGenres(data.genres || []);
    }
    fetchGenres();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const [movieRes, tvRes, personRes] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`,
            options,
          ),
          fetch(
            `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}`,
            options,
          ),
          fetch(
            `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(query)}`,
            options,
          ),
        ]);
        const movieData = await movieRes.json();
        const tvData = await tvRes.json();
        const personData = await personRes.json();
        const movies =
          movieData.results?.map((m) => ({ ...m, media_type: "movie" })) || [];
        const tv =
          tvData.results?.map((t) => ({ ...t, media_type: "tv" })) || [];
        const people =
          personData.results?.map((p) => ({ ...p, media_type: "person" })) ||
          [];
        let collectionMovies = [];
        if (movies.length > 0) {
          const movieId = movies[0].id;
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movieId}`,
            options,
          );
          const detailData = await detailRes.json();
          if (detailData.belongs_to_collection) {
            const collectionId = detailData.belongs_to_collection.id;
            const collectionRes = await fetch(
              `https://api.themoviedb.org/3/collection/${collectionId}`,
              options,
            );
            const collectionData = await collectionRes.json();
            collectionMovies =
              collectionData.parts?.map((m) => ({
                ...m,
                media_type: "movie",
              })) || [];
          }
        }
        const combined = [...collectionMovies, ...movies, ...tv, ...people];
        const unique = combined.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id),
        );
        const sorted = unique.sort((a, b) => b.popularity - a.popularity);
        setSuggestions(sorted);
      } catch (err) {
        console.error(err);
      }
    }, 150);
    return () => clearTimeout(delay);
  }, [query]);

  function handleClick(item) {
    if (item.media_type === "person") {
      navigate(`/person/${item.id}`);
    } else {
      navigate(`/${item.media_type}/${item.id}`);
    }
    setQuery("");
    setSuggestions([]);
    setActiveIndex(-1);
    setSearchOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown")
      setActiveIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
    if (e.key === "ArrowUp")
      setActiveIndex((prev) =>
        prev - 1 >= 0 ? prev - 1 : suggestions.length - 1,
      );
    if (e.key === "Enter" && activeIndex >= 0)
      handleClick(suggestions[activeIndex]);
  }

  return (
    <>
      <header className="header">
        <div className="logo">
          <Link to="/">
            <BiSolidCameraMovie />
            CineScope
          </Link>
        </div>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <MdLightMode /> : <MdDarkMode />}
        </button>

        <div className="searchbar desktop-search" ref={searchRef}>
          <div className="genre-inline">
            <select
              value={genreId}
              onChange={(e) => {
                if (e.target.value) navigate(`/genre/${e.target.value}`);
                else navigate("/");
              }}
            >
              <option value="">All</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Search Movies / Series / Celebrities"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button>
            <FaSearch />
          </button>
          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((item, index) => (
                <div
                  key={`${item.media_type}-${item.id}`}
                  className={`suggestion-item ${index === activeIndex ? "active" : ""}`}
                  onClick={() => handleClick(item)}
                >
                  <img
                    src={
                      item.media_type === "person"
                        ? item.profile_path
                          ? `https://image.tmdb.org/t/p/w92${item.profile_path}`
                          : dummyPoster
                        : item.poster_path
                          ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                          : dummyPoster
                    }
                    alt={item.title || item.name}
                  />
                  <div>
                    <p>{highlightText(item.title || item.name, query)}</p>
                    <span>
                      {item.media_type === "person"
                        ? "Celebrity"
                        : item.media_type}{" "}
                      •{" "}
                      {(item.release_date || item.first_air_date)?.slice(0, 4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="navlinks desktop-nav">
          <NavLink to="/profile" className="nav-item">
            <FaUser /> Profile
          </NavLink>

          <NavLink to="/watchlist" className="nav-item">
            <FaBookmark /> Watchlist
          </NavLink>

          {user ? (
            <button className="logout" onClick={handleLogout}>
              <MdOutlineLogin /> Logout
            </button>
          ) : (
            <NavLink to="/login" className="nav-item">
              <MdOutlineLogin /> Login
            </NavLink>
          )}
        </div>

        <div className="mobile-icons">
          <button
            className="icon-btn"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <FaSearch />
          </button>
          <button className="icon-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="mobile-searchbar" ref={searchRef}>
          <div className="searchbar">
            <div className="genre-inline">
              <select
                value={genreId}
                onChange={(e) => {
                  if (e.target.value) navigate(`/genre/${e.target.value}`);
                  else navigate("/");
                }}
              >
                <option value="">All</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button>
              <FaSearch />
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="suggestions mobile-suggestions">
              {suggestions.map((item, index) => (
                <div
                  key={`${item.media_type}-${item.id}`}
                  className={`suggestion-item ${index === activeIndex ? "active" : ""}`}
                  onClick={() => handleClick(item)}
                >
                  <img
                    src={
                      item.media_type === "person"
                        ? item.profile_path
                          ? `https://image.tmdb.org/t/p/w92${item.profile_path}`
                          : dummyPoster
                        : item.poster_path
                          ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                          : dummyPoster
                    }
                    alt={item.title || item.name}
                  />
                  <div>
                    <p>{highlightText(item.title || item.name, query)}</p>
                    <span>
                      {item.media_type === "person"
                        ? "Celebrity"
                        : item.media_type}{" "}
                      •{" "}
                      {(item.release_date || item.first_air_date)?.slice(0, 4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {menuOpen && (
        <div className="mobile-menu">
          <NavLink to="/profile" className="nav-item">
            <FaUser /> Profile
          </NavLink>

          <NavLink to="/watchlist" className="nav-item">
            <FaBookmark /> Watchlist
          </NavLink>

          {user ? (
            <button className="logout" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <NavLink to="/login" className="nav-item">
              Login
            </NavLink>
          )}
        </div>
      )}
    </>
  );
};

export default Header;
