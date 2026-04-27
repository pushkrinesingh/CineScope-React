import React, { useContext, useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BiSolidCameraMovie } from "react-icons/bi";
import { MdOutlineLogin, MdDarkMode, MdLightMode } from "react-icons/md";
import { FaBookmark, FaSearch, FaUser, FaBars, FaTimes } from "react-icons/fa";
import { options } from "../data";
import "./Header.css";
import { MovieContext } from "./Router";

const dummyPoster = "https://via.placeholder.com/92x138?text=No+Image";

const Header = () => {
  const { handleLogout, user, theme, toggleTheme } = useContext(MovieContext);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [genres, setGenres] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
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
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?language=en-US`,
          options,
        );
        const data = await res.json();
        setGenres(data.genres || []);
      } catch (err) {
        console.error("Failed to fetch genres:", err);
      }
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

        const [movieData, tvData, personData] = await Promise.all([
          movieRes.json(),
          tvRes.json(),
          personRes.json(),
        ]);

        const movies =
          movieData.results?.map((m) => ({ ...m, media_type: "movie" })) || [];
        const tv =
          tvData.results?.map((t) => ({ ...t, media_type: "tv" })) || [];
        const people =
          personData.results?.map((p) => ({ ...p, media_type: "person" })) ||
          [];

        let collectionMovies = [];
        if (movies.length > 0) {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movies[0].id}`,
            options,
          );
          const detailData = await detailRes.json();
          if (detailData.belongs_to_collection) {
            const collectionRes = await fetch(
              `https://api.themoviedb.org/3/collection/${detailData.belongs_to_collection.id}`,
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
            index ===
            self.findIndex(
              (t) => t.id === item.id && t.media_type === item.media_type,
            ),
        );
        setSuggestions(unique.sort((a, b) => b.popularity - a.popularity));
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 150);
    return () => clearTimeout(delay);
  }, [query]);

  function handleClick(item) {
    navigate(
      item.media_type === "person"
        ? `/person/${item.id}`
        : `/${item.media_type}/${item.id}`,
    );
    setQuery("");
    setSuggestions([]);
    setActiveIndex(-1);
    setSearchOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown")
      setActiveIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
    else if (e.key === "ArrowUp")
      setActiveIndex((prev) =>
        prev - 1 >= 0 ? prev - 1 : suggestions.length - 1,
      );
    else if (e.key === "Enter" && activeIndex >= 0)
      handleClick(suggestions[activeIndex]);
  }

  const getImageSrc = (item) => {
    if (item.media_type === "person") {
      return item.profile_path
        ? `https://image.tmdb.org/t/p/w92${item.profile_path}`
        : dummyPoster;
    }
    return item.poster_path
      ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
      : dummyPoster;
  };

  const SuggestionsList = () => (
    <div className="suggestions">
      {suggestions.map((item, index) => (
        <div
          key={`${item.media_type}-${item.id}`}
          className={`suggestion-item ${index === activeIndex ? "active" : ""}`}
          onClick={() => handleClick(item)}
        >
          <img src={getImageSrc(item)} alt={item.title || item.name} />
          <div>
            <p>{highlightText(item.title || item.name, query)}</p>
            <span>
              {item.media_type === "person" ? "Celebrity" : item.media_type}
              {" • "}
              {(item.release_date || item.first_air_date)?.slice(0, 4)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const GenreSelect = () => (
    <div className="genre-inline">
      <select
        value={genreId}
        onChange={(e) => {
          e.target.value ? navigate(`/genre/${e.target.value}`) : navigate("/");
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
  );

  return (
    <>
      <header className="header">
        <div className="logo">
          <Link to="/">
            <BiSolidCameraMovie />
            CineScope
          </Link>
        </div>

        <div className="searchbar desktop-search" ref={searchRef}>
          <GenreSelect />
          <input
            type="text"
            placeholder="Search Movies / Series / Celebrities"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" aria-label="Search">
            <FaSearch />
          </button>
          {suggestions.length > 0 && <SuggestionsList />}
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
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <MdLightMode /> : <MdDarkMode />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Toggle search"
          >
            <FaSearch />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <button
          type="button"
          className="theme-toggle desktop-theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <MdLightMode /> : <MdDarkMode />}
        </button>
      </header>

      {searchOpen && (
        <div className="mobile-searchbar" ref={searchRef}>
          <div className="searchbar">
            <GenreSelect />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button type="button" aria-label="Search">
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
                  <img src={getImageSrc(item)} alt={item.title || item.name} />
                  <div>
                    <p>{highlightText(item.title || item.name, query)}</p>
                    <span>
                      {item.media_type === "person"
                        ? "Celebrity"
                        : item.media_type}
                      {" • "}
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
              <MdOutlineLogin /> Logout
            </button>
          ) : (
            <NavLink to="/login" className="nav-item">
              <MdOutlineLogin /> Login
            </NavLink>
          )}
        </div>
      )}
    </>
  );
};

export default Header;
