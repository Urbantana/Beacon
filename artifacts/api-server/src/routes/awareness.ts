import { Router, type IRouter } from "express";
import { db, usersTable, pointsTransactionsTable, activityFeedTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getAppUserId } from "../lib/getAppUserId";

const router: IRouter = Router();

const COURSES = [
  {
    id: 1,
    title: "Disability Etiquette: How to Be an Inclusive Ally",
    titleAr: "آداب التعامل مع ذوي الإعاقة: كيف تكون حليفًا شاملًا",
    description: "Learn the do's and don'ts when interacting with people with disabilities. Covers respectful language, physical assistance, and attitude adjustments.",
    descriptionAr: "تعلم ما يجب وما لا يجب فعله عند التعامل مع ذوي الإعاقة. يشمل اللغة المحترمة والمساعدة الجسدية وتعديل المواقف.",
    category: "awareness",
    duration: 45,
    level: "beginner",
    instructor: "Bhimitkom Team",
    instructorAr: "فريق بهمتكم",
    videoUrl: "https://www.youtube.com/watch?v=example1",
    thumbnail: "🤝",
    pointsReward: 50,
    tags: ["etiquette", "inclusion", "awareness"],
    modules: [
      { title: "Language & Terminology", titleAr: "اللغة والمصطلحات" },
      { title: "Physical Assistance Guidelines", titleAr: "إرشادات المساعدة الجسدية" },
      { title: "Workplace Inclusion", titleAr: "الإدماج في بيئة العمل" },
    ],
  },
  {
    id: 2,
    title: "Introduction to Palestinian Sign Language",
    titleAr: "مقدمة في لغة الإشارة الفلسطينية",
    description: "A beginner's guide to Palestinian Sign Language (PSL). Learn essential signs for greetings, numbers, daily activities, and emergencies.",
    descriptionAr: "دليل المبتدئين في لغة الإشارة الفلسطينية. تعلم الإشارات الأساسية للتحيات والأرقام والأنشطة اليومية وحالات الطوارئ.",
    category: "sign_language",
    duration: 90,
    level: "beginner",
    instructor: "Deaf Palestinian Community Center",
    instructorAr: "مركز مجتمع الصم الفلسطيني",
    videoUrl: "https://www.youtube.com/watch?v=example2",
    thumbnail: "🤟",
    pointsReward: 100,
    tags: ["sign language", "deaf", "communication"],
    modules: [
      { title: "The Palestinian Sign Language Alphabet", titleAr: "أبجدية لغة الإشارة الفلسطينية" },
      { title: "Greetings & Introductions", titleAr: "التحيات والتعارف" },
      { title: "Numbers & Colors", titleAr: "الأرقام والألوان" },
      { title: "Emergency Signs", titleAr: "إشارات الطوارئ" },
    ],
  },
  {
    id: 3,
    title: "White Cane Awareness & Navigation",
    titleAr: "التوعية بالعصا البيضاء والتنقل",
    description: "Understand the role of the white cane in blind and low-vision mobility. Learn how to assist cane users safely and why the cane matters for independence.",
    descriptionAr: "افهم دور العصا البيضاء في تنقل المكفوفين وضعاف البصر. تعلم كيفية مساعدة مستخدمي العصا بأمان وأهميتها للاستقلالية.",
    category: "orientation",
    duration: 60,
    level: "beginner",
    instructor: "Palestinian Vision Organization",
    instructorAr: "منظمة الرؤية الفلسطينية",
    videoUrl: "https://www.youtube.com/watch?v=example3",
    thumbnail: "🦯",
    pointsReward: 75,
    tags: ["blind", "cane", "navigation", "orientation"],
    modules: [
      { title: "History & Meaning of the White Cane", titleAr: "تاريخ ومعنى العصا البيضاء" },
      { title: "Assisting a Cane User — The Right Way", titleAr: "مساعدة مستخدم العصا — الطريقة الصحيحة" },
      { title: "City Navigation Challenges in Palestine", titleAr: "تحديات التنقل في المدينة في فلسطين" },
    ],
  },
  {
    id: 4,
    title: "Inclusive Design for Digital Products",
    titleAr: "التصميم الشامل للمنتجات الرقمية",
    description: "Learn WCAG 2.1 accessibility guidelines and how to design websites, apps, and digital content that are usable by everyone.",
    descriptionAr: "تعلم إرشادات WCAG 2.1 وكيفية تصميم مواقع الويب والتطبيقات والمحتوى الرقمي بحيث يكون قابلًا للاستخدام من الجميع.",
    category: "digital",
    duration: 120,
    level: "intermediate",
    instructor: "Bhimitkom Tech Team",
    instructorAr: "فريق تقنية بهمتكم",
    videoUrl: "",
    thumbnail: "💻",
    pointsReward: 150,
    tags: ["wcag", "accessibility", "design", "digital"],
    modules: [
      { title: "WCAG 2.1 Principles (POUR)", titleAr: "مبادئ WCAG 2.1" },
      { title: "Screen Readers & Keyboard Navigation", titleAr: "قارئات الشاشة والتنقل بلوحة المفاتيح" },
      { title: "Color Contrast & Typography", titleAr: "تباين الألوان والطباعة" },
      { title: "Accessible Arabic & RTL Design", titleAr: "التصميم العربي الشامل واتجاه RTL" },
    ],
  },
  {
    id: 5,
    title: "Empowering Youth with Disabilities: Entrepreneurship Basics",
    titleAr: "تمكين الشباب ذوي الإعاقة: أساسيات ريادة الأعمال",
    description: "Designed in partnership with Bhimitkom Association. Covers business planning, marketing handmade products, and navigating Palestinian markets as an entrepreneur with a disability.",
    descriptionAr: "صُمم بالشراكة مع جمعية بهمتكم. يغطي التخطيط التجاري وتسويق المنتجات اليدوية والتعامل مع الأسواق الفلسطينية كرائد أعمال من ذوي الإعاقة.",
    category: "entrepreneurship",
    duration: 180,
    level: "intermediate",
    instructor: "Bhimitkom Association",
    instructorAr: "جمعية بهمتكم",
    videoUrl: "",
    thumbnail: "🚀",
    pointsReward: 200,
    tags: ["entrepreneurship", "business", "skills", "bhimitkom"],
    modules: [
      { title: "Your Idea, Your Business", titleAr: "فكرتك، عملك" },
      { title: "Pricing Handmade Palestinian Products", titleAr: "تسعير المنتجات اليدوية الفلسطينية" },
      { title: "Social Media Marketing", titleAr: "التسويق عبر وسائل التواصل" },
      { title: "Legal & Financial Basics", titleAr: "الأساسيات القانونية والمالية" },
    ],
  },
  {
    id: 6,
    title: "Mental Health & Resilience for Persons with Disabilities",
    titleAr: "الصحة النفسية والمرونة لذوي الإعاقة",
    description: "A supportive course covering psychological resilience, self-advocacy, dealing with stigma, and building peer support networks in Palestine.",
    descriptionAr: "دورة داعمة تغطي المرونة النفسية والمناصرة الذاتية والتعامل مع الوصمة وبناء شبكات دعم الأقران في فلسطين.",
    category: "wellbeing",
    duration: 90,
    level: "beginner",
    instructor: "Bhimitkom Counseling Team",
    instructorAr: "فريق الإرشاد في بهمتكم",
    videoUrl: "",
    thumbnail: "🧠",
    pointsReward: 100,
    tags: ["mental health", "resilience", "wellbeing", "bhimitkom"],
    modules: [
      { title: "Understanding Stigma & Changing Narratives", titleAr: "فهم الوصمة وتغيير الروايات" },
      { title: "Self-Advocacy Skills", titleAr: "مهارات المناصرة الذاتية" },
      { title: "Building Your Support Network", titleAr: "بناء شبكة دعمك" },
    ],
  },
];

// In-memory enrollment store (resets on server restart — replace with DB table if persistence needed)
const enrollments = new Map<string, { enrolledAt: Date; completedAt?: Date }>();
function enrollKey(userId: number, courseId: number) { return `${userId}:${courseId}`; }

router.get("/awareness/courses", async (_req, res): Promise<void> => {
  res.json(COURSES);
});

router.post("/awareness/enroll/:id", async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.id, 10);
  const course = COURSES.find(c => c.id === courseId);
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }
  const userId = await getAppUserId(req);
  const key = enrollKey(userId, courseId);
  if (!enrollments.has(key)) enrollments.set(key, { enrolledAt: new Date() });
  res.json({ message: "Enrolled", courseId });
});

router.post("/awareness/complete/:id", async (req, res): Promise<void> => {
  const courseId = parseInt(req.params.id, 10);
  const course = COURSES.find(c => c.id === courseId);
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }
  const userId = await getAppUserId(req);
  const key = enrollKey(userId, courseId);
  const enrollment = enrollments.get(key);
  if (!enrollment) { res.status(400).json({ error: "Not enrolled" }); return; }
  if (enrollment.completedAt) { res.json({ message: "Already completed", pointsEarned: 0 }); return; }

  enrollment.completedAt = new Date();
  enrollments.set(key, enrollment);

  await db.insert(pointsTransactionsTable).values({
    userId, points: course.pointsReward, type: "earn",
    category: "awareness",
    description: `Completed awareness course: ${course.title}`,
  });
  await db.update(usersTable)
    .set({ jawwalPoints: sql`${usersTable.jawwalPoints} + ${course.pointsReward}` })
    .where(eq(usersTable.id, userId));
  await db.insert(activityFeedTable).values({
    module: "awareness", action: "course_completed",
    description: `Completed course: ${course.title}`,
    points: course.pointsReward, userId,
    username: "User",
  });

  res.json({ message: "Course completed!", pointsEarned: course.pointsReward, courseId });
});

router.get("/awareness/my-enrollments", async (req, res): Promise<void> => {
  const userId = await getAppUserId(req);
  const result: Record<number, { enrolled: boolean; completed: boolean }> = {};
  for (const course of COURSES) {
    const key = enrollKey(userId, course.id);
    const e = enrollments.get(key);
    result[course.id] = { enrolled: !!e, completed: !!e?.completedAt };
  }
  res.json(result);
});

export default router;
