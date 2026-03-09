import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BookOpen, PlayCircle, Circle, CheckCircle2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  lesson_type: 'video' | 'pdf';
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
  isToggling
}: CourseSidebarProps) => {
  const progress = lessons ? Math.round((completedLessons?.size || 0) / lessons.length * 100) : 0;

  return (
    <div className="sticky top-24 space-y-6 animate-in slide-in-from-right-4 duration-700">
      <Card className="border-primary/10 shadow-xl overflow-hidden rounded-[2rem] bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 border-b border-primary/10 py-6 px-8">
          <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl"><BookOpen className="w-5 h-5 text-primary" /></div>
              Programme
            </div>
            {hasAccess && lessons && (
              <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                {progress}%
              </span>
            )}
          </CardTitle>
          {hasAccess && lessons && (
            <Progress value={progress} className="h-1.5 mt-4" />
          )}
        </CardHeader>
        
        <CardContent className="p-3 space-y-1 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {isLoadingLessons ? (
            <div className="p-4 space-y-3">
               <Skeleton className="h-14 w-full rounded-2xl" />
               <Skeleton className="h-14 w-full rounded-2xl" />
               <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : lessonsError ? (
            <p className="text-destructive p-4 text-xs font-bold italic">Erreur: {lessonsError.message}</p>
          ) : (
            lessons?.map((lesson, index) => {
              const isCompleted = completedLessons?.has(lesson.id) || false;
              const isSelected = selectedLesson?.id === lesson.id;
              
              return (
                <div key={lesson.id} className="flex items-center gap-1 group px-2">
                  <button
                    onClick={() => setSelectedLesson(lesson)}
                    disabled={!hasAccess}
                    className={cn(
                      "flex-1 text-left p-4 rounded-2xl transition-all duration-300 flex items-center gap-4",
                      isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" : "hover:bg-primary/5",
                      !hasAccess && "opacity-50 cursor-not-allowed",
                      isCompleted && !isSelected && "opacity-70"
                    )}>
                    <div className={cn(
                      "text-xs font-black w-8 h-8 rounded-full flex items-center justify-center border",
                      isSelected ? "bg-white/20 border-white/20 text-white" : "bg-muted border-border group-hover:border-primary/30",
                      isCompleted && !isSelected && "bg-green-500/10 border-green-500/20 text-green-600"
                    )}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold text-sm truncate", isCompleted && !isSelected && "text-muted-foreground")}>{lesson.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                         {lesson.lesson_type === 'video' ? <PlayCircle className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                         <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">{lesson.lesson_type}</span>
                      </div>
                    </div>
                    {hasAccess && isSelected && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                  </button>
                  
                  {hasAccess && (
                    <button 
                      onClick={() => onToggleCompletion(lesson.id, isCompleted)} 
                      disabled={isToggling}
                      className={cn(
                        "p-2 rounded-xl transition-all active:scale-125",
                        isCompleted ? "text-green-500 hover:bg-green-50" : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
