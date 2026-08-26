import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, LayoutDashboard, FileText, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sub-components
import { ProfileTab } from "./details/ProfileTab";
import { FinanceTab } from "./details/FinanceTab";
import { AttendanceTab } from "./details/AttendanceTab";
import { ResourcesTab } from "./details/ResourcesTab";
import { SecurityTab } from "./details/SecurityTab";
import { DocumentsTab } from "./details/DocumentsTab";
import { Clock } from "lucide-react";

interface StudentDetailsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedStudent: any;
    isLoadingProfile: boolean;
    fullProfile: any;
    academicForm: any;
    setAcademicForm: (form: any) => void;
    updateProfileFieldsMutation: any;
    isLoadingCourses: boolean;
    studentCoursesDetails: any[] | null;
    studentStrategiesDetails: any[] | null;
    studentIndicatorsDetails: any[] | null;
    allCourses: any[] | undefined;
    allStrategies: any[] | undefined;
    allIndicators: any[] | undefined;
    enrollMutation: any;
    deleteMutation: any;
    editForm: any;
    setEditForm: (form: any) => void;
    userActionMutation: any;
    selectedStudentId: string | null;
    setSelectedPurchase: (purchase: any) => void;
    setIsInstallmentsOpen: (open: boolean) => void;
    setManualPaymentAmount: (amount: number) => void;
    setIsManualPaymentOpen: (open: boolean) => void;
    setIsEnrollDialogOpen: (open: boolean) => void;
}

export const StudentDetailsSheet = ({
    open,
    onOpenChange,
    selectedStudent,
    isLoadingProfile,
    fullProfile,
    academicForm,
    setAcademicForm,
    updateProfileFieldsMutation,
    isLoadingCourses,
    studentCoursesDetails,
    studentStrategiesDetails,
    studentIndicatorsDetails,
    allStrategies,
    allIndicators,
    enrollMutation,
    deleteMutation,
    editForm,
    setEditForm,
    userActionMutation,
    selectedStudentId,
    setSelectedPurchase,
    setIsInstallmentsOpen,
    setManualPaymentAmount,
    setIsManualPaymentOpen,
    setIsEnrollDialogOpen
}: StudentDetailsSheetProps) => {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 bg-card/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex flex-col h-full overflow-hidden">
                <ScrollArea className="flex-1">
                    <div className="p-8 space-y-8">
                        {/* Profile Header */}
                        <SheetHeader className="relative space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-2xl transition-transform group-hover:scale-105">
                                        <AvatarImage src={selectedStudent?.avatar_url || ''} />
                                        <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                                            {selectedStudent?.full_name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        ACTIF
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <SheetTitle className="text-3xl font-black uppercase tracking-tighter italic leading-none">
                                        {selectedStudent?.full_name}
                                    </SheetTitle>
                                    <SheetDescription className="text-sm font-medium italic opacity-60">
                                        {selectedStudent?.email}
                                    </SheetDescription>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase">
                                            ID: {selectedStudentId?.slice(0, 8)}
                                        </Badge>
                                        {selectedStudent?.banned_until && new Date(selectedStudent.banned_until) > new Date() && (
                                            <Badge variant="destructive" className="font-black text-[10px] uppercase">BANNI</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-[2rem] border border-white/5 text-center">
                                    <div className="text-2xl font-black italic tracking-tighter text-primary">${selectedStudent?.total_spent?.toLocaleString() || 0}</div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">Montant Total Formation</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-[2rem] border border-white/5 text-center">
                                    <div className="text-2xl font-black italic tracking-tighter">{selectedStudent?.enrolled_courses_count || 0}</div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">Cursus Actifs</div>
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Navigation Tabs */}
                        <Tabs defaultValue="academic" className="w-full">
                            <TabsList className="grid w-full grid-cols-6 h-14 bg-white/5 p-1.5 rounded-[1.5rem] border border-white/5">
                                <TabsTrigger value="academic" title="Profil Civil" className="rounded-xl font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <User className="w-4 h-4" />
                                </TabsTrigger>
                                <TabsTrigger value="finance" title="Comptabilité & Cursus" className="rounded-xl font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <CreditCard className="w-4 h-4" />
                                </TabsTrigger>
                                <TabsTrigger value="attendance" title="Présences & Assiduité" className="rounded-xl font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Clock className="w-4 h-4" />
                                </TabsTrigger>
                                <TabsTrigger value="resources" title="Outils Trading" className="rounded-xl font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <LayoutDashboard className="w-4 h-4" />
                                </TabsTrigger>
                                <TabsTrigger value="documents" title="Documents" className="rounded-xl font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <FileText className="w-4 h-4" />
                                </TabsTrigger>
                                <TabsTrigger value="security" title="Sécurité" className="rounded-xl font-black text-[9px] uppercase tracking-widest data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                                    <Shield className="w-4 h-4" />
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="academic" className="outline-none">
                                <ProfileTab 
                                    isLoading={isLoadingProfile}
                                    fullProfile={fullProfile}
                                    academicForm={academicForm}
                                    setAcademicForm={setAcademicForm}
                                    updateMutation={updateProfileFieldsMutation}
                                />
                            </TabsContent>

                            <TabsContent value="finance" className="outline-none">
                                <FinanceTab 
                                    isLoading={isLoadingCourses}
                                    selectedStudent={selectedStudent}
                                    studentCoursesDetails={studentCoursesDetails}
                                    setIsEnrollDialogOpen={setIsEnrollDialogOpen}
                                    setSelectedPurchase={setSelectedPurchase}
                                    setIsInstallmentsOpen={setIsInstallmentsOpen}
                                    setManualPaymentAmount={setManualPaymentAmount}
                                    setIsManualPaymentOpen={setIsManualPaymentOpen}
                                    deleteMutation={deleteMutation}
                                />
                            </TabsContent>

                            <TabsContent value="attendance" className="outline-none">
                                <AttendanceTab studentId={selectedStudentId || ""} />
                            </TabsContent>

                            <TabsContent value="resources" className="outline-none">
                                <ResourcesTab 
                                    studentStrategiesDetails={studentStrategiesDetails}
                                    studentIndicatorsDetails={studentIndicatorsDetails}
                                    allStrategies={allStrategies}
                                    allIndicators={allIndicators}
                                    enrollMutation={enrollMutation}
                                    deleteMutation={deleteMutation}
                                />
                            </TabsContent>

                            <TabsContent value="documents" className="outline-none">
                                <DocumentsTab studentId={selectedStudentId || ""} />
                            </TabsContent>

                            <TabsContent value="security" className="outline-none">
                                <SecurityTab 
                                    editForm={editForm}
                                    setEditForm={setEditForm}
                                    userActionMutation={userActionMutation}
                                    selectedStudentId={selectedStudentId}
                                    selectedStudent={selectedStudent}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
