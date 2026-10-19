import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useUI } from "../context/UIContext";
import { useSubmitFeedback } from "../hooks/useFeedback";
import { ApiError } from "../lib/apiClient";

type RatingKey = "food" | "service" | "ai";

const RATING_ROWS: { key: RatingKey; label: string }[] = [
  { key: "food", label: "Food 🍛" },
  { key: "service", label: "Service 🧑‍🍳" },
  { key: "ai", label: "AI Experience 🤖" }
];

export default function FeedbackScreen() {
  const { showToast } = useUI();
  const submitFeedback = useSubmitFeedback();
  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({ food: 0, service: 0, ai: 0 });
  const [submitted, setSubmitted] = useState(false);

  const complete = RATING_ROWS.every((row) => ratings[row.key] >= 1);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!complete) {
      showToast("Please rate food, service, and the AI experience.");
      return;
    }

    submitFeedback.mutate(
      {
        food_rating: ratings.food,
        service_rating: ratings.service,
        ai_rating: ratings.ai,
        comment: comment.trim() || null
      },
      {
        onSuccess: () => {
          setComment("");
          setRatings({ food: 0, service: 0, ai: 0 });
          setSubmitted(true);
        },
        onError: (error) => {
          showToast(error instanceof ApiError ? error.message : "Could not send feedback.");
        }
      }
    );
  };

  const setRating = (category: RatingKey, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-3d mx-auto max-w-md rounded-[20px] p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
          <Check size={32} />
        </div>
        <h2 className="font-display text-[28px] text-ink">Shukria! 🙏</h2>
        <p className="mt-2 text-sm text-ink-muted">Thank you for dining at Veera Dhabha</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="btn-primary mt-6 inline-flex items-center gap-2 text-sm"
        >
          Back to Menu →
        </button>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-[28px] text-ink">How was your experience? 🙏</h1>

      <form onSubmit={submit} className="card-3d rounded-[20px] p-6">
        <div className="space-y-5">
          {RATING_ROWS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-soft">{label}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRating(key, star)}
                    className="text-2xl transition"
                  >
                    <Star
                      size={28}
                      className={star <= ratings[key] ? "fill-gold text-gold" : "text-cream-deeper"}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="h-24 w-full rounded-[12px] border border-primary/20 bg-cream p-3 text-sm outline-none transition focus:border-primary"
            placeholder="Tell us more..."
            maxLength={280}
          />
          <p className="mt-1 text-right text-xs text-ink-muted">{comment.length}/280</p>
        </div>

        <button
          type="submit"
          disabled={submitFeedback.isPending || !complete}
          className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-sm shadow-glow-orange disabled:opacity-60"
        >
          {submitFeedback.isPending ? "Sending…" : "Submit Feedback →"}
        </button>
      </form>
    </div>
  );
}
