"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api/client";
import { useLibraries } from "@/hooks/use-libraries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Library } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/format";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";

export default function LibrariesPage() {
  const { data: libraries, isLoading } = useLibraries();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiPost("/libraries", data),
    onSuccess: () => {
      toast.success("Library created");
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Libraries</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization&apos;s knowledge bases
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            New library
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a library</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  name,
                  description: description || undefined,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Financial Reports Q1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What kind of documents will this library contain?"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create library"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <SectionCard className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </SectionCard>
      ) : !libraries || libraries.length === 0 ? (
        <SectionCard className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <Library className="mb-2 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No libraries yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first library to start organizing knowledge
          </p>
        </SectionCard>
      ) : (
        <SectionCard className="p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {libraries.map((lib) => (
              <Link key={lib.id} href={`/admin/libraries/${lib.id}`}>
                <Card className="h-full cursor-pointer border-border/60 bg-card/80 shadow-sm transition-colors hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{lib.name}</CardTitle>
                    {lib.description && (
                      <CardDescription className="line-clamp-2">
                        {lib.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(lib.created_at)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </SectionCard>
      )}
    </PageContainer>
  );
}
