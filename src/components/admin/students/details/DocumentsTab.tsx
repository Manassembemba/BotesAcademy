import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Trash2, ExternalLink, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DocumentsTabProps {
    studentId: string;
}

export const DocumentsTab = ({ studentId }: DocumentsTabProps) => {
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const { data: documents, isLoading } = useQuery({
        queryKey: ['student-documents', studentId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('student_documents')
                .select('*')
                .eq('user_id', studentId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!studentId
    });

    const deleteMutation = useMutation({
        mutationFn: async (docId: string) => {
            const { error } = await supabase.from('student_documents').delete().eq('id', docId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Document supprimé");
            queryClient.invalidateQueries({ queryKey: ['student-documents', studentId] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const verifyMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: boolean }) => {
            const { error } = await supabase
                .from('student_documents')
                .update({ is_verified: status, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Statut de vérification mis à jour");
            queryClient.invalidateQueries({ queryKey: ['student-documents', studentId] });
        }
    });

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !studentId) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${studentId}/${crypto.randomUUID()}.${fileExt}`;

            // 1. Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('student_assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('student_assets')
                .getPublicUrl(filePath);

            // 3. Create database record
            const { error: dbError } = await supabase
                .from('student_documents')
                .insert({
                    user_id: studentId,
                    file_url: publicUrl,
                    document_type: file.type.includes('pdf') ? 'contract' : 'identity_proof',
                    is_verified: false
                });

            if (dbError) throw dbError;

            toast.success("Document ajouté avec succès");
            queryClient.invalidateQueries({ queryKey: ['student-documents', studentId] });
        } catch (error: any) {
            toast.error(`Erreur d'upload: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>;

    return (
        <div className="space-y-8 pt-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] italic">Documents du dossier</h3>
                </div>
                <div className="relative">
                    <input 
                        type="file" 
                        id="doc-upload" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                    />
                    <Button 
                        asChild 
                        disabled={isUploading}
                        className="h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-black uppercase text-[10px] tracking-widest px-4 cursor-pointer"
                    >
                        <label htmlFor="doc-upload">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            Ajouter un document
                        </label>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {documents?.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-30 italic">Aucun document archivé</p>
                        </div>
                    ) : (
                        documents?.map((doc: any) => (
                            <motion.div 
                                key={doc.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:border-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${doc.is_verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black uppercase italic tracking-tighter text-sm">
                                                {doc.document_type === 'contract' ? 'Contrat de formation' : 'Pièce d\'identité'}
                                            </span>
                                            {doc.is_verified ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full text-[8px] font-black tracking-widest">VÉRIFIÉ</Badge>
                                            ) : (
                                                <Badge className="bg-amber-500/10 text-amber-500 border-none rounded-full text-[8px] font-black tracking-widest">EN ATTENTE</Badge>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mt-1">
                                            Ajouté le {format(new Date(doc.created_at), 'dd MMMM yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10" asChild title="Ouvrir le document">
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </Button>
                                    
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={`h-10 w-10 rounded-xl ${doc.is_verified ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                                        onClick={() => verifyMutation.mutate({ id: doc.id, status: !doc.is_verified })}
                                        title={doc.is_verified ? "Invalider" : "Valider"}
                                    >
                                        {doc.is_verified ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                    </Button>

                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 rounded-xl text-white/20 hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            if (confirm("Supprimer ce document ?")) deleteMutation.mutate(doc.id);
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
