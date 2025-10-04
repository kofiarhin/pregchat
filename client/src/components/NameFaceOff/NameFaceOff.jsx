import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import useNamesQuery from "../../hooks/useNamesQuery.js";
import { shuffle } from "../../utils/shuffle.js";
import content from "../../content/appContent.json";
import "./nameFaceOff.styles.scss";

const STORAGE_KEY = "faceoffState:v1";

const createNamesHash = (list) =>
  list
    .reduce((hash, name, index) => {
      let nextHash = hash;
      const combined = `${name}-${index}`;

      for (let position = 0; position < combined.length; position += 1) {
        nextHash = (nextHash << 5) - nextHash + combined.charCodeAt(position);
        nextHash |= 0;
      }

      return nextHash;
    }, 0)
    .toString(16);

const NameFaceOff = () => {
  const [searchParams] = useSearchParams();
  const querySignature = searchParams.toString();
  const urlSeed = searchParams.get("seed");

  const filters = useMemo(() => {
    const allowedKeys = ["limit", "gender", "style", "q"];
    return allowedKeys.reduce((accumulator, key) => {
      const value = searchParams.get(key);
      if (value) {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});
  }, [querySignature]);

  const { data: names = [], isLoading, isError } = useNamesQuery(filters);

  const namesHash = useMemo(() => createNamesHash(names), [names]);

  const [orderedNames, setOrderedNames] = useState([]);
  const [gameState, setGameState] = useState({
    champion: "",
    index: 1,
    winner: null,
  });
  const [initialized, setInitialized] = useState(false);
  const namesHashRef = useRef("0");
  const seedRef = useRef(null);
  const resumedRef = useRef(false);

  useEffect(() => {
    if (!names.length) {
      setOrderedNames([]);
      setGameState({ champion: "", index: 1, winner: null });
      setInitialized(true);
      resumedRef.current = false;
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }

    let storedState = null;
    if (typeof window !== "undefined") {
      try {
        const value = window.localStorage.getItem(STORAGE_KEY);
        storedState = value ? JSON.parse(value) : null;
      } catch (error) {
        storedState = null;
      }
    }

    let activeSeed = urlSeed || storedState?.seed || seedRef.current;
    if (!activeSeed) {
      activeSeed = `${Date.now()}-${Math.random()}`;
    }
    seedRef.current = activeSeed;

    const shuffled = shuffle(names, activeSeed);
    const shuffledHash = createNamesHash(shuffled);
    namesHashRef.current = shuffledHash;

    const storedIsValid =
      storedState &&
      storedState.seed === activeSeed &&
      storedState.namesHash === shuffledHash &&
      typeof storedState.index === "number" &&
      shuffled.includes(storedState.champion);
    resumedRef.current = Boolean(storedIsValid);

    const initialChampion = shuffled[0] ?? "";
    const initialIndex = shuffled.length > 1 ? 1 : shuffled.length;
    const initialWinner = shuffled.length <= 1 ? initialChampion || null : null;

    const champion = storedIsValid ? storedState.champion : initialChampion;
    const index = storedIsValid
      ? Math.min(Math.max(storedState.index, 1), shuffled.length)
      : initialIndex;
    const winner =
      storedIsValid && index >= shuffled.length
        ? storedState.champion
        : initialWinner;

    setOrderedNames(shuffled);
    setGameState({ champion, index, winner });
    setInitialized(true);
  }, [namesHash, urlSeed]);

  useEffect(() => {
    if (!initialized || !orderedNames.length || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        champion: gameState.champion,
        index: gameState.index,
        seed: seedRef.current,
        namesHash: namesHashRef.current,
      })
    );
  }, [gameState, initialized, orderedNames]);

  const handleKeepChampion = useCallback(() => {
    setGameState((prev) => {
      const nextIndex = Math.min(prev.index + 1, orderedNames.length);
      const winner = nextIndex >= orderedNames.length ? prev.champion : null;
      return {
        champion: prev.champion,
        index: nextIndex,
        winner,
      };
    });
  }, [orderedNames.length]);

  const handleSelectChallenger = useCallback(() => {
    setGameState((prev) => {
      const challenger = orderedNames[prev.index] ?? prev.champion;
      const nextIndex = Math.min(prev.index + 1, orderedNames.length);
      const winner = nextIndex >= orderedNames.length ? challenger : null;
      return {
        champion: challenger,
        index: nextIndex,
        winner,
      };
    });
  }, [orderedNames]);

  const handlePlayAgain = useCallback(() => {
    if (!names.length) {
      return;
    }

    const newSeed = urlSeed || `${Date.now()}-${Math.random()}`;
    seedRef.current = newSeed;
    const reshuffled = shuffle(names, newSeed);
    const reshuffledHash = createNamesHash(reshuffled);
    namesHashRef.current = reshuffledHash;
    resumedRef.current = false;

    const champion = reshuffled[0] ?? "";
    const index = reshuffled.length > 1 ? 1 : reshuffled.length;
    const winner = reshuffled.length <= 1 ? champion || null : null;

    setOrderedNames(reshuffled);
    setGameState({ champion, index, winner });

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          champion,
          index,
          seed: newSeed,
          namesHash: reshuffledHash,
        })
      );
    }
  }, [names, urlSeed]);

  const totalRounds = Math.max(orderedNames.length - 1, 0);
  const currentRound = Math.min(gameState.index, totalRounds);
  const challenger = orderedNames[gameState.index] ?? null;

  if (isLoading || !initialized) {
    return (
      <div className="name-faceoff__feedback">{content.faceOff.loading}</div>
    );
  }

  if (isError) {
    return (
      <div className="name-faceoff__feedback">{content.faceOff.error}</div>
    );
  }

  if (!orderedNames.length) {
    return (
      <div className="name-faceoff__feedback">{content.faceOff.empty}</div>
    );
  }

  if (orderedNames.length === 1) {
    return (
      <div className="name-faceoff__winner-card">
        <p className="name-faceoff__progress">{content.faceOff.notEnough}</p>
        <p className="name-faceoff__winner-name">{orderedNames[0]}</p>
        <button
          type="button"
          className="name-faceoff__play-again"
          onClick={handlePlayAgain}
        >
          {content.faceOff.playAgain}
        </button>
      </div>
    );
  }

  if (gameState.winner) {
    return (
      <div className="name-faceoff__winner-card">
        <div className="name-faceoff__status">
          <p>{content.faceOff.winnerTitle}</p>
          <p className="name-faceoff__winner-name">{gameState.winner}</p>
        </div>
        <button
          type="button"
          className="name-faceoff__play-again"
          onClick={handlePlayAgain}
        >
          {content.faceOff.playAgain}
        </button>
      </div>
    );
  }

  return (
    <div className="name-faceoff">
      <div className="name-faceoff__status">
        <p className="name-faceoff__progress">
          {`${content.faceOff.progressPrefix} ${Math.max(
            currentRound,
            1
          )} / ${Math.max(totalRounds, 1)}`}
        </p>
        {resumedRef.current && (
          <p className="name-faceoff__resume">{content.faceOff.resume}</p>
        )}
      </div>
      <div className="name-faceoff__matchup">
        <button
          type="button"
          className="name-faceoff__button"
          onClick={handleKeepChampion}
        >
          {`${content.faceOff.championLabel}: ${gameState.champion}`}
        </button>
        <button
          type="button"
          className="name-faceoff__button name-faceoff__button--challenger"
          onClick={handleSelectChallenger}
          disabled={!challenger}
        >
          {challenger
            ? `${content.faceOff.challengerLabel}: ${challenger}`
            : content.faceOff.waiting}
        </button>
      </div>
    </div>
  );
};

export default NameFaceOff;
