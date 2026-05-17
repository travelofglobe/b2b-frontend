import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './utils/locales';

// Supported languages list
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', isRtl: true },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', isRtl: true },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }
];

const getInitialLanguage = () => {
  // Check stored language first
  const storedLng = localStorage.getItem('i18nextLng');
  if (storedLng && SUPPORTED_LANGUAGES.some(l => l.code === storedLng)) {
    return storedLng;
  }

  // Detect from browser settings
  const browserLngs = navigator.languages || [navigator.language || 'en'];
  for (const bLng of browserLngs) {
    const baseLng = bLng.split('-')[0].toLowerCase();
    if (SUPPORTED_LANGUAGES.some(l => l.code === baseLng)) {
      return baseLng;
    }
  }

  return 'en'; // Default fallback
};

const initialLng = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

// Handle RTL direction and Lang attribute globally on start and on language change
const updateDocumentDirection = (lng) => {
  const isRtl = SUPPORTED_LANGUAGES.some(l => l.code === lng && l.isRtl);
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  
  // Custom classes for fine-tuned CSS selector controls if needed
  if (isRtl) {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
  } else {
    document.documentElement.classList.add('ltr');
    document.documentElement.classList.remove('rtl');
  }
};

// Listen to language change to update Document Direction and persist
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  updateDocumentDirection(lng);
});

// Run initial execution
updateDocumentDirection(initialLng);

export default i18n;
