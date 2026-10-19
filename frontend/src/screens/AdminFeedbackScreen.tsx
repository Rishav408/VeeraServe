import { useMemo, useState } from "react";
import { MessageSquareHeart, Star } from "lucide-react";
import { Badge, Button, Card, EmptyState, Spinner } from "../components/ui";
import { useAcknowledgeFeedback, useAdminFeedback } from "../hooks/useFeedback";
import { timeAgo } from "../utils/format";
import type { FeedbackDto } from "../types/api";

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-ink-soft">
      <span className="min-w-[52px] text-ink-muted">{label}</span>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={13}
            className={star <= value ? "fill-gold text-gold" : "text-primary/20"}
          />
        ))}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default function AdminFeedbackScreen() {
  const feedbackQuery = useAdminFeedback();
  const acknowledge = useAcknowledgeFeedback();
  const [onlyPending, setOnlyPending] = useState(false);

  const all = useMemo(() => feedbackQuery.data ?? [], [feedbackQuery.data]);
  const pendingCount = all.filter((entry) => !entry.acknowledged).length;
  const shown: FeedbackDto[] = onlyPending ? all.filter((entry) => !entry.acknowledged) : all;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Feedback Inbox</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Guest feedback stored in the database. Acknowledge items once reviewed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="neutral">Total: {all.length}</Badge>
        <Badge tone={pendingCount > 0 ? "gold" : "success"}>Unacknowledged: {pendingCount}</Badge>
        <button
          type="button"
          onClick={() => setOnlyPending((value) => !value)}
          className={`rounded-pill px-3.5 py-1.5 text-sm font-semibold transition ${
            onlyPending ? "bg-primary text-white" : "bg-cream text-ink-soft hover:bg-primary/10"
          }`}
        >
          {onlyPending ? "Showing unacknowledged" : "Show unacknowledged only"}
        </button>
      </div>

      {feedbackQuery.isPending && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {feedbackQuery.isSuccess && shown.length === 0 && (
        <EmptyState
          icon={<MessageSquareHeart />}
          title="No feedback here"
          description={onlyPending ? "Everything has been acknowledged." : "Feedback submitted by diners will appear here."}
        />
      )}

      <div className="space-y-3">
        {shown.map((entry) => (
          <Card as="article" key={entry.id} className="rounded-[16px] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-lg font-bold text-primary">#{entry.id}</p>
              {entry.order_id !== null && <Badge tone="neutral">Order #{entry.order_id}</Badge>}
              {entry.acknowledged ? (
                <Badge tone="success">Acknowledged</Badge>
              ) : (
                <Badge tone="gold">New</Badge>
              )}
              <span className="text-xs text-ink-muted">{timeAgo(entry.created_at)}</span>
              {!entry.acknowledged && (
                <Button
                  variant="outline"
                  className="ml-auto text-xs"
                  disabled={acknowledge.isPending}
                  onClick={() => acknowledge.mutate(entry.id)}
                >
                  Acknowledge
                </Button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              <Stars label="Food" value={entry.food_rating} />
              <Stars label="Service" value={entry.service_rating} />
              <Stars label="AI" value={entry.ai_rating} />
            </div>

            {entry.comment && <p className="mt-3 text-sm italic text-ink-soft">"{entry.comment}"</p>}
          </Card>
        ))}
      </div>

      {acknowledge.isError && (
        <p className="text-sm font-semibold text-danger">{(acknowledge.error as Error).message}</p>
      )}
    </div>
  );
}
