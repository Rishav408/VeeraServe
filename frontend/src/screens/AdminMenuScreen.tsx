import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button, EmptyState, Input, Modal, Spinner } from "../components/ui";
import {
  useAdminCategories,
  useAdminMenuItems,
  useCreateCategory,
  useCreateMenuItem,
  useDeleteMenuItem,
  useUpdateMenuItem
} from "../hooks/useAdminMenu";
import type { ApiError } from "../lib/apiClient";
import type { CategoryDto, MenuItemCreate, MenuItemDto } from "../types/api";

interface FormValues {
  name: string;
  category_id: string;
  price: string;
  happy_hour_price: string;
  spice_level: number;
  is_veg: boolean;
  is_available: boolean;
  description: string;
  tags: string;
}

function toFormValues(item: MenuItemDto): FormValues {
  return {
    name: item.name,
    category_id: item.category_id,
    price: item.price === null ? "" : String(item.price),
    happy_hour_price: item.happy_hour_price === null ? "" : String(item.happy_hour_price),
    spice_level: item.spice_level,
    is_veg: item.is_veg,
    is_available: item.is_available,
    description: item.description ?? "",
    tags: item.tags.join(", ")
  };
}

function toPayload(values: FormValues): MenuItemCreate {
  return {
    name: values.name.trim(),
    category_id: values.category_id,
    description: values.description.trim() || null,
    price: values.price.trim() === "" ? null : Number(values.price),
    happy_hour_price: values.happy_hour_price.trim() === "" ? null : Number(values.happy_hour_price),
    is_veg: values.is_veg,
    spice_level: values.spice_level,
    tags: values.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    is_available: values.is_available
  };
}

function MenuItemForm({
  categories,
  initial,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onCancel
}: {
  categories: CategoryDto[];
  initial: FormValues;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: MenuItemCreate) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<FormValues>(initial);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim() || !values.category_id) return;
    onSubmit(toPayload(values));
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold text-ink-soft">Dish Name</span>
        <Input
          className="mt-1.5"
          placeholder="e.g., Paneer Butter Masala"
          value={values.name}
          onChange={(event) => set("name", event.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink-soft">Category</span>
        <select
          value={values.category_id}
          onChange={(event) => set("category_id", event.target.value)}
          className="mt-1.5 w-full rounded-[12px] border border-primary/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary"
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink-soft">Price (₹)</span>
        <Input
          className="mt-1.5"
          type="number"
          min={0}
          value={values.price}
          onChange={(event) => set("price", event.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink-soft">Happy Hour Price (₹)</span>
        <Input
          className="mt-1.5"
          type="number"
          min={0}
          value={values.happy_hour_price}
          onChange={(event) => set("happy_hour_price", event.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink-soft">Spice Level</span>
        <select
          value={values.spice_level}
          onChange={(event) => set("spice_level", Number(event.target.value))}
          className="mt-1.5 w-full rounded-[12px] border border-primary/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary"
        >
          {[0, 1, 2, 3, 4].map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold text-ink-soft">Tags (comma separated)</span>
        <Input
          className="mt-1.5"
          placeholder="spicy, chef-special"
          value={values.tags}
          onChange={(event) => set("tags", event.target.value)}
        />
      </label>

      <label className="block sm:col-span-2">
        <span className="text-sm font-semibold text-ink-soft">Description</span>
        <textarea
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          placeholder="Brief dish description..."
          className="mt-1.5 h-20 w-full rounded-[12px] border border-primary/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary"
        />
      </label>

      <div className="flex items-center gap-6 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <input type="checkbox" checked={values.is_veg} onChange={(event) => set("is_veg", event.target.checked)} />
          Vegetarian
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <input
            type="checkbox"
            checked={values.is_available}
            onChange={(event) => set("is_available", event.target.checked)}
          />
          Available
        </label>
      </div>

      {error && <p className="text-sm font-semibold text-danger sm:col-span-2">{error}</p>}

      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" className="flex items-center gap-2 text-sm" disabled={submitting}>
          <Plus size={16} /> {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export default function AdminMenuScreen() {
  const itemsQuery = useAdminMenuItems();
  const categoriesQuery = useAdminCategories();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const createCategory = useCreateCategory();

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
  const categoryLabel = useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories]
  );

  const [editing, setEditing] = useState<MenuItemDto | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [formKey, setFormKey] = useState(0);

  const errorMessage = (error: unknown): string | null =>
    error ? ((error as ApiError).message ?? "Something went wrong") : null;

  const defaultCategory = categories[0]?.id ?? "";

  const createCategorySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const label = newCategoryLabel.trim();
    if (!label) return;
    createCategory.mutate(
      { label },
      { onSuccess: () => setNewCategoryLabel("") }
    );
  };

  const remove = (item: MenuItemDto) => {
    if (window.confirm(`Delete "${item.name}"?`)) {
      deleteItem.mutate(item.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Menu Management</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Edits are saved to the database and re-indexed for the AI waiter and diner menu.
        </p>
      </div>

      <form onSubmit={createCategorySubmit} className="card-3d flex flex-wrap items-end gap-3 rounded-[16px] p-5">
        <label className="block flex-1">
          <span className="text-sm font-semibold text-ink-soft">New Category</span>
          <Input
            className="mt-1.5"
            placeholder="e.g., Desserts"
            value={newCategoryLabel}
            onChange={(event) => setNewCategoryLabel(event.target.value)}
          />
        </label>
        <Button type="submit" variant="outline" disabled={createCategory.isPending}>
          Add Category
        </Button>
        {createCategory.isError && (
          <p className="w-full text-sm font-semibold text-danger">{errorMessage(createCategory.error)}</p>
        )}
      </form>

      <section className="card-3d rounded-[16px] p-5">
        <h3 className="font-label text-base font-semibold text-ink">Add New Item</h3>
        <div className="mt-4">
          <MenuItemForm
            key={formKey}
            categories={categories}
            initial={toFormValues({
              id: "",
              name: "",
              category_id: defaultCategory,
              description: null,
              price: null,
              happy_hour_price: null,
              is_veg: true,
              spice_level: 2,
              tags: [],
              rating: null,
              prep_time: null,
              is_available: true,
              image_url: null,
              is_alcoholic: false
            })}
            submitLabel="Add Item"
            submitting={createItem.isPending}
            error={errorMessage(createItem.error)}
            onSubmit={(payload) =>
              createItem.mutate(payload, { onSuccess: () => setFormKey((key) => key + 1) })
            }
          />
        </div>
      </section>

      <div className="space-y-2">
        <h3 className="font-display text-xl text-ink">All Menu Items ({items.length})</h3>

        {itemsQuery.isPending && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {itemsQuery.isSuccess && items.length === 0 && (
          <EmptyState title="No menu items yet" description="Add your first dish above." />
        )}

        {items.map((item) => (
          <motion.article
            key={item.id}
            layout
            className="card-3d flex flex-wrap items-center justify-between gap-3 rounded-[14px] p-4"
          >
            <div className="flex items-center gap-3">
              <img
                src={item.image_url ?? undefined}
                alt={item.name}
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-ink-soft">{item.name}</p>
                <p className="text-xs text-ink-muted">
                  {categoryLabel.get(item.category_id) ?? item.category_id} · {item.is_veg ? "Veg" : "Non-Veg"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{item.price === null ? "—" : `₹${item.price}`}</p>
                {item.happy_hour_price !== null && (
                  <p className="text-[11px] text-ink-muted">HH ₹{item.happy_hour_price}</p>
                )}
              </div>

              <button
                type="button"
                aria-label="Toggle availability"
                onClick={() => updateItem.mutate({ id: item.id, changes: { is_available: !item.is_available } })}
                className={`relative inline-flex h-7 w-12 cursor-pointer rounded-full transition ${
                  item.is_available ? "bg-primary" : "bg-cream-deeper"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    item.is_available ? "left-5.5" : "left-0.5"
                  }`}
                />
              </button>

              <span
                className={`rounded-pill px-2.5 py-0.5 text-[11px] font-semibold ${
                  item.is_available ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}
              >
                {item.is_available ? "Available" : "Unavailable"}
              </span>

              <Button variant="ghost" className="px-2 py-1" onClick={() => setEditing(item)} aria-label="Edit item">
                <Pencil size={16} />
              </Button>
              <Button variant="danger" className="px-2 py-1" onClick={() => remove(item)} aria-label="Delete item">
                <Trash2 size={16} />
              </Button>
            </div>
          </motion.article>
        ))}
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={`Edit ${editing?.name ?? "item"}`}>
        {editing && (
          <MenuItemForm
            key={editing.id}
            categories={categories}
            initial={toFormValues(editing)}
            submitLabel="Save Changes"
            submitting={updateItem.isPending}
            error={errorMessage(updateItem.error)}
            onCancel={() => setEditing(null)}
            onSubmit={(changes) =>
              updateItem.mutate(
                { id: editing.id, changes },
                { onSuccess: () => setEditing(null) }
              )
            }
          />
        )}
      </Modal>
    </div>
  );
}
