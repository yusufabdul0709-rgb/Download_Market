import SEOHead from '../components/SEOHead';

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEOHead
        title="Terms of Service"
        description="Terms of service for Download Market downloader platform."
      />
      <h1 className="text-3xl font-bold text-text-primary mb-4">Terms of Service</h1>
      <div className="space-y-4 text-text-secondary">
        <p>This tool is provided for personal and lawful use only.</p>
        <p>You are responsible for complying with the source platform terms and copyright laws.</p>
        <p>We may limit traffic or block abusive usage to preserve platform stability.</p>
        <p>We do not guarantee availability for private or restricted content.</p>
      </div>
    </div>
  );
};

export default TermsPage;
