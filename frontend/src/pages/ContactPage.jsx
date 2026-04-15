import SEOHead from '../components/SEOHead';

const ContactPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEOHead
        title="Contact"
        description="Contact page for Download Market support and business inquiries."
      />
      <h1 className="text-3xl font-bold text-text-primary mb-4">Contact</h1>
      <div className="space-y-4 text-text-secondary">
        <p>For support, partnership, or legal requests, contact the team by email.</p>
        <p>Email: support@downloadmarket.app</p>
        <p>Response time: usually within 24-48 hours.</p>
        <p>Disclaimer: We do not host or store user content permanently.</p>
      </div>
    </div>
  );
};

export default ContactPage;
