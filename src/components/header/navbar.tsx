import React from "react";
import Logo from "../../assets/logo.svg";
import "./navbar.css";

interface NavbarProps {
  onFetchDataClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onFetchDataClick }) => {
  return (
    <nav className="navbar">
      <div className="navbar-logo-holder">
        <img src={Logo} alt="logo" className="navbar-logo" />
        <h1> MQTT Cluster Topology with Clients</h1>
      </div>
      <ul className="navbar-link">
        <button className="navbar-link-btn" onClick={onFetchDataClick} disabled>
          Refetch
        </button>
      </ul>
    </nav>
  );
};

export default Navbar;
