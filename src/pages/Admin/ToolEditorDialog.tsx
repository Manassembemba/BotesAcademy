import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const toolSchema = z.object({
  title: z.string().min(2, "Le titre est requis"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Le prix doit être positif"),
  type: z.enum(["strategy", "indicator"]),
  image_url: z.string().url().optional().or(z.literal("")),
  file_url: z.string().url().optional().or(z.literal("")),
  content: z.string().optional(), // For strategies description/content
});

type ToolFormValues = z.infer<typeof toolSchema>;

interface ToolEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ToolFormValues) => void;
  initialData?: any;
  isSaving: boolean;
}

const ToolEditorDialog = ({ isOpen, onClose, onSave, initialData, isSaving }: ToolEditorDialogProps) => {
  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      type: "indicator",
      image_url: "",
      file_url: "",
      content: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title || initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || 0,
        type: initialData.type || (initialData.file_url ? "indicator" : "strategy"),
        image_url: initialData.image_url || "",
        file_url: initialData.file_url || "",
        content: initialData.content || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        price: 0,
        type: "indicator",
        image_url: "",
        file_url: "",
        content: "",
      });
    }
  }, [initialData, form, isOpen]);

  const handleSubmit = (data: ToolFormValues) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier l'outil" : "Ajouter un outil"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'outil</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="indicator">Indicateur / Outil</SelectItem>
                        <SelectItem value="strategy">Stratégie / E-book</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'outil" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description courte</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description affichée sur la carte..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de l'image</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("type") === "indicator" ? (
              <FormField
                control={form.control}
                name="file_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL du fichier à télécharger</FormLabel>
                    <FormControl>
                      <Input placeholder="Lien vers le fichier (Drive, Supabase Storage...)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenu détaillé / Lien E-book</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Contenu de la stratégie ou lien vers le document..." className="h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ToolEditorDialog;
