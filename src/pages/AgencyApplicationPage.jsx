import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationService } from '../services/locationService';
import { agencyApplicationService } from '../services/agencyApplicationService';
import PlaneLoading from '../components/PlaneLoading';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

// Local translation dictionary mapping for Agency Application page
const localTranslations = {
    en: {
        title: "Agency Application",
        subtitle: "Become our partner and access global luxury B2B inventory.",
        step1: "Company Details",
        step2: "Authorized Person",
        step3: "Business Profile",
        step1Header: "Step 1: Company Information",
        step2Header: "Step 2: Authorized Representative",
        step3Header: "Step 3: Business Profile",
        companyLegalName: "Company Legal Name *",
        brandName: "Brand Name",
        taxNumber: "Tax Number / VAT ID *",
        taxOffice: "Tax Office",
        country: "Country *",
        city: "City *",
        businessAddress: "Business Address *",
        postalCode: "Postal Code",
        website: "Website",
        companyRegNumber: "Company Reg Number",
        firstName: "First Name *",
        lastName: "Last Name *",
        jobTitle: "Job Title",
        emailAddress: "Email Address *",
        mobilePhone: "Mobile Phone *",
        whatsAppNumber: "WhatsApp Number",
        preferredLanguage: "Preferred Language *",
        timeZone: "Time Zone *",
        profilePhoto: "Profile Photo",
        agencyType: "Agency Type *",
        monthlyVolume: "Monthly Booking Volume *",
        preferredCurrency: "Preferred Currency *",
        mainMarkets: "Main Markets Served * (Select Multi)",
        apiIntegration: "API Integration Needed",
        apiIntegrationSub: "Do you require dynamic XML/JSON feeds?",
        currentSuppliers: "Current Suppliers",
        additionalNotes: "Additional Notes",
        gdprConsent: "I authorize the processing of my personal data under GDPR/KVKK compliance guidelines for evaluation purposes.",
        recaptchaLabel: "I am not a robot",
        back: "Back",
        backToLogin: "Back to Login",
        continue: "Continue",
        submit: "Submit Application",
        successTitle: "Application Received!",
        successMessage: "Thank you for applying. We have successfully registered your application. Our onboarding team will evaluate your business profile within 24-48 hours.",
        successDispatched: "A confirmation email has been dispatched to:",
        returnToLogin: "Return to Login",
        enterManually: "Enter manually",
        selectFromList: "Select from list",
        searchCountry: "Search and select country..."
    },
    tr: {
        title: "Acente Başvurusu",
        subtitle: "İş ortağımız olun ve küresel lüks B2B envanterine erişin.",
        step1: "Şirket Bilgileri",
        step2: "Yetkili Temsilci",
        step3: "İş Profili",
        step1Header: "Adım 1: Şirket Bilgileri",
        step2Header: "Adım 2: Yetkili Temsilci",
        step3Header: "Adım 3: İş Profili",
        companyLegalName: "Şirket Resmi Unvanı *",
        brandName: "Marka / Ticari Unvan",
        taxNumber: "Vergi Numarası / VAT ID *",
        taxOffice: "Vergi Dairesi",
        country: "Ülke *",
        city: "Şehir *",
        businessAddress: "İş Adresi *",
        postalCode: "Posta Kodu",
        website: "Web Sitesi",
        companyRegNumber: "Ticari Sicil Numarası",
        firstName: "Ad *",
        lastName: "Soyad *",
        jobTitle: "Görev Unvanı",
        emailAddress: "E-posta Adresi *",
        mobilePhone: "Cep Telefonu *",
        whatsAppNumber: "WhatsApp Numarası",
        preferredLanguage: "Tercih Edilen Dil *",
        timeZone: "Saat Dilimi *",
        profilePhoto: "Profil Fotoğrafı",
        agencyType: "Acente Türü *",
        monthlyVolume: "Aylık Rezervasyon Hacmi *",
        preferredCurrency: "Tercih Edilen Para Birimi *",
        mainMarkets: "Hizmet Verilen Ana Pazarlar * (Çoklu Seçim)",
        apiIntegration: "API Entegrasyonu Gerekli mi?",
        apiIntegrationSub: "Dinamik XML/JSON veri akışı talep ediyor musunuz?",
        currentSuppliers: "Mevcut Tedarikçiler",
        additionalNotes: "Ek Notlar",
        gdprConsent: "Kişisel verilerimin KVKK/GDPR uyum çerçevesinde işlenmesine ve değerlendirme amacıyla kullanılmasına izin veriyorum.",
        recaptchaLabel: "Ben robot değilim",
        back: "Geri",
        backToLogin: "Girişe Dön",
        continue: "Devam Et",
        submit: "Başvuruyu Tamamla",
        successTitle: "Başvuru Alındı!",
        successMessage: "Başvurunuz için teşekkür ederiz. Bilgileriniz başarıyla kaydedilmiştir. Onboarding ekibimiz 24-48 saat içinde başvurunuzu değerlendirecektir.",
        successDispatched: "Onay e-postası şu adrese gönderilmiştir:",
        returnToLogin: "Giriş Ekranına Dön",
        enterManually: "Elle girin",
        selectFromList: "Listeden seçin",
        searchCountry: "Ülke arayın ve seçin..."
    }
};

// Automatically load backgrounds from assets
const backgroundModules = import.meta.glob('../assets/backgrounds/*', { eager: true });
const backgrounds = Object.values(backgroundModules).map(m => m.default || m);

const AgencyApplicationPage = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();

    // Select translation bundle
    const currentLang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
    const loc = localTranslations[currentLang] || localTranslations.en;
    
    // UI States
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [successMode, setSuccessMode] = useState(false);
    const [formError, setFormError] = useState('');
    
    // Live Duplication Errors
    const [taxError, setTaxError] = useState('');
    const [emailError, setEmailError] = useState('');

    // Autocomplete Lookup States
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    
    // Form FormState
    const [formData, setFormData] = useState({
        companyLegalName: '',
        brandName: '',
        taxNumber: '',
        taxOffice: '',
        countryId: '',
        countryName: '',
        cityId: '',
        cityName: '',
        isCustomCity: false,
        businessAddress: '',
        postalCode: '',
        website: '',
        companyRegistrationNumber: '',
        
        firstName: '',
        lastName: '',
        jobTitle: '',
        emailAddress: '',
        mobilePhoneCountryCode: '+90',
        mobilePhoneNumber: '',
        whatsAppNumber: '',
        preferredLanguage: 'English',
        timeZone: 'GMT+3',
        profilePhoto: '',

        agencyType: 'Retail Agency',
        monthlyBookingVolume: '0 – 100',
        preferredCurrency: 'USD',
        mainMarketsServed: [],
        apiIntegrationNeeded: false,
        currentSuppliers: '',
        additionalNotes: '',
        kvkkAccepted: false,
        recaptchaToken: 'mock-token'
    });

    // Load Background
    const selectedBg = useMemo(() => {
        if (!backgrounds || backgrounds.length === 0) return '';
        const randomIndex = Math.floor(Math.random() * backgrounds.length);
        return backgrounds[randomIndex];
    }, []);

    // Load Countries
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await locationService.listCountries();
                if (res && res.locationList) {
                    setCountries(res.locationList);
                }
            } catch (err) {
                console.error("Failed to load countries:", err);
            }
        };
        fetchCountries();
    }, []);

    // Load Cities when country changes
    useEffect(() => {
        if (!formData.countryId) {
            setCities([]);
            setFormData(prev => ({ ...prev, cityId: '', cityName: '', isCustomCity: false }));
            return;
        }
        const fetchCities = async () => {
            try {
                const res = await locationService.listSubRegions(formData.countryId);
                if (res && res.locationList) {
                    setCities(res.locationList);
                } else {
                    setCities([]);
                }
            } catch (err) {
                console.error("Failed to load cities:", err);
                setCities([]);
            }
        };
        fetchCities();
    }, [formData.countryId]);

    // Live Unique Check: Tax Number
    const handleTaxBlur = async () => {
        if (!formData.taxNumber) return;
        try {
            const isDuplicate = await agencyApplicationService.checkDuplicateTax(formData.taxNumber);
            if (isDuplicate) {
                setTaxError(currentLang === 'tr' ? 'Bu Vergi Numarası ile daha önce başvuru yapılmış.' : 'An application with this Tax Number already exists.');
            } else {
                setTaxError('');
            }
        } catch (err) {
            console.error("Duplicate check failed:", err);
        }
    };

    // Live Unique Check: Email
    const handleEmailBlur = async () => {
        if (!formData.emailAddress) return;
        try {
            const isDuplicate = await agencyApplicationService.checkDuplicateEmail(formData.emailAddress);
            if (isDuplicate) {
                setEmailError(currentLang === 'tr' ? 'Bu E-posta Adresi ile daha önce başvuru yapılmış.' : 'An application with this Email Address already exists.');
            } else {
                setEmailError('');
            }
        } catch (err) {
            console.error("Duplicate check failed:", err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // File to Base64 converter
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleMarketToggle = (market) => {
        setFormData(prev => {
            const current = [...prev.mainMarketsServed];
            if (current.includes(market)) {
                return { ...prev, mainMarketsServed: current.filter(m => m !== market) };
            } else {
                return { ...prev, mainMarketsServed: [...current, market] };
            }
        });
    };

    // Auto-complete country search filter
    const filteredCountries = useMemo(() => {
        if (!countrySearch) return countries;
        return countries.filter(c => {
            const name = c.name?.defaultName || '';
            return name.toLowerCase().includes(countrySearch.toLowerCase());
        });
    }, [countries, countrySearch]);

    const selectCountry = (id, name) => {
        setFormData(prev => ({ ...prev, countryId: id, countryName: name, cityId: '', cityName: '', isCustomCity: false }));
        setCountrySearch(name);
        setShowCountryDropdown(false);
    };

    // Form Validators
    const validateStep1 = () => {
        if (!formData.companyLegalName) return currentLang === 'tr' ? 'Şirket Resmi Unvanı zorunludur' : 'Company Legal Name is required';
        if (!formData.taxNumber) return currentLang === 'tr' ? 'Vergi Numarası zorunludur' : 'Tax Number is required';
        if (taxError) return taxError;
        if (!formData.countryId) return currentLang === 'tr' ? 'Ülke seçimi zorunludur' : 'Country is required';
        
        // Validation for city: either cityId must be selected OR cityName must be typed
        const hasCityId = !!formData.cityId;
        const hasCityName = !!formData.cityName && formData.cityName.trim().length > 0;
        if (!hasCityId && !hasCityName) {
            return currentLang === 'tr' ? 'Şehir bilgisi zorunludur' : 'City is required';
        }

        if (!formData.businessAddress) return currentLang === 'tr' ? 'İş Adresi zorunludur' : 'Business Address is required';
        if (formData.website) {
            const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
            if (!urlPattern.test(formData.website)) {
                return currentLang === 'tr' ? 'Web sitesi adresi geçerli bir URL olmalıdır' : 'Website must be a valid URL';
            }
        }
        return '';
    };

    const validateStep2 = () => {
        if (!formData.firstName) return currentLang === 'tr' ? 'Ad zorunludur' : 'First Name is required';
        if (!formData.lastName) return currentLang === 'tr' ? 'Soyad zorunludur' : 'Last Name is required';
        if (!formData.emailAddress) return currentLang === 'tr' ? 'E-posta Adresi zorunludur' : 'Email Address is required';
        if (emailError) return emailError;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.emailAddress)) {
            return currentLang === 'tr' ? 'Geçerli bir e-posta adresi giriniz' : 'Email must be a valid email address';
        }
        if (!formData.mobilePhoneNumber) return currentLang === 'tr' ? 'Cep Telefonu zorunludur' : 'Mobile Phone Number is required';
        if (!/^\d+$/.test(formData.mobilePhoneNumber)) {
            return currentLang === 'tr' ? 'Cep Telefonu sadece rakamlardan oluşmalıdır' : 'Mobile Phone Number must contain digits only';
        }
        return '';
    };

    const validateStep3 = () => {
        if (!formData.agencyType) return currentLang === 'tr' ? 'Acente Türü zorunludur' : 'Agency Type is required';
        if (formData.mainMarketsServed.length === 0) return currentLang === 'tr' ? 'Lütfen en az bir hizmet verilen pazar seçin' : 'Please select at least one Market Served';
        if (!formData.kvkkAccepted) return currentLang === 'tr' ? 'KVKK / GDPR onayını kabul etmelisiniz' : 'You must accept the KVKK / GDPR compliance terms';
        return '';
    };

    const handleContinue = () => {
        setFormError('');
        if (step === 1) {
            const err = validateStep1();
            if (err) {
                setFormError(err);
                return;
            }
            setStep(2);
        } else if (step === 2) {
            const err = validateStep2();
            if (err) {
                setFormError(err);
                return;
            }
            setStep(3);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        const err = validateStep3();
        if (err) {
            setFormError(err);
            return;
        }

        setIsLoading(true);
        try {
            await agencyApplicationService.submitApplication(formData);
            setSuccessMode(true);
        } catch (error) {
            setFormError(error.message || (currentLang === 'tr' ? 'Başvuru gönderilirken bir hata oluştu.' : 'Submission failed. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
            {isLoading && <PlaneLoading />}

            {/* Floating Language Switcher */}
            <div className="absolute top-6 right-6 z-30">
                <LanguageSwitcher />
            </div>

            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-slate-900/40 z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/90 z-10"></div>
                <img
                    src={selectedBg}
                    className="w-full h-full object-cover animate-pan"
                    alt="Luxury Background"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = 'linear-gradient(to bottom, #0f172a, #1e293b)';
                    }}
                />
            </div>

            {/* Main Application Box */}
            <div className="relative z-20 w-full max-w-4xl mx-auto px-6 py-12">
                {!successMode ? (
                    <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[32px] border border-white/10 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.5)] overflow-hidden">
                        {/* Header & Steps Indicator */}
                        <div className="p-8 pb-4 text-center border-b border-white/5 bg-white/[0.01]">
                            <h2 className="text-3xl font-black text-white mb-2">{loc.title}</h2>
                            <p className="text-slate-400 text-sm mb-6">{loc.subtitle}</p>

                            {/* Stepper Progress Bar */}
                            <div className="flex items-center justify-center max-w-md mx-auto relative mb-4">
                                <div className="absolute top-4 left-0 right-0 h-1 bg-white/10 z-0 rounded"></div>
                                <div className="absolute top-4 left-0 h-1 bg-gradient-to-r from-primary to-blue-500 z-0 rounded transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
                                
                                <div className="flex justify-between w-full relative z-10">
                                    {[1, 2, 3].map((num, idx) => {
                                        const labels = [loc.step1, loc.step2, loc.step3];
                                        return (
                                            <div key={num} className="flex flex-col items-center">
                                                <button
                                                    type="button"
                                                    disabled={num > step}
                                                    onClick={() => setStep(num)}
                                                    className={`size-9 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${
                                                        step >= num
                                                            ? 'bg-gradient-to-r from-primary to-blue-500 text-white shadow-lg shadow-primary/20 scale-110'
                                                            : 'bg-slate-800 text-slate-400 border border-white/5'
                                                    }`}
                                                >
                                                    {num}
                                                </button>
                                                <span className={`text-[10px] font-bold uppercase mt-2 tracking-wider ${step >= num ? 'text-white' : 'text-slate-500'}`}>
                                                    {labels[idx]}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Wizard Forms */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            
                            {/* Step 1: Company Details */}
                            {step === 1 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <h3 className="text-lg font-black text-white/90 border-l-4 border-primary pl-3 mb-6">{loc.step1Header}</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.companyLegalName}</label>
                                            <input
                                                type="text"
                                                name="companyLegalName"
                                                required
                                                value={formData.companyLegalName}
                                                onChange={handleInputChange}
                                                placeholder={loc.companyLegalName.replace(' *', '')}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.brandName}</label>
                                            <input
                                                type="text"
                                                name="brandName"
                                                value={formData.brandName}
                                                onChange={handleInputChange}
                                                placeholder={loc.brandName}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.taxNumber}</label>
                                            <input
                                                type="text"
                                                name="taxNumber"
                                                required
                                                value={formData.taxNumber}
                                                onChange={handleInputChange}
                                                onBlur={handleTaxBlur}
                                                placeholder={loc.taxNumber.replace(' *', '')}
                                                className={`w-full bg-white/5 border rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 transition-all text-sm font-semibold ${
                                                    taxError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary/50'
                                                }`}
                                            />
                                            {taxError && <p className="text-[11px] font-bold text-red-500 mt-1">{taxError}</p>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.taxOffice}</label>
                                            <input
                                                type="text"
                                                name="taxOffice"
                                                value={formData.taxOffice}
                                                onChange={handleInputChange}
                                                placeholder={loc.taxOffice}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Searchable Autocomplete Country Field */}
                                        <div className="space-y-1 relative">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.country}</label>
                                            <input
                                                type="text"
                                                placeholder={loc.searchCountry}
                                                value={countrySearch || formData.countryName}
                                                onChange={(e) => {
                                                    setCountrySearch(e.target.value);
                                                    setShowCountryDropdown(true);
                                                }}
                                                onFocus={() => setShowCountryDropdown(true)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                            {showCountryDropdown && filteredCountries.length > 0 && (
                                                <div className="absolute left-0 right-0 mt-2 bg-slate-900/95 border border-white/10 rounded-2xl max-h-60 overflow-y-auto z-50 shadow-2xl backdrop-blur-xl">
                                                    {filteredCountries.map((c) => (
                                                        <div
                                                            key={c.id}
                                                            onClick={() => selectCountry(c.id, c.name?.defaultName)}
                                                            className="px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer font-semibold transition-colors"
                                                        >
                                                            {c.name?.defaultName}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Dynamic City Selector (List + Manual override) */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.city}</label>
                                                {formData.countryId && cities.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                cityId: '',
                                                                cityName: '',
                                                                isCustomCity: !prev.isCustomCity
                                                            }));
                                                        }}
                                                        className="text-[10px] font-bold text-primary hover:underline uppercase"
                                                    >
                                                        {formData.isCustomCity ? loc.selectFromList : loc.enterManually}
                                                    </button>
                                                )}
                                            </div>
                                            {formData.isCustomCity || cities.length === 0 ? (
                                                <input
                                                    type="text"
                                                    name="cityName"
                                                    required
                                                    value={formData.cityName || ''}
                                                    onChange={handleInputChange}
                                                    placeholder={loc.city.replace(' *', '')}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                                />
                                            ) : (
                                                <select
                                                    name="cityId"
                                                    required
                                                    disabled={!formData.countryId}
                                                    value={formData.cityId}
                                                    onChange={(e) => {
                                                        const id = e.target.value;
                                                        const name = cities.find(c => String(c.id) === String(id))?.name?.defaultName || '';
                                                        setFormData(prev => ({ ...prev, cityId: id, cityName: name }));
                                                    }}
                                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:bg-slate-800 transition-all text-sm font-semibold disabled:opacity-50"
                                                >
                                                    <option value="">Select City</option>
                                                    {cities.map((city) => (
                                                        <option key={city.id} value={city.id}>
                                                            {city.name?.defaultName}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.businessAddress}</label>
                                        <textarea
                                            name="businessAddress"
                                            required
                                            rows="3"
                                            value={formData.businessAddress}
                                            onChange={handleInputChange}
                                            placeholder={loc.businessAddress.replace(' *', '')}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold resize-none"
                                        ></textarea>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.postalCode}</label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleInputChange}
                                                placeholder={loc.postalCode}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.website}</label>
                                            <input
                                                type="text"
                                                name="website"
                                                value={formData.website}
                                                onChange={handleInputChange}
                                                placeholder="https://example.com"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.companyRegNumber}</label>
                                            <input
                                                type="text"
                                                name="companyRegistrationNumber"
                                                value={formData.companyRegistrationNumber}
                                                onChange={handleInputChange}
                                                placeholder={loc.companyRegNumber}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Authorized Representative */}
                            {step === 2 && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <h3 className="text-lg font-black text-white/90 border-l-4 border-primary pl-3 mb-6">{loc.step2Header}</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.firstName}</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                required
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                placeholder={loc.firstName.replace(' *', '')}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.lastName}</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                required
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                placeholder={loc.lastName.replace(' *', '')}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.jobTitle}</label>
                                            <input
                                                type="text"
                                                name="jobTitle"
                                                value={formData.jobTitle}
                                                onChange={handleInputChange}
                                                placeholder={loc.jobTitle}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.emailAddress}</label>
                                            <input
                                                type="email"
                                                name="emailAddress"
                                                required
                                                value={formData.emailAddress}
                                                onChange={handleInputChange}
                                                onBlur={handleEmailBlur}
                                                placeholder="representative@email.com"
                                                className={`w-full bg-white/5 border rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 transition-all text-sm font-semibold ${
                                                    emailError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary/50'
                                                }`}
                                            />
                                            {emailError && <p className="text-[11px] font-bold text-red-500 mt-1">{emailError}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Mobile Phone country code select + digits input */}
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.mobilePhone}</label>
                                            <div className="flex gap-2">
                                                <select
                                                    name="mobilePhoneCountryCode"
                                                    value={formData.mobilePhoneCountryCode}
                                                    onChange={handleInputChange}
                                                    className="w-24 bg-slate-900 border border-white/10 rounded-2xl py-3 px-3 text-white focus:outline-none text-sm font-semibold"
                                                >
                                                    <option value="+90">+90 (TR)</option>
                                                    <option value="+1">+1 (US)</option>
                                                    <option value="+44">+44 (UK)</option>
                                                    <option value="+49">+49 (DE)</option>
                                                    <option value="+33">+33 (FR)</option>
                                                    <option value="+7">+7 (RU)</option>
                                                    <option value="+971">+971 (AE)</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    name="mobilePhoneNumber"
                                                    required
                                                    value={formData.mobilePhoneNumber}
                                                    onChange={(e) => {
                                                        const clean = e.target.value.replace(/\D/g, ''); // Digits only
                                                        setFormData(prev => ({ ...prev, mobilePhoneNumber: clean }));
                                                    }}
                                                    placeholder="5551234567"
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.whatsAppNumber}</label>
                                            <input
                                                type="text"
                                                name="whatsAppNumber"
                                                value={formData.whatsAppNumber}
                                                onChange={handleInputChange}
                                                placeholder={loc.whatsAppNumber}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.preferredLanguage}</label>
                                            <select
                                                name="preferredLanguage"
                                                required
                                                value={formData.preferredLanguage}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:bg-slate-800 transition-all text-sm font-semibold"
                                            >
                                                <option value="English">English</option>
                                                <option value="Turkish">Turkish</option>
                                                <option value="Russian">Russian</option>
                                                <option value="German">German</option>
                                                <option value="French">French</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.timeZone}</label>
                                            <select
                                                name="timeZone"
                                                required
                                                value={formData.timeZone}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:bg-slate-800 transition-all text-sm font-semibold"
                                            >
                                                <option value="GMT+0">GMT+0 (London, Lisbon)</option>
                                                <option value="GMT+1">GMT+1 (Paris, Berlin, Rome)</option>
                                                <option value="GMT+2">GMT+2 (Athens, Cairo, Kyiv)</option>
                                                <option value="GMT+3">GMT+3 (Istanbul, Moscow, Riyadh)</option>
                                                <option value="GMT+4">GMT+4 (Dubai, Baku)</option>
                                                <option value="GMT+5">GMT+5 (Karachi, Tashkent)</option>
                                                <option value="GMT-5">GMT-5 (New York, Miami)</option>
                                                <option value="GMT-8">GMT-8 (Los Angeles, Seattle)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.profilePhoto}</label>
                                        <div className="flex items-center gap-4">
                                            {formData.profilePhoto && (
                                                <img
                                                    src={formData.profilePhoto}
                                                    alt="Preview"
                                                    className="size-16 rounded-2xl object-cover border border-white/15 shadow-xl"
                                                />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-white/10 file:text-white file:cursor-pointer hover:file:bg-white/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Business Profile */}
                            {step === 3 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <h3 className="text-lg font-black text-white/90 border-l-4 border-primary pl-3 mb-4">{loc.step3Header}</h3>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.agencyType}</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                            {['Retail Agency', 'OTA', 'DMC', 'Wholesaler', 'Corporate'].map((type) => (
                                                <label
                                                    key={type}
                                                    className={`border rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                                                        formData.agencyType === type
                                                            ? 'border-primary bg-primary/10 text-white font-bold'
                                                            : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="agencyType"
                                                        value={type}
                                                        checked={formData.agencyType === type}
                                                        onChange={handleInputChange}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-xs font-semibold">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.monthlyVolume}</label>
                                            <select
                                                name="monthlyBookingVolume"
                                                required
                                                value={formData.monthlyBookingVolume}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:bg-slate-800 transition-all text-sm font-semibold"
                                            >
                                                <option value="0 – 100">0 – 100 bookings</option>
                                                <option value="100 – 500">100 – 500 bookings</option>
                                                <option value="500 – 1.000">500 – 1.000 bookings</option>
                                                <option value="1.000 – 5.000">1.000 – 5.000 bookings</option>
                                                <option value="5.000+">5.000+ bookings</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.preferredCurrency}</label>
                                            <select
                                                name="preferredCurrency"
                                                required
                                                value={formData.preferredCurrency}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:bg-slate-800 transition-all text-sm font-semibold"
                                            >
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                                <option value="GBP">GBP</option>
                                                <option value="TRY">TRY</option>
                                                <option value="RUB">RUB</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.mainMarkets}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['Europe', 'Middle East', 'North America', 'South America', 'Asia Pacific', 'Africa', 'Central Asia', 'GCC Countries', 'Mediterranean'].map((market) => {
                                                const selected = formData.mainMarketsServed.includes(market);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={market}
                                                        onClick={() => handleMarketToggle(market)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                            selected
                                                                ? 'bg-gradient-to-r from-primary to-blue-500 text-white border-transparent'
                                                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {market}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border border-white/10 bg-white/[0.02] rounded-2xl p-4">
                                        <div>
                                            <p className="text-sm font-bold text-white">{loc.apiIntegration}</p>
                                            <p className="text-xs text-slate-400">{loc.apiIntegrationSub}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="apiIntegrationNeeded"
                                                checked={formData.apiIntegrationNeeded}
                                                onChange={handleInputChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-5 after:width-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.currentSuppliers}</label>
                                            <input
                                                type="text"
                                                name="currentSuppliers"
                                                value={formData.currentSuppliers}
                                                onChange={handleInputChange}
                                                placeholder="e.g. Hotelbeds, Expedia, Ratehawk, Travco"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{loc.additionalNotes}</label>
                                            <textarea
                                                name="additionalNotes"
                                                maxLength="1000"
                                                rows="3"
                                                value={formData.additionalNotes}
                                                onChange={handleInputChange}
                                                placeholder={loc.additionalNotes}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-400 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all text-sm font-semibold resize-none"
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* KVKK Compliance */}
                                    <div className="space-y-4 border-t border-white/5 pt-4">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className="mt-1 relative flex items-center justify-center size-5 rounded border border-slate-600 bg-transparent hover:border-primary transition-colors flex-shrink-0">
                                                <input
                                                    type="checkbox"
                                                    name="kvkkAccepted"
                                                    required
                                                    checked={formData.kvkkAccepted}
                                                    onChange={handleInputChange}
                                                    className="appearance-none peer size-full cursor-pointer"
                                                />
                                                <div className="hidden peer-checked:block size-3 bg-primary rounded-[2px]"></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors select-none leading-relaxed">
                                                {loc.gdprConsent}
                                            </span>
                                        </label>

                                        {/* Custom Premium Security reCAPTCHA Check */}
                                        <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/10 flex items-center justify-between max-w-sm">
                                            <div className="flex items-center gap-3">
                                                <label className="relative flex items-center justify-center size-6 rounded border border-slate-600 bg-transparent cursor-pointer flex-shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        required
                                                        onChange={(e) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                recaptchaToken: e.target.checked ? 'verified-mock-token' : ''
                                                            }));
                                                        }}
                                                        className="appearance-none peer size-full cursor-pointer"
                                                    />
                                                    <div className="hidden peer-checked:block size-3 bg-emerald-500 rounded-[2px]"></div>
                                                </label>
                                                <span className="text-xs font-black text-white/90">{loc.recaptchaLabel}</span>
                                            </div>
                                            <div className="flex flex-col items-center opacity-60">
                                                <span className="material-symbols-outlined text-[24px] text-primary">security</span>
                                                <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider">reCAPTCHA</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {formError && (
                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    <span className="text-xs font-bold">{formError}</span>
                                </div>
                            )}

                            {/* Navigation Controls */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => setStep(step - 1)}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                                    >
                                        {loc.back}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                                    >
                                        {loc.backToLogin}
                                    </button>
                                )}

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={handleContinue}
                                        className="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg hover:shadow-primary/25 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                                    >
                                        {loc.continue}
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/25 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
                                    >
                                        {loc.submit}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                ) : (
                    /* Success Panel */
                    <div className="bg-white/[0.03] backdrop-blur-[40px] rounded-[32px] border border-white/10 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.5)] p-12 text-center space-y-6 max-w-xl mx-auto animate-in zoom-in duration-500">
                        <div className="size-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                            <span className="material-symbols-outlined text-5xl">task_alt</span>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-white">{loc.successTitle}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {loc.successMessage}
                            </p>
                            <p className="text-slate-400 text-xs font-semibold bg-white/5 border border-white/5 py-2 px-4 rounded-xl max-w-sm mx-auto">
                                {loc.successDispatched}<br/>
                                <span className="text-white font-bold">{formData.emailAddress}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-white/10 hover:bg-white/15 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] border border-white/5 transition-all shadow-md active:scale-[0.98]"
                        >
                            {loc.returnToLogin}
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pan {
                    0% { transform: scale(1.0) translate(0, 0); }
                    100% { transform: scale(1.1) translate(-2%, -2%); }
                }
                .animate-pan {
                    animation: pan 30s ease-out infinite alternate;
                }
            `}</style>
        </div>
    );
};

export default AgencyApplicationPage;
