import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../Pages/Home";
import SingleMovie from "../Pages/SingleMovie";
import Header from "./Header";
import Footer from "./Footer";
import { urls } from "../data";
import Watchlist from "../Pages/Watchlist";
import Login from "../Pages/Login";
import { createContext, useEffect, useState } from "react";
import SinglePerson from "../Pages/SinglePerson";
import ScrollToTop from "./ScrollToTop";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import PageNotFound from "../Pages/PageNotFound";
import { ToastContainer } from "react-toastify";
import GenrePage from "../Pages/GenrePage";
import Profile from "../Pages/Profile";
import ProtectedRoute from "./ProtectedRoute";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
export const MovieContext = createContext(null);

function Router() {
  const [WatchList, setWatchList] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setWatchList([]);
      return;
    }

    const colRef = collection(db, "watchlists", user.uid, "movies-shows");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const movies = snapshot.docs.map((doc) => doc.data());
      setWatchList(movies);
    });

    return () => unsub();
  }, [user]);

  async function AddToWatchlist(MovieToAdd) {
    const docId = `${MovieToAdd.media_type || (MovieToAdd.first_air_date ? "tv" : "movie")}_${MovieToAdd.id}`;
    const docRef = doc(db, "watchlists", user.uid, "movies-shows", docId);
    await setDoc(docRef, MovieToAdd);
  }


  async function RemoveFromWatchlist(IdToRemove) {
    const found = WatchList.find((item) => item.id === IdToRemove);
    const docId = `${found.media_type || (found.first_air_date ? "tv" : "movie")}_${IdToRemove}`;
    const docRef = doc(db, "watchlists", user.uid, "movies-shows", docId);
    await deleteDoc(docRef);
  }


  function IsInWatchlist(id) {
    return WatchList.some((item) => item.id === id);
  }
  function handleLogout() {
    signOut(auth)
      .then(() => {
        alert("Logged out ✅");
      })
      .catch((error) => {
        alert(error.message);
      });
  }

  return (
    <BrowserRouter>
      <MovieContext.Provider
        value={{
          WatchList,
          setWatchList,
          AddToWatchlist,
          RemoveFromWatchlist,
          IsInWatchlist,
          user,
          handleLogout,
        }}
      >
        <Header />
        <ScrollToTop />
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
                  heading="Popular"
                  btn1="Movies"
                  btn2="TV Shows"
                  urls={[urls.popularMovies, urls.popularTVShows]}
                />
                <Home
                  heading="Trending Celebrities"
                  btn1="Day"
                  btn2="Week"
                  urls={[urls.trendingCelebrities, urls.trendingCelebrities]}
                />
                <Home
                  heading="Top Rated"
                  btn1="Movies"
                  btn2="TV Shows"
                  urls={[urls.topRatedMovies, urls.topRatedTVShows]}
                />
                <Home
                  heading="UpComing"
                  btn1="Movies"
                  btn2="TV Shows"
                  urls={[urls.upcomingMovies, urls.upcomingTVShows]}
                />
              </>
            }
          />

          <Route path="/movie/:id" element={<SingleMovie />} />
          <Route path="/tv/:id" element={<SingleMovie />} />
          <Route path="/person/:id" element={<SinglePerson />} />
          <Route path="/genre/:id" element={<GenrePage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <Watchlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>

        <Footer />
        <ToastContainer
          position="bottom-right"
          autoClose={1500}
          theme="dark"
          newestOnTop
          closeOnClick
          pauseOnHover={false}
        />
      </MovieContext.Provider>
    </BrowserRouter>
  );
}

export default Router;
