import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = `f86cd3a0`;

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  // const [watched, setWatched] = useState([]);
  // const tempQuery = `interstellar`;

  const [watched, setWatched] = useState(function () {
    const stored = localStorage.getItem("watched");
    return JSON.parse(stored);
  });

  function handleSelectedId(id) {
    setSelectedId((selectedId) => (selectedId === id ? null : id));
  }

  function handleClosedSelectedId() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteWatched() {
    setWatched((watched) =>
      watched.filter((movie) => movie.imdbID === selectedId)
    );
  }

  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watched));
    },
    [watched]
  );

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");
          const res = await fetch(
            `http://www.omdbapi.com/?i=tt3896198&apikey=${KEY}&s=${query}`,
            { signal: controller.signal }
          );

          if (!res.ok) throw new Error("Something Went Wrong");
          const data = await res.json();
          if (data.Response === "False") throw new Error("Movie not Found");
          setMovies(data.Search);
          setError("");
          // console.log(data.Search);
        } catch (err) {
          // console.log(err.message);
          if (err.message !== "AbortError") {
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
          // setError([]);
        }
      }

      if (query.length < 3) {
        setError("");
        setMovies([]);
        return;
      }
      fetchMovies();

      return function () {
        controller.abort();
      };
    },
    [query]
  );
  return (
    <>
      <Navbar>
        <NavbarSearch query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </Navbar>
      <Main>
        <Box>
          {/* {isLoading ? <Loader /> : <MovieList movies={movies} />} */}
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList
              movies={movies}
              onSelectedId={handleSelectedId}
              // onCLoseMovie={handleClosedSelectedId}
            />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCLoseMovie={handleClosedSelectedId}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedMovieSummary watched={watched} />
              <WatchedMovieList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>❌</span> {message};
    </p>
  );
}

function Navbar({ children }) {
  return (
    <nav className="nav-bar">
      <NavbarLogo />
      {/* <NavbarSearch /> */}
      {children}
    </nav>
  );
}

function NavbarLogo() {
  return (
    <div className="logo">
      <span role="img">🎬</span>
      <h1>FlickFinder</h1>
    </div>
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Got <strong>{movies ? movies.length : 0}</strong> results
    </p>
  );
}

function NavbarSearch({ query, setQuery }) {
  const inputElement = useRef(null);

  useEffect(
    function () {
      function callback(e) {
        if (document.activeElement === inputElement.current) {
          return;
        }

        if (e.code === "Enter") {
          inputElement.current.focus();
          setQuery("");
        }
      }

      return () => document.addEventListener("keydown", callback);
    },
    [setQuery]
  );

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputElement}
    />
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

// function WatchedBox() {

//   const [isOpen2, setIsOpen2] = useState(true);

//   return (
//     <div className="box">
//       <button
//         className="btn-toggle"
//         onClick={() => setIsOpen2((open) => !open)}
//       >
//         {isOpen2 ? "–" : "+"}
//       </button>
//       {isOpen2 && (
//         <>

//         </>
//       )}
//     </div>
//   );
// }

function MovieList({ movies, onSelectedId }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          onSelectedId={onSelectedId}
          // onCLoseMovie={onCLoseMovie}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectedId }) {
  return (
    <li key={movie.imdbID} onClick={() => onSelectedId(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({ selectedId, onCLoseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const countRef = useRef(0);

  useEffect(
    function () {
      if (userRating) {
        countRef.current = countRef.current++;
      }
    },
    [userRating]
  );

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
  // console.log(isWatched);

  const watchedUserRating = watched.find((movie) => movie.imdbID)?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
    BoxOffice: boxoffice,
  } = movie;

  // console.log(title, year);

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );

        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }

      getMovieDetails();
    },
    [selectedId]
  );

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie : ${title}`;

      return function () {
        return (document.title = `FlickFinder`);
      };
    },
    [title]
  );

  useEffect(
    function () {
      function callback(e) {
        if (e.code === "Escape") {
          onCLoseMovie();
          console.log("Closed");
        }
      }

      document.addEventListener("keydown", callback);

      return function () {
        document.removeEventListener("keydown", callback);
      };
    },
    [onCLoseMovie]
  );

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDecisions: countRef.current,
    };

    onAddWatched(newWatchedMovie);
    onCLoseMovie();
  }

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCLoseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`poster of ${title} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>,{imdbRating} Imdb Rating
              </p>
              <p>Box Office: {boxoffice}</p>
            </div>
          </header>
          <section>
            {!isWatched ? (
              <>
                <div className="rating">
                  <StarRating
                    maxrating={10}
                    size={24}
                    onSetRating={(userRating) => setUserRating(userRating)}
                  />
                </div>
                {userRating > 0 && (
                  <button className="btn-add" onClick={handleAdd}>
                    +Add to you list
                  </button>
                )}{" "}
              </>
            ) : (
              <p className="rating">
                <b>You have rated this movie {watchedUserRating} ⭐</b>
              </p>
            )}

            <p>
              <em>{plot}</em>
            </p>
            <p>
              Starring: <b>{actors}</b>
            </p>
            <p>
              Directed by: <b>{director}</b>
            </p>
          </section>
        </>
      )}
      {/* {selectedId} */}
    </div>
  );
}

function WatchedMovieList({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <li key={movie.imdbID}>
          <img src={movie.poster} alt={`${movie.title} poster`} />
          <h3>{movie.title}</h3>
          <div>
            <p>
              <span>⭐️</span>
              <span>{movie.imdbRating}</span>
            </p>
            <p>
              <span>🌟</span>
              <span>{movie.userRating}</span>
            </p>
            <p>
              <span>⏳</span>
              <span>{movie.runtime} min</span>
            </p>

            <button
              className="btn-delete"
              onClick={() => onDeleteWatched(movie.imdbID)}
            >
              X
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function WatchedMovieSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you've </h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(1)}</span>
        </p>
        <p>
          <span>💫</span>
          <span>{avgUserRating.toFixed(1)}</span>
        </p>
        <p>
          <span>⏲️</span>
          <span>{avgRuntime.toFixed(1)} min</span>
        </p>
      </div>
    </div>
  );
}
