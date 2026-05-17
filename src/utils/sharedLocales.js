// Shared locale utility - covers all 12 supported languages
// Usage: import { t } from '../utils/sharedLocales'; then t(lang, 'key')

export const COMMON = {
  en: { active: 'Active', passive: 'Passive', cancel: 'Cancel', confirm: 'Confirm', save: 'Save', delete: 'Delete', edit: 'Edit', add: 'Add', export: 'Export', refresh: 'Refresh', search: 'Search', status: 'Status', actions: 'Actions', noData: 'No data found', processing: 'Processing...', close: 'Close', yes: 'Yes', no: 'No', name: 'Name', email: 'Email Address', phone: 'Phone Number', country: 'Country', city: 'City', address: 'Address', all: 'All', loading: 'Loading...', error: 'An error occurred', success: 'Successful' },
  tr: { active: 'Aktif', passive: 'Pasif', cancel: 'İptal', confirm: 'Onayla', save: 'Kaydet', delete: 'Sil', edit: 'Düzenle', add: 'Ekle', export: 'Dışa Aktar', refresh: 'Yenile', search: 'Ara', status: 'Durum', actions: 'İşlemler', noData: 'Veri bulunamadı', processing: 'İşleniyor...', close: 'Kapat', yes: 'Evet', no: 'Hayır', name: 'Ad', email: 'E-posta Adresi', phone: 'Telefon Numarası', country: 'Ülke', city: 'Şehir', address: 'Adres', all: 'Tümü', loading: 'Yükleniyor...', error: 'Bir hata oluştu', success: 'Başarılı' },
  ar: { active: 'نشط', passive: 'غير نشط', cancel: 'إلغاء', confirm: 'تأكيد', save: 'حفظ', delete: 'حذف', edit: 'تعديل', add: 'إضافة', export: 'تصدير', refresh: 'تحديث', search: 'بحث', status: 'الحالة', actions: 'الإجراءات', noData: 'لا توجد بيانات', processing: 'جارٍ المعالجة...', close: 'إغلاق', yes: 'نعم', no: 'لا', name: 'الاسم', email: 'البريد الإلكتروني', phone: 'رقم الهاتف', country: 'الدولة', city: 'المدينة', address: 'العنوان', all: 'الكل', loading: 'جارٍ التحميل...', error: 'حدث خطأ', success: 'ناجح' },
  es: { active: 'Activo', passive: 'Inactivo', cancel: 'Cancelar', confirm: 'Confirmar', save: 'Guardar', delete: 'Eliminar', edit: 'Editar', add: 'Agregar', export: 'Exportar', refresh: 'Actualizar', search: 'Buscar', status: 'Estado', actions: 'Acciones', noData: 'Sin datos', processing: 'Procesando...', close: 'Cerrar', yes: 'Sí', no: 'No', name: 'Nombre', email: 'Correo electrónico', phone: 'Teléfono', country: 'País', city: 'Ciudad', address: 'Dirección', all: 'Todo', loading: 'Cargando...', error: 'Ocurrió un error', success: 'Exitoso' },
  ru: { active: 'Активный', passive: 'Неактивный', cancel: 'Отмена', confirm: 'Подтвердить', save: 'Сохранить', delete: 'Удалить', edit: 'Редактировать', add: 'Добавить', export: 'Экспорт', refresh: 'Обновить', search: 'Поиск', status: 'Статус', actions: 'Действия', noData: 'Данные не найдены', processing: 'Обработка...', close: 'Закрыть', yes: 'Да', no: 'Нет', name: 'Имя', email: 'Эл. почта', phone: 'Телефон', country: 'Страна', city: 'Город', address: 'Адрес', all: 'Все', loading: 'Загрузка...', error: 'Произошла ошибка', success: 'Успешно' },
  zh: { active: '活跃', passive: '不活跃', cancel: '取消', confirm: '确认', save: '保存', delete: '删除', edit: '编辑', add: '添加', export: '导出', refresh: '刷新', search: '搜索', status: '状态', actions: '操作', noData: '未找到数据', processing: '处理中...', close: '关闭', yes: '是', no: '否', name: '姓名', email: '电子邮箱', phone: '电话号码', country: '国家', city: '城市', address: '地址', all: '全部', loading: '加载中...', error: '发生错误', success: '成功' },
  ja: { active: 'アクティブ', passive: '非アクティブ', cancel: 'キャンセル', confirm: '確認', save: '保存', delete: '削除', edit: '編集', add: '追加', export: 'エクスポート', refresh: '更新', search: '検索', status: 'ステータス', actions: 'アクション', noData: 'データなし', processing: '処理中...', close: '閉じる', yes: 'はい', no: 'いいえ', name: '名前', email: 'メールアドレス', phone: '電話番号', country: '国', city: '市', address: '住所', all: 'すべて', loading: '読み込み中...', error: 'エラーが発生しました', success: '成功' },
  fa: { active: 'فعال', passive: 'غیرفعال', cancel: 'لغو', confirm: 'تایید', save: 'ذخیره', delete: 'حذف', edit: 'ویرایش', add: 'افزودن', export: 'خروجی', refresh: 'بازیابی', search: 'جستجو', status: 'وضعیت', actions: 'اقدامات', noData: 'داده‌ای یافت نشد', processing: 'در حال پردازش...', close: 'بستن', yes: 'بله', no: 'خیر', name: 'نام', email: 'ایمیل', phone: 'شماره تلفن', country: 'کشور', city: 'شهر', address: 'آدرس', all: 'همه', loading: 'در حال بارگذاری...', error: 'خطایی رخ داد', success: 'موفق' },
  fr: { active: 'Actif', passive: 'Inactif', cancel: 'Annuler', confirm: 'Confirmer', save: 'Enregistrer', delete: 'Supprimer', edit: 'Modifier', add: 'Ajouter', export: 'Exporter', refresh: 'Actualiser', search: 'Rechercher', status: 'Statut', actions: 'Actions', noData: 'Aucune donnée', processing: 'Traitement...', close: 'Fermer', yes: 'Oui', no: 'Non', name: 'Nom', email: 'Adresse e-mail', phone: 'Numéro de téléphone', country: 'Pays', city: 'Ville', address: 'Adresse', all: 'Tout', loading: 'Chargement...', error: 'Une erreur est survenue', success: 'Succès' },
  it: { active: 'Attivo', passive: 'Inattivo', cancel: 'Annulla', confirm: 'Conferma', save: 'Salva', delete: 'Elimina', edit: 'Modifica', add: 'Aggiungi', export: 'Esporta', refresh: 'Aggiorna', search: 'Cerca', status: 'Stato', actions: 'Azioni', noData: 'Nessun dato trovato', processing: 'Elaborazione...', close: 'Chiudi', yes: 'Sì', no: 'No', name: 'Nome', email: 'Indirizzo email', phone: 'Numero di telefono', country: 'Paese', city: 'Città', address: 'Indirizzo', all: 'Tutto', loading: 'Caricamento...', error: 'Si è verificato un errore', success: 'Successo' },
  el: { active: 'Ενεργό', passive: 'Ανενεργό', cancel: 'Ακύρωση', confirm: 'Επιβεβαίωση', save: 'Αποθήκευση', delete: 'Διαγραφή', edit: 'Επεξεργασία', add: 'Προσθήκη', export: 'Εξαγωγή', refresh: 'Ανανέωση', search: 'Αναζήτηση', status: 'Κατάσταση', actions: 'Ενέργειες', noData: 'Δεν βρέθηκαν δεδομένα', processing: 'Επεξεργασία...', close: 'Κλείσιμο', yes: 'Ναι', no: 'Όχι', name: 'Όνομα', email: 'Διεύθυνση email', phone: 'Αριθμός τηλεφώνου', country: 'Χώρα', city: 'Πόλη', address: 'Διεύθυνση', all: 'Όλα', loading: 'Φόρτωση...', error: 'Παρουσιάστηκε σφάλμα', success: 'Επιτυχία' },
  pt: { active: 'Ativo', passive: 'Inativo', cancel: 'Cancelar', confirm: 'Confirmar', save: 'Salvar', delete: 'Excluir', edit: 'Editar', add: 'Adicionar', export: 'Exportar', refresh: 'Atualizar', search: 'Pesquisar', status: 'Status', actions: 'Ações', noData: 'Nenhum dado encontrado', processing: 'Processando...', close: 'Fechar', yes: 'Sim', no: 'Não', name: 'Nome', email: 'Endereço de e-mail', phone: 'Número de telefone', country: 'País', city: 'Cidade', address: 'Endereço', all: 'Tudo', loading: 'Carregando...', error: 'Ocorreu um erro', success: 'Sucesso' },
};

// Resolve lang code to base code
export const getLang = (lang) => (lang || 'en').split('-')[0].toLowerCase();

// Lookup helper with fallback to 'en'
export const t = (lang, dict, key) => {
  const l = getLang(lang);
  return dict[l]?.[key] ?? dict.en?.[key] ?? COMMON[l]?.[key] ?? COMMON.en[key] ?? key;
};

// Page-specific locale builder: merges COMMON with page overrides
export const buildLocale = (pageDict) => {
  const result = {};
  const langs = Object.keys(COMMON);
  langs.forEach(l => {
    result[l] = { ...COMMON[l], ...(pageDict[l] || {}) };
  });
  return result;
};
