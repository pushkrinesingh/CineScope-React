const API_TOKEN = import.meta.env.VITE_API_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3/";
export const baseImageUrl = "https://image.tmdb.org/t/p/original";
let year = 2026;
export const urls = {
  trendingByDay: `${BASE_URL}trending/movie/day?language=en-US`,
  trendingByWeek: `${BASE_URL}trending/movie/week?language=en-US`,
  popularMovies: `${BASE_URL}movie/popular?language=en-US`,
  popularTVShows: `${BASE_URL}tv/popular?language=en-US`,
  topRatedMovies: `${BASE_URL}movie/top_rated?language=en-US`,
  topRatedTVShows: `${BASE_URL}tv/top_rated?language=en-US`,

  upcomingMovies: `${BASE_URL}discover/movie?primary_release_date.gte=${year}-05-01&primary_release_date.lte=${year}-12-31&sort_by=popularity.desc&language=en-US`,

  upcomingTVShows: `${BASE_URL}discover/tv?first_air_date.gte=2026-05-30&first_air_date.lte=2028-01-01&sort_by=popularity.desc`,

  trendingCelebrities: `${BASE_URL}person/popular`,
};

export const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
  },
};