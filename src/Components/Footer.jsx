import React from "react";
import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaCopyright,
  FaHeart,
} from "react-icons/fa";
import "./Footer.css";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <h2>CineScope</h2>
          <p>
            Discover movies, explore TV shows, and build your personal
            watchlist. Your ultimate entertainment companion.
          </p>

          <h3>
            Made By <FaHeart /> Pushkrine Pratap Singh
          </h3>
        </div>
        <div className="footer-bottom-row">
          <div className="footer-links">
            <h3>Quick Links</h3>
            <Link to={"/"}>Home</Link>
            <Link to={"/watchlist"}>Watchlist</Link>
            <Link to={"/profile"}>Profile</Link>
            <Link to={"/login"}>Login</Link>
          </div>

          <div className="footer-socials">
            <h3>Connect</h3>

            <div className="icons">
              <a
                href="https://github.com/pushkrinesingh"
                target="_blank"
                rel="noreferrer"
              >
                <FaGithub />
              </a>
              <a
                href="https://www.instagram.com/pushkrine.singh/"
                target="_blank"
                rel="noreferrer"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.linkedin.com/in/pushkrinesingh/"
                target="_blank"
                rel="noreferrer"
              >
                <FaLinkedin />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          <FaCopyright /> {new Date().getFullYear()} CineScope. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
