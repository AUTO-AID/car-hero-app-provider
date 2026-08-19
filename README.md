# Car Hero — تطبيق الفنّي (Provider)

واجهات مزوّد الخدمة الميداني، مبنيّة على **نفس بنية `car-hero-app`** (تطبيق
العميل): Expo + React Native، عربية RTL، خط Cairo، ونفس رموز التصميم.

## التشغيل

```bash
npm install
npm run web      # أو: npm run android / npm run ios
```

## البنية — مطابقة لتطبيق العميل

```
car-hero-app-provider/
├── App.js                  ← الراوتر اليدوي (step + navStack) وتحميل الخطوط
├── index.js                ← registerRootComponent
├── app.json                ← Car Hero Provider · slug: car-hero-provider
├── assets/                 ← نفس أيقونات وشعار العلامة
└── src/
    ├── components/
    │   ├── AppText.js      ← نصّ يختار عائلة Cairo حسب الوزن
    │   ├── ui.js           ← نظام التصميم المشترك (٢٧ مكوّناً)
    │   └── ProviderNav.js  ← الشريط السفلي (نظير BottomTabBar)
    ├── hooks/useReducedMotion.js
    ├── services/
    │   ├── feedback.js     ← الاهتزاز (يعتمد عليه ui.js)
    │   └── qa.js           ← قفزة `?qa=<step>` في وضع التطوير
    ├── theme/theme.js      ← رموز التصميم
    └── screens/
        ├── Auth/            LoginScreen
        ├── Main/           HomeScreen
        ├── Order/          NewRequest · RequestDetails · EnRoute · Arrived
        │                   InService · Completed · MyRequests
        └── Account/        Notifications · Profile
```

**الطبقة المشتركة (`AppText` · `ui.js` · `theme.js` · `feedback.js` ·
`useReducedMotion` · `qa.js`) منسوخة حرفياً من `car-hero-app`.** أي تحسين فيها
يُنقل بين التطبيقين يدوياً حتى الآن — لا توجد حزمة مشتركة بينهما.

## التنقّل — لا مكتبة تنقّل

`ProviderNavigator.js` الأصلي (react-navigation) **استُبدل** بالراوتر اليدوي في
`App.js`، وهو نمط تطبيق العميل نفسه: حالة `step` واحدة، ومكدّس `navStack` يحفظ
الخطوة ومعاملاتها معاً، وكائن `nav` يحاكي واجهة react-navigation
(`navigate` / `replace` / `goBack` / `reset` / `popToTop`) فتبقى الشاشات مكتوبة
بأسلوبها المألوف دون أن يعتمد التطبيق على المكتبة.

خريطة الأسماء ← الخطوات في `ROUTE_TO_STEP` أعلى `App.js`. **إضافة شاشة تحتاج
ثلاثة تعديلات هناك:** الاستيراد، ومدخل في الخريطة، وشرط الرسم.

**شاشات الشريط السفلي** (`home`, `myRequests`, `notifications`, `profile`)
تُبدَّل كجذر لا تُدفع للمكدّس، وإلا نما المكدّس بلا حدّ مع كل تنقّل بين تبويبين.

### مسار دورة الطلب

```
Login → Home (تشغيل الاتصال) → NewRequest (عدّاد ٢٠ ثانية)
      → RequestDetails → EnRoute → Arrived → InService → Completed → Home
```

زرّ «محاكاة وصول طلب» في `HomeScreen` (حالة «متصل») هو مدخل التجربة، ويُحذف عند
ربط البثّ اللحظي.

## ما تغيّر عن الملفات الأصلية

| التغيير | السبب |
|---|---|
| `Text` من `react-native` ← `components/AppText` | خط Cairo يُشتقّ من وزن النصّ بدل تركه لخط النظام |
| التدرّجات المكتوبة يدوياً ← رموز `gradients` | `theme.js` هو مكان القرار البصري؛ أربعة تدرّجات كانت مكرّرة في ١١ ملفاً |
| البنفسجي `#8f5cb1/#6a1b9a` ← `gradients.primary` | توحيد الهوية مع تطبيق العميل (`#73409A/#51216F`) |
| شعار «CH» النصّي ← `assets/carhero-logo.png` في `LoginScreen` | الشعار الرسمي واحد ولا يُرسم له بديل (مواضعات العميل) |
| مربّع «CH» في رأس `HomeScreen` ← حرف الاسم الأول | الشعار الأفقي لا يُحشر في مربّع ٤٦px؛ والصفّ صفّ ترحيب لا صفّ هوية |
| `ProviderNavigator.js` ← راوتر `App.js` | بنية واحدة عبر التطبيقين |

## غير مربوط بعد — **كل البيانات في الشاشات ثابتة**

هذه واجهات فقط. لم يُنقل أيّ من طبقة الخدمات في تطبيق العميل، عن قصد: عقود
الفنّي في الخادم لم تُراجَع بعد، ونقل `api.js` بلا التحقّق منها يعني اختراع
عقود. المطلوب لاحقاً:

1. **`services/api.js` + `config.js` + `tokenStorage.js`** — تُنسخ من تطبيق
   العميل كما هي (تجديد التوكن وفكّ `{success,data}` والمهلة مشتركة).
2. **`AuthContext`** — دخول الفنّي باسم مستخدم لا برقم هاتف، ولا تسجيل ذاتي
   (الحساب يُنشأ من الإدارة)، فالسياق يحتاج مراجعة لا نسخاً.
3. **مفتاح الاتصال (`online`)** في `HomeScreen` — حالة محلّية الآن؛ يجب أن تصير
   نداء خادم، لأن `GET /providers/nearby` يُرجع المتصلين فقط، أي أن هذا المفتاح
   هو ما يجعل الفنّي مرئياً للعملاء أصلاً.
4. **الطلب الوارد** — عدّاد الـ٢٠ ثانية يعمل محلّياً بلا مصدر؛ يحتاج قناة
   `socket.io` (نظير `createOrdersSocket` في تطبيق العميل) ومهلة يحسمها الخادم
   لا العميل.
5. **الخرائط** — `EnRouteScreen` و`RequestDetailsScreen` ترسمان طرقاً كعناصر
   `View`. تطبيق العميل يستعمل Leaflet داخل `WebView`
   (`InteractiveMapScreen`) — نفس الأسلوب هو الأقرب هنا.
6. **الحالات الأربع** — الشاشات لا تعرض تحميلاً/فراغاً/خطأ لأنها لا تجلب شيئاً.
   عند الربط: `AsyncContent` من `ui.js`، ولا تُبنَ يدوياً.
7. **`Alert.alert` ميت على الويب** — التأكيدات عبر `ConfirmSheet` من `ui.js`.
   نافذة تأكيد الإنهاء في `InServiceScreen` مبنيّة بـ`Modal` خام وتستحق النقل.
8. **العملة** — `CompletedScreen` و`NewRequestScreen` تعرضان «د.أ» بينما تطبيق
   العميل كلّه بالليرة السورية (`walletApi.CURRENCY`). يُحسم عند الربط.

## اختبار الحالات

`?qa=<step>` على الويب في وضع التطوير يقفز إلى أي شاشة مباشرة — مفاتيح الخطوات
في `ROUTE_TO_STEP` داخل `App.js`. مثال: `?qa=inService`. تُلغى تلقائياً خارج
`__DEV__`.

