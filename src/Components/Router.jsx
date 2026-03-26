import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../Pages/Home";
import SingleMovie from "../Pages/SingleMovie";
import Header from "./Header";
import Footer from "./Footer";
import { urls } from "../data";
import Watchlist from "../Pages/Watchlist";
import Login from "../Pages/Login";

function Router() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Home
                heading="Trending Movies"
                btn1="Day"
                btn2="Week"
                urls={[urls.trendingByDay, urls.trendingByWeek]}
              />
              <Home
                heading="Popular Movies"
                btn1="Movies"
                btn2="TV Shows"
                urls={[urls.popularMovies, urls.popularTVShows]}
              />
              <Home
                heading="Top Rated Movies"
                btn1="Movies"
                btn2="TV Shows"
                urls={[urls.topRatedMovies, urls.topRatedTVShows]}
              />
            </>
          }
        />
        <Route path="/movie/:id" element={<SingleMovie />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default Router;
