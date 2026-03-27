import React, { useContext } from "react";
import { MovieContext } from "../Components/Router";
import { baseImageUrl } from "../data";
import { Link } from "react-router-dom";
import "./Home.css"; 

const WatchList = () => {

  const { WatchList } = useContext(MovieContext);

  function trimContent(content) {
    if (!content) return "";
    return content.length > 20 ? content.slice(0, 20) + "..." : content;
  }

  return (
    <div className="home-section">

      <h2>Your WatchList</h2>

      <div className="movie-grid">

        {WatchList.length > 0 ? (

          WatchList.map((item) => (

            <div key={item.id} className="movie-card">

              {item.poster_path && (
                <Link to={`/movie/${item.id}`}>
                  <img
                    src={`${baseImageUrl}${item.poster_path}`}
                    alt={item.title}
                  />
                </Link>
              )}

              <div className="content">

                <h3>{trimContent(item.title || item.name)}</h3>

                <p>
                  {item.release_date
                    ? new Date(item.release_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "2-digit",
                      })
                    : ""}
                </p>

              </div>

            </div>
          ))

        ) : (
          <p>No movies in WatchList</p>
        )}

      </div>

    </div>
  );
};

export default WatchList;