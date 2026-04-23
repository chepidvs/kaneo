import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import getLabelsByProject from "@/fetchers/label/get-labels-by-project";
import createLabel from "@/fetchers/label/create-label";
import updateLabel from "@/fetchers/label/update-label";
import deleteLabel from "@/fetchers/label/delete-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/projects/$projectId/labels",
)({
  component: LabelsPage,
});

function normalizeLabelName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

type ProjectLabel = {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

function LabelsPage() {
  const { projectId } = Route.useParams();

  const [labels, setLabels] = useState<ProjectLabel[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#888888");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#888888");

  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadLabels() {
    setIsLoading(true);
    try {
      const data = await getLabelsByProject({ projectId });
      setLabels(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to load labels");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadLabels();
  }, [projectId]);

  async function handleCreate() {
    if (isCreating) return;

    const normalizedName = normalizeLabelName(name);
    if (!normalizedName) return;

    setIsCreating(true);
    try {
      await createLabel({
        name: normalizedName,
        color,
        projectId,
      });

      setName("");
      await loadLabels();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create label");
    } finally {
      setIsCreating(false);
    }
  }

  function startEdit(label: ProjectLabel) {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditColor("#888888");
  }

  async function handleUpdate(id: string) {
    if (isUpdating) return;

    const normalizedName = normalizeLabelName(editName);
    if (!normalizedName) return;

    setIsUpdating(true);
    try {
      await updateLabel({
        id,
        name: normalizedName,
        color: editColor,
      });

      cancelEdit();
      await loadLabels();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update label");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    if (!confirm("Delete this label?")) return;

    setDeletingId(id);
    try {
      await deleteLabel({ id });
      await loadLabels();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete label");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-lg font-semibold">Labels</h2>

      {/* CREATE */}
      <div className="flex gap-2">
        <Input
          placeholder="Label name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isCreating}
        />
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-16 p-1"
          disabled={isCreating}
        />
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating ? "Adding..." : "Add"}
        </Button>
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading labels...</div>
        ) : labels.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No labels created yet.
          </div>
        ) : (
          labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center justify-between gap-2 rounded border p-2"
            >
              {editingId === label.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={isUpdating}
                  />
                  <Input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-16 p-1"
                    disabled={isUpdating}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(label.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span>{label.name}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => startEdit(label)}
                      disabled={!!deletingId}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(label.id)}
                      disabled={deletingId === label.id}
                    >
                      {deletingId === label.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}