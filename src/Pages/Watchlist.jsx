import React, { useContext } from "react";
import { MovieContext } from "../Components/Router";
import { baseImageUrl } from "../data";
import { Link } from "react-router-dom";
import "./Home.css";

const WatchList = () => {
  const { WatchList, RemoveFromWatchlist } = useContext(MovieContext);

  function trimContent(content) {
    if (!content) return "";
    return content.length > 20 ? content.slice(0, 20) + "..." : content;
  }

  return (
    <div className="watchlist-section">
      <h2>Your WatchList ({WatchList.length})</h2>

      <div className="movie-grid watchlist-grid">
        {WatchList.length > 0 ? (
          WatchList.map((item) => {
            const isTV = item.name !== undefined;

            return (
              <div key={item.id} className="movie-card">
                {item.poster_path && (
                  <Link to={`/${isTV ? "tv" : "movie"}/${item.id}`}>
                    <img
                      src={`${baseImageUrl}${item.poster_path}`}
                      alt={item.title || item.name}
                    />
                  </Link>
                )}

                <div className="content">
                  <h3>{trimContent(item.title || item.name)}</h3>

                  <p>
                    {item.release_date || item.first_air_date
                      ? new Date(
                          item.release_date || item.first_air_date,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "2-digit",
                        })
                      : ""}
                  </p>
                  <button className="watchlist-remove-btn"onClick={() => RemoveFromWatchlist(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="empty-state">
            Your Watchlist is empty. Start adding movies!
          </p>
        )}
      </div>
    </div>
  );
};

export default WatchList;
