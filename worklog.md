# Worklog

---
Task ID: 1
Agent: Super Z (main agent)
Task: بناء تطبيق «منظّمي الشخصي» — تطبيق ويب شخصي عربي RTL لإدارة المشاريع والعملاء المحتملين والزيارات والخدمات والمهام والملاحظات، مع حفظ محلي (localStorage) دون خدمات خارجية.

Work Log:
- حمّلت مهارة fullstack-dev وهيّأت البيئة (Next.js 16 + Tailwind 4 + shadcn/ui + zustand + date-fns).
- أنشأت طبقة البيانات: src/lib/types.ts (أنواع المشاريع/العملاء/الزيارات/الخدمات/المهام/الملاحظات + حالات العملاء والأولويات) و src/lib/store.ts (مخزن Zustand مع persist على localStorage تحت المفتاح munazzimi-v1، skipHydration + rehydrate عند الإقلاع، بيانات تجريبية أولية مطابقة لأمثلة المواصفات: عيادة الشفاء، لوحة تحكم مجمع عيادات، 12 خدمة، 6 تصنيفات) و src/lib/utils-app.ts (تواريخ عربية، تنسيق دولارات، أنماط الحالات).
- بنيت الهيكل: src/components/app/app-shell.tsx (شريط جانبي RTL يمين لسطح المكتب + شريط سفلي للجوال مع «المزيد» Sheet + ترويسة بتاريخ اليوم + مبدّل الوضع الليلي next-themes).
- بنيت 9 أقسام: dashboard (ملخص + مهام اليوم + زيارات قادمة + عملاء للمتابعة + مشاريع)، tasks (إضافة سريعة + تبويبات + تجميع متأخرة/اليوم/القادمة/مكتملة)، calendar (شبكة شهرية تبدأ بالسبت + أحداث ملوّنة: زيارة/متابعة/مهمة + حوار اليوم + إضافة مهمة بتاريخ)، projects (قائمة بفلاتر + تفاصيل: سلايدر 3 مراحل قابل للنقر، معلومات وكيل AI، روابط قابلة للتحرير المباشر، سعر أساسي + إضافات مع الإجمالي، مهام وعملاء مرتبطون)، clients (قائمة + تفاصيل: بيانات، فرصة تجارية، خدمات مقترحة chips، موعد متابعة فوري، سجل زيارات بخط زمني)، visits (سجل عام + فلترة بالعميل + بحث)، services (مجمّعة حسب التصنيف، الرقمية «الأساس» أولًا)، notes، settings (إدارة تصنيفين + أسماء المراحل + وضع ليلي + مسح شامل).
- جميع النماذج عبر حوارات shadcn مع نمط Inner component + key لتجنب set-state-in-effect (قواعد React Compiler).
- إصلاحات أثناء الفحص: تصحيح استيراد CLIENT_STATUSES من types، إضافة استيراد useStore المنسي في calendar-view، إصلاح خطأ hydration (li داخل li في بطاقة الزيارة)، إزالة eslint-disable غير المستخدمة، إعادة هيكلة 6 نماذج.
- تحققت بالمتصفح (agent-browser): الرئيسية، التقويم + حوار اليوم، المهام (إضافة/حذف)، تفاصيل المشروع، تفاصيل العميل + إضافة زيارة، الزيارات، الخدمات، الملاحظات، الإعدادات، الوضع الليلي، عرض جوال 390px (شريط سفلي + درج)، استمرارية البيانات بعد إعادة التحميل، ولا أخطاء كونسول.

Stage Summary:
- التطبيق مكتمل ويعمل على منفذ 3000 مع حفظ محلي كامل في متصفح المستخدم (وفق نطاق «يعمل محليًا دون خدمات خارجية»).
- الملفات الرئيسية: src/app/{layout,page,globals.css}، src/lib/{types,store,utils-app}.ts، src/components/app/{app-shell,dashboard,tasks-view,calendar-view,projects-view,clients-view,visits-view,services-view,notes-view,settings-view,task-form,visit-form,shared,nav-types}.tsx
- مراحل المواصفات الثلاث مُنفّذة دفعة واحدة (واجهة + وظائف + بيانات + اختبار). ما بعد النسخة الأساسية (عروض أسعار، نسخ احتياطي، إحصائيات) خارج النطاق عمدًا.

---
Task ID: 2
Agent: Super Z (main agent)
Task: تعديل مستقل بناءً على طلب المستخدم: ① ساعة رقمية بخط كبير نسبيًا تحت التاريخ ② إضافة حجم الخط في الإعدادات ③ إضافة نمط الساعة (12/24 ساعة).

Work Log:
- types.ts: أضفت النوع ClockFormat وحقلي settings اختياريين clockFormat وfontScale (اختياريان لتوافق بيانات localStorage القديمة دون ترحيل).
- store.ts: defaultSettings الآن تتضمن clockFormat: "12" وfontScale: 100.
- utils-app.ts: أضفت clockParts (أجزاء الوقت حسب النمط مع تثبيت الأصفار) وfmtTimeIn (عرض وقت مخزّن HH:mm حسب النمط).
- مكوّن جديد src/components/app/clock.tsx: خُطّاف useNow (تحديث كل ثانية بتهيئة كسولة — يتجنّب قاعدة set-state-in-effect) وخُطّاف useClockFormat ومكوّن DigitalClock بحجمين (hero للرئيسية بأرقام mono مع ثوانٍ صغيرة وص/م بلون أساسي، sm للترويسة).
- dashboard.tsx: قسم الترحيب أصبح: تحية ← التاريخ الكامل ← ساعة رقمية كبيرة تحته مباشرة، وشارة وقت المهمة تتبع نمط الساعة.
- app-shell.tsx: ساعة مدمجة بجانب تاريخ الترويسة (تظهر أيضًا على الجوال)، وتأثير useEffect يطبّق fontScale على documentElement.style.fontSize فورًا مع كل تغيير.
- settings-view.tsx: بطاقتان جديدتان بعد الوضع الليلي: «حجم الخط» (4 خيارات 90/100/110/125% بعيّنة خط متدرجة، يحفظ تلقائيًا) و«نمط الساعة» (زرّا 12/24 مع مثال ومعاينة حية للساعة في ترويسة البطاقة).
- tasks-view.tsx وcalendar-view.tsx: توحيد عرض أوقات المهام (الشارات وأحداث اليوم) عبر fmtTimeIn حتى يطابق التطبيق كله النمط المختار.
- فحوصات: eslint نظيف (أصلحت set-state-in-effect)، tsc نظيف لكود src/، اختبار بالمتصفح: الرئيسية 12↔24 فوري، الثواني تتقدم، تكبير الخط 125% يكبر كل الواجهة، الاستمرارية بعد reload (localStorage munazzimi-v1: clockFormat/fontScale محفوظان)، عرض جوال 390px سليم، لا أخطاء كونسول.

Stage Summary:
- التعديلات الثلاثة منجزة وتعمل وفق فلسفة «التعديلات المستقلة»: إعدادات جديدة اختيارية متوافقة مع البيانات القديمة، والحفظ محلي كالعادة.
- الملفات المتأثرة: src/lib/{types,store,utils-app}.ts، src/components/app/{clock.tsx جديد, dashboard, app-shell, settings-view, tasks-view, calendar-view}.tsx

---
Task ID: 3
Agent: Super Z (main agent)
Task: تعديلان مستقلان بطلب المستخدم: ① قسم «مفتاح الذكاء الاصطناعي» في الإعدادات (مزوّد/موديل/مفتاح مخفي مع إظهار ونسخ + اختبار اتصال + ملاحظة) ② «المساعد الذكي»: زر عائم ونافذة شات عربية RTL تحفظ محليًا وتقرأ بيانات التطبيق الفعلية.

Work Log:
- types.ts: أضفت AIProvider وAISettings (provider/model/apiKey/baseUrl لمزوّد «آخر»/notes) وChatMessage، وحقلي AppSettings.ai وAppData.chat.
- store.ts: defaultSettings تتضمن ai فارغة، رسالة ترحيب في seed chat، إجراءان addChatMessage (سقف 200 رسالة) وclearChat (يُبقي الترحيب)، وchat ضمن partialize لل حفظ المحلي.
- ملف جديد src/lib/ai.ts: PROVIDER_LABELS وMODEL_HINTS لكل مزوّد، ASSISTANT_SYSTEM_PROMPT بالعربية (مساعد عام: شرح/صياغة رسائل/أفكار تسويق/تلخيص حالة، لا يخترع بيانات)، وbuildAppContext يبني ملخصًا عربيًا مضغوطًا للبيانات الفعلية (المشاريع بمراحلها وأسعارها، العملاء بحالاتهم ومواعيد المتابعة، المهام متأخرة/اليوم/قادمة، أحدث الزيارات، الخدمات، عناوين الملاحظات).
- مسار جديد src/app/api/ai/chat/route.ts: وكيل محلي موحّد — Google Gemini (generateContent) وAnthropic (messages مع x-api-key) وOpenAI وGroq و«آخر» بواجهة OpenAI-compatible مع تطبيع Base URL، مهلة 90 ثانية، وتفسير أخطاء المزوّد لرسائل عربية واضحة (401 مفتاح غير صالح / 429 تجاوز الحد / 404 موديل غير موجود).
- settings-view.tsx: بطاقة AiKeyCard — قائمة مزوّدين (Select)، موديل نص حر مع placeholder متغير، مفتاح type=password مع زر إظهار/إخفاء وزر نسخ للحافظة، حقل Base URL يظهر فقط لـ«آخر»، ملاحظة، زر «اختبار الاتصال» مع حالة تحميل وtoast نجاح/فشل، ونص خصوصية. حفظ فوري محلي.
- مكوّن جديد src/components/app/assistant.tsx (AssistantDock): زر عائم Sparkles ثابت في كل الشاشات (bottom-20 على الجوال فوق شريط التنقل، bottom-6 لسطح المكتب)، Sheet جانبية يسار RTL عرضية sm:max-w-md، فقاعات رسائل (المستخدم يمين بتدرج أساسي، المساعد يسار بخلفية muted، أخطاء بإطار أحمر مع أيقونة)، مؤشر «يكتب…» بثلاث نقاط متحركة، أسفل إدخال Textarea بمتغير auto-grow وEnter للإرسال وShift+Enter سطر جديد، بطاقة «لا يوجد مفتاح» مع زر فتح الإعدادات (يغلق النافذة وينتقل)، زر «محادثة جديد» مع تأكيد AlertDialog، وتوقيت كل رسالة يتبع نمط الساعة المختار.
- app-shell.tsx: ربط AssistantDock وتمرير onNavigateSettings. next.config.ts: devIndicators: false لإخفاء زر أدوات التطوير الذي كان يغطي الزر العائم.
- الفحص بالمتصفح: النافذة والبطاقة يعملان، اختبار الاتصال بمفتاح وهمي وصل Google فعليًا وأعاد «المفتاح غير صالح (400)» داخل toast عربي واضح، إرسال رسالة في الشات أظهر الخطأ بفقاعة حمراء منسقة، الاستمرارية بعد reload (المفتاح + 3 رسائل في localStorage)، «محادثة جديدة» بمسح السجل مع الإبقاء على الترحيب، حقل Base URL يظهر لمزوّد «آخر»، عرض جوال 390px سليم، eslint نظيف ولا أخطاء كونسول.

Stage Summary:
- الميزتان منجزتان وفق الملاحظة المعمارية للمستخدم: المفتاح محفوظ محليًا مع باقي البيانات، والمسار /api/ai/chat هو الجسر الوحيد للخدمة الخارجية ولا يرسل شيئًا إلا للمزوّد المختار.
- المساعد يقرأ البيانات الفعلية لحظة كل سؤال عبر buildAppContext ويحقنها في برومبت النظام (آخر 20 رسالة كسياق محادثة).
- الملفات: types/store/ai.ts جديد/api/ai/chat/route.ts جديد/assistant.tsx جديد/settings-view/app-shell/next.config.
