import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import ToolEditorDialog from "./ToolEditorDialog";

const ToolManagement = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any>(null);

  // Fetch all tools (strategies and indicators)
  const { data: tools, isLoading } = useQuery({
    queryKey: ['adminTools'],
    queryFn: async () => {
      const [strategiesRes, indicatorsRes] = await Promise.all([
        supabase.from('strategies').select('*'),
        supabase.from('indicators').select('*')
      ]);

      if (strategiesRes.error) throw strategiesRes.error;
      if (indicatorsRes.error) throw indicatorsRes.error;

      const strategies = strategiesRes.data.map(s => ({ ...s, type: 'strategy' }));
      const indicators = indicatorsRes.data.map(i => ({ ...i, type: 'indicator', title: i.name })); // Normalize name to title

      return [...strategies, ...indicators].sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());
    },
  });

  // Create/Update mutation
  const saveToolMutation = useMutation({
    mutationFn: async (data: any) => {
      // Mapping table according to platform type
      const isStrategy = data.type === 'TradingView';
      const table = isStrategy ? 'strategies' : 'indicators';
      
      let imageUrl = selectedTool?.image_url;
      let fileUrl = null;

      // 1. Upload Image if provided
      if (data.imageFile) {
        const fileExt = data.imageFile.name.split('.').pop();
        const fileName = `products/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('marketplace').upload(fileName, data.imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('marketplace').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      // 2. Prepare Payload
      const payload: any = {
        description: data.description,
        price: data.price,
        image_url: imageUrl,
        compatibility: data.compatibility, // Derived from type in ToolEditorDialog
      };

      if (isStrategy) {
        payload.title = data.title;
      } else {
        payload.name = data.title;
        payload.category = data.category;
        payload.price_1m = data.price_1m;
        payload.price_3m = data.price_3m;
        payload.price_lifetime = data.price_lifetime;
      }

      let toolId = selectedTool?.id;

      // 3. Save to main table
      if (selectedTool) {
        const { error } = await supabase.from(table as any).update(payload).eq('id', selectedTool.id);
        if (error) throw error;
      } else {
        const { data: newTool, error } = await supabase.from(table as any).insert(payload).select().single();
        if (error) throw error;
        toolId = newTool.id;
      }

      // 4. Handle Secrets
      if (!isStrategy) {
        if (data.indicatorFile) {
          const fileExt = data.indicatorFile.name.split('.').pop();
          const fileName = `secrets/${toolId}_${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('marketplace').upload(fileName, data.indicatorFile);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('marketplace').getPublicUrl(fileName);
          fileUrl = urlData.publicUrl;
        }

        if (fileUrl) {
          const { error } = await supabase.from('indicator_secrets').upsert({
            indicator_id: toolId,
            file_url: fileUrl
          }, { onConflict: 'indicator_id' });
          if (error) throw error;
        }
      } else if (isStrategy && data.content) {
        const { error } = await supabase.from('strategy_secrets').upsert({
          strategy_id: toolId,
          content: data.content
        }, { onConflict: 'strategy_id' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(selectedTool ? "Outil modifié" : "Outil créé");
      queryClient.invalidateQueries({ queryKey: ['adminTools'] });
      setIsDialogOpen(false);
      setSelectedTool(null);
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (tool: any) => {
      const table = tool.type === 'strategy' ? 'strategies' : 'indicators';
      const { error } = await supabase.from(table as any).delete().eq('id', tool.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Outil supprimé");
      queryClient.invalidateQueries({ queryKey: ['adminTools'] });
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleEdit = (tool: any) => {
    setSelectedTool(tool);
    setIsDialogOpen(true);
  };

  const handleDelete = (tool: any) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet outil ?")) {
      deleteMutation.mutate(tool);
    }
  };

  const handleCreate = () => {
    setSelectedTool(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion du Marketplace</h1>
          <p className="text-muted-foreground">Ajoutez et modifiez vos ressources, stratégies et outils.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Produit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prix (1m/3m/Vie)</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun outil disponible.</TableCell>
                  </TableRow>
                ) : (
                  tools?.map((tool: any) => (
                    <TableRow key={tool.id}>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tool.type === 'strategy' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                          {tool.type === 'strategy' ? 'Ressource' : 'Outil'}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{tool.title || tool.name}</TableCell>
                      <TableCell>
                        {tool.type === 'indicator' ? (
                          <div className="text-[10px] font-bold">
                            {tool.price_1m}$ / {tool.price_3m}$ / {tool.price_lifetime}$
                          </div>
                        ) : (
                          `${tool.price} USD`
                        )}
                      </TableCell>
                      <TableCell>
                        {tool.image_url ? (
                          <img src={tool.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <Package className="w-8 h-8 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tool)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(tool)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ToolEditorDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onSave={(data) => saveToolMutation.mutate(data)}
        initialData={selectedTool}
        isSaving={saveToolMutation.isPending}
      />
    </div>
  );
};

export default ToolManagement;
