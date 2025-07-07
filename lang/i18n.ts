import i18n from 'i18next';
import {initReactI18next} from 'react-i18next'
import * as Loc from 'react-native-localize';
import en from './en.json';
import fr from './fr.json';
import ja from './ja.json';
import kn from './kn.json';
import te from './te.json';
import ml from './ml.json';
import ta from './ta.json';
import { settingC } from '@/constants/file';

i18n.use({
        type:'languageDetector',
        async: true,
        detect: (cb:any) => {
            const savelang = settingC.getString('lang')
            if(savelang) return cb(savelang);
            const fit = Loc.findBestLanguageTag(['en', 'ml','ta'])?.languageTag || 'en'
            settingC.set('lang',fit);
            cb(fit);
        },
        init:()=>{},
        cacheUserLanguage: () => {},
    }).use(initReactI18next).init({
    fallbackLng: 'en',
    resources: {
            en:{translation:en},
            fr:{translation:fr},
            ja:{translation:ja},
            kn:{translation:kn},
            te:{translation:te},
            ml:{translation:ml},
            ta:{translation:ta}
        },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
