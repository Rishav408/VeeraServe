import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFoundScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-3d rounded-[20px] p-8 text-center"
    >
      <div className="mb-4 text-6xl">🍽️</div>
      <h2 className="font-display text-4xl text-ink">Page not found</h2>
      <p className="mt-2 text-sm text-ink-muted">This route does not exist in the dining flow.</p>
      <Link to="/" className="btn-primary mt-4 inline-block text-sm">
        Go back home
      </Link>
    </motion.div>
  );
}
