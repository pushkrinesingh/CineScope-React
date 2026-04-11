import { useState } from "react";

function LocationData() {
  const [Location, setLocation] = useState(null);
  const [city, setCity] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theaters, setTheaters] = useState([]);
  const API_KEY = import.meta.env.VITE_GEO_KEY;

  function getLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setLocation({ lat, lng });

          //  fetch nearby theaters
   const query = `
  [out:json];
  (
    node["amenity"="cinema"](around:5000, ${lat}, ${lng});
    node["amenity"="theatre"](around:5000, ${lat}, ${lng});
    way["amenity"="cinema"](around:5000, ${lat}, ${lng});
  );
  out center;
`;

          const theaterRes = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
              method: "POST",
              body: query,
            },
          );

          const theaterData = await theaterRes.json();

          setTheaters(theaterData.elements || []);

          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${API_KEY}`,
          );

          const data = await res.json();

          const components = data.results[0].components;

          const cityName =
            components.city || components.town || components.village;

          setCity(cityName);
        } catch (err) {
          setError("Error fetching location");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }

  return { Location, city, error, loading, getLocation,theaters  };
}

export default LocationData;