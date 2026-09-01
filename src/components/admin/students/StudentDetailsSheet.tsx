import React from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, Clock, LayoutDashboard, FileText, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sub-components
import { ProfileTab } from "./details/ProfileTab";
import { FinanceTab } from "./details/FinanceTab";
import { AttendanceTab } from "./details/AttendanceTab";
import { ResourcesTab } from "./details/ResourcesTab";
import { SecurityTab } from "./details/SecurityTab";
import { DocumentsTab } from "./details/DocumentsTab";

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
    setIsEnrollDialogOpen
}: StudentDetailsSheetProps) => {
    // Statut calculé dynamiquement
    const isBanned = selectedStudent?.banned_until && new Date(selectedStudent.banned_until) > new Date();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl p-0 bg-card border-l border-border/50 shadow-2xl flex flex-col h-full overflow-hidden">
                <ScrollArea className="flex-1">
                    <div className="p-5 space-y-5">
                        {/* Profile Header */}
                        <SheetHeader className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Avatar className="h-16 w-16 border-2 border-border/50 shadow-md">
                                        <AvatarImage src={selectedStudent?.avatar_url || ''} />
                                        <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                                            {selectedStudent?.full_name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Badge statut dynamique — calculé depuis banned_until */}
                                    <div className={`absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-md ${isBanned ? 'bg-destructive text-destructive-foreground' : 'bg-emerald-500 text-white'}`}>
                                        {isBanned ? 'Banni' : 'Actif'}
                                    </div>
                                </div>
                                <div className="space-y-1 flex-1 min-w-0">
                                    <SheetTitle className="text-xl font-bold tracking-tight text-foreground leading-tight truncate">
                                        {selectedStudent?.full_name}
                                    </SheetTitle>
                                    <SheetDescription className="text-sm text-muted-foreground truncate">
                                        {selectedStudent?.email}
                                    </SheetDescription>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
                                            ID: {selectedStudentId?.slice(0, 8)}
                                        </Badge>
                                        {isBanned && (
                                            <Badge variant="destructive" className="text-[10px] font-medium px-2 py-0.5">Banni</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* KPI Summary Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/50 text-center">
                                    <div className="text-xl font-bold text-primary">${selectedStudent?.total_spent?.toLocaleString() || 0}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">Montant total</div>
                                </div>
                                <div className="bg-muted/40 p-3.5 rounded-2xl border border-border/50 text-center">
                                    <div className="text-xl font-bold">{selectedStudent?.enrolled_courses_count || 0}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">Cursus actifs</div>
                                </div>
                            </div>
                        </SheetHeader>

                        {/* Navigation Tabs — avec labels texte pour l'accessibilité */}
                        <Tabs defaultValue="academic" className="w-full">
                            <TabsList className="grid w-full grid-cols-6 h-10 bg-muted/50 p-1 rounded-xl border border-border/40">
                                <TabsTrigger value="academic" className="rounded-lg flex-col gap-0.5 h-full px-0 text-[9px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Profil</span>
                                </TabsTrigger>
                                <TabsTrigger value="finance" className="rounded-lg flex-col gap-0.5 h-full px-0 text-[9px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Finance</span>
                                </TabsTrigger>
                                <TabsTrigger value="attendance" className="rounded-lg flex-col gap-0.5 h-full px-0 text-[9px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Présence</span>
                                </TabsTrigger>
                                <TabsTrigger value="resources" className="rounded-lg flex-col gap-0.5 h-full px-0 text-[9px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Outils</span>
                                </TabsTrigger>
                                <TabsTrigger value="documents" className="rounded-lg flex-col gap-0.5 h-full px-0 text-[9px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
                                    <FileText className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Docs</span>
                                </TabsTrigger>
                                <TabsTrigger value="security" className="rounded-lg flex-col gap-0.5 h-full px-0 text-[9px] font-semibold data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground data-[state=active]:shadow-xs">
                                    <Shield className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Sécu.</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="academic" className="outline-none mt-4">
                                <ProfileTab 
                                    isLoading={isLoadingProfile}
                                    fullProfile={fullProfile}
                                    academicForm={academicForm}
                                    setAcademicForm={setAcademicForm}
                                    updateMutation={updateProfileFieldsMutation}
                                />
                            </TabsContent>

                            <TabsContent value="finance" className="outline-none mt-4">
                                <FinanceTab 
                                    isLoading={isLoadingCourses}
                                    selectedStudent={selectedStudent}
                                    studentCoursesDetails={studentCoursesDetails}
                                    setIsEnrollDialogOpen={setIsEnrollDialogOpen}
                                    setSelectedPurchase={setSelectedPurchase}
                                    setIsInstallmentsOpen={setIsInstallmentsOpen}
                                    setManualPaymentAmount={setManualPaymentAmount}
                                    setIsManualPaymentOpen={setIsEnrollDialogOpen}
                                    deleteMutation={deleteMutation}
                                />
                            </TabsContent>

                            <TabsContent value="attendance" className="outline-none mt-4">
                                <AttendanceTab studentId={selectedStudentId || ""} />
                            </TabsContent>

                            <TabsContent value="resources" className="outline-none mt-4">
                                <ResourcesTab 
                                    studentStrategiesDetails={studentStrategiesDetails}
                                    studentIndicatorsDetails={studentIndicatorsDetails}
                                    allStrategies={allStrategies}
                                    allIndicators={allIndicators}
                                    enrollMutation={enrollMutation}
                                    deleteMutation={deleteMutation}
                                />
                            </TabsContent>

                            <TabsContent value="documents" className="outline-none mt-4">
                                <DocumentsTab studentId={selectedStudentId || ""} />
                            </TabsContent>

                            <TabsContent value="security" className="outline-none mt-4">
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
