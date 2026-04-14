import { motion } from 'framer-motion';
import { ClipboardCopy, Search, Download, CheckCircle, Link2, Send, Bookmark, MoreHorizontal } from 'lucide-react';

const Step1Visual = () => (
  <div className="w-full h-full bg-[#000000] rounded-xl relative overflow-hidden flex flex-col justify-end border border-slate-200 dark:border-slate-800">
    {/* Reel Background & UI Elements */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm -translate-y-4">
        <div className="w-0 h-0 border-l-6 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1" />
      </div>
      {/* Right side floating icons mockup */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-3 opacity-60">
        <div className="w-6 h-6 rounded-full bg-white/20" />
        <div className="w-6 h-6 rounded-full bg-white/20" />
        <div className="w-6 h-6 rounded-full bg-white/20" />
      </div>
    </div>
    
    {/* Realistic Instagram-style Dark Share Menu */}
    <div className="bg-[#262626] rounded-t-2xl p-4 w-full transform translate-y-1 z-10 flex flex-col items-center shadow-[0_-10px_30px_rgba(0,0,0,0.4)]">
      <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
      
      <div className="flex justify-between w-full px-1">
        
        {/* Share Icon */}
        <div className="flex flex-col items-center gap-2 opacity-50 transition-opacity hover:opacity-100">
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
             <Send size={18} className="text-white" />
          </div>
          <span className="text-[10px] text-white/80">Share</span>
        </div>

        {/* Highlighted Copy Link Icon */}
        <div className="flex flex-col items-center gap-2 relative group cursor-pointer z-20">
          <div className="absolute inset-0 bg-[#0095F6]/20 rounded-full scale-125 animate-pulse" />
          <div className="w-11 h-11 rounded-full bg-white border-[2px] border-[#0095F6] flex items-center justify-center z-10 shadow-lg shadow-[#0095F6]/40">
             <Link2 size={18} className="text-[#0095F6] scale-110" />
          </div>
          <span className="text-[10px] font-bold text-[#0095F6] mt-[1px]">Copy link</span>
        </div>

        {/* Save Icon */}
        <div className="flex flex-col items-center gap-2 opacity-50 transition-opacity hover:opacity-100">
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
             <Bookmark size={18} className="text-white" />
          </div>
          <span className="text-[10px] text-white/80">Save</span>
        </div>

        {/* More Icon */}
        <div className="flex flex-col items-center gap-2 opacity-50 transition-opacity hover:opacity-100">
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
             <MoreHorizontal size={18} className="text-white" />
          </div>
          <span className="text-[10px] text-white/80">More</span>
        </div>

      </div>
    </div>
  </div>
);

const Step2Visual = () => (
  <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4">
    <div className="w-full flex bg-white shadow-md shadow-indigo-500/5 rounded-xl border border-indigo-100 overflow-hidden h-10 transform -rotate-1 hover:rotate-0 transition-transform">
      <div className="flex-1 px-3 flex items-center bg-indigo-50/30">
        <span className="text-[11px] font-medium text-slate-500 overflow-hidden whitespace-nowrap">https://instagram.com/reel/p...</span>
        <div className="w-0.5 h-4 bg-indigo-500 animate-pulse ml-1" />
      </div>
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 flex items-center justify-center">
         <Search size={12} className="text-white mr-1" />
         <span className="text-xs font-bold text-white">Fetch</span>
      </div>
    </div>
    <div className="mt-4 flex gap-2 w-full justify-center opacity-60">
      <div className="w-16 h-2 bg-slate-200 rounded-full" />
      <div className="w-8 h-2 bg-indigo-200 rounded-full" />
    </div>
  </div>
);

const Step3Visual = () => (
  <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4 relative">
    <div className="w-full max-w-[140px] bg-white rounded-xl shadow-lg shadow-emerald-500/10 border border-slate-100 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform">
      <div className="h-16 bg-slate-100 relative">
         <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle size={24} className="text-emerald-400 opacity-50" />
         </div>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div className="h-2 bg-slate-100 rounded-full w-3/4 mx-auto" />
        <div className="w-full py-2 bg-gradient-to-r from-success to-emerald-500 rounded-lg flex items-center justify-center gap-1.5 mt-1 shadow-md shadow-success/20">
          <Download size={14} className="text-white" />
          <span className="text-xs font-bold text-white tracking-wide">Download</span>
        </div>
      </div>
    </div>
  </div>
);

const steps = [
  {
    Visual: Step1Visual,
    title: 'Copy Instagram link',
    description: 'Open the app, find the video or media you want, and copy its link.',
  },
  {
    Visual: Step2Visual,
    title: 'Paste it here',
    description: 'Paste the copied link into the input box above and click the Fetch button.',
  },
  {
    Visual: Step3Visual,
    title: 'Click download',
    description: 'Select your preferred quality or format and click download to save the file.',
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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

            <div className="w-full aspect-video rounded-2xl overflow-hidden mb-5 bg-slate-50 flex items-center justify-center group-hover:shadow-inner transition-all duration-300">
              <step.Visual />
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
