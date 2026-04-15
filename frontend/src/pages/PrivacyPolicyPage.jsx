import SEOHead from '../components/SEOHead';

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEOHead
        title="Privacy Policy"
        description="Read the privacy policy for Download Market. We do not store user content."
      />
      <h1 className="text-3xl font-bold text-text-primary mb-4">Privacy Policy</h1>
      <div className="space-y-4 text-text-secondary">
        <p>We process URL requests to generate downloadable media links and improve service reliability.</p>
        <p>We do not permanently store downloaded media content on our servers.</p>
        <p>Temporary processing files are auto-cleaned and removed after expiration.</p>
        <p>By using this service, you confirm you have rights to download and use the content.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
