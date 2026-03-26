import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { baseImageUrl } from "../data";
import { FaStar } from "react-icons/fa";

import "./SingleMovie.css"
function SingleMovie() {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);

  useEffect(() => {
    fetchMovie();
  }, [id]);

  async function fetchMovie() {
    const API_KEY = import.meta.env.VITE_API_KEY;

    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`,
    );

    const result = await response.json();

    setMovie(result);
    
}
if (!movie) return <h2>Loading...</h2>;


  return (
    <div className="single-movie">
      <img src={`${baseImageUrl}${movie.poster_path}`} alt={movie.title} />

      <h1>{movie.title}</h1>

      <p>{movie.overview}</p>

      <p>Release Date: {movie.release_date}</p>

      <p>Rating: <FaStar/> {movie.vote_average}/10</p>
    </div>
  );
}

export default SingleMovie;