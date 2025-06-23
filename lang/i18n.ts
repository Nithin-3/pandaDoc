import i18n from 'i18next';
import {initReactI18next} from 'react-i18next'
import * as Loc from 'react-native-localize';
import en from './en.json';

i18n.use({
        type:'languageDetector',
        async: true,
        detect: (cb:any) => {
            const bestLang = Loc.findBestLanguageTag(['en', 'fr']);
            cb(bestLang?.languageTag || 'en');
        },
        init:()=>{},
        cacheUserLanguage: () => {},
    }).use(initReactI18next).init({
    fallbackLng: 'en',
    resources: {
            en:{translation:en},
        },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
