import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import { MovieContext } from './Router';
import './OnboardingPopup.css';
import { options } from '../data';


const OnboardingPopup = () => {
  const { user } = useContext(MovieContext);

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedActor, setSelectedActor] = useState(null);
  const [loadingActors, setLoadingActors] = useState(false);
  const [loadingFact, setLoadingFact] = useState(false);
  
  const [randomMaleActors, setRandomMaleActors] = useState([]);
  const [randomFemaleActors, setRandomFemaleActors] = useState([]);
  const [funFact, setFunFact] = useState("");

  const fetchActorsFromAI = async () => {
    setLoadingActors(true);
    try {
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_KEY;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{
            role: "user",
            content: "Give me 4 popular male actors and 4 popular female actors right now. Return only JSON: {male: [names], female: [names]}"
          }],
          max_tokens: 200,
          temperature: 0.8
        })
      });

      const data = await res.json();
      const content = data.choices[0].message.content;
      const json = JSON.parse(content.match(/\{.*\}/s)[0]);

      const maleNames = json.male || [];
      const femaleNames = json.female || [];

      const fetchImage = async (name) => {
        try {
          const searchRes = await fetch(
            `https://api.themoviedb.org/3/search/person&query=${encodeURIComponent(name)}`,options
          );
          const searchData = await searchRes.json();
          
          const person = searchData.results[0];
          if (person?.profile_path) {
            return `https://image.tmdb.org/t/p/w300${person.profile_path}`;
          }
        } catch (e) {}
        return `https://picsum.photos/id/${Math.floor(Math.random()*100)+100}/300/300`; // fallback
      };

      const maleWithImages = await Promise.all(
        maleNames.map(async (name) => ({
          name,
          image: await fetchImage(name)
        }))
      );

      const femaleWithImages = await Promise.all(
        femaleNames.map(async (name) => ({
          name,
          image: await fetchImage(name)
        }))
      );

      setRandomMaleActors(maleWithImages);
      setRandomFemaleActors(femaleWithImages);

    } catch (error) {
      console.error(error);
      setRandomMaleActors([
        { name: "Shah Rukh Khan", image: "https://image.tmdb.org/t/p/w300/5qHNjhtj4F0h5q7q9q7q7q7q7q7q.jpg" },
        { name: "Hrithik Roshan", image: "https://image.tmdb.org/t/p/w300/1f2f2f2f2f2f2f2f2f2f2f2f2f2f2f.jpg" }
      ]);
    } finally {
      setLoadingActors(false);
    }
  };

  const generateFunFact = async (actorName) => {
    setLoadingFact(true);
    setFunFact("");
    try {
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_KEY;
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "Give one short interesting fun fact about this actor." },
            { role: "user", content: `Fun fact about ${actorName}` }
          ],
          max_tokens: 120,
          temperature: 0.9
        })
      });
      const data = await res.json();
      setFunFact(data.choices[0].message.content.trim());
    } catch {
      setFunFact(`${actorName} is a very talented and popular actor.`);
    } finally {
      setLoadingFact(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const key = `onboardingCompleted_${user.uid}`;
    if (!localStorage.getItem(key)) {
      setShowModal(true);
      setStep(1);
      fetchActorsFromAI();
    }
  }, [user]);

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    setStep(2);
  };

  const handleActorSelect = async (actor) => {
    setSelectedActor(actor);
    setStep(3);
    await generateFunFact(actor.name);
  };

  const handleComplete = () => {
    if (user) localStorage.setItem(`onboardingCompleted_${user.uid}`, 'true');
    setShowModal(false);
  };

  if (!showModal || !user) return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="modal-header">
          <h2>Personalize Your Experience</h2>
          <button className="pop-close-btn" onClick={handleComplete}>×</button>
        </div>

        {step === 1 && (
          <div className="step">
            <p>Do you prefer Male or Female actors?</p>
            <div className="gender-buttons">
              <button onClick={() => handleGenderSelect('male')} disabled={loadingActors}>
                Male Actors
              </button>
              <button onClick={() => handleGenderSelect('female')} disabled={loadingActors}>
                Female Actors
              </button>
            </div>
            {loadingActors && <p className="loading">AI is finding fresh actors with real photos...</p>}
          </div>
        )}

        {step === 2 && selectedGender && (
          <div className="step">
            <p>Choose your favorite {selectedGender} actor:</p>
            <div className="actors-grid">
              {(selectedGender === 'male' ? randomMaleActors : randomFemaleActors).map((actor, i) => (
                <div key={i} className="actor-card" onClick={() => handleActorSelect(actor)}>
                  <img src={actor.image} alt={actor.name} />
                  <p>{actor.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && selectedActor && (
          <div className="step">
            <h3>Fun Fact about {selectedActor.name}</h3>
            {loadingFact ? (
              <p className="loading">🤖 Generating fun fact...</p>
            ) : (
              <p className="fun-fact">{funFact}</p>
            )}
            <button className="continue-btn" onClick={handleComplete} disabled={loadingFact}>
              Continue to Website
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPopup;