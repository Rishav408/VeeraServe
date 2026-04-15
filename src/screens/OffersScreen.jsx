import { motion } from "framer-motion";

const offers = [
  { id: 1, title: "Lunch Rush", detail: "Flat 15% off on all mains between 12-3 PM.", emoji: "☀️" },
  { id: 2, title: "Combo King", detail: "Buy Biryani + Chaas and get Gulab Jamun free.", emoji: "👑" },
  { id: 3, title: "Family Feast", detail: "4 breads free on orders above ₹1200.", emoji: "👨‍👩‍👧‍👦" }
];

export default function OffersScreen() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-ink">Offers & Deals 🎉</h1>
        <p className="mt-1 text-sm text-ink-muted">Curated savings from Veera Dhabha.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <motion.article
            key={offer.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="card-3d rounded-[20px] bg-gradient-to-br from-gold/20 via-cream to-primary/10 p-5 transition hover:shadow-card-hover"
          >
            <div className="mb-2 text-3xl">{offer.emoji}</div>
            <h3 className="font-display text-2xl text-ink">{offer.title}</h3>
            <p className="mt-2 text-sm text-ink-muted">{offer.detail}</p>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
