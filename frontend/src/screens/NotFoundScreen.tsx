import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { EmptyState, buttonClasses } from "../components/ui";

export default function NotFoundScreen() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <EmptyState
        icon="🍽️"
        title="Page not found"
        description="This route does not exist in the dining flow."
        action={
          <Link to="/" className={buttonClasses("primary", "inline-block text-sm")}>
            Go back home
          </Link>
        }
      />
    </motion.div>
  );
}
