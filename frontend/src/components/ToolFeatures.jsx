import { motion } from 'framer-motion';
import { Droplets, Zap, MonitorSmartphone, BadgeCheck, ShieldCheck, FileDown } from 'lucide-react';

const featuresList = [
  {
    icon: Droplets,
    title: 'No watermark',
    description: 'Download clean videos without any added watermarks or branding.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: FileDown,
    title: 'HD quality',
    description: 'Get the highest available quality — up to 1080p video downloads.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: Zap,
    title: 'Fast download',
    description: 'Our tool instantly fetches and processes your media links in seconds.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: BadgeCheck,
    title: 'Free',
    description: 'Use it directly on your phone, tablet, or PC — absolutely zero cost.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
];

/**
 * SEO-rich Features section for tool pages.
 * Pass `platform` for customized H2 heading.
 */
const ToolFeatures = ({ platform = 'Our Downloader' }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-12 mb-8"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
          Features of <span className="gradient-text-alt">{platform}</span>
        </h2>
        <p className="text-text-secondary font-medium max-w-lg mx-auto">
          Everything you need for fast, safe, and high-quality downloads.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuresList.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="bg-white rounded-2xl p-5 border border-primary/8 hover:border-primary/20 hover:shadow-lg transition-all duration-300 group"
          >
            <div className={`w-10 h-10 ${feature.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon size={20} className={feature.color} />
            </div>
            <h3 className="text-text-primary font-bold text-sm mb-1">{feature.title}</h3>
            <p className="text-text-secondary text-xs leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default ToolFeatures;
