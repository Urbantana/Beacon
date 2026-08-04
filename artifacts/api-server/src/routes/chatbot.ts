import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface ChatResponse {
  reply: string;
  replyAr: string;
  suggestions?: string[];
  suggestionsAr?: string[];
  links?: { label: string; labelAr: string; href: string }[];
}

// Rule-based responses
function getResponse(message: string, context: string, lang: string): ChatResponse {
  const lower = message.toLowerCase();

  // Events
  if (/event|festival|book|ticket|فعالية|احجز/.test(lower)) {
    return {
      reply: "I can help you with events! You can browse upcoming events, book tickets using Jawwal Points, and earn rewards for attending.",
      replyAr: "يمكنني مساعدتك في الفعاليات! يمكنك تصفح الفعاليات القادمة وحجز التذاكر باستخدام نقاط جوال وكسب مكافآت.",
      suggestions: ["How do I book an event?", "What events are happening?", "How many points do I need?"],
      suggestionsAr: ["كيف أحجز فعالية؟", "ما الفعاليات الجارية؟", "كم نقطة أحتاج؟"],
      links: [{ label: "Browse Events", labelAr: "تصفح الفعاليات", href: "/events" }],
    };
  }

  // Tours
  if (/tour|guide|walk|trip|جولة|مرشد/.test(lower)) {
    return {
      reply: "PalTur offers community-led tours by local guides! Explore historical sites, taste local food, or trek through olive groves.",
      replyAr: "يقدم بالتور جولات يقودها أفراد من المجتمع! استكشف المواقع التاريخية أو تذوق الطعام المحلي.",
      suggestions: ["Show me available tours", "How do I book a tour?", "Can I become a guide?"],
      suggestionsAr: ["أرني الجولات المتاحة", "كيف أحجز جولة؟", "هل يمكنني أن أصبح مرشدًا؟"],
      links: [{ label: "Browse Tours", labelAr: "تصفح الجولات", href: "/tours" }],
    };
  }

  // Points / Wallet
  if (/point|wallet|reward|earn|redeem|نقاط|محفظة|مكافأة/.test(lower)) {
    return {
      reply: "Jawwal Points are earned by taking eco-friendly routes, reporting issues, attending events, and more. Redeem them in the Heritage Store!",
      replyAr: "تُكسب نقاط جوال من خلال سلوك المسارات الصديقة للبيئة والإبلاغ عن المشكلات وحضور الفعاليات والمزيد.",
      suggestions: ["How do I earn more points?", "Where can I spend points?", "Check my balance"],
      suggestionsAr: ["كيف أكسب المزيد من النقاط؟", "أين يمكنني إنفاق النقاط؟", "تحقق من رصيدي"],
      links: [
        { label: "My Wallet", labelAr: "محفظتي", href: "/wallet" },
        { label: "Heritage Store", labelAr: "متجر التراث", href: "/store" },
      ],
    };
  }

  // Traffic / Routes
  if (/traffic|route|road|car|drive|مرور|طريق/.test(lower)) {
    return {
      reply: "Use the Smart Route feature to avoid traffic and earn Jawwal Points. You can also report incidents to help other drivers.",
      replyAr: "استخدم ميزة المسار الذكي لتجنب الازدحام وكسب نقاط جوال. يمكنك أيضًا الإبلاغ عن الحوادث.",
      links: [{ label: "Traffic & Routes", labelAr: "المرور والطرق", href: "/traffic" }],
    };
  }

  // Carbon / Environment
  if (/carbon|tree|eco|green|environment|كربون|شجرة|بيئة/.test(lower)) {
    return {
      reply: "Track your carbon footprint and offset it by planting virtual trees using Jawwal Points. Every tree costs 50 points!",
      replyAr: "تتبع بصمتك الكربونية وعوضها بزراعة أشجار افتراضية باستخدام نقاط جوال. تكلف كل شجرة 50 نقطة!",
      links: [{ label: "Carbon Footprint", labelAr: "البصمة الكربونية", href: "/carbon" }],
    };
  }

  // Complaints
  if (/complaint|problem|report|issue|broken|شكوى|مشكلة|بلاغ/.test(lower)) {
    return {
      reply: "You can submit a complaint about any city issue — potholes, waste, broken lights, etc. Each complaint gets a tracking ID so you can follow its progress.",
      replyAr: "يمكنك تقديم شكوى حول أي مشكلة في المدينة — حفر، نفايات، إضاءة معطوبة، إلخ. كل شكوى تحصل على رقم تتبع.",
      links: [{ label: "My Complaints", labelAr: "شكاواي", href: "/complaints" }],
    };
  }

  // Fuel
  if (/fuel|gas|petrol|diesel|station|وقود|بنزين|محطة/.test(lower)) {
    return {
      reply: "Check real-time fuel availability at nearby stations, book a time slot to skip the queue, and report fuel status to earn points.",
      replyAr: "تحقق من توفر الوقود في الوقت الفعلي في المحطات القريبة، احجز موعدًا لتجنب الطابور.",
      links: [{ label: "Fuel Map", labelAr: "خريطة الوقود", href: "/fuel" }],
    };
  }

  // Help / Hello
  if (/hello|hi|help|مرحبا|مساعدة|أهلا/.test(lower)) {
    return {
      reply: "Hello! I'm your PalTur assistant. I can help you with events, tours, points, routes, complaints, fuel, and more. What would you like to know?",
      replyAr: "مرحبًا! أنا مساعد بالتور. يمكنني مساعدتك في الفعاليات والجولات والنقاط والطرق والشكاوى والوقود والمزيد.",
      suggestions: ["Find events", "Check my points", "Report an issue", "Book a tour"],
      suggestionsAr: ["البحث عن فعاليات", "تحقق من نقاطي", "الإبلاغ عن مشكلة", "احجز جولة"],
    };
  }

  // Default fallback
  return {
    reply: "I'm not sure I understand that. Here are some things I can help with:",
    replyAr: "لست متأكدًا من فهمي لذلك. إليك بعض الأشياء التي يمكنني المساعدة بها:",
    suggestions: ["Events & booking", "Points & wallet", "Report an issue", "Traffic & routes", "Tours & guides"],
    suggestionsAr: ["الفعاليات والحجز", "النقاط والمحفظة", "الإبلاغ عن مشكلة", "المرور والطرق", "الجولات والمرشدون"],
  };
}

// POST /api/chatbot — get a response
router.post("/chatbot", (req, res): void => {
  const { message = "", context = "", lang = "en" } = req.body;
  if (!message.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  const response = getResponse(message, context, lang);
  res.json(response);
});

export default router;
