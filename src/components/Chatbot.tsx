"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, Minus, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

// ─── Knowledge Base (English + Multi-language keywords) ───────────────────────
const KB: { keywords: string[]; answer: string }[] = [
    {
        keywords: [
            // English
            "what is webfindlead", "about", "platform", "tool", "website", "what does", "what do you do",
            "explain", "overview", "introduction", "what is this", "what is it",
            // Urdu
            "یہ کیا ہے", "کیا ہے", "ویب فائنڈ", "پلیٹ فارم",
            // Arabic
            "ما هو", "ما هذا", "منصة", "أداة",
            // Spanish
            "qué es", "para qué sirve", "plataforma",
            // French
            "c'est quoi", "qu'est ce que", "plateforme",
            // Hindi
            "क्या है", "क्या करता है",
            // Turkish
            "nedir", "ne işe yarar",
        ],
        answer: "🚀 **WebFindLead** is a lead generation platform that scans Google Maps to find local businesses — especially ones with **no website or a low-quality site**.\n\nIt's perfect for:\n- Web designers & agencies\n- Freelancers looking for clients\n- B2B sales professionals\n\nYou find businesses that need help → and pitch your services to them!"
    },
    {
        keywords: [
            // English - very broad
            "find lead", "search lead", "how to search", "find business", "scan", "look for", "discover",
            "how do i find", "finding", "get leads", "search for", "locate", "find client",
            "how to use", "getting started", "start", "begin", "first time",
            // Urdu
            "لیڈز کیسے", "تلاش کریں", "کاروبار کیسے", "کیسے ڈھونڈیں", "شروع کریں",
            // Arabic
            "كيف أجد", "ابحث", "عملاء", "كيف تبدأ",
            // Spanish
            "cómo encontrar", "buscar", "encontrar clientes", "cómo usar", "empezar",
            // French
            "comment trouver", "chercher", "trouver des clients", "comment utiliser", "commencer",
            // Hindi
            "लीड्स कैसे", "खोजें", "कैसे ढूंढें",
            // Turkish
            "nasıl bulunur", "arama", "müşteri bul",
        ],
        answer: "🔍 **How to Find Leads:**\n1. Click **'Find Leads'** in the sidebar\n2. Enter a **business category** (e.g. Dentist, Plumber, Bakery, Gym)\n3. Enter a **location** (e.g. New York, London, Dubai)\n4. Click **Search** — results appear instantly!\n\nEach result shows the business website status, rating, phone, and contact info. 🎯"
    },
    {
        keywords: [
            // English
            "save lead", "save it", "saving", "bookmark", "add to leads", "keep lead", "how to save",
            "how do i save", "save a", "saved", "add it", "store lead",
            // Urdu
            "محفوظ کریں", "سیو کریں", "کیسے سیو", "بچائیں",
            // Arabic
            "حفظ", "كيف أحفظ", "حفظ العملاء",
            // Spanish
            "guardar", "cómo guardar", "salvar",
            // French
            "sauvegarder", "comment sauver", "enregistrer",
            // Hindi
            "सहेजें", "सेव करें",
            // Turkish
            "kaydet", "nasıl kaydedilir",
        ],
        answer: "💾 **How to Save a Lead:**\n1. Go to **Find Leads** and run a search\n2. Click the **bookmark/save icon** on any business card\n3. It's instantly added to your **My Leads** dashboard!\n\nYou can save as many leads as your plan allows. ✅"
    },
    {
        keywords: [
            // English
            "my leads", "saved leads", "lead list", "lead dashboard", "view leads", "see leads",
            "where are my", "find my leads", "all leads", "lead management",
            // Urdu
            "میری لیڈز", "لیڈ لسٹ", "محفوظ شدہ",
            // Arabic
            "العملاء المحفوظة", "قائمة العملاء", "لوحة العملاء",
            // Spanish
            "mis clientes", "lista de clientes",
            // French
            "mes clients", "liste de clients",
            // Hindi
            "मेरी लीड्स",
            // Turkish
            "kaydedilen müşteriler",
        ],
        answer: "📋 **My Leads Dashboard:**\nAccess from the sidebar → **My Leads**\n\nHere you can:\n- View all your saved businesses\n- Filter by **status** (New, Contacted, Converted)\n- Update pipeline stages\n- **Export** all leads to CSV\n- Delete leads you no longer need"
    },
    {
        keywords: [
            // English
            "export", "csv", "download leads", "spreadsheet", "excel", "download", "extract",
            "how to export", "get csv", "save file", "backup leads",
            // Urdu
            "برآمد کریں", "ڈاؤن لوڈ", "فائل ڈاؤن لوڈ",
            // Arabic
            "تصدير", "تحميل", "ملف إكسل",
            // Spanish
            "exportar", "descargar", "archivo csv",
            // French
            "exporter", "télécharger", "fichier csv",
            // Hindi
            "निर्यात करें", "डाउनलोड करें",
            // Turkish
            "dışa aktar", "indir",
        ],
        answer: "📥 **Export Your Leads to CSV:**\n1. Go to **My Leads** in the sidebar\n2. Click the **Export CSV** button at the top\n3. A `.csv` file downloads instantly\n4. Open in **Excel or Google Sheets** 🎉\n\nAll your lead data (name, phone, website, status) is included!"
    },
    {
        keywords: [
            // English
            "audit", "website audit", "analyze", "analysis", "digital score", "report",
            "check website", "website check", "score", "grade website", "audit tool",
            // Urdu
            "آڈٹ", "ویب سائٹ چیک", "ڈیجیٹل اسکور",
            // Arabic
            "تدقيق", "فحص الموقع", "تحليل", "درجة رقمية",
            // Spanish
            "auditoría", "analizar sitio", "puntuación digital",
            // French
            "audit", "analyser site", "score numérique",
            // Hindi
            "ऑडिट", "वेबसाइट जांच",
            // Turkish
            "denetim", "web sitesi analizi",
        ],
        answer: "🔎 **Website Audit Tool:**\nGenerates a **Digital Health Score (0–100)** for any business.\n\nIt checks:\n- ✅ Website presence & quality\n- ✅ Google & Facebook ad pixels\n- ✅ Social media profiles\n- ✅ Contact info (phone, email)\n\n**How to use:** Click **Audit** on any result from the search page → get a full shareable report!"
    },
    {
        keywords: [
            // English
            "price", "pricing", "plan", "cost", "subscription", "upgrade", "pay", "how much",
            "what does it cost", "monthly", "fee", "billing", "buy", "purchase", "tier",
            "free plan", "pro plan", "agency plan", "premium",
            // Urdu
            "قیمت", "پلان", "کتنا", "سبسکرپشن", "مفت", "ادائیگی",
            // Arabic
            "سعر", "تكلفة", "خطة", "اشتراك", "مجاني", "دفع",
            // Spanish
            "precio", "costo", "plan", "suscripción", "cuánto cuesta", "gratis",
            // French
            "prix", "coût", "plan", "abonnement", "combien", "gratuit",
            // Hindi
            "कीमत", "मूल्य", "प्लान", "कितना",
            // Turkish
            "fiyat", "plan", "abonelik", "ücretsiz",
        ],
        answer: "💳 **Pricing Plans:**\n\n🆓 **Free Trial** — 3 leads (no card needed)\n⚡ **Pro Scanner** — $20/month → 75 leads/month\n🏢 **Agency** — $99/month → Unlimited leads\n\n👉 To upgrade: Go to **Homepage** or **Settings → Plan & Billing** → Click Upgrade\n\nCoupon codes are accepted at checkout for discounts! 🏷️"
    },
    {
        keywords: [
            // English
            "coupon", "discount", "promo", "code", "voucher", "promo code", "offer", "deal",
            // Urdu
            "کوپن", "ڈسکاؤنٹ", "پروموکوڈ",
            // Arabic
            "كوبون", "خصم", "رمز ترويجي",
            // Spanish
            "cupón", "descuento", "código promocional",
            // French
            "coupon", "réduction", "code promo",
            // Hindi
            "कूपन", "छूट",
            // Turkish
            "kupon", "indirim",
        ],
        answer: "🏷️ **Using a Coupon Code:**\n1. Go to the **Homepage** and click your desired plan\n2. In the upgrade checkout modal, enter your **coupon code**\n3. A valid code applies the discount automatically before payment ✅\n\nCoupon codes are case-sensitive — make sure to enter them exactly as given."
    },
    {
        keywords: [
            // English
            "sign up", "register", "create account", "new account", "join", "get started",
            "how to register", "make account", "signup",
            // Urdu
            "رجسٹر", "اکاؤنٹ بنائیں", "سائن اپ",
            // Arabic
            "تسجيل", "إنشاء حساب", "اشتراك",
            // Spanish
            "registrarse", "crear cuenta", "inscribirse",
            // French
            "s'inscrire", "créer un compte", "inscription",
            // Hindi
            "रजिस्टर", "अकाउंट बनाएं",
            // Turkish
            "kayıt ol", "hesap oluştur",
        ],
        answer: "✍️ **Create an Account:**\n1. Click **'Sign In / Sign Up'** from the sidebar\n2. Fill in your **name, email, and password**\n3. A **6-digit OTP** is sent to your email\n4. Enter the code to verify your email\n5. You're in! 🎉 You get **3 free leads** to start\n\nNo credit card required for the free trial!"
    },
    {
        keywords: [
            // English
            "sign in", "login", "log in", "access account", "signin", "how to login", "enter account",
            // Urdu
            "لاگ ان", "سائن ان",
            // Arabic
            "تسجيل الدخول", "دخول",
            // Spanish
            "iniciar sesión", "entrar", "acceder",
            // French
            "se connecter", "connexion",
            // Hindi
            "साइन इन", "लॉग इन",
            // Turkish
            "giriş yap", "oturum aç",
        ],
        answer: "🔐 **Sign In to Your Account:**\n1. Click **'Sign In / Sign Up'** from the sidebar\n2. Enter your **email and password**\n3. Click **Sign In** → you'll land on your dashboard\n\nForgot your password? Go to **Settings → Account → Change Password** or contact support."
    },
    {
        keywords: [
            // English
            "otp", "verification", "verify", "code", "email code", "not received", "didn't get",
            "resend", "verification code", "confirm email", "6 digit",
            // Urdu
            "کوڈ نہیں ملا", "تصدیقی کوڈ", "ای میل کوڈ",
            // Arabic
            "رمز التحقق", "لم أستلم", "إعادة إرسال",
            // Spanish
            "código verificación", "no recibí", "reenviar",
            // French
            "code vérification", "je n'ai pas reçu", "renvoyer",
            // Hindi
            "कोड नहीं मिला", "सत्यापन कोड",
            // Turkish
            "doğrulama kodu", "almadım",
        ],
        answer: "📧 **Email Verification Help:**\n\n1️⃣ Check your **Spam/Junk** folder first\n2️⃣ Codes expire in **10 minutes** — use **Resend Code** if expired\n3️⃣ Make sure the email you entered is correct\n4️⃣ Wait up to 2 minutes for delivery\n\nIf you still can't receive it, contact us via **Help & Support** in the sidebar."
    },
    {
        keywords: [
            // English
            "password", "change password", "forgot password", "reset password", "update password",
            "new password", "old password", "lost password",
            // Urdu
            "پاس ورڈ بھول گیا", "پاس ورڈ تبدیل",
            // Arabic
            "كلمة المرور", "نسيت كلمة المرور", "تغيير كلمة المرور",
            // Spanish
            "contraseña", "cambiar contraseña", "olvidé contraseña",
            // French
            "mot de passe", "changer mot de passe", "oublié mot de passe",
            // Hindi
            "पासवर्ड", "पासवर्ड बदलें",
            // Turkish
            "şifre", "şifre değiştir", "şifremi unuttum",
        ],
        answer: "🔒 **Change Your Password:**\n1. Go to **Settings** in the sidebar\n2. Click the **Account** tab\n3. Enter your **current password**\n4. Enter and confirm your **new password**\n5. Click **Update Password** ✅\n\nMake sure your new password is at least 8 characters long."
    },
    {
        keywords: [
            // English
            "settings", "account settings", "profile", "update name", "edit profile",
            "my account", "personal info", "account details",
            // Urdu
            "ترتیبات", "پروفائل",
            // Arabic
            "الإعدادات", "الملف الشخصي",
            // Spanish
            "configuración", "perfil", "ajustes",
            // French
            "paramètres", "profil",
            // Hindi
            "सेटिंग्स", "प्रोफ़ाइल",
            // Turkish
            "ayarlar", "profil",
        ],
        answer: "⚙️ **Account Settings:**\nSidebar → **Settings**\n\nHere you can:\n- ✏️ Update your **display name**\n- 🔒 Change your **password**\n- 💳 View your **Plan & Billing**\n- 💳 Add or update **payment method**\n- ❌ Cancel subscription\n- 🗑️ Delete your account"
    },
    {
        keywords: [
            // English
            "leads balance", "credits", "how many leads", "used up", "ran out", "balance left",
            "lead count", "remaining", "limit",
            // Urdu
            "لیڈ بیلنس", "کتنی لیڈز باقی",
            // Arabic
            "رصيد العملاء", "كم تبقى",
            // Spanish
            "saldo de clientes", "cuántos quedan",
            // French
            "solde de clients", "combien restant",
            // Hindi
            "लीड्स बैलेंस", "कितने बचे",
            // Turkish
            "müşteri bakiyesi", "kaç kaldı",
        ],
        answer: "📊 **Leads Balance:**\nYour balance is shown in the **sidebar at the bottom**.\n\nEach saved lead uses 1 credit:\n- 🆓 Free: **3 leads**\n- ⚡ Pro: **75 leads/month**\n- 🏢 Agency: **Unlimited**\n\nUpgrade anytime: **Settings → Plan & Billing** → Upgrade Now 🚀"
    },
    {
        keywords: [
            // English
            "contact", "support", "help", "issue", "problem", "not working", "error", "bug",
            "something wrong", "trouble", "assistance", "report", "complaint",
            // Urdu
            "مدد", "مسئلہ", "کام نہیں کر رہا",
            // Arabic
            "مساعدة", "مشكلة", "دعم",
            // Spanish
            "ayuda", "problema", "soporte",
            // French
            "aide", "problème", "assistance",
            // Hindi
            "मदद", "समस्या", "सहायता",
            // Turkish
            "yardım", "sorun", "destek",
        ],
        answer: "🆘 **Get Help & Support:**\n1. Go to **Help & Support** in the sidebar\n2. Fill in your **subject and message**\n3. Our team will respond as soon as possible ✅\n\nYou can also try:\n- Refreshing the page\n- Signing out and back in\n- Clearing browser cache"
    },
    {
        keywords: [
            // English
            "delete account", "remove account", "close account",
            // Urdu
            "اکاؤنٹ ڈیلیٹ",
            // Arabic
            "حذف الحساب",
            // Spanish
            "eliminar cuenta",
            // French
            "supprimer compte",
            // Hindi
            "अकाउंट डिलीट करें",
            // Turkish
            "hesabı sil",
        ],
        answer: "⚠️ **Delete Account:**\n1. Go to **Settings** → **Account** tab\n2. Scroll to the bottom\n3. Click **Delete Account** and confirm\n\n🚨 **This is permanent and irreversible.** All your leads and data will be permanently deleted."
    },
    {
        keywords: [
            // English
            "cancel", "cancel subscription", "stop subscription", "end subscription", "unsubscribe",
            // Urdu
            "سبسکرپشن منسوخ",
            // Arabic
            "إلغاء الاشتراك",
            // Spanish
            "cancelar suscripción",
            // French
            "annuler abonnement",
            // Hindi
            "सदस्यता रद्द करें",
            // Turkish
            "aboneliği iptal et",
        ],
        answer: "❌ **Cancel Subscription:**\n1. Go to **Settings** → **Plan & Billing**\n2. Click **Cancel Subscription**\n3. Confirm the cancellation\n\nYou'll keep access until the end of your current billing period. Your data is safe."
    },
    {
        keywords: [
            // English
            "no website", "missing website", "without website", "businesses without",
            "low quality", "bad website", "old website", "opportunity", "who to target",
            // Urdu
            "ویب سائٹ نہیں",
            // Arabic
            "بدون موقع", "موقع مفقود",
            // Spanish
            "sin sitio web", "sin website",
            // French
            "sans site web",
            // Hindi
            "बिना वेबसाइट",
            // Turkish
            "web sitesi yok",
        ],
        answer: "🎯 **Finding the Best Prospects:**\nBusinesses marked **'No Website'** or **'Low Quality'** = your best clients!\n\nThese businesses:\n- Are losing customers online\n- Are likely open to outreach\n- Haven't been approached yet\n\n💡 **Pro Tip:** Use the **Audit tool** to generate a report showing exactly what they're missing — it's a powerful sales pitch!"
    },
    {
        keywords: [
            // English
            "google maps", "maps data", "how does it work", "data source", "where from", "how",
            // Urdu
            "گوگل میپس", "ڈیٹا کہاں سے",
            // Arabic
            "خرائط غوغل", "مصدر البيانات",
            // Spanish
            "google maps", "fuente de datos",
            // French
            "google maps", "source des données",
            // Hindi
            "गूगल मैप्स", "डेटा कहाँ से",
            // Turkish
            "google haritalar", "veri kaynağı",
        ],
        answer: "🗺️ **How WebFindLead Works:**\nWe pull real-time data from **Google Maps**. When you search:\n\n1. Our system scans all businesses in that category & location\n2. Checks each one for website quality\n3. Detects ad pixels (Facebook/Google)\n4. Finds social media profiles\n5. Extracts contact info\n\nAll **live data** — no outdated databases! ⚡"
    },
    {
        keywords: [
            // English
            "extension", "browser extension", "chrome extension", "plugin",
            // Urdu
            "ایکسٹینشن",
            // Arabic
            "امتداد المتصفح",
            // Spanish
            "extensión del navegador",
            // French
            "extension navigateur",
            // Hindi
            "ब्राउज़र एक्सटेंशन",
            // Turkish
            "tarayıcı uzantısı",
        ],
        answer: "🔌 **Browser Extension:**\nWebFindLead has a Chrome extension for power users. It's currently available for **admin/selected accounts**.\n\nTo request access, submit a message via **Help & Support** in the sidebar."
    },
    {
        keywords: [
            "hi", "hello", "hey", "hii", "howdy", "sup", "good morning", "good evening",
            // Urdu
            "ہیلو", "سلام", "آداب", "ہاۓ",
            // Arabic
            "مرحبا", "أهلا", "السلام عليكم",
            // Spanish
            "hola", "buenos días", "buenas",
            // French
            "bonjour", "salut", "bonsoir",
            // Hindi
            "नमस्ते", "हैलो", "हाय",
            // Turkish
            "merhaba", "selam", "iyi günler",
        ],
        answer: "👋 **Hi there! Welcome to WebFindLead!**\n\nI can help you with:\n- 🔍 Finding & saving leads\n- 💳 Pricing & plan upgrades\n- 📥 Exporting your leads\n- 🔎 Using the Website Audit\n- ⚙️ Account & settings\n\nWhat would you like to know? 😊"
    },
    {
        keywords: [
            "thank", "thanks", "great", "awesome", "perfect", "nice", "good", "helpful", "cool",
            // Urdu
            "شکریہ", "بہت اچھا",
            // Arabic
            "شكرا", "ممتاز",
            // Spanish
            "gracias", "genial",
            // French
            "merci", "super",
            // Hindi
            "धन्यवाद", "शुक्रिया",
            // Turkish
            "teşekkürler", "harika",
        ],
        answer: "😊 You're welcome! Happy to help anytime.\n\nIs there anything else I can assist you with? 🚀"
    },
];

// ─── Smart Matching with Scoring ─────────────────────────────────────────────
function getBotResponse(userInput: string): string {
    const lower = userInput.toLowerCase().trim();

    let bestScore = 0;
    let bestAnswer = "";

    for (const entry of KB) {
        let score = 0;
        for (const kw of entry.keywords) {
            if (lower === kw) {
                score += 10; // Exact match
            } else if (lower.includes(kw)) {
                score += 5; // Input contains keyword
            } else if (kw.includes(lower) && lower.length > 2) {
                score += 3; // Keyword contains input
            } else {
                // Word-level partial match
                const inputWords = lower.split(/\s+/);
                const kwWords = kw.split(/\s+/);
                const matches = inputWords.filter(w => kwWords.includes(w) && w.length > 2);
                score += matches.length * 2;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestAnswer = entry.answer;
        }
    }

    if (bestScore >= 2 && bestAnswer) {
        return bestAnswer;
    }

    return "🤔 I didn't quite understand that. You can ask me about:\n\n- **Finding leads** — how to search\n- **Pricing** — plans & costs\n- **My Leads** — managing your saved leads\n- **Export** — download to CSV\n- **Account & Settings**\n- **Website Audit** tool\n\nOr visit **Help & Support** in the sidebar for direct help! 💬";
}

// ─── Quick Prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
    "How do I find leads?",
    "What are the pricing plans?",
    "How do I export my leads?",
    "How does the Website Audit work?",
];

// ─── Simple Markdown Renderer ─────────────────────────────────────────────────
function formatMessage(text: string) {
    const lines = text.split("\n");
    return (
        <div className="space-y-1 text-sm leading-relaxed">
            {lines.map((line, i) => {
                const parts = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                    j % 2 === 1 ? <strong key={j} className="font-bold">{part}</strong> : part
                );

                if (line.startsWith("- ") || /^\d+[️⃣]?\s/.test(line) || /^[✅⚡🆓🏢💳❌⚠️🔒✏️🏷️🎯💡📊🆘🔐✍️📧🔎🗺️🔌📋📥💾🔍🚀👋😊🤔]/u.test(line)) {
                    return <div key={i} className="pl-1">{parts}</div>;
                }
                if (line === "") return <div key={i} className="h-1" />;
                return <div key={i}>{parts}</div>;
            })}
        </div>
    );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "👋 Hi! I'm your **WebFind Assistant**. Ask me anything about finding leads, pricing, exporting, or using the platform!\n\n🌍 You can also ask in **Urdu, Arabic, Spanish, French, Hindi, or Turkish**!"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showQuickPrompts, setShowQuickPrompts] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const sendMessage = (text: string) => {
        if (!text.trim() || loading) return;

        const userMsg: Message = { role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setShowQuickPrompts(false);
        setLoading(true);

        setTimeout(() => {
            const reply = getBotResponse(text);
            setMessages(prev => [...prev, { role: "assistant", content: reply }]);
            setLoading(false);
        }, 500);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-[380px] h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10">
                                <Bot className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black tracking-tight">WebFind Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Always Online · 7 Languages</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                            <Minus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[86%] px-4 py-3 rounded-2xl shadow-sm",
                                    msg.role === "user"
                                        ? "bg-primary text-white rounded-tr-none font-medium text-sm"
                                        : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                                )}>
                                    {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Prompts */}
                    {showQuickPrompts && (
                        <div className="px-4 pb-3 bg-white border-t border-slate-100 shrink-0">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest pt-3 mb-2">Quick Questions:</p>
                            <div className="space-y-1.5">
                                {QUICK_PROMPTS.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => sendMessage(q)}
                                        className="w-full text-left text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all flex items-center justify-between gap-2"
                                    >
                                        <span>{q}</span>
                                        <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask in any language..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-slate-900"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 relative overflow-hidden group",
                    isOpen ? "bg-slate-800" : "bg-primary"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOpen ? (
                    <X className="w-7 h-7 text-white" />
                ) : (
                    <>
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/90" />
                        </span>
                        <MessageCircle className="w-7 h-7 text-white" />
                    </>
                )}
            </button>
        </div>
    );
}
