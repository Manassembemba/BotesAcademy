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
import { Loader2, Upload, FileText, ImageIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Schéma de base commun
const baseSchema = z.object({
  title: z.string().min(2, "Le titre est requis"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  image_url: z.string().optional(),
});

// Schéma pour TradingView (Stratégies)
const tradingViewSchema = baseSchema.extend({
  type: z.literal("TradingView"),
  content: z.string().min(1, "Le code PineScript est requis pour TradingView"),
  category: z.string().default("Stratégie"),
});

// Schéma pour MetaTrader / Autres (Indicateurs avec abonnements)
const indicatorSchema = baseSchema.extend({
  type: z.enum(["MT4", "MT5", "Autre"]),
  price_1m: z.coerce.number().min(0, "Le prix doit être positif").default(0),
  price_3m: z.coerce.number().min(0, "Le prix doit être positif").default(0),
  price_lifetime: z.coerce.number().min(0, "Le prix doit être positif").default(0),
  category: z.enum(["Indicateur", "EA", "Script", "Library"]),
});

const toolSchema = z.discriminatedUnion("type", [tradingViewSchema, indicatorSchema]);

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
      type: "MT4",
      category: "Indicateur",
      price_1m: 0,
      price_3m: 0,
      price_lifetime: 0,
      content: "",
    } as any,
  });

  useEffect(() => {
    if (initialData && isOpen) {
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
        category: initialData.category || (displayType === "TradingView" ? "Stratégie" : "Indicateur"),
        content: initialData.strategy_secrets?.content || initialData.content || "",
        image_url: initialData.image_url || "",
      } as any);
    } else if (!isOpen) {
        form.reset();
        setImageFile(null);
        setIndicatorFile(null);
    }
  }, [initialData, form, isOpen]);

  const handleSubmit = (values: ToolFormValues) => {
    onSave({
      ...values,
      imageFile,
      indicatorFile,
      compatibility: [values.type],
    });
  };

  const currentType = form.watch("type");
  const isDigitalFile = currentType !== "TradingView";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-primary/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-primary">
            {initialData ? "Modifier la ressource" : "Ajouter une ressource"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 py-4">
            
            {/* SECTION 1: PLATEFORME & IDENTITÉ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-3xl border border-border/50">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Plateforme Cible</FormLabel>
                    <Select onValueChange={(val) => {
                        field.onChange(val);
                        // Reset category based on type
                        if (val === "TradingView") form.setValue("category", "Stratégie" as any);
                        else form.setValue("category", "Indicateur" as any);
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-2xl h-14 border-primary/20 bg-card font-black italic">
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-primary/10">
                        <SelectItem value="MT4" className="font-bold">MetaTrader 4</SelectItem>
                        <SelectItem value="MT5" className="font-bold">MetaTrader 5</SelectItem>
                        <SelectItem value="TradingView" className="font-bold">TradingView</SelectItem>
                        <SelectItem value="Autre" className="font-bold">Autre Support</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Nom Commercial</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Gold Alpha Pro" className="rounded-2xl h-14 border-primary/10 bg-card text-lg font-bold" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SECTION 2: TARIFICATION DYNAMIQUE */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <FormLabel className="font-bold uppercase text-[10px] tracking-wider text-muted-foreground">Tarification</FormLabel>
                    <div className="h-px flex-1 bg-border/50" />
                </div>

                {isDigitalFile ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem><FormLabel className="text-[9px] font-black uppercase opacity-60">Base ($)</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl font-bold" {...field} /></FormControl></FormItem>
                        )} />
                        {/* TypeScript safe fields for Indicators */}
                        {currentType !== "TradingView" && (
                            <>
                                <FormField control={form.control} name="price_1m" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[9px] font-black uppercase opacity-60">1 Mois ($)</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl font-bold text-blue-600" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="price_3m" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[9px] font-black uppercase opacity-60">3 Mois ($)</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl font-bold text-teal-600" {...field} /></FormControl></FormItem>
                                )} />
                                <FormField control={form.control} name="price_lifetime" render={({ field }) => (
                                    <FormItem><FormLabel className="text-[9px] font-black uppercase opacity-60">A Vie ($)</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl font-bold text-amber-600" {...field} /></FormControl></FormItem>
                                )} />
                            </>
                        )}
                    </div>
                ) : (
                    <div className="p-6 bg-orange-500/5 rounded-[2rem] border border-orange-500/20">
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem className="max-w-[200px]">
                                <FormLabel className="font-black uppercase text-[10px] tracking-widest text-orange-600">Prix de vente unique ($)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" className="rounded-2xl h-14 border-orange-500/20 bg-card font-black text-2xl text-orange-600" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                )}
            </div>

            {/* SECTION 3: ASSETS & CONTENU */}
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Visuel Catalogue</FormLabel>
                        <div className="relative border-2 border-dashed rounded-2xl h-20 flex flex-col items-center justify-center hover:border-primary/50 transition-all cursor-pointer bg-card group overflow-hidden">
                            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                            {imageFile ? (
                                <div className="flex items-center gap-2 text-primary p-2">
                                    <ImageIcon className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-[10px] font-bold truncate max-w-[150px]">{imageFile.name}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                                    <ImageIcon className="w-5 h-5" /> 
                                    <span className="text-[9px] font-black uppercase">Click to upload image</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {isDigitalFile ? (
                        <div className="space-y-2">
                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-primary">Fichier Exécutable (MT4/MT5)</FormLabel>
                            <div className="relative border-2 border-dashed rounded-2xl h-20 flex flex-col items-center justify-center hover:border-primary transition-all cursor-pointer bg-primary/5 group">
                                <input type="file" onChange={(e) => setIndicatorFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {indicatorFile ? (
                                    <div className="flex items-center gap-2 text-emerald-600 p-2">
                                        <FileText className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-[10px] font-bold truncate max-w-[150px]">{indicatorFile.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-primary/40 group-hover:text-primary transition-colors">
                                        <Upload className="w-5 h-5" />
                                        <span className="text-[9px] font-black uppercase">Drop .ex4 / .ex5 here</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 flex items-center gap-3">
                            <Info className="w-5 h-5 text-muted-foreground" />
                            <p className="text-[10px] font-medium leading-tight">Pour TradingView, collez directement le code PineScript ci-dessous.</p>
                        </div>
                    )}
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Argumentaire Commercial</FormLabel>
                        <FormControl>
                        <Textarea placeholder="Décrivez les avantages compétitifs..." className="rounded-3xl min-h-[100px] bg-card border-primary/10 shadow-sm leading-relaxed" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                {currentType === "TradingView" && (
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-4">
                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-orange-600">Source PineScript (Propriétaire)</FormLabel>
                            <FormControl>
                            <Textarea placeholder="// @version=5\nindicator('My Strategy', overlay=true)..." className="rounded-3xl h-48 bg-orange-500/5 border-orange-500/20 font-mono text-[10px] p-6 text-orange-950" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}
            </div>

            <DialogFooter className="pt-8 border-t gap-4">
              <Button type="button" variant="ghost" onClick={onClose} className="rounded-2xl h-14 px-8 font-bold uppercase text-[10px] tracking-widest">Fermer</Button>
              <Button type="submit" disabled={isSaving} className="rounded-2xl h-14 px-12 font-black uppercase tracking-[0.2em] shadow-glow-primary min-w-[200px]">
                {isSaving ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : (initialData ? "Mettre à jour" : "Lancer le Produit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ToolEditorDialog;
