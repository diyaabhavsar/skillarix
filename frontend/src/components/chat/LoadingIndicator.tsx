import { motion } from 'framer-motion';

export const LoadingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex justify-center"
  >
    <div className="bg-muted px-4 py-2 rounded-full">
      <div className="flex items-center gap-2">
        {[0.3, 0.15, 0].map((delay, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: `-${delay}s` }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);
