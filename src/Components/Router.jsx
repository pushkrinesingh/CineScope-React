import { Routes, Route, useLocation } from "react-router-dom";
import Home from "../Pages/Home";
import SingleMovie from "../Pages/SingleMovie";
import Header from "./Header";
import Footer from "./Footer";
import { urls } from "../data";
import Watchlist from "../Pages/Watchlist";
import Login from "../Pages/Login";
import { createContext, useCallback, useEffect, useState } from "react";
import SinglePerson from "../Pages/SinglePerson";
import ScrollToTop from "./ScrollToTop";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import PageNotFound from "../Pages/PageNotFound";
import { ToastContainer, toast } from "react-toastify";
import GenrePage from "../Pages/GenrePage";
import Profile from "../Pages/Profile";
import ProtectedRoute from "./ProtectedRoute";
import OnboardingPopup from "./OnboardingPopup";
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import MoodRecommender from "./MoodRecommender";

export const MovieContext = createContext(null);

function Router() {
  const [WatchList, setWatchList] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  useEffect(() => {
    async function fetchTheme() {
      if (!user) {
        document.documentElement.setAttribute("data-theme", theme);
        return;
      }
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
        console.error("Failed to fetch theme:", err);
      }
    }
    fetchTheme();
  }, [user]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);

    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { theme: newTheme });
    } catch (err) {
      console.error("Theme update failed:", err);
    }
  }, [theme, user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user && location.state?.pendingMovie) {
      AddToWatchlist(location.state.pendingMovie);
    }
  }, [user]);

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
      .then(() => toast.success("Logged out successfully ✅"))
      .catch((error) => toast.error(error.message));
  }

  return (
    <MovieContext.Provider
      value={{
        WatchList,
        setWatchList,
        AddToWatchlist,
        RemoveFromWatchlist,
        IsInWatchlist,
        user,
        loading,
        handleLogout,
        theme,
        toggleTheme,
      }}
    >
      <Header />
      <MoodRecommender />
      <OnboardingPopup />
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
  );
}

export default Router;
