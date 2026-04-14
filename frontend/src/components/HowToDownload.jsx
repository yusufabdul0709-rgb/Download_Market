import { motion } from 'framer-motion';
import { ClipboardCopy, Search, Download, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: ClipboardCopy,
    title: 'Copy the URL',
    description: 'Open the app (YouTube, Instagram, etc.), find the content you want, and copy its URL/link.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Search,
    title: 'Paste & Fetch',
    description: 'Paste the copied URL into the input box above and click the Fetch button to load the preview.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: Download,
    title: 'Choose & Download',
    description: 'Select your preferred quality or format from the options and click download. The file will save automatically.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: CheckCircle,
    title: 'Enjoy!',
    description: 'Your file is saved! You can find it in your device\'s Downloads folder. No sign-ups or fees required.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

/**
 * Reusable "How to Download" guide section.
 * Pass a `platform` prop like "Instagram Reels", "YouTube Videos", etc.
 */
const HowToDownload = ({ platform = 'media' }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="mt-16 mb-8"
    >
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
          How to Download{' '}
          <span className="gradient-text">{platform}</span>
        </h2>
        <p className="text-text-secondary font-medium max-w-lg mx-auto">
          It only takes a few seconds. Follow these simple steps:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-white rounded-2xl p-6 border border-primary/8 hover:border-primary/20 hover:shadow-lg transition-all duration-300 group"
          >
            {/* Step number */}
            <div className="absolute -top-3 -left-2 w-7 h-7 bg-gradient-to-br from-primary to-accent text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
              {index + 1}
            </div>

            <div className={`w-12 h-12 ${step.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <step.icon size={24} className={step.color} />
            </div>
            <h3 className="text-text-primary font-bold text-base mb-2">{step.title}</h3>
            <p className="text-text-secondary text-sm leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>

      {/* SEO-friendly FAQ-like text block */}
      <div className="mt-10 bg-white rounded-2xl p-6 sm:p-8 border border-primary/8">
        <h3 className="text-text-primary font-bold text-lg mb-3">
          Why use Download Market?
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm text-text-secondary leading-relaxed">
          <div>
            <p className="mb-2">
              <strong className="text-text-primary">⚡ Lightning Fast</strong> — Our servers process your content in seconds, not minutes.
            </p>
            <p className="mb-2">
              <strong className="text-text-primary">🛡️ 100% Safe</strong> — No malware, no data tracking, no account required.
            </p>
          </div>
          <div>
            <p className="mb-2">
              <strong className="text-text-primary">📱 Works Everywhere</strong> — Desktop, tablet, or mobile — just paste and download.
            </p>
            <p className="mb-2">
              <strong className="text-text-primary">🎯 Multiple Formats</strong> — Choose HD video, audio-only, or compressed formats.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default HowToDownload;
