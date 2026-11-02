import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type Note } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Health = { status: string; database: string };

// The signed-in home page. Notes is a placeholder resource; replace it with the first real feature.
export default function Notes() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ notes: Note[] }>("/notes")
      .then((res) => setNotes(res.notes))
      .catch((err: Error) => setError(err.message));
    api<Health>("/health")
      .then(setHealth)
      .catch(() => setHealth({ status: "degraded", database: "down" }));
  }, []);

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = String(new FormData(form).get("title")).trim();
    if (!title) return;
    try {
      const res = await api<{ note: Note }>("/notes", { body: { title } });
      setNotes((current) => [res.note, ...current]);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function onDelete(id: string) {
    await api(`/notes/${id}`, { method: "DELETE" });
    setNotes((current) => current.filter((n) => n.id !== id));
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hello, {user?.name}</h1>
          <p className="text-muted-foreground text-sm">
            API: {health ? `${health.status}, database ${health.database}` : "checking…"}
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={onAdd} className="flex gap-2">
            <Input name="title" placeholder="Add a note" aria-label="New note title" maxLength={120} />
            <Button type="submit">Add</Button>
          </form>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {notes.map((note) => (
              <li key={note.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                {note.title}
                <Button variant="ghost" size="sm" onClick={() => onDelete(note.id)}>
                  Delete
                </Button>
              </li>
            ))}
            {notes.length === 0 && <li className="text-muted-foreground text-sm">No notes yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
