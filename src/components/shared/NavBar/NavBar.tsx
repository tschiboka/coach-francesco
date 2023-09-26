import logo from "../../../assets/images/logo_dark.jpg";
import { GoChevronUp } from "react-icons/go";
import "./NavBar.scss";

const NavBar = () => {
    return (
        <header className="NavBar">
            <div className="branding" id="branding">
                <img src={logo} alt="logo" title="Logo" width="auto" />

                <div className="header__title">
                    <span className="header__title__name">
                        FRANCESCO&nbsp;LEVO
                    </span>

                    <span className="header__title__motto">
                        WORK&nbsp;&bull;&nbsp;BELIEVE&nbsp;&bull;&nbsp;PROGRESS
                    </span>
                </div>
            </div>

            <nav>
                <ul className="english" lang="en">
                    <li
                        className="nav__link current-page"
                        id="home"
                        title="Home Page"
                    >
                        <a href="#top">Home</a>
                    </li>

                    <li
                        className="nav__link"
                        id="about"
                        title="Learn More about Francesco"
                    >
                        <a href="./pages/about/about.html">
                            About&nbsp;Francesco
                        </a>
                    </li>

                    <li
                        className="nav__link"
                        id="results"
                        title="Success Stories That Francesco Is Proud of"
                    >
                        <a href="./pages/results/results.html">
                            Client Results
                        </a>
                    </li>

                    <li
                        className="nav__link"
                        id="events"
                        title="Find Classes, Availibility and Prices"
                    >
                        <a href="./pages/events/events.html">Events</a>
                    </li>

                    <li
                        className="nav__link"
                        id="contact"
                        title="How to Reach Out to Francesco"
                    >
                        <a href="./pages/contact/contact.html">Contact</a>
                    </li>
                </ul>

                <div className="nav__buttons" id="nav__buttons">
                    <div id="language-options" className="language-options">
                        <div
                            className="language-options--english active"
                            title="Engish Language Option"
                            //onClick="setLanguage('english')"
                        ></div>

                        <div
                            className="language-options--italian"
                            title="Opzione Italiano"
                            //onClick="setLanguage('italian')"
                        ></div>
                    </div>

                    <i
                        className="chevron-up"
                        title="Hide Navigation"
                        //onclick="toggleHeader()"
                    >
                        <GoChevronUp />
                    </i>
                </div>
            </nav>
        </header>
    );
};

export default NavBar;
