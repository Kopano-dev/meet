// NOTE(longsleep): This loads all translation files to be included in the
// app bundle. They are not that large.

// Please keep imports and exports alphabetically sorted.
import de from './de.json';
import es from './es.json';
import fr from './fr.json';
import hi from './hi.json';
import hu from './hu.json';
import hr from './hr.json';
import is from './is.json';
import it from './it.json';
import ja from './ja.json';
import nb from './nb.json';
import nl from './nl.json';
import pl from './pl.json';
import ptPT from './pt_PT.json';
import ru from './ru.json';
import sl from './sl.json';

function enableLocales(locales, enabled) {
  if (process.env.NODE_ENV !== 'production') { // eslint-disable-line no-undef
    return locales;
  }
  return enabled.reduce(function(value, locale) {
    value[locale] = locales[locale];
    return value;
  }, {});
}

// Locales must follow BCP 47 format (https://tools.ietf.org/html/rfc5646).
const locales = enableLocales({
  de,
  es,
  fr,
  hi,
  hu,
  hr,
  is,
  it,
  ja,
  nb,
  nl,
  pl,
  'pt-PT': ptPT,
  ru,
  sl,
}, [
  // List of enabled languages in production builds.
  'de',
  'en-GB',
  'en-US',
  'fr',
  'hi',
  'nb',
  'nl',
  'pt-PT',
  'ru',
]);

export default locales;
