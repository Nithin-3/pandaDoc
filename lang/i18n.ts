import i18n from 'i18next';
import {initReactI18next} from 'react-i18next'
import * as Loc from 'react-native-localize';
import en from './en.json';
import fr from './fr.json';
import de from './de.json';
import es from './es.json';
import ja from './ja.json';
import ml from './ml.json';
import ta from './ta.json';

i18n.use({
        type:'languageDetector',
        async: true,
        detect: (cb:any) => {
            const bestLang = Loc.findBestLanguageTag(['en', 'fr','de','es','ja','ml','ta']);
            cb(bestLang?.languageTag || 'en');
        },
        init:()=>{},
        cacheUserLanguage: () => {},
    }).use(initReactI18next).init({
    fallbackLng: 'en',
    resources: {
            en:{translation:en},
            fr:{translation:fr},
            de:{translation:de},
            es:{translation:es},
            ja:{translation:ja},
            ml:{translation:ml},
            ta:{translation:ta}
        },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
