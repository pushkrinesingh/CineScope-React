const API_TOKEN = import.meta.env.VITE_API_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3/";
export const baseImageUrl = "https://image.tmdb.org/t/p/original";
function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return { today: `${year}-${month}-${day}`, year };
}

export const urls = {
  trendingByDay: `${BASE_URL}trending/movie/day?language=en-US`,
  trendingByWeek: `${BASE_URL}trending/movie/week?language=en-US`,
  popularMovies: `${BASE_URL}movie/popular?language=en-US`,
  popularTVShows: `${BASE_URL}tv/popular?language=en-US`,
  topRatedMovies: `${BASE_URL}movie/top_rated?language=en-US`,
  topRatedTVShows: `${BASE_URL}tv/top_rated?language=en-US`,

  get upcomingMovies() {
    const { today, year } = getToday();
    return `${BASE_URL}discover/movie?primary_release_date.gte=${today}&primary_release_date.lte=${year}-12-31&sort_by=popularity.desc&language=en-US&include_adult=false`;
  },

  get upcomingTVShows() {
    const { today, year } = getToday();
    return `${BASE_URL}discover/tv?first_air_date.gte=${today}&first_air_date.lte=${year}-12-31&sort_by=popularity.desc&language=en-US&include_adult=false`;
  },

  trendingCelebrities: `${BASE_URL}person/popular`,
};

export const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
  },
};
