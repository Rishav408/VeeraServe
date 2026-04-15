import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { useState } from "react";
import { useAppData } from "../context/AppDataContext";

export default function FeedbackScreen() {
  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState({ food: 0, service: 0, ai: 0 });
  const [submitted, setSubmitted] = useState(false);
  const { feedback, addFeedback } = useAppData();

  const submit = (event) => {
    event.preventDefault();
    if (!comment.trim()) return;

    const avgRating = Math.round(
      ([ratings.food, ratings.service, ratings.ai].filter((r) => r > 0).reduce((a, b) => a + b, 0) || 15) /
        Math.max([ratings.food, ratings.service, ratings.ai].filter((r) => r > 0).length, 1)
    );

    addFeedback({ rating: avgRating, comment });
    setComment("");
    setRatings({ food: 0, service: 0, ai: 0 });
    setSubmitted(true);
  };

  const setRating = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const ratingRows = [
    { key: "food", label: "Food 🍛" },
    { key: "service", label: "Service 🧑‍🍳" },
    { key: "ai", label: "AI Experience 🤖" }
  ];

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
          {ratingRows.map(({ key, label }) => (
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

        <button type="submit" className="btn-primary mt-4 flex w-full items-center justify-center gap-2 text-sm shadow-glow-orange">
          Submit Feedback →
        </button>
      </form>

      {feedback.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-lg text-ink">Recent Feedback</h3>
          {feedback.slice(0, 5).map((item) => (
            <article key={item.id} className="card-3d rounded-[14px] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {item.user[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-soft">{item.user}</p>
                    <div className="mt-0.5 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={star <= item.rating ? "fill-gold text-gold" : "text-cream-deeper"}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-ink-muted">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.comment}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
