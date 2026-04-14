import { motion } from 'framer-motion';

/**
 * SEO FAQ section for tool pages. Pass an array of
 * { question, answer } objects and a platform name.
 * Uses semantic H2/H3 tags for crawlability.
 */
const SEOFaq = ({ platform = 'Downloads', items = [] }) => {
  const defaultItems = [
    {
      question: `Is ${platform} really free?`,
      answer: 'Yes! Download Market is 100% free. No sign-up, no subscription, no hidden charges. Just paste a link and download.',
    },
    {
      question: `Can I download ${platform} on my phone?`,
      answer: 'Absolutely. Our tool works on all devices — Android, iPhone, iPad, laptop, and desktop. No app installation required.',
    },
    {
      question: `Is it safe to download ${platform}?`,
      answer: 'Yes. We don\'t store any of your data, downloads, or personal information. All downloads are processed securely on our servers.',
    },
    {
      question: `What quality can I download ${platform} in?`,
      answer: 'You can download in the highest quality available — up to 1080p Full HD for video, and 320kbps for audio. We always offer the best formats.',
    },
    {
      question: `Do downloads have a watermark?`,
      answer: 'No. All downloads from Download Market are clean, original files without any added watermarks or branding.',
    },
  ];

  const faqItems = items.length > 0 ? items : defaultItems;

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
          Frequently Asked <span className="gradient-text">Questions</span>
        </h2>
        <p className="text-text-secondary font-medium max-w-lg mx-auto">
          Everything you need to know about downloading {platform.toLowerCase()}.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        {faqItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-primary/8 hover:border-primary/15 transition-colors"
          >
            <h3 className="text-text-primary font-bold text-base mb-2">
              {item.question}
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default SEOFaq;
