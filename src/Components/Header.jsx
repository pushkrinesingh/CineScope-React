import React from "react";
import { Link } from "react-router-dom";
import { BiSolidCameraMovie } from "react-icons/bi";
import { FaBookmark ,FaSearch} from "react-icons/fa";

import "./Header.css"

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <Link to={"/"}>
          <BiSolidCameraMovie />
          CineScope
        </Link>
      </div>

      <div className="searchbar">
        <input type="text" placeholder="Search Your Movies/Series"/>
        <button><FaSearch/></button>
      </div>

      <div className="navlinks">
        <Link to={"/watchlist"}>
          <FaBookmark />
          Watchlist
        </Link>
        <Link to={"/login"}>Login</Link>
      </div>
    </header>
  );
};

export default Header;
