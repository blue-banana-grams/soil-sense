import { useEffect, useState } from 'react';
import { Landing } from './components/Landing';
import { Results } from './components/Results';
import { locationUrl, readLocation, type ChosenLocation } from './lib/route';

function App({ embedded = false }: { embedded?: boolean }) {
  const [location, setLocation] = useState<ChosenLocation | null>(() => readLocation(window.location.search));

  useEffect(() => {
    const onPop = () => setLocation(readLocation(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = (next: ChosenLocation | null, replace = false) => {
    const url = locationUrl(next, embedded);
    if (replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    setLocation(next);
    window.scrollTo(0, 0);
  };

  return location ? (
    <Results
      key={`${location.lat},${location.lng}`}
      location={location}
      embedded={embedded}
      onMove={(next) => go(next, true)}
      onChangeLocation={() => go(null)}
    />
  ) : (
    <Landing embedded={embedded} onChoose={(next) => go(next)} />
  );
}

export default App;
