import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { baseImageUrl } from "../data";
import "./SinglePerson.css";
import { options } from "../data";
function SinglePerson() {
  const { id } = useParams();

  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    async function fetchPerson() {
      const personURL = `https://api.themoviedb.org/3/person/${id}`;

      const movieURL = `https://api.themoviedb.org/3/person/${id}/movie_credits`;

      try {
        const [personRes, movieRes] = await Promise.all([
          fetch(personURL, options),
          fetch(movieURL, options),
        ]);

        const personData = await personRes.json();
        const movieData = await movieRes.json();

        setPerson(personData);
        const sortedMovies = (movieData.cast || [])
          .filter((m) => m.poster_path)
          .sort((a, b) => b.popularity - a.popularity);
        

        setMovies(sortedMovies);
      } catch (error) {
        console.error(error);
      }
    }

    fetchPerson();
  }, [id]);

  if (!person) {
    return (
      <section className="person-page">
        <div className="person-info">
          <div className="skeleton skeleton-img"></div>

          <div className="person-text">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-bio"></div>
          </div>
        </div>

        <h2>Known For</h2>

        <div className="movie-container">
          {Array(10)
            .fill()
            .map((_, i) => (
              <div key={i} className="movie-box">
                <div className="skeleton skeleton-poster"></div>
                <div className="skeleton skeleton-movie-title"></div>
              </div>
            ))}
        </div>
      </section>
    );
  }

  return (
    <section className="person-page">
      <div className="person-info">
        <img src={`${baseImageUrl}${person.profile_path}`} alt={person.name} />

        <div>
          <h1>{person.name}</h1>

          <p>
            <b>Birthday:</b> {person.birthday}
          </p>
          <p>
            <b>Place of Birth:</b> {person.place_of_birth}
          </p>

          <p className="bio">{person.biography}</p>
        </div>
      </div>

      <h2>Known For</h2>

      <div className="movie-container">
        {movies.slice(0, visibleCount).map((movie) => (
          <div key={movie.id} className="movie-box">
            <Link to={`/movie/${movie.id}`}>
              <img
                src={`${baseImageUrl}${movie.poster_path}`}
                alt={movie.title}
              />
            </Link>

            <p>{movie.title}</p>
          </div>
        ))}
      </div>
      {visibleCount < movies.length && (
        <button
          className="load-more-btn"
          onClick={() => setVisibleCount((prev) => prev + 10)}
        >
          Load More
        </button>
      )}
    </section>
  );
}

export default SinglePerson;
