import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileText, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toolSchema = z.object({
  title: z.string().min(2, "Le titre est requis"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  price_1m: z.coerce.number().min(0).optional(),
  price_3m: z.coerce.number().min(0).optional(),
  price_lifetime: z.coerce.number().min(0).optional(),
  type: z.enum(["MT4", "MT5", "TradingView", "Autre"]),
  category: z.string().default("Indicateur"),
  content: z.string().optional(),
});

type ToolFormValues = z.infer<typeof toolSchema>;

interface ToolEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  isSaving: boolean;
}

const ToolEditorDialog = ({ isOpen, onClose, onSave, initialData, isSaving }: ToolEditorDialogProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [indicatorFile, setIndicatorFile] = useState<File | null>(null);

  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      price_1m: 0,
      price_3m: 0,
      price_lifetime: 0,
      type: "MT4",
      category: "Indicateur",
      content: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      // Mapping initial type from DB values
      let displayType: any = "MT4";
      if (initialData.type === 'strategy' || (initialData.compatibility && initialData.compatibility.includes('TradingView'))) {
        displayType = "TradingView";
      } else if (initialData.compatibility && initialData.compatibility.includes('MT5')) {
        displayType = "MT5";
      } else if (initialData.compatibility && initialData.compatibility.includes('MT4')) {
        displayType = "MT4";
      }

      form.reset({
        title: initialData.title || initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || 0,
        price_1m: initialData.price_1m || 0,
        price_3m: initialData.price_3m || 0,
        price_lifetime: initialData.price_lifetime || 0,
        type: displayType,
        category: initialData.category || "Indicateur",
        content: initialData.content || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        price: 0,
        price_1m: 0,
        price_3m: 0,
        price_lifetime: 0,
        type: "MT4",
        category: "Indicateur",
        content: "",
      });
    }
    setImageFile(null);
    setIndicatorFile(null);
  }, [initialData, form, isOpen]);

  const handleSubmit = (values: ToolFormValues) => {
    onSave({
      ...values,
      imageFile,
      indicatorFile,
      // The compatibility is now derived from the type for the DB
      compatibility: [values.type],
    });
  };

  const currentType = form.watch("type");
  const isDigitalFile = currentType === "MT4" || currentType === "MT5" || currentType === "Autre";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-primary/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-primary">
            {initialData ? "🔧 Modifier l'outil" : "🚀 Nouveau Produit"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 py-4">
            {/* PLATFORM SELECTOR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-3xl border border-border/50 shadow-inner">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Plateforme / Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-2xl h-14 border-primary/20 bg-card shadow-sm font-bold">
                          <SelectValue placeholder="Choisir la plateforme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-primary/10">
                        <SelectItem value="MT4" className="font-bold underline decoration-blue-500">MetaTrader 4 (.ex4)</SelectItem>
                        <SelectItem value="MT5" className="font-bold underline decoration-teal-500">MetaTrader 5 (.ex5)</SelectItem>
                        <SelectItem value="TradingView" className="font-bold underline decoration-orange-500">TradingView (PineScript)</SelectItem>
                        <SelectItem value="Autre" className="font-bold underline decoration-purple-500">Autre Ressource</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {isDigitalFile ? (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Catégorie Technique</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-2xl h-14 border-primary/40 bg-primary/5 shadow-sm font-black italic">
                            <SelectValue placeholder="Type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="Indicateur">📊 Indicateur Standard</SelectItem>
                          <SelectItem value="EA">🤖 Expert Advisor (Robot)</SelectItem>
                          <SelectItem value="Script">📜 Script Utilitaire</SelectItem>
                          <SelectItem value="Library">📂 Librairie (.dll / .mqh)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Prix Unique (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" className="rounded-2xl h-14 border-primary/20 bg-card font-black italic text-xl" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* SUBSCRIPTION PRICES FOR MT4/MT5/AUTRE */}
            {isDigitalFile && (
              <div className="space-y-3">
                <FormLabel className="font-black uppercase text-[10px] tracking-widest px-2">💰 Tarification Abonnements (USD)</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] font-bold uppercase">Base</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="price_1m" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] font-bold uppercase">1 Mois</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="price_3m" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] font-bold uppercase">3 Mois</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="price_lifetime" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] font-bold uppercase">À Vie</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </div>
            )}

            {/* PRODUCT INFO */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Titre du Produit</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Botes Gold Scalper Pro" className="rounded-2xl h-14 border-primary/10 bg-card text-lg font-bold" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* VISUAL UPLOAD */}
                <div className="space-y-2">
                  <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Visuel Produit (Image)</FormLabel>
                  <div className="relative border-2 border-dashed rounded-2xl h-14 flex items-center justify-center hover:border-primary/50 transition-all cursor-pointer bg-card group">
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex items-center gap-2">
                      {imageFile ? (
                        <span className="text-primary font-bold text-xs truncate max-w-[150px]">{imageFile.name}</span>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-4 h-4" /> <span className="text-[10px] font-black uppercase">Uploader Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* FILE SOURCE FOR MT4/MT5/AUTRE */}
                {isDigitalFile && (
                  <div className="space-y-2">
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Fichier Source (Secret)</FormLabel>
                    <div className="relative border-2 border-dashed rounded-2xl h-14 flex items-center justify-center hover:border-primary transition-all cursor-pointer bg-primary/5 group">
                      <input type="file" onChange={(e) => setIndicatorFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="flex items-center gap-2">
                        {indicatorFile ? (
                          <div className="flex items-center text-emerald-600 font-bold text-xs">
                            <FileText className="w-4 h-4 mr-2" /> {indicatorFile.name}
                          </div>
                        ) : (
                          <div className="flex items-center text-primary/40 group-hover:text-primary transition-colors">
                            <Upload className="w-4 h-4 mr-2" />
                            <span className="text-[9px] font-black uppercase">Uploader le fichier</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Description du produit</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Vantez les mérites de cet outil d'exception..." className="rounded-3xl min-h-[120px] bg-card border-primary/10 shadow-sm leading-relaxed" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* CONTENT FOR TRADINGVIEW */}
            {currentType === "TradingView" && (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Script PineScript / Contenu</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Collez le code TradingView ici..." className="rounded-3xl h-48 bg-primary/5 border-primary/20 font-mono text-xs p-6" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-8 border-t gap-4">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-bold uppercase text-[10px] tracking-widest">Annuler</Button>
              <Button type="submit" disabled={isSaving} className="rounded-2xl h-14 px-12 font-black uppercase tracking-[0.2em] shadow-glow-primary min-w-[200px]">
                {isSaving ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : "Sauvegarder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ToolEditorDialog;
