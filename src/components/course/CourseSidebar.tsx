import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, PlayCircle, Circle, CheckCircle2, CheckCircle, HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Lesson {
  id: string;
  title: string;
  lesson_type: 'video' | 'pdf' | 'quiz';
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
  mode = 'online'
}: CourseSidebarProps) => {
  const isOnline = mode === 'online';
  const progress = lessons ? Math.round((completedLessons?.size || 0) / lessons.length * 100) : 0;

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
    <div className="sticky top-24 space-y-6 animate-in slide-in-from-right-4 duration-700">
      <Card className="border-primary/10 shadow-xl overflow-hidden rounded-[2rem] bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 border-b border-primary/10 py-6 px-8">
          <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><BookOpen className="w-5 h-5 text-primary" /></div>
              {isOnline ? "Progression" : "Sommaire"}
            </div>
            {hasAccess && lessons && isOnline && (
              <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {progress}%
              </span>
            )}
          </CardTitle>
          {hasAccess && lessons && isOnline && (
            <Progress value={progress} className="h-1.5 mt-4" />
          )}
        </CardHeader>
        
        <CardContent className="p-3 space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {isLoadingLessons ? (
            <div className="p-4 space-y-3">
               <Skeleton className="h-14 w-full rounded-2xl" />
               <Skeleton className="h-14 w-full rounded-2xl" />
               <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : lessonsError ? (
            <p className="text-destructive p-4 text-xs font-bold italic">Erreur: {lessonsError.message}</p>
          ) : (
            <div className="space-y-2">
              {moduleNames.map((moduleName, modIdx) => {
                const moduleLessons = lessonsByModule[moduleName];
                const completedInModule = moduleLessons.filter((l: Lesson) => completedLessons?.has(l.id)).length;
                const isModuleComplete = completedInModule === moduleLessons.length;

                return (
                  <Collapsible key={moduleName} defaultOpen={true} className="space-y-2">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                            isModuleComplete ? "bg-emerald-500 text-white" : "bg-primary/20 text-primary"
                          )}>
                            {isModuleComplete ? <CheckCircle className="w-3 h-3" /> : modIdx + 1}
                          </div>
                          <span className="font-black uppercase text-xs tracking-tighter">{moduleName}</span>
                          <Badge variant="outline" className="text-[8px] h-4 py-0">
                            {completedInModule}/{moduleLessons.length}
                          </Badge>
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 pl-4">
                      {moduleLessons.map((lesson: Lesson, index: number) => {
                        const isCompleted = completedLessons?.has(lesson.id) || false;
                        const isSelected = selectedLesson?.id === lesson.id;

                        return (
                          <div key={lesson.id} className="flex items-center gap-1 group px-2">
                            <button
                              onClick={() => isOnline && setSelectedLesson(lesson)}
                              disabled={!hasAccess || !isOnline}
                              className={cn(
                                "flex-1 text-left p-3 rounded-xl transition-all duration-300 flex items-center gap-3",
                                isSelected && isOnline ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" : "hover:bg-primary/5",
                                !hasAccess && "opacity-50 cursor-not-allowed",
                                isCompleted && !isSelected && isOnline && "opacity-70",
                                !isOnline && "cursor-default"
                              )}>
                              <div className={cn(
                                "text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border",
                                isSelected && isOnline ? "bg-white/20 border-white/20 text-white" : "bg-muted border-border group-hover:border-primary/30",
                                isCompleted && !isSelected && isOnline && "bg-green-500/10 border-green-500/20 text-green-600",
                                !isOnline && "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                              )}>
                                {isCompleted && isOnline ? <CheckCircle className="w-3 h-3" /> : index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn("font-bold text-xs truncate uppercase tracking-tighter", isCompleted && !isSelected && isOnline && "text-muted-foreground")}>{lesson.title}</p>
                              </div>
                              {hasAccess && isSelected && isOnline && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                            </button>

                            {hasAccess && isOnline && (
                              <button
                                onClick={() => onToggleCompletion(lesson.id, isCompleted)}
                                disabled={isToggling}
                                className={cn(
                                  "p-1.5 rounded-lg transition-all active:scale-125",
                                  isCompleted ? "text-green-500 hover:bg-green-50" : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
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
        </CardContent>
      </Card>
    </div>
  );
};
