import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, Award, CheckCircle, PlayCircle, Star, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Course {
  id: number; title: string; titleAr: string;
  description: string; descriptionAr: string;
  category: string; duration: number; level: string;
  instructor: string; instructorAr: string;
  videoUrl: string; thumbnail: string; pointsReward: number;
  tags: string[];
  modules: { title: string; titleAr: string }[];
}
type EnrollmentMap = Record<number, { enrolled: boolean; completed: boolean }>;

const CATEGORY_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  awareness:        { en: "Awareness",        ar: "توعية",           color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"       },
  sign_language:    { en: "Sign Language",    ar: "لغة الإشارة",    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  orientation:      { en: "Orientation",      ar: "التوجه والتنقل", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"     },
  digital:          { en: "Digital Access",   ar: "وصول رقمي",      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"         },
  entrepreneurship: { en: "Entrepreneurship", ar: "ريادة الأعمال",  color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"     },
  wellbeing:        { en: "Wellbeing",        ar: "الصحة النفسية",  color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"         },
};

const LEVEL_LABELS: Record<string, { en: string; ar: string }> = {
  beginner:     { en: "Beginner",     ar: "مبتدئ"   },
  intermediate: { en: "Intermediate", ar: "متوسط"   },
  advanced:     { en: "Advanced",     ar: "متقدم"   },
};

export default function AwarenessPage() {
  const { isRtl, lang } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();

  const t = (en: string, ar: string) => lang === "ar" ? ar : en;

  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ["awareness-courses"],
    queryFn: () => fetch(`${BASE}/api/awareness/courses`).then(r => r.json()),
  });

  const { data: enrollments = {} } = useQuery<EnrollmentMap>({
    queryKey: ["my-enrollments"],
    queryFn: () => fetch(`${BASE}/api/awareness/my-enrollments`).then(r => r.json()),
  });

  const enrollMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/awareness/enroll/${id}`, { method: "POST" }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-enrollments"] }); toast({ title: t("✅ Enrolled!", "✅ تم التسجيل!") }); },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => fetch(`${BASE}/api/awareness/complete/${id}`, { method: "POST" }).then(r => r.json()),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      if (data.pointsEarned > 0) {
        toast({ title: t("🎓 Course Completed!", "🎓 اكتملت الدورة!"), description: t(`You earned ${data.pointsEarned} Jawwal Points!`, `لقد ربحت ${data.pointsEarned} نقطة جوال!`) });
      }
    },
  });

  const enrolled = Object.values(enrollments).filter(e => e.enrolled).length;
  const completed = Object.values(enrollments).filter(e => e.completed).length;
  const totalPossiblePoints = courses.reduce((a, c) => a + c.pointsReward, 0);

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-3xl">📚</span>
            {t("Awareness & Training", "التوعية والتدريب")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Free courses on disability inclusion, sign language, and accessibility — developed with Bhimitkom Association.",
               "دورات مجانية حول الإدماج والإعاقة ولغة الإشارة وإمكانية الوصول — طُوِّرت بالتعاون مع جمعية بهمتكم.")}
          </p>
        </div>

        {/* Progress stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: BookOpen,    val: courses.length, label: t("Total Courses", "إجمالي الدورات"),  color: "text-foreground" },
            { icon: Star,        val: enrolled,       label: t("Enrolled",       "المسجّلة"),       color: "text-blue-600"   },
            { icon: CheckCircle, val: completed,      label: t("Completed",      "المكتملة"),       color: "text-green-600"  },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("size-5 mx-auto mb-1", s.color)} />
                <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Points banner */}
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200 dark:border-amber-800/50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            🌟 {t(`Complete all courses and earn up to ${totalPossiblePoints} Jawwal Points!`,
                   `أكمل جميع الدورات واكسب حتى ${totalPossiblePoints} نقطة جوال!`)}
          </p>
          <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">
            {t("Courses developed in partnership with Bhimitkom Association, Palestinian Vision Organization, and Deaf Palestinian Community Center.",
               "دورات طُوِّرت بالشراكة مع جمعية بهمتكم ومنظمة الرؤية الفلسطينية ومركز مجتمع الصم الفلسطيني.")}
          </p>
        </div>

        {/* Course grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-56 bg-muted animate-pulse rounded-2xl" />)}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map(course => {
              const e = enrollments[course.id] ?? { enrolled: false, completed: false };
              const catInfo = CATEGORY_LABELS[course.category];
              const lvlInfo = LEVEL_LABELS[course.level];
              return (
                <Card key={course.id} className={cn("flex flex-col hover:shadow-md transition-shadow",
                  e.completed ? "border-green-200 dark:border-green-900/50" : e.enrolled ? "border-primary/30" : "")}>
                  <CardContent className="p-5 flex flex-col flex-1 gap-3">
                    {/* Top */}
                    <div className={cn("flex items-start justify-between gap-2", isRtl && "flex-row-reverse")}>
                      <span className="text-4xl">{course.thumbnail}</span>
                      <div className={cn("flex flex-col items-end gap-1", isRtl && "items-start")}>
                        {e.completed && <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="size-3 me-1" />{t("Completed", "مكتملة")}</Badge>}
                        {e.enrolled && !e.completed && <Badge className="text-xs bg-primary/10 text-primary">{t("Enrolled", "مسجّل")}</Badge>}
                        {catInfo && <Badge variant="secondary" className={cn("text-xs", catInfo.color)}>{lang === "ar" ? catInfo.ar : catInfo.en}</Badge>}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className={cn("font-bold text-sm leading-snug", isRtl && "text-right")}>{lang === "ar" ? course.titleAr : course.title}</h3>
                      <p className={cn("text-xs text-muted-foreground mt-1 line-clamp-2", isRtl && "text-right")}>{lang === "ar" ? course.descriptionAr : course.description}</p>
                    </div>

                    {/* Meta */}
                    <div className={cn("flex items-center gap-3 text-xs text-muted-foreground flex-wrap", isRtl && "flex-row-reverse")}>
                      <span className={cn("flex items-center gap-1", isRtl && "flex-row-reverse")}><Clock className="size-3" />{course.duration} {t("min", "دقيقة")}</span>
                      <span>{lvlInfo ? (lang === "ar" ? lvlInfo.ar : lvlInfo.en) : course.level}</span>
                      <span className="flex items-center gap-1 text-amber-600 font-medium"><Award className="size-3" />+{course.pointsReward} pts</span>
                    </div>

                    {/* Instructor */}
                    <p className={cn("text-xs text-muted-foreground", isRtl && "text-right")}>
                      👤 {lang === "ar" ? course.instructorAr : course.instructor}
                    </p>

                    {/* Modules */}
                    <div className="flex-1">
                      <p className={cn("text-xs font-medium mb-1.5", isRtl && "text-right")}>{t("Modules", "الوحدات")} ({course.modules.length})</p>
                      <div className="space-y-1">
                        {course.modules.slice(0, 3).map((m, i) => (
                          <div key={i} className={cn("flex items-center gap-2 text-xs text-muted-foreground", isRtl && "flex-row-reverse")}>
                            <div className="size-4 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0">{i + 1}</div>
                            {lang === "ar" ? m.titleAr : m.title}
                          </div>
                        ))}
                        {course.modules.length > 3 && (
                          <p className="text-xs text-muted-foreground ps-6">+{course.modules.length - 3} {t("more modules", "وحدات إضافية")}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={cn("flex gap-2 pt-2 flex-wrap", isRtl && "flex-row-reverse")}>
                      {!e.enrolled && (
                        <Button size="sm" className="gap-1.5 text-xs flex-1"
                          onClick={() => enrollMutation.mutate(course.id)}
                          disabled={enrollMutation.isPending}>
                          <BookOpen className="size-3.5" />{t("Enroll Free", "التسجيل مجانًا")}
                        </Button>
                      )}
                      {e.enrolled && !e.completed && (
                        <Button size="sm" className="gap-1.5 text-xs flex-1"
                          onClick={() => completeMutation.mutate(course.id)}
                          disabled={completeMutation.isPending}>
                          <CheckCircle className="size-3.5" />{t(`Complete (+${course.pointsReward} pts)`, `إكمال (+${course.pointsReward} نقطة)`)}
                        </Button>
                      )}
                      {e.completed && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs flex-1 text-green-600 border-green-200" disabled>
                          <CheckCircle className="size-3.5" />{t("Certificate Earned", "تم الحصول على الشهادة")}
                        </Button>
                      )}
                      {course.videoUrl && (
                        <a href={course.videoUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                            <PlayCircle className="size-3.5" />{t("Watch", "شاهد")}
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
