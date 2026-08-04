import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FORBIDDEN_LOCALES = {
    en: {
        badge: "HTTP 403 • ACCESS DENIED",
        title: "Access Forbidden",
        subtitle: "You do not have permission to view or modify this resource. The session may belong to another account, or your user permissions are restricted.",
        primaryBtn: "Return to Dashboard",
        secondaryBtn: "Search Hotels",
        contactSupport: "Need assistance? Contact support"
    },
    tr: {
        badge: "HTTP 403 • ERİŞİM ENGELLENDİ",
        title: "Erişim Engellendi",
        subtitle: "Bu kaynağı görüntülemek veya değiştirmek için yetkiniz bulunmuyor. Oturum başka bir kullanıcıya ait olabilir veya erişim izinleriniz kısıtlanmış olabilir.",
        primaryBtn: "Kontrol Paneline Dön",
        secondaryBtn: "Otel Ara",
        contactSupport: "Yardıma mı ihtiyacınız var? Destek ekibiyle iletişime geçin"
    },
    ar: {
        badge: "HTTP 403 • تم رفض الوصول",
        title: "الوصول محظور",
        subtitle: "ليس لديك إذن لعرض أو تعديل هذا المورد. قد تتبع الجلسة لحساب آخر أو قد تكون صلاحياتك مخصصة.",
        primaryBtn: "العودة إلى لوحة التحكم",
        secondaryBtn: "البحث عن الفنادق",
        contactSupport: "هل تحتاج إلى مساعدة؟ اتصل بالدعم"
    },
    es: {
        badge: "HTTP 403 • ACCESO DENEGADO",
        title: "Acceso Prohibido",
        subtitle: "No tiene permiso para ver o modificar este recurso. Es posible que la sesión pertenezca a otra cuenta o que sus permisos estén restringidos.",
        primaryBtn: "Volver al Panel",
        secondaryBtn: "Buscar Hoteles",
        contactSupport: "¿Necesita ayuda? Contacte al soporte"
    },
    ru: {
        badge: "HTTP 403 • ДОСТУП ОГРАНИЧЕН",
        title: "Доступ запрещен",
        subtitle: "У вас нет прав для просмотра или изменения этого ресурса. Сеанс может принадлежать другой учетной записи или ваши права ограничены.",
        primaryBtn: "Вернуться на панель",
        secondaryBtn: "Поиск отелей",
        contactSupport: "Нужна помощь? Свяжитесь со службой поддержки"
    },
    zh: {
        badge: "HTTP 403 • 拒绝访问",
        title: "禁止访问",
        subtitle: "您没有权限查看或修改此资源。该会话可能属于另一个账户，或者您的访问权限已被受限。",
        primaryBtn: "返回仪表板",
        secondaryBtn: "搜索酒店",
        contactSupport: "需要帮助？联系支持团队"
    },
    ja: {
        badge: "HTTP 403 • アクセス拒否",
        title: "アクセスが禁止されています",
        subtitle: "このリソースを表示または変更する権限がありません。セッションが別のアカウントに属しているか、アクセス権限が制限されている可能性があります。",
        primaryBtn: "ダッシュボードに戻る",
        secondaryBtn: "ホテルを検索",
        contactSupport: "お困りですか？サポートにお問い合わせください"
    },
    fa: {
        badge: "HTTP 403 • دسترسی رد شد",
        title: "دسترسی غیرمجاز",
        subtitle: "شما اجازه مشاهده یا تغییر این منبع را ندارید. ممکن است نشست به حساب دیگری تعلق داشته باشد یا دسترسی‌های شما محدود شده باشد.",
        primaryBtn: "بازگشت به داشبورد",
        secondaryBtn: "جستجوی هتل‌ها",
        contactSupport: "نیاز به راهنمایی دارید؟ با پشتیبانی تماس بگیرید"
    },
    fr: {
        badge: "HTTP 403 • ACCÈS REFUSÉ",
        title: "Accès Interdit",
        subtitle: "Vous n'avez pas l'autorisation de consulter ou de modifier cette ressource. La session appartient peut-être à un autre compte ou vos droits d'accès sont restreints.",
        primaryBtn: "Retour au Tableau de bord",
        secondaryBtn: "Rechercher des Hôtels",
        contactSupport: "Besoin d'aide ? Contactez le support"
    },
    it: {
        badge: "HTTP 403 • ACCESSO NEGATO",
        title: "Accesso Vietato",
        subtitle: "Non disponi delle autorizzazioni per visualizzare o modificare questa risorsa. La sessione potrebbe appartenere a un altro account o le tue autorizzazioni potrebbero essere limitate.",
        primaryBtn: "Torna alla Dashboard",
        secondaryBtn: "Cerca Hotel",
        contactSupport: "Hai bisogno di assistenza? Contatta il supporto"
    },
    el: {
        badge: "HTTP 403 • ΔΕΝ ΕΠΙΤΡΕΠΕΤΑΙ Η ΠΡΟΣΒΑΣΗ",
        title: "Απαγόρευση Πρόσβασης",
        subtitle: "Δεν έχετε δικαίωμα προβολής ή τροποποίησης αυτού του πόρου. Η συνεδρία ενδέχεται να ανήκει σε άλλο λογαριασμό ή τα δικαιώματά σας είναι περιορισμένα.",
        primaryBtn: "Επιστροφή στον Πίνακα Ελέγχου",
        secondaryBtn: "Αναζήτηση Ξενοδοχείων",
        contactSupport: "Χρειάζεστε βοήθεια; Επικοινωνήστε με την υποστήριξη"
    },
    pt: {
        badge: "HTTP 403 • ACESSO NEGADO",
        title: "Acesso Prohibido",
        subtitle: "Você não tem permissão para visualizar ou modificar este recurso. A sessão pode pertencer a outra conta ou suas permissões podem estar restritas.",
        primaryBtn: "Voltar ao Painel",
        secondaryBtn: "Buscar Hotéis",
        contactSupport: "Precisa de ajuda? Entre em contato com o suporte"
    }
};

const ForbiddenPage = () => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const currentLang = (i18n.language || 'en').toLowerCase().split('-')[0];
    const isRtl = currentLang === 'ar' || currentLang === 'fa';
    const loc = FORBIDDEN_LOCALES[currentLang] || FORBIDDEN_LOCALES.en;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white flex flex-col font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
            <Header />

            <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-20 relative overflow-hidden">
                {/* Background Ambient Glow Effects */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-[140px] pointer-events-none"></div>
                <div className="absolute bottom-10 right-10 size-[300px] bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="w-full max-w-xl relative group">
                    {/* Glassmorphism Card */}
                    <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-slate-200/80 dark:border-slate-800 rounded-[36px] p-10 sm:p-12 text-center shadow-2xl overflow-hidden transition-all duration-300">
                        {/* Watermark Icon */}
                        <div className="absolute -top-12 -right-12 opacity-5 dark:opacity-10 pointer-events-none">
                            <span className="material-symbols-outlined text-[240px] text-rose-500">gpp_maybe</span>
                        </div>

                        {/* Top Security Icon Badge */}
                        <div className="relative size-24 bg-gradient-to-br from-rose-500/10 to-amber-500/10 dark:from-rose-500/20 dark:to-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-inner">
                            <span className="material-symbols-outlined text-5xl text-rose-600 dark:text-rose-400">shield_lock</span>
                        </div>

                        {/* Badge Pill */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold tracking-widest uppercase mb-4">
                            <span className="size-2 rounded-full bg-rose-500 animate-pulse"></span>
                            {loc.badge}
                        </div>

                        {/* Title & Subtitle */}
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3 text-slate-900 dark:text-white">
                            {loc.title}
                        </h1>

                        <p className="text-slate-600 dark:text-slate-300 text-sm font-normal leading-relaxed mb-8 max-w-md mx-auto">
                            {loc.subtitle}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto px-7 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">dashboard</span>
                                {loc.primaryBtn}
                            </button>

                            <button
                                onClick={() => navigate('/hotels')}
                                className="w-full sm:w-auto px-7 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">search</span>
                                {loc.secondaryBtn}
                            </button>
                        </div>

                        {/* Footer Contact Note */}
                        <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800">
                            <a
                                href="mailto:support@travelofglobe.com"
                                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary transition-colors font-medium"
                            >
                                <span className="material-symbols-outlined text-base">help</span>
                                {loc.contactSupport}
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ForbiddenPage;
