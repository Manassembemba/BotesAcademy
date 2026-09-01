import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, PlayCircle, Circle, CheckCircle2, CheckCircle, HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Lesson {
  id: string;
  title: string;
  lesson_type: 'video' | 'pdf';
  module_name?: string | null;
}

interface CourseSidebarProps {
  lessons: Lesson[] | undefined;
  isLoadingLessons: boolean;
  lessonsError: any;
  hasAccess: boolean;
  selectedLesson: Lesson | null;
  setSelectedLesson: (lesson: Lesson) => void;
  completedLessons: Set<string> | undefined;
  onToggleCompletion: (lessonId: string, isCompleted: boolean) => void;
  isToggling: boolean;
  mode?: 'online' | 'presentiel' | 'hybrid';
  isCinemaMode?: boolean;
}

export const CourseSidebar = ({
  lessons,
  isLoadingLessons,
  lessonsError,
  hasAccess,
  selectedLesson,
  setSelectedLesson,
  completedLessons,
  onToggleCompletion,
  isToggling,
  mode = 'online',
  isCinemaMode = false
}: CourseSidebarProps) => {
  const isOnline = mode === 'online';

  // Grouper les leçons par module
  const lessonsByModule = React.useMemo(() => {
    if (!lessons) return {};
    return lessons.reduce((acc: any, lesson: Lesson) => {
      const moduleName = lesson.module_name || "Introduction";
      if (!acc[moduleName]) acc[moduleName] = [];
      acc[moduleName].push(lesson);
      return acc;
    }, {});
  }, [lessons]);

  const moduleNames = Object.keys(lessonsByModule);

  return (
    <div className={cn(
      "sticky top-28 space-y-6 animate-in slide-in-from-right-4 duration-700 transition-all",
      isCinemaMode && "top-8 scale-95 origin-top-right opacity-80 hover:opacity-100"
    )}>
      <div className={cn(
        "bento-card p-0 border-none shadow-2xl overflow-hidden transition-all duration-700",
        isCinemaMode ? "bg-white/5 backdrop-blur-3xl border-white/10" : "bg-card shadow-glow-primary/5"
      )}>
        <div className={cn(
          "border-b py-6 px-6 transition-all duration-700",
          isCinemaMode ? "bg-white/5 border-white/10" : "bg-primary/5 border-border/50"
        )}>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-2xl transition-all",
                  isCinemaMode ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
                )}>
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={cn(
                    "text-base font-bold uppercase tracking-tight leading-none transition-all",
                    isCinemaMode ? "text-white" : "text-foreground"
                  )}>
                    Programme du cours
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {completedLessons?.size || 0} sur {lessons?.length || 0} leçons complétées
                  </p>
                </div>
             </div>
             {hasAccess && lessons && (
               <Badge variant="outline" className={cn(
                 "font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5 rounded-lg border",
                 (completedLessons?.size || 0) === lessons.length ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"
               )}>
                 {(completedLessons?.size || 0) === lessons.length ? "Terminé" : `${completedLessons?.size || 0}/${lessons.length}`}
               </Badge>
             )}
          </div>
        </div>
        
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {isLoadingLessons ? (
            <div className="space-y-3 p-2">
               <Skeleton className="h-16 w-full rounded-2xl" />
               <Skeleton className="h-16 w-full rounded-2xl" />
               <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : lessonsError ? (
            <div className="p-8 text-center space-y-2">
               <HelpCircle className="w-10 h-10 text-destructive mx-auto opacity-20" />
               <p className="text-destructive text-[10px] font-black uppercase italic tracking-widest">Échec du chargement</p>
            </div>
          ) : (
            <div className="space-y-4">
              {moduleNames.map((moduleName, modIdx) => {
                const moduleLessons = lessonsByModule[moduleName];
                const completedInModule = moduleLessons.filter((l: Lesson) => completedLessons?.has(l.id)).length;
                const isModuleComplete = completedInModule === moduleLessons.length;

                return (
                  <Collapsible key={moduleName} defaultOpen={modIdx === 0} className="space-y-2">
                    <CollapsibleTrigger asChild>
                      <button className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                        isCinemaMode ? "bg-white/5 hover:bg-white/10" : "bg-muted/30 hover:bg-muted/50"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                            isModuleComplete ? "bg-emerald-500 text-white shadow-glow-emerald" : 
                            isCinemaMode ? "bg-white/10 border border-white/10 text-white/40 group-hover:text-white" :
                            "bg-card border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30"
                          )}>
                            {isModuleComplete ? <CheckCircle className="w-4 h-4" /> : modIdx + 1}
                          </div>
                          <div className="text-left">
                             <span className={cn(
                               "font-black uppercase text-[10px] tracking-widest leading-none block mb-1 opacity-50 italic transition-all",
                               isCinemaMode ? "text-white/40" : "text-muted-foreground"
                             )}>Module {modIdx + 1}</span>
                             <span className={cn(
                               "font-black uppercase text-xs tracking-tighter block transition-all",
                               isCinemaMode ? "text-white/80" : "text-foreground"
                             )}>{moduleName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <Badge variant="outline" className={cn(
                             "text-[9px] font-black px-2 transition-all",
                             isCinemaMode ? "border-white/20 bg-white/5 text-white/60" : "border-primary/20 bg-primary/5 text-primary"
                           )}>
                             {completedInModule}/{moduleLessons.length}
                           </Badge>
                           <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 pl-4 pt-1">
                      {moduleLessons.map((lesson: Lesson, index: number) => {
                        const isCompleted = completedLessons?.has(lesson.id) || false;
                        const isSelected = selectedLesson?.id === lesson.id;

                        return (
                          <div key={lesson.id} className="flex items-center gap-2 group px-1">
                            <button
                              onClick={() => isOnline && setSelectedLesson(lesson)}
                              disabled={!hasAccess || !isOnline}
                              className={cn(
                                "flex-1 text-left p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 border-2 border-transparent",
                                isSelected && isOnline ? (isCinemaMode ? "bg-white/20 text-white border-white/20" : "bg-primary text-white shadow-2xl scale-[1.02] border-primary/20") : 
                                isCinemaMode ? "hover:bg-white/5" : "hover:bg-primary/5 hover:border-primary/10",
                                !hasAccess && "opacity-40 cursor-not-allowed",
                                isCompleted && !isSelected && isOnline && "opacity-80"
                              )}>
                              <div className={cn(
                                "text-[10px] font-black w-7 h-7 rounded-lg flex items-center justify-center border transition-all shadow-inner shrink-0",
                                isSelected && isOnline ? "bg-white/20 border-white/20 text-white" : 
                                isCinemaMode ? "bg-black/20 border-white/10 text-white/40" :
                                "bg-background border-border group-hover:border-primary/30",
                                isCompleted && !isSelected && isOnline && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
                              )}>
                                {isCompleted && isOnline ? <CheckCircle className="w-4 h-4" /> : index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                   "font-black text-[11px] uppercase tracking-tighter leading-tight italic truncate transition-all",
                                   isSelected && isOnline ? "text-white" : isCompleted ? (isCinemaMode ? "text-emerald-400" : "text-emerald-700/80") : 
                                   isCinemaMode ? "text-white/60" : "text-foreground/80"
                                )}>{lesson.title}</p>
                              </div>
                              {hasAccess && isSelected && isOnline && <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse",
                                isCinemaMode ? "bg-white" : "bg-white"
                              )} />}
                            </button>

                            {hasAccess && isOnline && (
                              <button
                                onClick={() => onToggleCompletion(lesson.id, isCompleted)}
                                disabled={isToggling}
                                className={cn(
                                  "p-2 rounded-xl transition-all active:scale-150 shrink-0",
                                  isCompleted ? "text-emerald-500 hover:bg-emerald-50" : 
                                  isCinemaMode ? "text-white/20 hover:text-white hover:bg-white/5" :
                                  "text-muted-foreground/30 hover:text-primary hover:bg-primary/5"
                                )}
                              >
                                {isCompleted ? <CheckCircle2 className="w-5 h-5 shadow-glow-emerald" /> : <Circle className="w-5 h-5" />}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
