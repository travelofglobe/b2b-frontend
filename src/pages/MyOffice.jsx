import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { COMMON, getLang } from '../utils/sharedLocales';

const MO = {
  en: { title: 'My Office Management', tabGeneral: 'General Information', tabUsers: 'Users', tabGuests: 'Guests', saveBtn: 'Save Office Profile', saving: 'Synchronizing...', agencyId: 'Agency Identity', baseLocation: 'Base Location', currency: 'Currency', integration: 'Integration', auditTimeline: 'Audit Timeline', created: 'Created', lastUpdate: 'Last Update', sec01: 'Section 01 / Identity', sec02: 'Section 02 / Contact', sec03: 'Section 03 / Geography', sec04: 'Section 04 / Finance', sec05: 'Section 05 / Settings', agencyName: 'Agency Name', officialTitle: 'Official Title', type: 'Type', language: 'Language', parentId: 'Parent ID', directEmail: 'Direct Email', phone: 'Phone Number', country: 'Country', city: 'City', streetAddress: 'Street Address', zipCode: 'Zip Code', taxOffice: 'Tax Office', taxNumber: 'Tax Number', accEmail: 'Accounting Email', accPhone: 'Accounting Phone', accCountry: 'Accounting Country', accCity: 'Accounting City', accAddress: 'Accounting Address', mainCurrency: 'Main Currency', integrationType: 'Integration Type', allowedSale: 'Allowed for Sale', bookingStatus: 'Booking status', selectTerritory: 'Select Territory', selectHub: 'Select Hub', commercialName: 'Commercial Name', legalTitle: 'Legal Title', totalUsers: 'Total Users', activeUsers: 'Active Users', passiveUsers: 'Passive Users', totalGuests: 'Total Guests', activeGuests: 'Active Guests', passiveGuests: 'Passive Guests', searchUsers: 'Search by name or email...', searchGuests: 'Search by name, email or passport...', allRoles: 'All Roles', allCountries: 'All Countries', active: 'Active', passive: 'Passive', export: 'Export', addUser: 'Add User', addGuest: 'Add Guest', editUser: 'Edit User', editGuest: 'Edit Guest', userInfo: 'Enter user information', guestInfo: 'Enter guest information', name: 'Name', surname: 'Surname', emailAddr: 'Email Address', password: 'Password', role: 'Role', status: 'Status', gender: 'Gender', firstName: 'First Name', lastName: 'Last Name', birthDate: 'Birth Date', passportNo: 'Passport No', passportExpiry: 'Passport Expiry', cancel: 'Cancel', saveUser: 'Save User', saveGuest: 'Save Guest', processing: 'Processing...', confirm: 'Confirm', colUser: 'User', colContact: 'Contact', colRole: 'Role', colStatus: 'Status', colActions: 'Actions', colGuest: 'Guest', colBirth: 'Birth & Country', colPassport: 'Passport', noUsers: 'No users found', noGuests: 'No guests found', deleteUser: 'Delete User', deleteUserMsg: 'This action cannot be undone. All access for this user will be revoked immediately.', deleteGuest: 'Delete Guest', deleteGuestMsg: 'Are you sure you want to remove this guest from your CRM?', profileUpdated: 'Agency profile updated successfully.', updateFailed: 'Update failed.', invalidEmail: 'Please enter a valid email address.', userUpdated: 'User updated successfully', userCreated: 'User created successfully', errorSavingUser: 'Error saving user', userDeleted: 'User deleted successfully', errorDeletingUser: 'Error deleting user', noUserExport: 'No user data to export.', usersExported: 'User list exported as CSV.', usersRefreshed: 'User list refreshed', guestUpdated: 'Guest updated successfully', guestCreated: 'Guest created successfully', errorSavingGuest: 'Error saving guest', guestDeleted: 'Guest deleted successfully', errorDeletingGuest: 'Error deleting guest', noGuestExport: 'No guest data to export.', guestsExported: 'Guest list exported as CSV.', guestsRefreshed: 'Guest list refreshed' },
  tr: { title: 'Ofis Yonetimi', tabGeneral: 'Genel Bilgiler', tabUsers: 'Kullanicilar', tabGuests: 'Misafirler', saveBtn: 'Ofis Profilini Kaydet', saving: 'Senkronize ediliyor...', agencyId: 'Acente Kimlik', baseLocation: 'Konum', currency: 'Para Birimi', integration: 'Entegrasyon', auditTimeline: 'Denetim Gecmisi', created: 'Olusturuldu', lastUpdate: 'Son Guncelleme', sec01: 'Bolum 01 / Kimlik', sec02: 'Bolum 02 / Iletisim', sec03: 'Bolum 03 / Cografya', sec04: 'Bolum 04 / Finans', sec05: 'Bolum 05 / Ayarlar', agencyName: 'Acente Adi', officialTitle: 'Resmi Unvan', type: 'Tur', language: 'Dil', parentId: 'Ust ID', directEmail: 'E-posta', phone: 'Telefon', country: 'Ulke', city: 'Sehir', streetAddress: 'Adres', zipCode: 'Posta Kodu', taxOffice: 'Vergi Dairesi', taxNumber: 'Vergi No', accEmail: 'Muhasebe E-posta', accPhone: 'Muhasebe Telefon', accCountry: 'Muhasebe Ulke', accCity: 'Muhasebe Sehir', accAddress: 'Muhasebe Adres', mainCurrency: 'Ana Para Birimi', integrationType: 'Entegrasyon Turu', allowedSale: 'Satisa Acik', bookingStatus: 'Rezervasyon durumu', selectTerritory: 'Bolge Secin', selectHub: 'Sehir Secin', commercialName: 'Ticari Ad', legalTitle: 'Hukuki Unvan', totalUsers: 'Toplam Kullanici', activeUsers: 'Aktif Kullanici', passiveUsers: 'Pasif Kullanici', totalGuests: 'Toplam Misafir', activeGuests: 'Aktif Misafir', passiveGuests: 'Pasif Misafir', searchUsers: 'Ad veya e-posta ara...', searchGuests: 'Ad, e-posta veya pasaport ara...', allRoles: 'Tum Roller', allCountries: 'Tum Ulkeler', active: 'Aktif', passive: 'Pasif', export: 'Disa Aktar', addUser: 'Kullanici Ekle', addGuest: 'Misafir Ekle', editUser: 'Kullanici Duzenle', editGuest: 'Misafir Duzenle', userInfo: 'Kullanici bilgilerini girin', guestInfo: 'Misafir bilgilerini girin', name: 'Ad', surname: 'Soyad', emailAddr: 'E-posta Adresi', password: 'Sifre', role: 'Rol', status: 'Durum', gender: 'Cinsiyet', firstName: 'Ad', lastName: 'Soyad', birthDate: 'Dogum Tarihi', passportNo: 'Pasaport No', passportExpiry: 'Pasaport Bitis', cancel: 'Iptal', saveUser: 'Kullanici Kaydet', saveGuest: 'Misafir Kaydet', processing: 'Isleniyor...', confirm: 'Onayla', colUser: 'Kullanici', colContact: 'Iletisim', colRole: 'Rol', colStatus: 'Durum', colActions: 'Islemler', colGuest: 'Misafir', colBirth: 'Dogum & Ulke', colPassport: 'Pasaport', noUsers: 'Kullanici bulunamadi', noGuests: 'Misafir bulunamadi', deleteUser: 'Kullanici Sil', deleteUserMsg: 'Bu islem geri alinamaz.', deleteGuest: 'Misafir Sil', deleteGuestMsg: 'Bu misafiri CRM sisteminden silmek istediginize emin misiniz?', profileUpdated: 'Acente profili basariyla guncellendi.', updateFailed: 'Guncelleme basarisiz.', invalidEmail: 'Gecerli bir e-posta adresi girin.', userUpdated: 'Kullanici basariyla guncellendi', userCreated: 'Kullanici basariyla olusturuldu', errorSavingUser: 'Kullanici kaydedilemedi', userDeleted: 'Kullanici basariyla silindi', errorDeletingUser: 'Kullanici silinemedi', noUserExport: 'Disa aktarilacak kullanici yok.', usersExported: 'Kullanici listesi CSV olarak aktarildi.', usersRefreshed: 'Kullanici listesi yenilendi', guestUpdated: 'Misafir basariyla guncellendi', guestCreated: 'Misafir basariyla olusturuldu', errorSavingGuest: 'Misafir kaydedilemedi', guestDeleted: 'Misafir basariyla silindi', errorDeletingGuest: 'Misafir silinemedi', noGuestExport: 'Disa aktarilacak misafir yok.', guestsExported: 'Misafir listesi CSV olarak aktarildi.', guestsRefreshed: 'Misafir listesi yenilendi' },
  ar: { title: 'إدارة المكتب', tabGeneral: 'معلومات عامة', tabUsers: 'المستخدمون', tabGuests: 'الضيوف', saveBtn: 'حفظ ملف المكتب', saving: 'جاري المزامنة...', agencyId: 'هوية الوكالة', baseLocation: 'الموقع', currency: 'العملة', integration: 'التكامل', auditTimeline: 'سجل التدقيق', created: 'تاريخ الإنشاء', lastUpdate: 'آخر تحديث', sec01: 'قسم 01 / الهوية', sec02: 'قسم 02 / التواصل', sec03: 'قسم 03 / الجغرافيا', sec04: 'قسم 04 / المالية', sec05: 'قسم 05 / الإعدادات', agencyName: 'اسم الوكالة', officialTitle: 'اللقب الرسمي', type: 'النوع', language: 'اللغة', parentId: 'معرف الأصل', directEmail: 'البريد الإلكتروني', phone: 'رقم الهاتف', country: 'الدولة', city: 'المدينة', streetAddress: 'العنوان', zipCode: 'الرمز البريدي', taxOffice: 'مكتب الضرائب', taxNumber: 'رقم ضريبي', accEmail: 'بريد المحاسبة', accPhone: 'هاتف المحاسبة', accCountry: 'دولة المحاسبة', accCity: 'مدينة المحاسبة', accAddress: 'عنوان الفواتير', mainCurrency: 'العملة الرئيسية', integrationType: 'نوع التكامل', allowedSale: 'متاح للبيع', bookingStatus: 'حالة الحجز', selectTerritory: 'اختر المنطقة', selectHub: 'اختر المدينة', commercialName: 'الاسم التجاري', legalTitle: 'العنوان القانوني', totalUsers: 'إجمالي المستخدمين', activeUsers: 'مستخدمون نشطون', passiveUsers: 'مستخدمون غير نشطين', totalGuests: 'إجمالي الضيوف', activeGuests: 'ضيوف نشطون', passiveGuests: 'ضيوف غير نشطين', searchUsers: 'بحث بالاسم أو البريد...', searchGuests: 'بحث بالاسم أو جواز السفر...', allRoles: 'جميع الأدوار', allCountries: 'جميع الدول', active: 'نشط', passive: 'غير نشط', export: 'تصدير', addUser: 'إضافة مستخدم', addGuest: 'إضافة ضيف', editUser: 'تعديل مستخدم', editGuest: 'تعديل ضيف', userInfo: 'أدخل بيانات المستخدم', guestInfo: 'أدخل بيانات الضيف', name: 'الاسم', surname: 'اللقب', emailAddr: 'البريد الإلكتروني', password: 'كلمة المرور', role: 'الدور', status: 'الحالة', gender: 'الجنس', firstName: 'الاسم الأول', lastName: 'اسم العائلة', birthDate: 'تاريخ الميلاد', passportNo: 'رقم جواز السفر', passportExpiry: 'انتهاء جواز السفر', cancel: 'إلغاء', saveUser: 'حفظ المستخدم', saveGuest: 'حفظ الضيف', processing: 'جاري المعالجة...', confirm: 'تأكيد', colUser: 'المستخدم', colContact: 'التواصل', colRole: 'الدور', colStatus: 'الحالة', colActions: 'الإجراءات', colGuest: 'الضيف', colBirth: 'الميلاد والدولة', colPassport: 'جواز السفر', noUsers: 'لا يوجد مستخدمون', noGuests: 'لا يوجد ضيوف', deleteUser: 'حذف مستخدم', deleteUserMsg: 'لا يمكن التراجع عن هذا الإجراء.', deleteGuest: 'حذف ضيف', deleteGuestMsg: 'هل أنت متأكد من حذف هذا الضيف?' },
  es: { title: 'Mi Oficina', tabGeneral: 'Informacion General', tabUsers: 'Usuarios', tabGuests: 'Huespedes', saveBtn: 'Guardar Perfil', saving: 'Sincronizando...', agencyId: 'Identidad de Agencia', baseLocation: 'Ubicacion', currency: 'Moneda', integration: 'Integracion', auditTimeline: 'Historial de Auditoria', created: 'Creado', lastUpdate: 'Ultima Actualizacion', sec01: 'Seccion 01 / Identidad', sec02: 'Seccion 02 / Contacto', sec03: 'Seccion 03 / Geografa', sec04: 'Seccion 04 / Finanzas', sec05: 'Seccion 05 / Configuracion', agencyName: 'Nombre de Agencia', officialTitle: 'Titulo Oficial', type: 'Tipo', language: 'Idioma', parentId: 'ID Padre', directEmail: 'Email Directo', phone: 'Telefono', country: 'Pais', city: 'Ciudad', streetAddress: 'Direccion', zipCode: 'Codigo Postal', taxOffice: 'Oficina Fiscal', taxNumber: 'Numero Fiscal', accEmail: 'Email Contabilidad', accPhone: 'Telefono Contabilidad', accCountry: 'Pais Contabilidad', accCity: 'Ciudad Contabilidad', accAddress: 'Direccion Contabilidad', mainCurrency: 'Moneda Principal', integrationType: 'Tipo de Integracion', allowedSale: 'Permitido para Venta', bookingStatus: 'Estado de reserva', selectTerritory: 'Seleccionar Territorio', selectHub: 'Seleccionar Ciudad', commercialName: 'Nombre Comercial', legalTitle: 'Titulo Legal', totalUsers: 'Total Usuarios', activeUsers: 'Usuarios Activos', passiveUsers: 'Usuarios Inactivos', totalGuests: 'Total Huespedes', activeGuests: 'Huespedes Activos', passiveGuests: 'Huespedes Inactivos', searchUsers: 'Buscar por nombre o email...', searchGuests: 'Buscar por nombre, email o pasaporte...', allRoles: 'Todos los Roles', allCountries: 'Todos los Paises', active: 'Activo', passive: 'Inactivo', export: 'Exportar', addUser: 'Agregar Usuario', addGuest: 'Agregar Huesped', editUser: 'Editar Usuario', editGuest: 'Editar Huesped', userInfo: 'Ingrese informacion del usuario', guestInfo: 'Ingrese informacion del huesped', name: 'Nombre', surname: 'Apellido', emailAddr: 'Correo Electronico', password: 'Contrasena', role: 'Rol', status: 'Estado', gender: 'Genero', firstName: 'Nombre', lastName: 'Apellido', birthDate: 'Fecha de Nacimiento', passportNo: 'No. Pasaporte', passportExpiry: 'Vencimiento Pasaporte', cancel: 'Cancelar', saveUser: 'Guardar Usuario', saveGuest: 'Guardar Huesped', processing: 'Procesando...', confirm: 'Confirmar', colUser: 'Usuario', colContact: 'Contacto', colRole: 'Rol', colStatus: 'Estado', colActions: 'Acciones', colGuest: 'Huesped', colBirth: 'Nacimiento y Pais', colPassport: 'Pasaporte', noUsers: 'No se encontraron usuarios', noGuests: 'No se encontraron huespedes', deleteUser: 'Eliminar Usuario', deleteUserMsg: 'Esta accion no se puede deshacer.', deleteGuest: 'Eliminar Huesped', deleteGuestMsg: '?Esta seguro de eliminar este huesped del CRM?', profileUpdated: 'Perfil actualizado', updateFailed: 'Fallo de actualización', invalidEmail: 'Correo no válido', userUpdated: 'Usuario actualizado', userCreated: 'Usuario creado', errorSavingUser: 'Error al guardar', userDeleted: 'Usuario eliminado', errorDeletingUser: 'Error al eliminar', noUserExport: 'No hay datos', usersExported: 'Exportación completada', usersRefreshed: 'Lista actualizada', guestUpdated: 'Huésped actualizado', guestCreated: 'Huésped creado', errorSavingGuest: 'Error al guardar', guestDeleted: 'Huésped eliminado', errorDeletingGuest: 'Error al eliminar', noGuestExport: 'No hay datos', guestsExported: 'Exportación completada', guestsRefreshed: 'Lista actualizada' },
  ru: { title: 'Управление офисом', tabGeneral: 'Общая информация', tabUsers: 'Пользователи', tabGuests: 'Гости', saveBtn: 'Сохранить профиль', saving: 'Синхронизация...', agencyId: 'Идентификатор', baseLocation: 'Местоположение', currency: 'Валюта', integration: 'Интеграция', auditTimeline: 'История', created: 'Создано', lastUpdate: 'Обновлено', sec01: 'Раздел 01', sec02: 'Раздел 02', sec03: 'Раздел 03', sec04: 'Раздел 04', sec05: 'Раздел 05', agencyName: 'Название агентства', officialTitle: 'Официальное название', type: 'Тип', language: 'Язык', parentId: 'ID родителя', directEmail: 'Прямой Email', phone: 'Телефон', country: 'Страна', city: 'Город', streetAddress: 'Адрес', zipCode: 'Индекс', taxOffice: 'Налоговая', taxNumber: 'ИНН', accEmail: 'Бух. Email', accPhone: 'Бух. телефон', accCountry: 'Бух. страна', accCity: 'Бух. город', accAddress: 'Бух. адрес', mainCurrency: 'Основная валюта', integrationType: 'Интеграция', allowedSale: 'Разрешено', bookingStatus: 'Статус брони', selectTerritory: 'Выберите территорию', selectHub: 'Выберите хаб', commercialName: 'Коммерческое название', legalTitle: 'Юридическое название', totalUsers: 'Всего', activeUsers: 'Активные', passiveUsers: 'Пассивные', totalGuests: 'Всего', activeGuests: 'Активные', passiveGuests: 'Пассивные', searchUsers: 'Поиск...', searchGuests: 'Поиск...', allRoles: 'Все', allCountries: 'Все', active: 'Активный', passive: 'Пассивный', export: 'Экспорт', addUser: 'Добавить', addGuest: 'Добавить', editUser: 'Редактировать', editGuest: 'Редактировать', userInfo: 'Введите информацию', guestInfo: 'Введите информацию', name: 'Имя', surname: 'Фамилия', emailAddr: 'Email', password: 'Пароль', role: 'Роль', status: 'Статус', gender: 'Пол', firstName: 'Имя', lastName: 'Фамилия', birthDate: 'Дата рождения', passportNo: 'Паспорт', passportExpiry: 'Срок', cancel: 'Отмена', saveUser: 'Сохранить', saveGuest: 'Сохранить', processing: 'Обработка...', confirm: 'Подтвердить', colUser: 'Пользователь', colContact: 'Контакт', colRole: 'Роль', colStatus: 'Статус', colActions: 'Действия', colGuest: 'Гость', colBirth: 'Рождение', colPassport: 'Паспорт', noUsers: 'Не найдено', noGuests: 'Не найдено', deleteUser: 'Удалить', deleteUserMsg: 'Нельзя отменить.', deleteGuest: 'Удалить', deleteGuestMsg: 'Уверены?', profileUpdated: 'Обновлено', updateFailed: 'Ошибка', invalidEmail: 'Неверный email', userUpdated: 'Обновлен', userCreated: 'Создан', errorSavingUser: 'Ошибка', userDeleted: 'Удален', errorDeletingUser: 'Ошибка', noUserExport: 'Нет данных', usersExported: 'Готово', usersRefreshed: 'Обновлено', guestUpdated: 'Обновлен', guestCreated: 'Создан', errorSavingGuest: 'Ошибка', guestDeleted: 'Удален', errorDeletingGuest: 'Ошибка', noGuestExport: 'Нет данных', guestsExported: 'Готово', guestsRefreshed: 'Обновлено' },
  zh: { title: '办公室管理', tabGeneral: '常规信息', tabUsers: '用户', tabGuests: '客人', saveBtn: '保存', saving: '同步中...', agencyId: '机构身份', baseLocation: '基本位置', currency: '货币', integration: '集成', auditTimeline: '审计', created: '已创建', lastUpdate: '上次更新', sec01: '第01节', sec02: '第02节', sec03: '第03节', sec04: '第04节', sec05: '第05节', agencyName: '机构名称', officialTitle: '官方头衔', type: '类型', language: '语言', parentId: '父ID', directEmail: '直接邮箱', phone: '电话', country: '国家', city: '城市', streetAddress: '地址', zipCode: '邮编', taxOffice: '税务局', taxNumber: '税号', accEmail: '财务邮箱', accPhone: '财务电话', accCountry: '财务国家', accCity: '财务城市', accAddress: '财务地址', mainCurrency: '主要货币', integrationType: '集成类型', allowedSale: '允许销售', bookingStatus: '预订状态', selectTerritory: '选择领土', selectHub: '选择枢纽', commercialName: '商业名称', legalTitle: '法定名称', totalUsers: '用户总数', activeUsers: '活跃用户', passiveUsers: '非活跃用户', totalGuests: '客人总数', activeGuests: '活跃客人', passiveGuests: '非活跃客人', searchUsers: '搜索...', searchGuests: '搜索...', allRoles: '所有角色', allCountries: '所有国家', active: '活跃', passive: '非活跃', export: '导出', addUser: '添加用户', addGuest: '添加客人', editUser: '编辑', editGuest: '编辑', userInfo: '输入用户信息', guestInfo: '输入客人信息', name: '名字', surname: '姓氏', emailAddr: '邮箱', password: '密码', role: '角色', status: '状态', gender: '性别', firstName: '名字', lastName: '姓氏', birthDate: '出生日期', passportNo: '护照号码', passportExpiry: '护照到期', cancel: '取消', saveUser: '保存', saveGuest: '保存', processing: '处理中...', confirm: '确认', colUser: '用户', colContact: '联系方式', colRole: '角色', colStatus: '状态', colActions: '操作', colGuest: '客人', colBirth: '出生', colPassport: '护照', noUsers: '未找到', noGuests: '未找到', deleteUser: '删除', deleteUserMsg: '无法撤销。', deleteGuest: '删除', deleteGuestMsg: '确定删除？', profileUpdated: '已更新', updateFailed: '失败', invalidEmail: '无效邮箱', userUpdated: '已更新', userCreated: '已创建', errorSavingUser: '错误', userDeleted: '已删除', errorDeletingUser: '错误', noUserExport: '无数据', usersExported: '完成', usersRefreshed: '已刷新', guestUpdated: '已更新', guestCreated: '已创建', errorSavingGuest: '错误', guestDeleted: '已删除', errorDeletingGuest: '错误', noGuestExport: '无数据', guestsExported: '完成', guestsRefreshed: '已刷新' },
  ja: { title: 'オフィス管理', tabGeneral: '一般情報', tabUsers: 'ユーザー', tabGuests: 'ゲスト', saveBtn: '保存', saving: '同期中...', agencyId: 'エージェンシーID', baseLocation: '拠点', currency: '通貨', integration: '統合', auditTimeline: '監査', created: '作成', lastUpdate: '最終更新', sec01: 'セクション01', sec02: 'セクション02', sec03: 'セクション03', sec04: 'セクション04', sec05: 'セクション05', agencyName: '代理店名', officialTitle: '公式名', type: '種類', language: '言語', parentId: '親ID', directEmail: 'Eメール', phone: '電話', country: '国', city: '都市', streetAddress: '住所', zipCode: '郵便番号', taxOffice: '税務署', taxNumber: '税番号', accEmail: '経理Eメール', accPhone: '経理電話', accCountry: '経理の国', accCity: '経理の都市', accAddress: '経理の住所', mainCurrency: '主通貨', integrationType: '統合タイプ', allowedSale: '販売許可', bookingStatus: '予約ステータス', selectTerritory: '領域を選択', selectHub: 'ハブを選択', commercialName: '商業名', legalTitle: '法的名称', totalUsers: '総ユーザー', activeUsers: 'アクティブ', passiveUsers: 'パッシブ', totalGuests: '総ゲスト', activeGuests: 'アクティブ', passiveGuests: 'パッシブ', searchUsers: '検索...', searchGuests: '検索...', allRoles: 'すべての役割', allCountries: 'すべての国', active: 'アクティブ', passive: '非アクティブ', export: 'エクスポート', addUser: '追加', addGuest: '追加', editUser: '編集', editGuest: '編集', userInfo: 'ユーザー情報', guestInfo: 'ゲスト情報', name: '名前', surname: '苗字', emailAddr: 'Eメール', password: 'パスワード', role: '役割', status: 'ステータス', gender: '性別', firstName: '名', lastName: '姓', birthDate: '生年月日', passportNo: 'パスポート', passportExpiry: '期限', cancel: 'キャンセル', saveUser: '保存', saveGuest: '保存', processing: '処理中...', confirm: '確認', colUser: 'ユーザー', colContact: '連絡先', colRole: '役割', colStatus: '状態', colActions: 'アクション', colGuest: 'ゲスト', colBirth: '誕生', colPassport: 'パスポート', noUsers: 'なし', noGuests: 'なし', deleteUser: '削除', deleteUserMsg: '元に戻せません', deleteGuest: '削除', deleteGuestMsg: '削除しますか?', profileUpdated: '更新済', updateFailed: '失敗', invalidEmail: '無効なEメール', userUpdated: '更新済', userCreated: '作成済', errorSavingUser: 'エラー', userDeleted: '削除済', errorDeletingUser: 'エラー', noUserExport: 'データなし', usersExported: '完了', usersRefreshed: '更新', guestUpdated: '更新済', guestCreated: '作成済', errorSavingGuest: 'エラー', guestDeleted: '削除済', errorDeletingGuest: 'エラー', noGuestExport: 'データなし', guestsExported: '完了', guestsRefreshed: '更新' },
  fa: { title: 'مدیریت دفتر', tabGeneral: 'اطلاعات عمومی', tabUsers: 'کاربران', tabGuests: 'مهمانان', saveBtn: 'ذخیره', saving: 'در حال همگام سازی...', agencyId: 'شناسه آژانس', baseLocation: 'مکان', currency: 'ارز', integration: 'ادغام', auditTimeline: 'حسابرسی', created: 'ایجاد شده', lastUpdate: 'آخرین بروزرسانی', sec01: 'بخش 01', sec02: 'بخش 02', sec03: 'بخش 03', sec04: 'بخش 04', sec05: 'بخش 05', agencyName: 'نام آژانس', officialTitle: 'عنوان رسمی', type: 'نوع', language: 'زبان', parentId: 'شناسه والد', directEmail: 'ایمیل مستقیم', phone: 'تلفن', country: 'کشور', city: 'شهر', streetAddress: 'آدرس', zipCode: 'کد پستی', taxOffice: 'اداره مالیات', taxNumber: 'شماره مالیاتی', accEmail: 'ایمیل حسابداری', accPhone: 'تلفن حسابداری', accCountry: 'کشور حسابداری', accCity: 'شهر حسابداری', accAddress: 'آدرس حسابداری', mainCurrency: 'ارز اصلی', integrationType: 'نوع ادغام', allowedSale: 'مجاز برای فروش', bookingStatus: 'وضعیت رزرو', selectTerritory: 'انتخاب قلمرو', selectHub: 'انتخاب هاب', commercialName: 'نام تجاری', legalTitle: 'عنوان قانونی', totalUsers: 'کل کاربران', activeUsers: 'کاربران فعال', passiveUsers: 'غیرفعال', totalGuests: 'کل مهمانان', activeGuests: 'فعال', passiveGuests: 'غیرفعال', searchUsers: 'جستجو...', searchGuests: 'جستجو...', allRoles: 'همه نقش ها', allCountries: 'همه کشورها', active: 'فعال', passive: 'غیرفعال', export: 'خروجی', addUser: 'افزودن کاربر', addGuest: 'افزودن مهمان', editUser: 'ویرایش', editGuest: 'ویرایش', userInfo: 'اطلاعات کاربر', guestInfo: 'اطلاعات مهمان', name: 'نام', surname: 'نام خانوادگی', emailAddr: 'ایمیل', password: 'رمز عبور', role: 'نقش', status: 'وضعیت', gender: 'جنسیت', firstName: 'نام', lastName: 'نام خانوادگی', birthDate: 'تاریخ تولد', passportNo: 'شماره پاسپورت', passportExpiry: 'انقضا پاسپورت', cancel: 'لغو', saveUser: 'ذخیره', saveGuest: 'ذخیره', processing: 'در حال پردازش...', confirm: 'تایید', colUser: 'کاربر', colContact: 'تماس', colRole: 'نقش', colStatus: 'وضعیت', colActions: 'اقدامات', colGuest: 'مهمان', colBirth: 'تولد', colPassport: 'پاسپورت', noUsers: 'یافت نشد', noGuests: 'یافت نشد', deleteUser: 'حذف', deleteUserMsg: 'غیر قابل بازگشت است.', deleteGuest: 'حذف', deleteGuestMsg: 'مطمئن هستید؟', profileUpdated: 'بروز شد', updateFailed: 'خطا', invalidEmail: 'ایمیل نامعتبر', userUpdated: 'بروز شد', userCreated: 'ایجاد شد', errorSavingUser: 'خطا', userDeleted: 'حذف شد', errorDeletingUser: 'خطا', noUserExport: 'داده ای نیست', usersExported: 'انجام شد', usersRefreshed: 'بروز شد', guestUpdated: 'بروز شد', guestCreated: 'ایجاد شد', errorSavingGuest: 'خطا', guestDeleted: 'حذف شد', errorDeletingGuest: 'خطا', noGuestExport: 'داده ای نیست', guestsExported: 'انجام شد', guestsRefreshed: 'بروز شد' },
  fr: { title: 'Mon Bureau', tabGeneral: 'Informations', tabUsers: 'Utilisateurs', tabGuests: 'Invités', saveBtn: 'Enregistrer', saving: 'Synchronisation...', agencyId: 'Identité', baseLocation: 'Emplacement', currency: 'Devise', integration: 'Intégration', auditTimeline: 'Audit', created: 'Créé', lastUpdate: 'Mise à jour', sec01: 'Section 01', sec02: 'Section 02', sec03: 'Section 03', sec04: 'Section 04', sec05: 'Section 05', agencyName: 'Nom Agence', officialTitle: 'Titre Officiel', type: 'Type', language: 'Langue', parentId: 'ID Parent', directEmail: 'Email', phone: 'Téléphone', country: 'Pays', city: 'Ville', streetAddress: 'Adresse', zipCode: 'Code Postal', taxOffice: 'Bureau Fiscal', taxNumber: 'Numéro Fiscal', accEmail: 'Email Compta', accPhone: 'Tél Compta', accCountry: 'Pays Compta', accCity: 'Ville Compta', accAddress: 'Adresse Compta', mainCurrency: 'Devise principale', integrationType: 'Intégration', allowedSale: 'Autorisé', bookingStatus: 'Statut Rési', selectTerritory: 'Territoire', selectHub: 'Hub', commercialName: 'Nom Commercial', legalTitle: 'Titre Légal', totalUsers: 'Total', activeUsers: 'Actifs', passiveUsers: 'Passifs', totalGuests: 'Total', activeGuests: 'Actifs', passiveGuests: 'Passifs', searchUsers: 'Recherche...', searchGuests: 'Recherche...', allRoles: 'Tous rôles', allCountries: 'Tous pays', active: 'Actif', passive: 'Inactif', export: 'Exporter', addUser: 'Ajouter', addGuest: 'Ajouter', editUser: 'Modifier', editGuest: 'Modifier', userInfo: 'Infos utilisateur', guestInfo: 'Infos invité', name: 'Nom', surname: 'Prénom', emailAddr: 'Email', password: 'Mot de passe', role: 'Rôle', status: 'Statut', gender: 'Genre', firstName: 'Prénom', lastName: 'Nom', birthDate: 'Naissance', passportNo: 'Passeport', passportExpiry: 'Expiration', cancel: 'Annuler', saveUser: 'Enregistrer', saveGuest: 'Enregistrer', processing: 'Traitement...', confirm: 'Confirmer', colUser: 'Utilisateur', colContact: 'Contact', colRole: 'Rôle', colStatus: 'Statut', colActions: 'Actions', colGuest: 'Invité', colBirth: 'Naissance', colPassport: 'Passeport', noUsers: 'Aucun trouvé', noGuests: 'Aucun trouvé', deleteUser: 'Supprimer', deleteUserMsg: 'Irréversible.', deleteGuest: 'Supprimer', deleteGuestMsg: 'Êtes-vous sûr?', profileUpdated: 'Mis à jour', updateFailed: 'Échec', invalidEmail: 'Email invalide', userUpdated: 'Mis à jour', userCreated: 'Créé', errorSavingUser: 'Erreur', userDeleted: 'Supprimé', errorDeletingUser: 'Erreur', noUserExport: 'Aucune donnée', usersExported: 'Fait', usersRefreshed: 'Actualisé', guestUpdated: 'Mis à jour', guestCreated: 'Créé', errorSavingGuest: 'Erreur', guestDeleted: 'Supprimé', errorDeletingGuest: 'Erreur', noGuestExport: 'Aucune donnée', guestsExported: 'Fait', guestsRefreshed: 'Actualisé' },
  it: { title: 'Il mio Ufficio', tabGeneral: 'Informazioni', tabUsers: 'Utenti', tabGuests: 'Ospiti', saveBtn: 'Salva', saving: 'Sincronizzazione...', agencyId: 'Identità', baseLocation: 'Posizione', currency: 'Valuta', integration: 'Integrazione', auditTimeline: 'Audit', created: 'Creato', lastUpdate: 'Ultimo Aggiornamento', sec01: 'Sezione 01', sec02: 'Sezione 02', sec03: 'Sezione 03', sec04: 'Sezione 04', sec05: 'Sezione 05', agencyName: 'Nome Agenzia', officialTitle: 'Titolo Ufficiale', type: 'Tipo', language: 'Lingua', parentId: 'ID Genitore', directEmail: 'Email', phone: 'Telefono', country: 'Paese', city: 'Città', streetAddress: 'Indirizzo', zipCode: 'CAP', taxOffice: 'Ufficio Tasse', taxNumber: 'Partita IVA', accEmail: 'Email Contab', accPhone: 'Tel Contab', accCountry: 'Paese Contab', accCity: 'Città Contab', accAddress: 'Indirizzo Contab', mainCurrency: 'Valuta Prin', integrationType: 'Integrazione', allowedSale: 'Consentito', bookingStatus: 'Stato preno', selectTerritory: 'Territorio', selectHub: 'Hub', commercialName: 'Nome Comm', legalTitle: 'Titolo Legale', totalUsers: 'Totale', activeUsers: 'Attivi', passiveUsers: 'Inattivi', totalGuests: 'Totale', activeGuests: 'Attivi', passiveGuests: 'Inattivi', searchUsers: 'Cerca...', searchGuests: 'Cerca...', allRoles: 'Tutti i ruoli', allCountries: 'Tutti i paesi', active: 'Attivo', passive: 'Inattivo', export: 'Esporta', addUser: 'Aggiungi', addGuest: 'Aggiungi', editUser: 'Modifica', editGuest: 'Modifica', userInfo: 'Info utente', guestInfo: 'Info ospite', name: 'Nome', surname: 'Cognome', emailAddr: 'Email', password: 'Password', role: 'Ruolo', status: 'Stato', gender: 'Sesso', firstName: 'Nome', lastName: 'Cognome', birthDate: 'Data di nascita', passportNo: 'Passaporto', passportExpiry: 'Scadenza', cancel: 'Annulla', saveUser: 'Salva', saveGuest: 'Salva', processing: 'Elaborazione...', confirm: 'Conferma', colUser: 'Utente', colContact: 'Contatto', colRole: 'Ruolo', colStatus: 'Stato', colActions: 'Azioni', colGuest: 'Ospite', colBirth: 'Nascita', colPassport: 'Passaporto', noUsers: 'Nessuno', noGuests: 'Nessuno', deleteUser: 'Elimina', deleteUserMsg: 'Irreversibile.', deleteGuest: 'Elimina', deleteGuestMsg: 'Sei sicuro?', profileUpdated: 'Aggiornato', updateFailed: 'Fallito', invalidEmail: 'Email non valida', userUpdated: 'Aggiornato', userCreated: 'Creato', errorSavingUser: 'Errore', userDeleted: 'Eliminato', errorDeletingUser: 'Errore', noUserExport: 'Nessun dato', usersExported: 'Fatto', usersRefreshed: 'Aggiornato', guestUpdated: 'Aggiornato', guestCreated: 'Creato', errorSavingGuest: 'Errore', guestDeleted: 'Eliminato', errorDeletingGuest: 'Errore', noGuestExport: 'Nessun dato', guestsExported: 'Fatto', guestsRefreshed: 'Aggiornato' },
  el: { title: 'Το Γραφείο Μου', tabGeneral: 'Πληροφορίες', tabUsers: 'Χρήστες', tabGuests: 'Επισκέπτες', saveBtn: 'Αποθήκευση', saving: 'Συγχρονισμός...', agencyId: 'Ταυτότητα', baseLocation: 'Τοποθεσία', currency: 'Νόμισμα', integration: 'Ενσωμάτωση', auditTimeline: 'Ιστορικό', created: 'Δημιουργήθηκε', lastUpdate: 'Ενημέρωση', sec01: 'Ενότητα 01', sec02: 'Ενότητα 02', sec03: 'Ενότητα 03', sec04: 'Ενότητα 04', sec05: 'Ενότητα 05', agencyName: 'Όνομα Πρακτορείου', officialTitle: 'Τίτλος', type: 'Τύπος', language: 'Γλώσσα', parentId: 'ID Γονέα', directEmail: 'Email', phone: 'Τηλέφωνο', country: 'Χώρα', city: 'Πόλη', streetAddress: 'Διεύθυνση', zipCode: 'Τ.Κ.', taxOffice: 'Εφορία', taxNumber: 'ΑΦΜ', accEmail: 'Email Λογ/ρίου', accPhone: 'Τηλ Λογ/ρίου', accCountry: 'Χώρα Λογ/ρίου', accCity: 'Πόλη Λογ/ρίου', accAddress: 'Διευθ Λογ/ρίου', mainCurrency: 'Νόμισμα', integrationType: 'Τύπος', allowedSale: 'Επιτρέπεται', bookingStatus: 'Κατάσταση', selectTerritory: 'Περιοχή', selectHub: 'Hub', commercialName: 'Όνομα', legalTitle: 'Νομική μορφή', totalUsers: 'Σύνολο', activeUsers: 'Ενεργοί', passiveUsers: 'Ανενεργοί', totalGuests: 'Σύνολο', activeGuests: 'Ενεργοί', passiveGuests: 'Ανενεργοί', searchUsers: 'Αναζήτηση...', searchGuests: 'Αναζήτηση...', allRoles: 'Όλοι', allCountries: 'Όλες', active: 'Ενεργό', passive: 'Ανενεργό', export: 'Εξαγωγή', addUser: 'Προσθήκη', addGuest: 'Προσθήκη', editUser: 'Επεξεργασία', editGuest: 'Επεξεργασία', userInfo: 'Πληροφορίες', guestInfo: 'Πληροφορίες', name: 'Όνομα', surname: 'Επώνυμο', emailAddr: 'Email', password: 'Κωδικός', role: 'Ρόλος', status: 'Κατάσταση', gender: 'Φύλο', firstName: 'Όνομα', lastName: 'Επώνυμο', birthDate: 'Γέννηση', passportNo: 'Διαβατήριο', passportExpiry: 'Λήξη', cancel: 'Ακύρωση', saveUser: 'Αποθήκευση', saveGuest: 'Αποθήκευση', processing: 'Επεξεργασία...', confirm: 'Επιβεβαίωση', colUser: 'Χρήστης', colContact: 'Επικοινωνία', colRole: 'Ρόλος', colStatus: 'Κατάσταση', colActions: 'Ενέργειες', colGuest: 'Επισκέπτης', colBirth: 'Γέννηση', colPassport: 'Διαβατήριο', noUsers: 'Κανένας', noGuests: 'Κανένας', deleteUser: 'Διαγραφή', deleteUserMsg: 'Μη αναστρέψιμο.', deleteGuest: 'Διαγραφή', deleteGuestMsg: 'Σίγουρα;', profileUpdated: 'Ενημερώθηκε', updateFailed: 'Αποτυχία', invalidEmail: 'Άκυρο email', userUpdated: 'Ενημερώθηκε', userCreated: 'Δημιουργήθηκε', errorSavingUser: 'Σφάλμα', userDeleted: 'Διαγράφηκε', errorDeletingUser: 'Σφάλμα', noUserExport: 'Κενό', usersExported: 'Ολοκληρώθηκε', usersRefreshed: 'Ανανεώθηκε', guestUpdated: 'Ενημερώθηκε', guestCreated: 'Δημιουργήθηκε', errorSavingGuest: 'Σφάλμα', guestDeleted: 'Διαγράφηκε', errorDeletingGuest: 'Σφάλμα', noGuestExport: 'Κενό', guestsExported: 'Ολοκληρώθηκε', guestsRefreshed: 'Ανανεώθηκε' },
  pt: { title: 'Meu Escritório', tabGeneral: 'Informações Gerais', tabUsers: 'Usuários', tabGuests: 'Hóspedes', saveBtn: 'Salvar', saving: 'Sincronizando...', agencyId: 'Identidade', baseLocation: 'Localização', currency: 'Moeda', integration: 'Integração', auditTimeline: 'Auditoria', created: 'Criado', lastUpdate: 'Última Atualização', sec01: 'Seção 01', sec02: 'Seção 02', sec03: 'Seção 03', sec04: 'Seção 04', sec05: 'Seção 05', agencyName: 'Nome da Agência', officialTitle: 'Título Oficial', type: 'Tipo', language: 'Idioma', parentId: 'ID Principal', directEmail: 'Email', phone: 'Telefone', country: 'País', city: 'Cidade', streetAddress: 'Endereço', zipCode: 'CEP', taxOffice: 'Finanças', taxNumber: 'NIF', accEmail: 'Email Contab', accPhone: 'Tel Contab', accCountry: 'País Contab', accCity: 'Cidade Contab', accAddress: 'Endereço Contab', mainCurrency: 'Moeda Principal', integrationType: 'Integração', allowedSale: 'Permitido', bookingStatus: 'Status Reserva', selectTerritory: 'Território', selectHub: 'Hub', commercialName: 'Nome Comercial', legalTitle: 'Título Legal', totalUsers: 'Total', activeUsers: 'Ativos', passiveUsers: 'Inativos', totalGuests: 'Total', activeGuests: 'Ativos', passiveGuests: 'Inativos', searchUsers: 'Buscar...', searchGuests: 'Buscar...', allRoles: 'Todos os papéis', allCountries: 'Todos os países', active: 'Ativo', passive: 'Inativo', export: 'Exportar', addUser: 'Adicionar', addGuest: 'Adicionar', editUser: 'Editar', editGuest: 'Editar', userInfo: 'Info usuário', guestInfo: 'Info hóspede', name: 'Nome', surname: 'Sobrenome', emailAddr: 'Email', password: 'Senha', role: 'Papel', status: 'Status', gender: 'Gênero', firstName: 'Nome', lastName: 'Sobrenome', birthDate: 'Nascimento', passportNo: 'Passaporte', passportExpiry: 'Validade', cancel: 'Cancelar', saveUser: 'Salvar', saveGuest: 'Salvar', processing: 'Processando...', confirm: 'Confirmar', colUser: 'Usuário', colContact: 'Contato', colRole: 'Papel', colStatus: 'Status', colActions: 'Ações', colGuest: 'Hóspede', colBirth: 'Nascimento', colPassport: 'Passaporte', noUsers: 'Nenhum', noGuests: 'Nenhum', deleteUser: 'Excluir', deleteUserMsg: 'Irreversível.', deleteGuest: 'Excluir', deleteGuestMsg: 'Tem certeza?', profileUpdated: 'Atualizado', updateFailed: 'Falha', invalidEmail: 'Email inválido', userUpdated: 'Atualizado', userCreated: 'Criado', errorSavingUser: 'Erro', userDeleted: 'Excluído', errorDeletingUser: 'Erro', noUserExport: 'Sem dados', usersExported: 'Feito', usersRefreshed: 'Atualizado', guestUpdated: 'Atualizado', guestCreated: 'Criado', errorSavingGuest: 'Erro', guestDeleted: 'Excluído', errorDeletingGuest: 'Erro', noGuestExport: 'Sem dados', guestsExported: 'Feito', guestsRefreshed: 'Atualizado' }
};
const tMO = (lang, key) => { const l = getLang(lang); return MO[l]?.[key] ?? MO.en[key] ?? COMMON[l]?.[key] ?? COMMON.en[key] ?? key; };
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { agencyService } from '../services/agencyService';
import { locationService } from '../services/locationService';
import { userService, roleService } from '../services/userService';
import { guestService } from '../services/guestService';
import { currencyService } from '../services/currencyService';
import HeaderActions from '../components/HeaderActions';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PhoneInput from '../components/PhoneInput';
import '../datepicker-custom.css';

// Fix Leaflet marker icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Module-level cache removed to allow dynamic data refresh on every mount


// Helper to format YYYY-MM-DD to DD.MM.YYYY for backend
const formatToBackendDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
};

// Helper to format DD.MM.YYYY to YYYY-MM-DD for date picker
const formatToPickerDate = (dateStr) => {
    if (!dateStr || !dateStr.includes('.')) return '';
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month}-${day}`;
};

const getCountryName = (countries, alphaTwoCode, lang = 'en') => {
    if (!alphaTwoCode) return '';
    const c = countries.find(x => x.alphaTwoCode === alphaTwoCode);
    if (!c) return alphaTwoCode;
    return c.name?.translations?.[lang] || c.name?.translations?.en || c.name?.defaultName || alphaTwoCode;
};

// Export to CSV Helper
const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            const value = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Skeleton Loading Component
const TableSkeleton = ({ columns }) => (
    <>
        {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="animate-pulse">
                {[...Array(columns)].map((_, j) => (
                    <td key={j} className="p-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div></td>
                ))}
            </tr>
        ))}
    </>
);

// Map Recenter Component
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

// Map Click Handler Component
const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    if (!position || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
        return null;
    }

    return <Marker position={position} />;
};

const MyOffice = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { i18n } = useTranslation();
    const [currentLang, setCurrentLang] = useState(() => (i18n.language || localStorage.getItem('i18nextLng') || 'en').split('-')[0].toLowerCase());
    useEffect(() => {
        setCurrentLang((i18n.language || 'en').split('-')[0].toLowerCase());
        const handler = (lng) => setCurrentLang((lng || 'en').split('-')[0].toLowerCase());
        i18n.on('languageChanged', handler);
        return () => i18n.off('languageChanged', handler);
    }, [i18n]);
    const L = (key) => tMO(currentLang, key);
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(false);
    const [guestsLoading, setGuestsLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [mapCenter, setMapCenter] = useState([36.6826845, 30.9089719]);
    const [zoom, setZoom] = useState(13);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // Cache tracking
    const isUsersLoaded = useRef(false);
    const isGuestsLoaded = useRef(false);

    // Summary data
    const [summary, setSummary] = useState({ totalCount: 0, activeCount: 0, passiveCount: 0, totalGuestCount: 0, activeGuestCount: 0, passiveGuestCount: 0 });

    // User management state
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [userFilters, setUserFilters] = useState({ query: '', status: 'ACTIVE', roleIds: [] });
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userApiError, setUserApiError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [userFormData, setUserFormData] = useState({ name: '', surname: '', email: '', password: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE', roleIds: [] });

    // Guest management state
    const [guests, setGuests] = useState([]);
    const [guestFilters, setGuestFilters] = useState({ query: '', status: 'ACTIVE', countryCodes: [] });
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);
    const [guestApiError, setGuestApiError] = useState(null);
    const [guestFormData, setGuestFormData] = useState({
        gender: 'MALE',
        firstName: '',
        lastName: '',
        birthDate: '', 
        country: '',
        passportNo: '',
        passportExpiry: '', 
        email: '',
        phoneCountryCode: '90',
        phoneNumber: '',
        status: 'ACTIVE'
    });
    const [guestCountrySearch, setGuestCountrySearch] = useState('');
    const [showGuestCountries, setShowGuestCountries] = useState(false);

    // Form data (General Info)
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        officialTitle: '',
        agencyType: '', // Initialized to avoid controlled/uncontrolled warning
        defaultLanguage: 'EN',
        parentId: '', // Added missing initial state
        countryId: '',
        cityId: '',
        zipCode: '',
        address: '',
        latitude: 36.6826845,
        longitude: 30.9089719,
        phoneCountryCode: '',
        phoneNumber: '',
        email: '',
        website: '',
        taxOffice: '',
        taxNumber: '',
        agencyFinancialInfo: {
            title: '',
            taxOffice: '',
            taxNumber: '',
            email: '',
            phoneCountryCode: '',
            phoneNumber: '',
            countryId: '',
            cityId: '',
            address: ''
        },
        createDateTime: null,
        updateDateTime: null,
        createdBy: '',
        updatedBy: ''
    });

    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [finCities, setFinCities] = useState([]);
    const [currencies, setCurrencies] = useState([]);

    // Single Mount Effect
    useEffect(() => {
        const abortController = new AbortController();
        const fetchOnMount = async () => {
            await fetchInitialData(abortController.signal);
        };
        fetchOnMount();
        fetchStats(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, []);

    // Tab Lazy Loading Logic
    useEffect(() => {
        if (activeTab === 'users' && !isUsersLoaded.current) {
            fetchUsersData();
            isUsersLoaded.current = true;
        } else if (activeTab === 'guests' && !isGuestsLoaded.current) {
            fetchGuestsData();
            isGuestsLoaded.current = true;
        }
    }, [activeTab]);

    const showNotification = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchInitialData = async (signal) => {
        try {
            setLoading(true);
            const [agencyData, countriesData, currenciesData] = await Promise.all([
                agencyService.getMe(signal),
                locationService.listCountries(signal),
                currencyService.listActiveCurrencies(signal)
            ]);

            setCountries(countriesData.locationList || []);
            setCurrencies(currenciesData || []);

            let initialCities = [];
            if (agencyData.countryId) {
                try {
                    const citiesData = await locationService.listSubRegions(agencyData.countryId);
                    initialCities = citiesData.locationList || [];
                } catch (e) { console.error(e); }
            }
            setCities(initialCities);

            let initialFinCities = [];
            if (agencyData.agencyFinancialInfo?.countryId) {
                try {
                    const finCitiesData = await locationService.listSubRegions(agencyData.agencyFinancialInfo.countryId);
                    initialFinCities = finCitiesData.locationList || [];
                } catch (e) { console.error(e); }
            }
            setFinCities(initialFinCities);

            let lat = agencyData.latitude || agencyData.geoLocation?.latitude || 36.6826845;
            let lng = agencyData.longitude || agencyData.geoLocation?.longitude || 30.9089719;
            lat = parseFloat(lat);
            lng = parseFloat(lng);
            setMapCenter([lat, lng]);

            setFormData({
                ...agencyData,
                latitude: lat,
                longitude: lng,
                officialTitle: agencyData.agencyFinancialInfo?.title || '',
                taxOffice: agencyData.agencyFinancialInfo?.taxOffice || '',
                taxNumber: agencyData.agencyFinancialInfo?.taxNumber || '',
                agencyFinancialInfo: {
                    ...agencyData.agencyFinancialInfo,
                    title: agencyData.agencyFinancialInfo?.title || '',
                    taxOffice: agencyData.agencyFinancialInfo?.taxOffice || '',
                    taxNumber: agencyData.agencyFinancialInfo?.taxNumber || ''
                }
            });

        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (signal) => {
        try {
            setStatsLoading(true);
            const [userSummary, guestSummary] = await Promise.all([
                userService.getSummary(signal).catch(() => ({ totalCount: 0, activeCount: 0, passiveCount: 0 })),
                guestService.getSummary(signal).catch(() => ({ totalCount: 0, activeCount: 0, passiveCount: 0 }))
            ]);

            setSummary({
                totalCount: userSummary.totalCount || 0,
                activeCount: userSummary.activeCount || 0,
                passiveCount: userSummary.passiveCount || 0,
                totalGuestCount: guestSummary.totalCount || 0,
                activeGuestCount: guestSummary.activeCount || 0,
                passiveGuestCount: guestSummary.passiveCount || 0
            });
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Error fetching stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchUsersData = async (isManual = false) => {
        try {
            setUsersLoading(true);
            const [usersResponse, rolesResponse] = await Promise.all([
                userService.filterUsers(userFilters),
                roleService.filterRoles()
            ]);
            setUsers(usersResponse.agencyUsers || usersResponse.content || []);
            setRoles(rolesResponse.roles || rolesResponse.content || []);
            if (isManual) showNotification(L('usersRefreshed'));
        } catch (err) { console.error(err); } finally { setUsersLoading(false); }
    };

    const fetchGuestsData = async (isManual = false) => {
        try {
            setGuestsLoading(true);
            const response = await guestService.filterGuests(guestFilters);
            setGuests(response.guests || response.agencyCrmGuests || response.content || []);
            if (isManual) showNotification(L('guestsRefreshed'));
        } catch (err) { console.error(err); } finally { setGuestsLoading(false); }
    };

    const handleUserFilterChange = (newFilters) => {
        setUserFilters(newFilters);
        if (isUsersLoaded.current) {
            setUsersLoading(true);
            userService.filterUsers(newFilters).then(res => {
                setUsers(res.agencyUsers || res.content || []);
                setUsersLoading(false);
            }).catch(() => setUsersLoading(false));
        }
    };

    const handleGuestFilterChange = (newFilters) => {
        setGuestFilters(newFilters);
        if (isGuestsLoaded.current) {
            setGuestsLoading(true);
            guestService.filterGuests(newFilters).then(res => {
                setGuests(res.guests || res.agencyCrmGuests || res.content || []);
                setGuestsLoading(false);
            }).catch(() => setGuestsLoading(false));
        }
    };

    const handleCountryChange = async (e) => {
        const countryId = e.target.value;
        setFormData(prev => ({ ...prev, countryId, cityId: '' }));
        if (countryId) {
            try {
                const citiesData = await locationService.listSubRegions(countryId);
                setCities(citiesData.locationList || []);
            } catch (err) { console.error(err); setCities([]); }
        } else { setCities([]); }
    };

    const handleFinCountryChange = async (e) => {
        const countryId = e.target.value;
        setFormData(prev => ({
            ...prev,
            agencyFinancialInfo: { ...prev.agencyFinancialInfo, countryId, cityId: '' }
        }));
        if (countryId) {
            try {
                const citiesData = await locationService.listSubRegions(countryId);
                setFinCities(citiesData.locationList || []);
            } catch (err) { console.error(err); setFinCities([]); }
        } else { setFinCities([]); }
    };

    const handleInputChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };
    const setMapLocation = (latlng) => setFormData(prev => ({ ...prev, latitude: latlng[0], longitude: latlng[1] }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            
            const payload = {
                ...formData,
                countryId: formData.countryId ? Number(formData.countryId) : null,
                cityId: formData.cityId ? Number(formData.cityId) : null,
                agencyFinancialInfo: {
                    ...formData.agencyFinancialInfo,
                    countryId: formData.agencyFinancialInfo?.countryId ? Number(formData.agencyFinancialInfo.countryId) : null,
                    cityId: formData.agencyFinancialInfo?.cityId ? Number(formData.agencyFinancialInfo.cityId) : null,
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }
            };

            delete payload.officialTitle;
            delete payload.taxOffice;
            delete payload.taxNumber;
            delete payload.geoLocation;
            delete payload.cityName;
            delete payload.countryName;

            await agencyService.updateAgency(formData.id, payload);
            showNotification(L('profileUpdated'));
            await fetchInitialData();
        } catch (err) { 
            showNotification(err.message || L('updateFailed'), 'error'); 
        } finally { 
            setSaving(false); 
        }
    };

    const openAddUser = () => { setUserApiError(null); setShowPassword(false); setEditingUser(null); setUserFormData({ name: '', surname: '', email: '', password: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE', roleIds: [] }); setIsUserModalOpen(true); };
    const openEditUser = (u) => { setUserApiError(null); setShowPassword(false); setEditingUser(u); setUserFormData({ name: u.name, surname: u.surname, email: u.email, phoneCountryCode: u.phoneCountryCode || '90', phoneNumber: u.phoneNumber || '', status: u.status || 'ACTIVE', roleIds: u.roles?.map(r => r.id) || [] }); setIsUserModalOpen(true); };

    const validatePassword = (p) => ({
        length: p.length >= 12 && p.length <= 16,
        uppercase: /[A-Z]/.test(p),
        lowercase: /[a-z]/.test(p),
        number: /[0-9]/.test(p),
        special: /[!@#$%^&*]/.test(p)
    });

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setUserApiError(null);

            if (!editingUser) {
                const v = validatePassword(userFormData.password);
                if (!v.length || !v.uppercase || !v.lowercase || !v.number || !v.special) {
                    setUserApiError("Lütfen tüm şifre kurallarını karşılayın.");
                    setSaving(false);
                    return;
                }
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (userFormData.email && !emailRegex.test(userFormData.email)) { 
                showNotification(L('invalidEmail'), 'error'); 
                setSaving(false); 
                return; 
            }
            if (editingUser) {
                await userService.updateUser(editingUser.id, userFormData);
                if (userFormData.roleIds.length > 0) await userService.assignRoles(editingUser.id, userFormData.roleIds);
                showNotification(L('userUpdated'));
            } else {
                const newUser = await userService.saveUser(userFormData);
                if (userFormData.roleIds.length > 0) await userService.assignRoles(newUser.id, userFormData.roleIds);
                showNotification(L('userCreated'));
            }
            setIsUserModalOpen(false); fetchUsersData();
            const sumData = await userService.getSummary(); setSummary(prev => ({ ...prev, totalCount: sumData.totalCount, activeCount: sumData.activeCount, passiveCount: sumData.passiveCount }));
        } catch (err) { 
            const msg = err.response?.data?.message || err.message || L('errorSavingUser');
            setUserApiError(msg);
            showNotification(msg, 'error'); 
        } finally { setSaving(false); }
    };

    const requestConfirmation = (title, message, onConfirm, type = 'danger') => {
        setConfirmModal({ show: true, title, message, onConfirm, type });
    };

    const handleDeleteUser = (id) => {
        requestConfirmation(
            'Delete User',
            'This action cannot be undone. All access for this user will be revoked immediately.',
            async () => {
                try {
                    await userService.deleteUser(id);
                    showNotification(L('userDeleted'));
                    fetchUsersData();
                    const sumData = await userService.getSummary();
                    setSummary(prev => ({ ...prev, totalCount: sumData.totalCount, activeCount: sumData.activeCount, passiveCount: sumData.passiveCount }));
                } catch (err) { showNotification(err.message || L('errorDeletingUser'), 'error'); }
            }
        );
    };

    const handleToggleUserStatus = async (u) => {
        const newStatus = u.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';
        try {
            const payload = {
                name: u.name,
                surname: u.surname,
                email: u.email,
                phoneCountryCode: u.phoneCountryCode || '90',
                phoneNumber: u.phoneNumber || '',
                status: newStatus,
                roleIds: u.roles?.map(r => r.id) || []
            };
            await userService.updateUser(u.id, payload);
            showNotification(L('userUpdated'));
            fetchUsersData();
            const sumData = await userService.getSummary();
            setSummary(prev => ({ ...prev, totalCount: sumData.totalCount, activeCount: sumData.activeCount, passiveCount: sumData.passiveCount }));
        } catch (err) {
            showNotification(err.message || L('updateFailed'), 'error');
        }
    };

    const handleToggleGuestStatus = async (g) => {
        const newStatus = g.status === 'ACTIVE' ? 'PASSIVE' : 'ACTIVE';
        try {
            const payload = {
                gender: g.gender || 'MALE',
                firstName: g.firstName,
                lastName: g.lastName,
                birthDate: g.birthDate,
                country: g.country,
                passportNo: g.passportNo,
                passportExpiry: g.passportExpiry,
                email: g.email,
                phoneCountryCode: g.phoneCountryCode || '90',
                phoneNumber: g.phoneNumber || '',
                status: newStatus
            };
            await guestService.updateGuest(g.id, payload);
            showNotification(L('guestUpdated'));
            fetchGuestsData();
            const sumData = await guestService.getSummary();
            setSummary(prev => ({ ...prev, totalGuestCount: sumData.totalCount, activeGuestCount: sumData.activeCount, passiveGuestCount: sumData.passiveCount }));
        } catch (err) {
            showNotification(err.message || L('updateFailed'), 'error');
        }
    };

    const handleExportUsers = () => {
        if (users.length === 0) { showNotification(L('noUserExport'), 'error'); return; }
        const exportData = users.map(u => ({ ID: u.id, Name: u.name, Surname: u.surname, Email: u.email, Phone: `+${u.phoneCountryCode}${u.phoneNumber}`, Roles: u.roles?.map(r => r.roleName || r.name).join(' | '), Status: u.status }));
        downloadCSV(exportData, `Users_Export_${new Date().toLocaleDateString()}.csv`);
        showNotification(L('usersExported'));
    };

    const openAddGuest = () => { setGuestApiError(null); setEditingGuest(null); setGuestFormData({ gender: 'MALE', firstName: '', lastName: '', birthDate: '', country: '', passportNo: '', passportExpiry: '', email: '', phoneCountryCode: '90', phoneNumber: '', status: 'ACTIVE' }); setIsGuestModalOpen(true); };
    const openEditGuest = (g) => { setGuestApiError(null); setEditingGuest(g); setGuestFormData({ gender: g.gender || 'MALE', firstName: g.firstName, lastName: g.lastName, birthDate: g.birthDate, country: g.country, passportNo: g.passportNo, passportExpiry: g.passportExpiry, email: g.email, phoneCountryCode: g.phoneCountryCode || '90', phoneNumber: g.phoneNumber || '', status: g.status || 'ACTIVE' }); setIsGuestModalOpen(true); };
    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setGuestApiError(null);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (guestFormData.email && !emailRegex.test(guestFormData.email)) { showNotification(L('invalidEmail'), 'error'); setSaving(false); return; }
            if (editingGuest) { await guestService.updateGuest(editingGuest.id, guestFormData); showNotification(L('guestUpdated')); }
            else { await guestService.saveGuest(guestFormData); showNotification(L('guestCreated')); }
            setIsGuestModalOpen(false); fetchGuestsData();
            const sumData = await guestService.getSummary(); setSummary(prev => ({ ...prev, totalGuestCount: sumData.totalCount, activeGuestCount: sumData.activeCount, passiveGuestCount: sumData.passiveCount }));
        } catch (err) { 
            const msg = err.response?.data?.message || err.message || L('errorSavingGuest');
            setGuestApiError(msg);
            showNotification(msg, 'error'); 
        } finally { setSaving(false); }
    };

    const handleDeleteGuest = (id) => {
        requestConfirmation(
            'Delete Guest',
            'Are you sure you want to remove this guest from your CRM? This will delete all associated profile data.',
            async () => {
                try {
                    await guestService.deleteGuest(id);
                    showNotification(L('guestDeleted'));
                    fetchGuestsData();
                    const sumData = await guestService.getSummary();
                    setSummary(prev => ({ ...prev, totalGuestCount: sumData.totalCount, activeGuestCount: sumData.activeCount, passiveGuestCount: sumData.passiveCount }));
                } catch (err) { showNotification(err.message || L('errorDeletingGuest'), 'error'); }
            }
        );
    };

    const handleExportGuests = () => {
        if (guests.length === 0) { showNotification(L('noGuestExport'), 'error'); return; }
        const exportData = guests.map(g => ({ ID: g.id, Gender: g.gender, FirstName: g.firstName, LastName: g.lastName, BirthDate: g.birthDate, Country: g.country, PassportNo: g.passportNo, PassportExpiry: g.passportExpiry, Email: g.email, Phone: `+${g.phoneCountryCode}${g.phoneNumber}` }));
        downloadCSV(exportData, `Guests_Export_${new Date().toLocaleDateString()}.csv`);
        showNotification(L('guestsExported'));
    };

    const openInMaps = () => { const addressStr = `${formData.address} ${formData.zipCode}`; const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressStr)}`; window.open(url, '_blank'); };

    if (loading) { return <div className="flex h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a]"><div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>; }

    return (
        <>
            <style>{`
                .input-modern { background: rgba(248, 250, 252, 0.6); border: 1px solid #e2e8f0; transition: all 0.2s ease; border-radius: 10px; padding: 0 12px; }
                .dark .input-modern { background: rgba(30, 41, 59, 0.4); border-color: #334155; }
                .input-modern:focus { border-color: #3B82F6; background: rgba(59, 130, 246, 0.04); }
                .map-card { border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                .dark .map-card { box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
                .badge-card { background: white; border: 1px solid #f1f5f9; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
                .dark .badge-card { background: #1e293b; border-color: #334155; }
                .data-table th { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: left; letter-spacing: 0.05em; }
                .dark .data-table th { border-color: #334155; color: #94a3b8; }
                .data-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-weight: 500; }
                .dark .data-table td { border-color: #1e293b; }
                .data-row:hover { background-color: #f8fafc; }
                .dark .data-row:hover { background-color: #1e293b/50; }
                .modal-overlay { background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); }
            `}</style>

            {toast.show && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-top-4 duration-300"><div className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl rounded-xl flex items-center gap-2.5"><div className={`size-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div><p className="text-[10px] font-semibold uppercase tracking-wider">{toast.message}</p></div></div>}

            <main className="flex-1 p-3 md:p-4 flex flex-col h-screen overflow-hidden">
                <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden">
                    <header className="flex flex-wrap items-center justify-between mb-4 gap-3">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-primary text-xl">corporate_fare</span>
                            <h1 className="text-base font-semibold text-slate-900 dark:text-white">{L('title')}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <HeaderActions />
                        </div>
                    </header>


                    <div className="mb-4 flex gap-6 border-b border-slate-200 dark:border-slate-800">
                        {[
                            { id: 'general', label: L('tabGeneral'), icon: 'info' },
                            { id: 'users', label: L('tabUsers'), count: statsLoading ? 'loading' : summary.totalCount, icon: 'groups' },
                            { id: 'guests', label: L('tabGuests'), count: statsLoading ? 'loading' : summary.totalGuestCount, icon: 'recent_actors' }
                        ].map((tab) => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-3 text-xs font-semibold uppercase tracking-wider relative flex items-center gap-2 transition-all ${activeTab === tab.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
                                <span className="material-icons-round text-base">{tab.icon}</span> {tab.label} 
                                {tab.count !== undefined && (
                                    <span className="text-[9px] font-bold flex items-center justify-center min-w-[18px] h-4 px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ml-1">
                                        {tab.count === 'loading' ? (
                                            <div className="size-2.5 border-[1.5px] border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                        ) : (
                                            tab.count
                                        )}
                                    </span>
                                )}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'general' ? (
                            <div className="h-full flex gap-5 overflow-hidden pb-3">
                                {/* Left Sidebar Info */}
                                <div className="w-[300px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 flex-shrink-0">
                                    {/* Agency Identity Card */}
                                    <div className="bg-gradient-to-br from-white via-slate-50/60 to-blue-50/40 dark:from-slate-900 dark:to-slate-800/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden flex-shrink-0">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="flex items-center justify-between mb-3 relative z-10">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${formData.agencyType === 'GSA' ? 'bg-primary text-white' : 'bg-emerald-500 text-white'}`}>
                                                {formData.agencyType}
                                            </span>
                                            <div className="size-7 bg-primary/10 text-primary dark:bg-primary/20 rounded-xl flex items-center justify-center shadow-xs">
                                                <span className="material-icons-round text-base">corporate_fare</span>
                                            </div>
                                        </div>
                                        <div className="mb-3 relative z-10">
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{L('agencyName')}</p>
                                            <h2 className="text-base font-bold truncate text-slate-900 dark:text-white">{formData.name || 'Your Agency'}</h2>
                                            {formData.officialTitle && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">{formData.officialTitle}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs relative z-10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 text-[11px] font-semibold">{L('baseLocation')}:</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px] text-right">{formData.cityName}, {formData.countryName}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 text-[11px] font-semibold">{L('currency')}:</span>
                                                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[11px]">{formData.currency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Audit & Timeline Card */}
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex-shrink-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="size-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-500">
                                                <span className="material-icons-round text-sm">history</span>
                                            </div>
                                            <h3 className="text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wider">{L('auditTimeline')}</h3>
                                        </div>
                                        <div className="space-y-3 text-xs">
                                            <div className="flex items-start gap-2.5">
                                                <div className="size-2 bg-primary rounded-full mt-1 shrink-0"></div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">{L('created')}</p>
                                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{new Date(formData.createDateTime).toLocaleString(localStorage.getItem('language') || 'tr')}</p>
                                                    <p className="text-[10px] text-slate-400 italic">by {formData.createdBy}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2.5">
                                                <div className="size-2 bg-emerald-500 rounded-full mt-1 shrink-0"></div>
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 uppercase">{L('lastUpdate')}</p>
                                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{new Date(formData.updateDateTime).toLocaleString(localStorage.getItem('language') || 'tr')}</p>
                                                    <p className="text-[10px] text-slate-400 italic">by {formData.updatedBy}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Map Preview */}
                                    <div className="map-card h-[180px] relative group border border-slate-200 dark:border-slate-800 flex-shrink-0">
                                        <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                                            <ChangeView center={mapCenter} zoom={zoom} />
                                            <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                            <LocationMarker position={[formData.latitude, formData.longitude]} setPosition={setMapLocation} />
                                        </MapContainer>
                                        <div className="absolute bottom-3 right-3 z-[1000] opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={openInMaps} className="size-7 bg-white dark:bg-slate-900 rounded-lg shadow-md flex items-center justify-center text-primary hover:scale-105 active:scale-95 transition-all">
                                                <span className="material-icons-round text-sm">open_in_new</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Structured Information Grid */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                                        {/* Section 01: Agency Identity */}
                                        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <span className="material-icons-round text-primary text-base">badge</span>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">{L('sec01')}</h3>
                                            </div>
                                            <div className="space-y-2.5">
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('agencyName')}</label>
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80">{formData.name || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('officialTitle')}</label>
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80">{formData.officialTitle || '-'}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('type')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80">{formData.agencyType || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('language')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80">{formData.defaultLanguage === 'TR' ? 'Turkish' : 'English'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 02: Contact Details */}
                                        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <span className="material-icons-round text-indigo-500 text-base">contact_phone</span>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">{L('sec02')}</h3>
                                            </div>
                                            <div className="space-y-2.5">
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('directEmail')}</label>
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80">{formData.email || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('phone')}</label>
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80">+{formData.phoneCountryCode} {formData.phoneNumber || '-'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 03: Geography & Location */}
                                        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <span className="material-icons-round text-emerald-500 text-base">place</span>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">{L('sec03')}</h3>
                                            </div>
                                            <div className="space-y-2.5">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('country')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80 truncate">{formData.countryName || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('city')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80 truncate">{formData.cityName || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <div className="col-span-3">
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('streetAddress')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80 truncate">{formData.address || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('zipCode')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80 text-center">{formData.zipCode || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 04: Finance */}
                                        <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                                                <span className="material-icons-round text-amber-500 text-base">payments</span>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">{L('sec04')}</h3>
                                            </div>
                                            <div className="space-y-2.5">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('taxOffice')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80">{formData.taxOffice || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('taxNumber')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80">{formData.taxNumber || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('accEmail')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80 truncate">{formData.agencyFinancialInfo?.email || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('accPhone')}</label>
                                                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80">{formData.agencyFinancialInfo?.phoneCountryCode ? `+${formData.agencyFinancialInfo.phoneCountryCode} ${formData.agencyFinancialInfo.phoneNumber || ''}` : '-'}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">{L('accAddress')}</label>
                                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800/80 truncate">{formData.agencyFinancialInfo?.address || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'users' ? (
                            <div className="h-full flex flex-col gap-4 overflow-hidden">
                                {/* User Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                    <div className="bg-[#eff6ff] dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100/50 dark:border-blue-800/20 shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{L('totalUsers')}</span>
                                            <div className="size-6 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-blue-600 shadow-xs">
                                                <span className="material-icons-round text-sm">groups</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.totalCount}</div>
                                            <div className="text-[9px] font-semibold text-blue-400 mb-0.5">MEMBERS</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#f0fdf4] dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-800/20 shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{L('activeUsers')}</span>
                                            <div className="size-6 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-emerald-600 shadow-xs">
                                                <span className="material-icons-round text-sm">person_check</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.activeCount}</div>
                                            <div className="text-[9px] font-semibold text-emerald-400 mb-0.5">ONLINE</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#fef2f2] dark:bg-red-900/10 p-3 rounded-xl border border-red-100/50 dark:border-red-800/20 shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">{L('passiveUsers')}</span>
                                            <div className="size-6 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-red-600 shadow-xs">
                                                <span className="material-icons-round text-sm">person_off</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.passiveCount}</div>
                                            <div className="text-[9px] font-semibold text-red-400 mb-0.5">DISABLED</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 max-w-xl">
                                            <div className="relative flex-1">
                                                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                                                <input type="text" placeholder={L('searchUsers')} value={userFilters.query} onChange={(e) => handleUserFilterChange({ ...userFilters, query: e.target.value })} className="w-full h-9 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-xs font-semibold outline-none focus:border-primary transition-colors" />
                                            </div>
                                            <select value={userFilters.roleIds[0] || ''} onChange={(e) => handleUserFilterChange({ ...userFilters, roleIds: e.target.value ? [parseInt(e.target.value)] : [] })} className="h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none cursor-pointer">
                                                <option value="">{L('allRoles')}</option>
                                                {roles.map(r => <option key={r.id} value={r.id}>{r.roleName || r.name}</option>)}
                                            </select>
                                            <select value={userFilters.status} onChange={(e) => handleUserFilterChange({ ...userFilters, status: e.target.value })} className="h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none cursor-pointer">
                                                <option value="ACTIVE">Active</option>
                                                <option value="PASSIVE">Passive</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => fetchUsersData(true)} className={`size-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all text-slate-500 ${usersLoading ? 'animate-spin opacity-50 pointer-events-none' : ''}`}><span className="material-icons-round text-base">refresh</span></button>
                                            <button onClick={handleExportUsers} className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-50 transition-all"><span className="material-icons-round text-sm">download</span> Export</button>
                                            <button onClick={openAddUser} className="h-9 px-4 bg-primary text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 flex items-center gap-1.5 active:scale-95 transition-all"><span className="material-icons-round text-base">add</span> Add User</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <table className="w-full data-table">
                                            <thead><tr><th>User</th><th>Contact</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                                            <tbody>
                                                {usersLoading ? <TableSkeleton columns={5} /> : users.length > 0 ? users.map((u) => (<tr key={u.id} className="data-row transition-colors"><td><div className="flex items-center gap-2.5"><div className="size-8 rounded-full flex items-center justify-center text-white font-semibold text-[11px] shadow-xs bg-gradient-to-br from-primary to-blue-600 shrink-0">{u.name?.[0]}{u.surname?.[0]}</div><div><p className="font-semibold text-slate-900 dark:text-white leading-none mb-0.5">{u.name} {u.surname}</p><p className="text-[9px] text-slate-400 font-semibold uppercase">ID: {u.id}</p></div></div></td><td><div className="space-y-0.5"><div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs"><span className="material-icons-round text-xs text-slate-400">mail_outline</span> {u.email}</div>{u.phoneNumber && <div className="flex items-center gap-1.5 text-slate-400 text-[11px]"><span className="material-icons-round text-xs">phone_iphone</span> +{u.phoneCountryCode} {u.phoneNumber}</div>}</div></td><td><div className="flex flex-wrap gap-1">{u.roles?.length > 0 ? u.roles.map((r, idx) => (<span key={r.id || idx} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-primary text-[10px] font-semibold rounded-md">{r.roleName || r.name}</span>)) : <span className="text-slate-400 text-[10px] italic">No Role</span>}</div></td><td><div className="flex items-center gap-2"><button type="button" onClick={() => handleToggleUserStatus(u)} className={`relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-none ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} title={u.status === 'ACTIVE' ? 'Set Passive' : 'Set Active'}><span className={`pointer-events-none inline-block size-[18px] transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${u.status === 'ACTIVE' ? 'translate-x-[18px]' : 'translate-x-0'}`} /></button><span className={`text-xs font-semibold ${u.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{u.status === 'ACTIVE' ? 'Active' : 'Passive'}</span></div></td><td className="text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openEditUser(u)} className="size-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round text-base">edit</span></button><button onClick={() => handleDeleteUser(u.id)} className="size-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"><span className="material-icons-round text-base">delete_outline</span></button></div></td></tr>)) : (<tr><td colSpan="5" className="py-12 text-center"><p className="text-slate-400 text-xs font-medium italic">No users found</p></td></tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col gap-4 overflow-hidden">
                                {/* Guest Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                    <div className="bg-[#f5f3ff] dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100/50 dark:border-purple-800/20 shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Total Guests</span>
                                            <div className="size-6 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-purple-600 shadow-xs">
                                                <span className="material-icons-round text-sm">recent_actors</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.totalGuestCount}</div>
                                            <div className="text-[9px] font-semibold text-purple-400 mb-0.5">PROFILES</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#f0fdf4] dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-800/20 shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Guests</span>
                                            <div className="size-6 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-emerald-600 shadow-xs">
                                                <span className="material-icons-round text-sm">how_to_reg</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.activeGuestCount}</div>
                                            <div className="text-[9px] font-semibold text-emerald-400 mb-0.5">VERIFIED</div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-[#fef2f2] dark:bg-red-900/10 p-3 rounded-xl border border-red-100/50 dark:border-red-800/20 shadow-xs">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[9px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Passive Guests</span>
                                            <div className="size-6 bg-white dark:bg-slate-800 rounded-md flex items-center justify-center text-red-600 shadow-xs">
                                                <span className="material-icons-round text-sm">person_remove</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <div className="text-xl font-bold text-slate-900 dark:text-white leading-none">{statsLoading ? '...' : summary.passiveGuestCount}</div>
                                            <div className="text-[9px] font-semibold text-red-400 mb-0.5">ARCHIVED</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 max-w-xl">
                                            <div className="relative flex-1">
                                                <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                                                <input type="text" placeholder="Search by name, email or passport..." value={guestFilters.query} onChange={(e) => handleGuestFilterChange({ ...guestFilters, query: e.target.value })} className="w-full h-9 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 text-xs font-semibold outline-none focus:border-primary transition-colors" />
                                            </div>
                                            <select value={guestFilters.countryCodes[0] || ''} onChange={(e) => handleGuestFilterChange({ ...guestFilters, countryCodes: e.target.value ? [e.target.value] : [] })} className="h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none cursor-pointer">
                                                <option value="">All Countries</option>
                                                {countries.map(c => <option key={c.locationId} value={c.alphaTwoCode}>{getCountryName(countries, c.alphaTwoCode, currentLang)}</option>)}
                                            </select>
                                            <select value={guestFilters.status} onChange={(e) => handleGuestFilterChange({ ...guestFilters, status: e.target.value })} className="h-9 px-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none cursor-pointer">
                                                <option value="ACTIVE">Active</option>
                                                <option value="PASSIVE">Passive</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => fetchGuestsData(true)} className={`size-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all text-slate-500 ${guestsLoading ? 'animate-spin opacity-50 pointer-events-none' : ''}`}><span className="material-icons-round text-base">refresh</span></button>
                                            <button onClick={handleExportGuests} className="h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:bg-slate-50 transition-all"><span className="material-icons-round text-sm">download</span> Export</button>
                                            <button onClick={openAddGuest} className="h-9 px-4 bg-primary text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/20 flex items-center gap-1.5 active:scale-95 transition-all"><span className="material-icons-round text-base">add</span> Add Guest</button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <table className="w-full data-table">
                                        <thead><tr><th>Guest</th><th>Birth & Country</th><th>Passport</th><th>Contact</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                                        <tbody>
                                            {guestsLoading ? <TableSkeleton columns={6} /> : guests.length > 0 ? guests.map((g) => (
                                                <tr key={g.id} className="data-row transition-colors"><td><div className="flex items-center gap-2.5"><div className="size-8 rounded-full flex items-center justify-center text-white font-semibold text-[11px] shadow-xs bg-gradient-to-br from-primary to-blue-600 shrink-0">{g.firstName?.[0]}{g.lastName?.[0]}</div><div><p className="font-semibold text-slate-900 dark:text-white leading-none mb-0.5">{g.gender === 'MALE' ? 'Mr' : 'Mrs'} {g.firstName} {g.lastName}</p><p className="text-[9px] text-slate-400 font-semibold uppercase">ID: {g.id}</p></div></div></td><td><div className="flex items-center gap-2"><div className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-semibold text-slate-500">{g.country || 'N/A'}</div><div><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{getCountryName(countries, g.country, currentLang)}</p><p className="text-[10px] text-slate-400">Born: {g.birthDate || 'Unknown'}</p></div></div></td><td><div className="flex items-center gap-1.5"><div className="size-5 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center text-primary"><span className="material-icons-round text-xs">badge</span></div><div><p className="text-xs font-semibold text-slate-900 dark:text-white">{g.passportNo || 'N/A'}</p><p className="text-[10px] text-slate-400">Expires: {g.passportExpiry || 'N/A'}</p></div></div></td><td><div className="space-y-0.5"><div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs"><span className="material-icons-round text-xs text-slate-400">mail_outline</span> {g.email}</div>{g.phoneNumber && <div className="flex items-center gap-1.5 text-slate-400 text-[11px]"><span className="material-icons-round text-xs">phone_iphone</span> +{g.phoneCountryCode} {g.phoneNumber}</div>}</div></td><td><div className="flex items-center gap-2"><button type="button" onClick={() => handleToggleGuestStatus(g)} className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${g.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} title={g.status === 'ACTIVE' ? 'Set Passive' : 'Set Active'}><span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${g.status === 'ACTIVE' ? 'translate-x-3' : 'translate-x-0'}`} /></button><span className={`text-[10px] font-semibold ${g.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{g.status === 'ACTIVE' ? 'Active' : 'Passive'}</span></div></td><td className="text-right"><div className="flex items-center justify-end gap-1"><button onClick={() => openEditGuest(g)} className="size-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round text-base">edit</span></button><button onClick={() => handleDeleteGuest(g.id)} className="size-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"><span className="material-icons-round text-base">delete_outline</span></button></div></td></tr>
                                            )) : (<tr><td colSpan="6" className="py-12 text-center"><p className="text-slate-400 text-xs font-medium italic">No guests found</p></td></tr>)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </main>

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[30000] flex items-center justify-center p-4">
                    <div className="modal-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, show: false })}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center"><div className={`size-16 rounded-3xl flex items-center justify-center mx-auto mb-6 ${confirmModal.type === 'danger' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-primary/10 text-primary'}`}><span className="material-icons-round text-3xl">{confirmModal.type === 'danger' ? 'delete_forever' : 'help_outline'}</span></div><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{confirmModal.title}</h3><p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{confirmModal.message}</p></div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3"><button onClick={() => setConfirmModal({ ...confirmModal, show: false })} className="flex-1 h-12 rounded-2xl text-sm font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700">Cancel</button><button onClick={() => { confirmModal.onConfirm(); setConfirmModal({ ...confirmModal, show: false }); }} className={`flex-1 h-12 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'danger' ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-primary shadow-primary/20'}`}>Confirm</button></div>
                    </div>
                </div>
            )}

            {/* Modals (Users) */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="modal-overlay fixed inset-0" onClick={() => setIsUserModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-white/5"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingUser ? L('editUser') : L('addUser')}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{L('userInfo')}</p></div><button onClick={() => setIsUserModalOpen(false)} className="size-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round">close</span></button></div></div>
                        <form onSubmit={handleUserSubmit} className="p-8 space-y-6">
                            {userApiError && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
                                    <div className="size-10 bg-red-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                        <span className="material-icons-round">error_outline</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Hata Oluştu</p>
                                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 break-words">{userApiError}</p>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Name</label><input type="text" required value={userFormData.name} onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary transition-all" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Surname</label><input type="text" required value={userFormData.surname} onChange={(e) => setUserFormData(prev => ({ ...prev, surname: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary transition-all" /></div></div>
                            <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label><input type="email" required autoComplete="new-email" value={userFormData.email} onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary transition-all" /></div>
                            {!editingUser && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            required 
                                            autoComplete="new-password"
                                            value={userFormData.password} 
                                            onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))} 
                                            className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl pl-4 pr-12 text-xs font-bold outline-none focus:border-primary transition-all" 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <span className="material-icons-round text-lg">
                                                {showPassword ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-white/5">
                                        {[
                                            { key: 'length', label: 'Minimum 12 - Maksimum 16 karakter' },
                                            { key: 'uppercase', label: 'En az 1 büyük harf (A-Z)' },
                                            { key: 'lowercase', label: 'En az 1 küçük harf (a-z)' },
                                            { key: 'number', label: 'En az 1 rakam (0-9)' },
                                            { key: 'special', label: 'En az 1 özel karakter (!@#$%^&*)' },
                                        ].map(rule => {
                                            const isValid = validatePassword(userFormData.password)[rule.key];
                                            return (
                                                <div key={rule.key} className="flex items-center gap-2">
                                                    <div className={`size-4 rounded-full flex items-center justify-center transition-colors ${isValid ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                                                        <span className="material-icons-round text-[10px] font-bold">{isValid ? 'check' : 'close'}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-bold transition-colors ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>{rule.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1">
                                <PhoneInput 
                                    label="Phone Number"
                                    value={(userFormData.phoneCountryCode?.startsWith('+') ? userFormData.phoneCountryCode : `+${userFormData.phoneCountryCode}`) + ' ' + userFormData.phoneNumber}
                                    onChange={(val) => {
                                        const parts = val.split(' ');
                                        setUserFormData(prev => ({ 
                                            ...prev, 
                                            phoneCountryCode: parts[0]?.replace('+', '') || '90', 
                                            phoneNumber: parts[1] || '' 
                                        }));
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Role</label><select multiple value={userFormData.roleIds} onChange={(e) => setUserFormData(prev => ({ ...prev, roleIds: Array.from(e.target.selectedOptions, option => parseInt(option.value)) }))} className="w-full min-h-[80px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-2 text-xs font-bold outline-none focus:border-primary">{roles.map(r => <option key={r.id} value={r.id}>{r.roleName || r.name}</option>)}</select></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label><select value={userFormData.status} onChange={(e) => setUserFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary"><option value="ACTIVE">Active</option><option value="PASSIVE">Passive</option></select></div></div>
                            <div className="pt-4 flex items-center justify-end gap-3"><button type="button" onClick={() => setIsUserModalOpen(false)} className="h-11 px-6 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{L('cancel')}</button><button type="submit" disabled={saving} className="h-11 px-8 bg-primary text-white rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">{saving ? L('processing') : L('saveUser')}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modals (Guests) */}
            {isGuestModalOpen && (
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="modal-overlay fixed inset-0" onClick={() => setIsGuestModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-white/5"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingGuest ? L('editGuest') : L('addGuest')}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{L('guestInfo')}</p></div><button onClick={() => setIsGuestModalOpen(false)} className="size-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><span className="material-icons-round">close</span></button></div></div>
                        <form onSubmit={handleGuestSubmit} className="p-8 space-y-6">
                            {guestApiError && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
                                    <div className="size-10 bg-red-500 rounded-xl flex items-center justify-center text-white shrink-0">
                                        <span className="material-icons-round">error_outline</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Hata Oluştu</p>
                                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 break-words">{guestApiError}</p>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-4"><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label><select value={guestFormData.gender} onChange={(e) => setGuestFormData(prev => ({ ...prev, gender: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary"><option value="MALE">Mr</option><option value="FEMALE">Mrs</option></select></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label><input type="text" required value={guestFormData.firstName} onChange={(e) => setGuestFormData(prev => ({ ...prev, firstName: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary" /></div><div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label><input type="text" required value={guestFormData.lastName} onChange={(e) => setGuestFormData(prev => ({ ...prev, lastName: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary" /></div></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Birth Date</label>
                                    <DatePicker 
                                        selected={guestFormData.birthDate ? new Date(formatToPickerDate(guestFormData.birthDate)) : null} 
                                        onChange={(date) => setGuestFormData(prev => ({ ...prev, birthDate: date ? formatToBackendDate(date.toISOString().split('T')[0]) : '' }))}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="DD.MM.YYYY"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary w-full"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                                 <div className="space-y-1 relative">
                                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Country</label>
                                     <div 
                                         onClick={() => setShowGuestCountries(!showGuestCountries)}
                                         className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 flex items-center justify-between cursor-pointer group"
                                     >
                                         <span className={`text-xs font-bold ${guestFormData.country ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                                             {guestFormData.country ? (
                                                 <div className="flex items-center gap-2">
                                                     <span className="opacity-50 text-[10px]">{guestFormData.country}</span>
                                                     <span>{getCountryName(countries, guestFormData.country, currentLang)}</span>
                                                 </div>
                                             ) : 'Select country...'}
                                         </span>
                                         <span className={`material-icons-round text-slate-400 text-sm transition-transform ${showGuestCountries ? 'rotate-180' : ''}`}>expand_more</span>
                                     </div>

                                     {showGuestCountries && (
                                         <>
                                             <div className="fixed inset-0 z-[1001]" onClick={() => { setShowGuestCountries(false); setGuestCountrySearch(''); }} />
                                             <div className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[1002] flex flex-col animate-in fade-in slide-in-from-top-2">
                                                 <div className="p-2 border-b border-slate-50 dark:border-white/5">
                                                     <div className="relative">
                                                         <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                                         <input 
                                                             type="text" 
                                                             placeholder="Search country..." 
                                                             value={guestCountrySearch}
                                                             onChange={(e) => setGuestCountrySearch(e.target.value)}
                                                             autoFocus
                                                             className="w-full h-9 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl pl-9 pr-3 text-[11px] font-bold outline-none focus:border-primary transition-all"
                                                         />
                                                     </div>
                                                 </div>
                                                 <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                                                     {countries
                                                         .filter(c => {
                                                             const name = (c.name?.translations?.[currentLang] || c.name?.translations?.en || c.name?.defaultName || '').toLowerCase();
                                                             return name.includes(guestCountrySearch.toLowerCase()) || c.alphaTwoCode.toLowerCase().includes(guestCountrySearch.toLowerCase());
                                                         })
                                                         .map(c => (
                                                             <div 
                                                                 key={c.id} 
                                                                 onClick={() => {
                                                                     setGuestFormData(prev => ({ ...prev, country: c.alphaTwoCode }));
                                                                     setShowGuestCountries(false);
                                                                     setGuestCountrySearch('');
                                                                 }}
                                                                 className={`px-3 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center justify-between mb-0.5 ${guestFormData.country === c.alphaTwoCode ? 'bg-primary text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                                                             >
                                                                 <div className="flex items-center gap-2">
                                                                     <span className="opacity-60 text-[9px] w-6 uppercase">{c.alphaTwoCode}</span>
                                                                     <span>{c.name?.translations?.[currentLang] || c.name?.translations?.en || c.name?.defaultName}</span>
                                                                 </div>
                                                                 {guestFormData.country === c.alphaTwoCode && <span className="material-icons-round text-xs">check</span>}
                                                             </div>
                                                         ))}
                                                 </div>
                                             </div>
                                         </>
                                     )}
                                 </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Passport No</label>
                                    <input type="text" value={guestFormData.passportNo} onChange={(e) => setGuestFormData(prev => ({ ...prev, passportNo: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Passport Expiry</label>
                                    <DatePicker 
                                        selected={guestFormData.passportExpiry ? new Date(formatToPickerDate(guestFormData.passportExpiry)) : null} 
                                        onChange={(date) => setGuestFormData(prev => ({ ...prev, passportExpiry: date ? formatToBackendDate(date.toISOString().split('T')[0]) : '' }))}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="DD.MM.YYYY"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary w-full"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label><input type="email" required value={guestFormData.email} onChange={(e) => setGuestFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary" placeholder="example@mail.com" /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label><select value={guestFormData.status} onChange={(e) => setGuestFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 text-xs font-bold outline-none focus:border-primary"><option value="ACTIVE">Active</option><option value="PASSIVE">Passive</option></select></div>
                            </div>
                            <div className="space-y-1">
                                <PhoneInput 
                                    label="Phone Number"
                                    value={(guestFormData.phoneCountryCode?.startsWith('+') ? guestFormData.phoneCountryCode : `+${guestFormData.phoneCountryCode}`) + ' ' + guestFormData.phoneNumber}
                                    onChange={(val) => {
                                        const parts = val.split(' ');
                                        setGuestFormData(prev => ({ 
                                            ...prev, 
                                            phoneCountryCode: parts[0]?.replace('+', '') || '90', 
                                            phoneNumber: parts[1] || '' 
                                        }));
                                    }}
                                />
                            </div>
                            <div className="pt-4 flex items-center justify-end gap-3"><button type="button" onClick={() => setIsGuestModalOpen(false)} className="h-11 px-6 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{L('cancel')}</button><button type="submit" disabled={saving} className="h-11 px-8 bg-primary text-white rounded-2xl text-xs font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">{saving ? L('processing') : L('saveGuest')}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyOffice;
