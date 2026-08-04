import { Router, type IRouter } from "express";

const router: IRouter = Router();

const ORGANIZATIONS = [
  {
    id: 1,
    name: "Bhimitkom Association",
    nameAr: "جمعية بهمتكم",
    description: "A leading Palestinian organization empowering youth with disabilities through vocational training, awareness, and community inclusion programs.",
    descriptionAr: "منظمة فلسطينية رائدة تُمكّن الشباب ذوي الإعاقة من خلال التدريب المهني وبرامج التوعية والدمج المجتمعي.",
    phone: "+972 59-849-5030",
    email: "info@bhimitkom.ps",
    website: "https://bhimitkom.ps",
    facebook: "https://www.facebook.com/bhimitkom",
    location: "Ramallah, West Bank",
    locationAr: "رام الله، الضفة الغربية",
    lat: 31.9038, lng: 35.2034,
    services: ["Vocational Training", "Sign Language Courses", "Peer Support Groups", "Disability Awareness", "Assistive Technology", "Employment Services"],
    servicesAr: ["التدريب المهني", "دورات لغة الإشارة", "مجموعات دعم الأقران", "توعية الإعاقة", "التكنولوجيا المساعدة", "خدمات التوظيف"],
    category: "disability",
    featured: true,
  },
  {
    id: 2,
    name: "Palestinian Independent Commission for Human Rights (ICHR)",
    nameAr: "الهيئة المستقلة لحقوق الإنسان",
    description: "The national human rights institution of Palestine. Monitors and protects human rights including the rights of persons with disabilities.",
    descriptionAr: "المؤسسة الوطنية لحقوق الإنسان في فلسطين. تراقب وتحمي حقوق الإنسان بما فيها حقوق ذوي الإعاقة.",
    phone: "+972 2-298-0888",
    email: "info@ichr-pal.org",
    website: "https://www.ichr-pal.org",
    facebook: "https://www.facebook.com/ICHR.Palestine",
    location: "Ramallah, West Bank",
    locationAr: "رام الله، الضفة الغربية",
    lat: 31.9050, lng: 35.2040,
    services: ["Human Rights Monitoring", "Legal Aid", "Complaints Mechanism", "Disability Rights Advocacy", "Awareness Campaigns"],
    servicesAr: ["رصد حقوق الإنسان", "المساعدة القانونية", "آلية تقديم الشكاوى", "المناصرة لحقوق ذوي الإعاقة", "حملات التوعية"],
    category: "human_rights",
    featured: false,
  },
  {
    id: 3,
    name: "AMAN Coalition (Integrity & Anti-Corruption)",
    nameAr: "ائتلاف أمان للنزاهة ومكافحة الفساد",
    description: "Works to promote transparency, accountability, and the rights of marginalized groups including persons with disabilities in Palestinian institutions.",
    descriptionAr: "يعمل على تعزيز الشفافية والمساءلة وحقوق الفئات المهمشة بما فيها ذوو الإعاقة في المؤسسات الفلسطينية.",
    phone: "+972 2-298-0344",
    email: "info@aman-palestine.org",
    website: "https://www.aman-palestine.org",
    facebook: "https://www.facebook.com/amanpalestine",
    location: "Ramallah, West Bank",
    locationAr: "رام الله، الضفة الغربية",
    lat: 31.9020, lng: 35.2010,
    services: ["Anti-Corruption Advocacy", "Marginalized Groups Rights", "Institutional Accountability", "Policy Reform", "Civic Education"],
    servicesAr: ["مكافحة الفساد", "حقوق الفئات المهمشة", "المساءلة المؤسسية", "إصلاح السياسات", "التثقيف المدني"],
    category: "coalition",
    featured: false,
  },
  {
    id: 4,
    name: "Palestinian Vision Organization",
    nameAr: "منظمة الرؤية الفلسطينية",
    description: "Specialized organization working on visual impairment and blindness support, rehabilitation, and integration into Palestinian society.",
    descriptionAr: "منظمة متخصصة تعمل في دعم المكفوفين وضعاف البصر وإعادة تأهيلهم ودمجهم في المجتمع الفلسطيني.",
    phone: "+972 2-240-6450",
    email: "vision@palestinianvision.org",
    website: "https://palestinianvision.org",
    facebook: "https://www.facebook.com/PalestinianVision",
    location: "Jerusalem",
    locationAr: "القدس",
    lat: 31.7683, lng: 35.2137,
    services: ["White Cane Training", "Braille Literacy", "Visual Rehabilitation", "Guide Dog Programs", "Assistive Tech"],
    servicesAr: ["تدريب العصا البيضاء", "محو الأمية بالبرايل", "إعادة التأهيل البصري", "برامج الكلاب المرشدة", "التقنيات المساعدة"],
    category: "disability",
    featured: false,
  },
  {
    id: 5,
    name: "Al-Nahda Society for Special Needs",
    nameAr: "جمعية النهضة لذوي الاحتياجات الخاصة",
    description: "Provides rehabilitation, educational, and social services for children and adults with physical and intellectual disabilities across the West Bank.",
    descriptionAr: "تقدم خدمات التأهيل والتعليم والاجتماعية للأطفال والبالغين ذوي الإعاقات الجسدية والذهنية في أرجاء الضفة الغربية.",
    phone: "+972 2-240-7890",
    email: "info@alnahda-ps.org",
    website: "",
    facebook: "",
    location: "Nablus, West Bank",
    locationAr: "نابلس، الضفة الغربية",
    lat: 32.2211, lng: 35.2544,
    services: ["Physical Therapy", "Special Education", "Speech Therapy", "Social Integration", "Family Support"],
    servicesAr: ["العلاج الطبيعي", "التعليم الخاص", "علاج النطق", "الدمج الاجتماعي", "دعم الأسرة"],
    category: "disability",
    featured: false,
  },
  {
    id: 6,
    name: "Deaf Palestinian Community Center",
    nameAr: "مركز مجتمع الصم الفلسطيني",
    description: "Dedicated center for the deaf and hard-of-hearing community in Palestine. Offers sign language courses, interpretation services, and cultural events.",
    descriptionAr: "مركز مخصص لمجتمع الصم وضعاف السمع في فلسطين. يقدم دورات لغة الإشارة وخدمات الترجمة والفعاليات الثقافية.",
    phone: "+972 2-240-5500",
    email: "deaf.center@paldeaf.ps",
    website: "",
    facebook: "",
    location: "Ramallah, West Bank",
    locationAr: "رام الله، الضفة الغربية",
    lat: 31.9060, lng: 35.2050,
    services: ["Palestinian Sign Language Courses", "Interpretation Services", "Deaf Culture Events", "Lip-reading Classes", "Job Placement"],
    servicesAr: ["دورات لغة الإشارة الفلسطينية", "خدمات الترجمة الفورية", "فعاليات ثقافية للصم", "دروس قراءة الشفاه", "التوظيف"],
    category: "disability",
    featured: false,
  },
];

router.get("/organizations", async (_req, res): Promise<void> => {
  res.json(ORGANIZATIONS);
});

router.get("/organizations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const org = ORGANIZATIONS.find(o => o.id === id);
  if (!org) { res.status(404).json({ error: "Not found" }); return; }
  res.json(org);
});

export default router;
