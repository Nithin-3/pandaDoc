import i18n from 'i18next';
import {initReactI18next} from 'react-i18next'
import * as Loc from 'react-native-localize';
import en from './en.json';
import ml from './ml.json';
import ta from './ta.json';
import { lang } from '@/constants/file';

i18n.use({
        type:'languageDetector',
        async: true,
        detect: (cb:any) => {
            const savelang = lang.getString('lang')
            if(savelang) return cb(savelang);
            const fit = Loc.findBestLanguageTag(['en', 'ml','ta'])?.languageTag || 'en'
            lang.set('lang',fit);
            cb(fit);
        },
        init:()=>{},
        cacheUserLanguage: () => {},
    }).use(initReactI18next).init({
    fallbackLng: 'en',
    resources: {
            en:{translation:en},
            ml:{translation:ml},
            ta:{translation:ta}
        },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
